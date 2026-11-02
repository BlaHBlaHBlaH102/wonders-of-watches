"""Astronomy for the moon-phase complication.

Low-precision lunar position after Meeus, *Astronomical Algorithms* (ch. 47-48).
No key or network call needed, so the Moon keeps working even if an upstream API
is down. Good to about a percent of illumination, which is more than a moon-phase
disc can show.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone

NAMES = [
    "New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
    "Full moon", "Waning gibbous", "Last quarter", "Waning crescent",
]


def moon_phase(when: datetime | None = None) -> dict:
    """Return illumination (0-1), cycle position (0 new, 0.5 full) and a name."""
    when = when or datetime.now(timezone.utc)
    jd = when.timestamp() / 86400.0 + 2440587.5
    t = (jd - 2451545.0) / 36525.0

    # Mean elongation, solar anomaly and lunar anomaly, in degrees.
    d = 297.8501921 + 445267.1114034 * t
    m = 357.5291092 + 35999.0502909 * t
    mp = 134.9633964 + 477198.8675055 * t
    dr, mr, mpr = map(math.radians, (d, m, mp))

    # Phase angle i: 180 at new moon, 0 at full moon.
    phase_angle = (
        180.0 - d
        - 6.289 * math.sin(mpr)
        + 2.100 * math.sin(mr)
        - 1.274 * math.sin(2 * dr - mpr)
        - 0.658 * math.sin(2 * dr)
        - 0.214 * math.sin(2 * mpr)
        - 0.110 * math.sin(dr)
    ) % 360.0

    illumination = (1 + math.cos(math.radians(phase_angle))) / 2
    # i falls from 180 (new) through 0 (full), so the cycle runs against it.
    cycle = ((180.0 - phase_angle) % 360.0) / 360.0
    # Principal phases are instants, so give each only a narrow window.
    octant = NAMES[round(cycle * 8) % 8]
    return {
        "illumination": round(illumination, 4),
        "cycle": round(cycle, 4),
        "name": octant,
        "waxing": cycle < 0.5,
    }
