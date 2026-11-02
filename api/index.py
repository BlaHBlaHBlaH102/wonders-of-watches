"""Wonders of Watches API (FastAPI). Vercel serves `app` as a Python function.

Local:  uvicorn api.index:app --reload --port 8000
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query, Response

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _sky import moon_phase  # noqa: E402
from _wonders import WONDERS  # noqa: E402

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
NASA_APOD_URL = "https://api.nasa.gov/planetary/apod"
TIMEOUT = httpx.Timeout(8.0)

app = FastAPI(title="Wonders of Watches API", version="1.0.0", docs_url="/api/docs", openapi_url="/api/openapi.json")

# Tiny per-instance cache. The CDN headers below do the heavy lifting on Vercel;
# this just spares upstream APIs on a warm function.
_cache: dict[str, tuple[float, Any]] = {}


def _cached(key: str, ttl: float) -> Any | None:
    hit = _cache.get(key)
    return hit[1] if hit and time.monotonic() - hit[0] < ttl else None


def _store(key: str, value: Any) -> Any:
    if len(_cache) > 512:
        _cache.clear()
    _cache[key] = (time.monotonic(), value)
    return value


async def _fetch_sun(lat: float, lon: float) -> dict | None:
    """Sun and solar radiation from Open-Meteo. None if the service is unavailable."""
    key = f"sun:{lat}:{lon}"
    if (hit := _cached(key, 600)) is not None:
        return hit
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "shortwave_radiation,is_day",
        "daily": "sunrise,sunset",
        "timezone": "auto",
        "forecast_days": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
        data = response.json()
        return _store(key, {
            "radiation": data["current"]["shortwave_radiation"],
            "isDay": bool(data["current"]["is_day"]),
            "sunrise": data["daily"]["sunrise"][0],
            "sunset": data["daily"]["sunset"][0],
            "timezone": data["timezone"],
        })
    except (httpx.HTTPError, KeyError, IndexError, ValueError):
        return None


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "nasaKey": bool(os.getenv("NASA_API_KEY"))}


@app.get("/api/wonders")
def wonders(response: Response) -> dict:
    response.headers["Cache-Control"] = "public, s-maxage=3600, stale-while-revalidate=86400"
    return {"wonders": WONDERS}


@app.get("/api/sky")
async def sky(
    response: Response,
    lat: float = Query(36.115, ge=-90, le=90, description="Default: Shiojiri, home of Spring Drive"),
    lon: float = Query(137.954, ge=-180, le=180),
) -> dict:
    # Two decimals is about a kilometre: plenty for the sun, kinder to privacy and cache.
    lat, lon = round(lat, 2), round(lon, 2)
    sun = await _fetch_sun(lat, lon)
    response.headers["Cache-Control"] = "public, s-maxage=600" if sun else "no-store"
    return {"lat": lat, "lon": lon, "moon": moon_phase(), "sun": sun}


@app.get("/api/apod")
async def apod(response: Response) -> dict:
    """NASA's Astronomy Picture of the Day. Set NASA_API_KEY for the full free quota."""
    if (hit := _cached("apod", 3600)) is None:
        params = {"api_key": os.getenv("NASA_API_KEY", "DEMO_KEY"), "thumbs": "true"}
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                upstream = await client.get(NASA_APOD_URL, params=params)
                upstream.raise_for_status()
            data = upstream.json()
            # Video days have no picture; thumbnails are not always supplied either.
            image = data.get("url") if data.get("media_type") == "image" else data.get("thumbnail_url")
            if not image:
                raise HTTPException(404, "No image in today's APOD")
            hit = _store("apod", {
                "title": data.get("title", ""),
                "date": data.get("date", ""),
                "image": image,
                "explanation": data.get("explanation", ""),
                "credit": (data.get("copyright") or "NASA").strip(),
            })
        except (httpx.HTTPError, ValueError) as err:
            raise HTTPException(502, "NASA APOD is unavailable") from err
    response.headers["Cache-Control"] = "public, s-maxage=3600, stale-while-revalidate=86400"
    return hit
