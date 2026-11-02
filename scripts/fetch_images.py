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
    'gs-spacewalk': ('Seiko Spacewalk.JPG', 'Seiko Spring Drive Spacewalk chronograph', 1920, None),
    'gs-5r86': ('Seiko Spring Drive 5R86 parts.jpg', 'Parts of the Spring Drive chronograph calibre 5R86', 1920, None),
    'gs-gtr50': ('Grand Seiko Sport Collection Custom-Made Model featuring Nissan GT-R50 by Italdesign.jpg', 'Grand Seiko Sport Collection for the Nissan GT-R50', 1920, None),
    'gs-sbgw231': ('Grand Seiko SBGW231 sideview.JPG', 'Grand Seiko SBGW231, side view', 1920, None),
    'gs-sbgr051': ('Grand Seiko SBGR051 sideview.JPG', 'Grand Seiko SBGR051, side view', 1920, None),
    'gs-sbgw005': ('Grand SeikoSBGW005 9S54-0030 01s3x.jpg', 'Grand Seiko SBGW005', 1920, None),
    'gs-hibeat': ('Grand Seiko Automatic Hi-Beat.jpg', 'Grand Seiko Automatic Hi-Beat', 1920, None),
    'gs-9s64': ('Grand Seiko Caliber 9S64 Hand-wound.jpg', 'Grand Seiko Caliber 9S64', 1920, None),
    'gx-gs1300': ('CASIO G-SHOCK GS-1300B-1AJF 01.JPG', 'G-Shock GS-1300B', 1920, None),
    'gx-5610': ('CASIO G-Shock GW-M5610U.jpg', 'G-Shock GW-M5610U', 1920, None),
    'gx-mrg': ('Casio G-SHOCK MR-G The G MRG-7100BJ-1AJF02s5.jpg', 'G-Shock MR-G MRG-7100BJ', 1920, None),
    'gx-9052': ('Casio G-Shock DW9052 - edit.jpg', 'G-Shock DW-9052', 1920, None),
    'gx-ga100': ('Casio G-Shock GA-100, digital and analog watch (from 2010, photographed in 2023).jpg', 'G-Shock GA-100', 1920, None),
    'gx-rangeman': ("Casio G-Shock GW-9400-1ER 'Rangeman' - triple sensor.jpg", 'G-Shock GW-9400 Rangeman', 1920, None),
    'gx-shop': ('Casio G-Shock watches in a shop display in Germany (2023).jpg', 'A wall of G-Shocks', 1920, None),
    'om-speedy': ('Speedmaster (23456608783).jpg', 'Omega Speedmaster Professional', 1920, None),
    'om-dial': ('Moonwatch (24023224706).jpg', 'Speedmaster dial, close up', 1920, None),
    'om-front': ('OMEGA-Speedmaster-Professional-Front.jpg', 'Omega Speedmaster Professional, front', 1920, None),
    'om-side': ('Side view on Omega Speedmaster (cropped).jpg', 'Speedmaster, side view', 1920, None),
    'om-sea60': ('Omega Seamaster ca. 1960.jpg', 'Omega Seamaster, about 1960', 1920, None),
    'om-seamaster': ('Omega-Seamaster-p1020458.jpg', 'Omega Seamaster', 1920, None),
    'rx-sub': ('Rolex Oyster Perpetual Date Submariner Watch.JPG', 'Rolex Oyster Perpetual Date Submariner', 1920, None),
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
            "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1920,
        })
        data = json.loads(fetch(f"https://commons.wikimedia.org/w/api.php?{query}"))
        info = next(iter(data["query"]["pages"].values()))["imageinfo"][0]
        meta = info["extmetadata"]

        target = OUT / f"{slug}.webp"
        if target.exists():  # Resumable: Wikimedia throttles bulk original downloads.
            image = Image.open(target)
        else:
            image = Image.open(io.BytesIO(fetch(info.get("thumburl") or info["url"]))).convert("RGB")
            if crop:
                w, h = image.size
                image = image.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
            if image.width > max_w:
                image = image.resize((max_w, round(image.height * max_w / image.width)), Image.LANCZOS)
            image.save(target, "WEBP", quality=82, method=6)
            time.sleep(1)

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
