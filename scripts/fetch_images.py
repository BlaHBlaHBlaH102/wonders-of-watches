"""Download the site's photographs from Wikimedia Commons and record their credits.

Writes optimised WebP files to public/images and attribution data to
src/data/images.json (the site's Credits section renders from that file, which is
what keeps us compliant with the CC BY / CC BY-SA licences).

Run:  python scripts/fetch_images.py     (needs Pillow: requirements-dev.txt)
"""
from __future__ import annotations

import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images"
DATA = ROOT / "src" / "data" / "images.json"
UA = {"User-Agent": "WondersOfWatches/1.0 (educational site; image credits recorded)"}

# slug: (Commons title, subject, max width, optional crop as l/t/r/b fractions)
IMAGES = {
    "snowflake": ("Grand Seiko SBGA011.jpg", "Grand Seiko SBGA011 “Snowflake”", 2400, None),
    "calibre-9s65": ("Grand Seiko Caliber 9S65 Automatic.JPG", "Grand Seiko Caliber 9S65", 1600, None),
    "speedmaster": ("Classic Speedy (24067321725).jpg", "Omega Speedmaster Professional", 2000, None),
    "speedmaster-macro": ("Omega (23497183123).jpg", "Speedmaster dial, close up", 2400, None),
    "speedmaster-back": ("Flight-Qualified by NASA (23456599843).jpg", "Speedmaster caseback", 1800, None),
    "seamaster": ("Omega Seamaster Co-Axial.jpg", "Omega Seamaster Co-Axial", 1200, (0.12, 0.08, 0.88, 0.72)),
    "aldrin": ("Aldrin Apollo 11 original.jpg", "Buzz Aldrin on the Moon, Apollo 11", 2400, None),
    "apollo13": ("Apollo 13 Lunar Module after separation from CSM (AS13-59-8562).jpg", "Apollo 13 lunar module Aquarius", 2000, None),
    "moon": ("FullMoon2010.jpg", "The full Moon", 1600, None),
    "ga2000": ("G-Shock GA-2000 Carbon Core Guard.jpg", "G-Shock GA-2000 Carbon Core Guard", 2000, None),
    "dw5000": ("DW-5000.jpg", "Casio G-Shock DW-5000", 1800, None),
    "tourbillon": ("Tourbillon wheel close-up (3370466847).jpg", "A tourbillon, close up", 2400, None),
    "breguet": ("Tourbillon, original drawing, Abraham-Louis Breguet.jpg", "Breguet’s original tourbillon drawing", 1800, None),
    "rotor": ("Mechanics movement feinmechanik wrist watch clock automatic gmt master gmt-932709.jpg!d.jpg", "An automatic calibre and its rotor", 1920, None),
    "astron": ("Seiko Astron.jpg", "Seiko Quartz Astron", 1200, None),
    "accutron": ("Bulova accutron sv 1963.jpg", "Bulova Accutron Spaceview, tuning-fork movement", 2000, None),
}


def fetch(url: str) -> bytes:
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as resp:
                return resp.read()
        except urllib.error.HTTPError as err:
            if err.code != 429:
                raise
            time.sleep(int(err.headers.get("Retry-After") or 0) or 30 * (attempt + 1))
    raise RuntimeError(f"Rate limited: {url}")


def clean(meta: dict, key: str) -> str:
    text = re.sub(r"<[^>]+>", "", meta.get(key, {}).get("value", ""))
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    DATA.parent.mkdir(parents=True, exist_ok=True)
    credits = {}
    for slug, (title, subject, max_w, crop) in IMAGES.items():
        query = urllib.parse.urlencode({
            "action": "query", "format": "json", "titles": f"File:{title}",
            "prop": "imageinfo", "iiprop": "url|extmetadata",
        })
        data = json.loads(fetch(f"https://commons.wikimedia.org/w/api.php?{query}"))
        info = next(iter(data["query"]["pages"].values()))["imageinfo"][0]
        meta = info["extmetadata"]

        target = OUT / f"{slug}.webp"
        if target.exists():  # Resumable: Wikimedia throttles bulk original downloads.
            image = Image.open(target)
        else:
            image = Image.open(io.BytesIO(fetch(info["url"]))).convert("RGB")
            if crop:
                w, h = image.size
                image = image.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
            if image.width > max_w:
                image = image.resize((max_w, round(image.height * max_w / image.width)), Image.LANCZOS)
            image.save(target, "WEBP", quality=82, method=6)
            time.sleep(10)

        credits[slug] = {
            "src": f"/images/{slug}.webp",
            "width": image.width,
            "height": image.height,
            "subject": subject,
            "artist": clean(meta, "Artist")[:90] or "Unknown",
            "license": clean(meta, "LicenseShortName"),
            "licenseUrl": meta.get("LicenseUrl", {}).get("value", ""),
            "source": info["descriptionurl"],
            "cropped": bool(crop),
        }
        print(f"{slug}: {image.width}x{image.height} {credits[slug]['license']}")
    DATA.write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
