"""Subset the licensed OTF fonts and DSEG7 to WOFF2 for the web.

Usage: python scripts/build_fonts.py <helvetica_dir> <minion_dir> <dseg_dir>

DSEG7 is deliberately cut down to digits and clock punctuation: seven segments
can't draw legible letters, so the font cannot be used for text by accident.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"

LATIN = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [
    0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x2032, 0x2033,
    0x00D7, 0x2212, 0x2192, 0x2190, 0x2197, 0x2022,
]
DIGITS = [ord(c) for c in "0123456789:.- "]

HELVETICA = ["Th", "ThIt", "ThEx", "UltLt", "UltLtEx", "Lt", "Roman", "It", "Md", "MdEx", "BdEx",
             "LtCn", "Cn", "MdCn", "BdCn", "XBlkCn", "ThCn"]
MINION = ["Regular", "It", "Medium", "MediumIt", "SemiboldIt", "BoldCn", "BoldCnIt"]
DSEG = ["DSEG7Classic-Regular", "DSEG7Classic-Bold"]


def cut(src: Path, dest: Path, unicodes: list[int]) -> None:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "liga", "onum", "lnum", "tnum", "pnum", "smcp", "c2sc", "ss01", "mark", "mkmk"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    font = TTFont(src)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(dest)
    print(f"{dest.name}: {dest.stat().st_size // 1024} KB")


def main(helvetica: str, minion: str, dseg: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in HELVETICA:
        cut(Path(helvetica) / f"HelveticaNeueLTPro-{name}.otf", OUT / f"helv-{name}.woff2", LATIN)
    for name in MINION:
        cut(Path(minion) / f"MinionPro-{name}.otf", OUT / f"minion-{name}.woff2", LATIN)
    for name in DSEG:
        source = next(Path(dseg).rglob(f"{name}.woff2"))
        cut(source, OUT / f"{name}.woff2", DIGITS)


if __name__ == "__main__":
    main(*sys.argv[1:4])
