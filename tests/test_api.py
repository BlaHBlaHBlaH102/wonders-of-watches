from datetime import datetime, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from api import index
from api._sky import moon_phase

client = TestClient(index.app)


def at(*args):
    return datetime(*args, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def clear_cache():
    index._cache.clear()


def fake_get(payload=None, status=200):
    async def _get(self, url, params=None):
        return httpx.Response(status, json=payload or {}, request=httpx.Request("GET", url))
    return _get


def test_total_solar_eclipse_is_a_new_moon():
    moon = moon_phase(at(2024, 4, 8, 18, 21))
    assert moon["illumination"] < 0.01
    assert moon["name"] == "New moon"


def test_known_full_moon():
    moon = moon_phase(at(2024, 9, 18, 2, 34))
    assert moon["illumination"] > 0.99
    assert moon["name"] == "Full moon"


def test_first_quarter_is_half_lit_and_waxing():
    moon = moon_phase(at(2024, 6, 14, 5, 18))
    assert moon["illumination"] == pytest.approx(0.5, abs=0.03)
    assert moon["waxing"] is True
    assert moon["name"] == "First quarter"


def test_last_quarter_is_waning():
    moon = moon_phase(at(2024, 5, 1, 11, 27))
    assert moon["illumination"] == pytest.approx(0.5, abs=0.03)
    assert moon["waxing"] is False


def test_wonders_are_chronological_and_complete():
    items = client.get("/api/wonders").json()["wonders"]
    years = [w["year"] for w in items]
    assert years == sorted(years)
    assert {"springdrive", "coaxial", "carbon"} <= {w["id"] for w in items}


def test_sky_maps_open_meteo(monkeypatch):
    payload = {
        "current": {"shortwave_radiation": 412.0, "is_day": 1},
        "daily": {"sunrise": ["2026-11-02T06:10"], "sunset": ["2026-11-02T16:55"]},
        "timezone": "Asia/Tokyo",
    }
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get(payload))
    body = client.get("/api/sky?lat=35.123&lon=139.456").json()
    assert body["lat"] == 35.12
    assert body["sun"]["radiation"] == 412.0
    assert body["sun"]["isDay"] is True
    assert "illumination" in body["moon"]


def test_sky_keeps_the_moon_when_upstream_fails(monkeypatch):
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get(status=503))
    response = client.get("/api/sky")
    assert response.status_code == 200
    assert response.json()["sun"] is None
    assert response.json()["moon"]["name"]
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("query", ["lat=91", "lat=-91", "lon=181", "lat=abc"])
def test_sky_rejects_bad_coordinates(query):
    assert client.get(f"/api/sky?{query}").status_code == 422


def test_apod_image_day(monkeypatch):
    payload = {"media_type": "image", "url": "https://x/y.jpg", "title": "T", "date": "2026-11-02"}
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get(payload))
    body = client.get("/api/apod").json()
    assert body["image"] == "https://x/y.jpg"
    assert body["credit"] == "NASA"


def test_apod_video_day_uses_thumbnail(monkeypatch):
    payload = {"media_type": "video", "url": "https://v", "thumbnail_url": "https://t.jpg"}
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get(payload))
    assert client.get("/api/apod").json()["image"] == "https://t.jpg"


def test_apod_video_day_without_thumbnail_is_404(monkeypatch):
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get({"media_type": "video", "url": "https://v"}))
    assert client.get("/api/apod").status_code == 404


def test_apod_rate_limited_is_502(monkeypatch):
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get(status=429))
    assert client.get("/api/apod").status_code == 502
