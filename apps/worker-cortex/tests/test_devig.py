"""VERIFY: Shin de-vig matches an independent hand computation; the live under-round book falls back to power."""
import math

import pytest
from cortex.devig import devig
from samples import load


def _shin_reference(odds: list[float]) -> list[float]:
    """Independent Shin (bisection on z solving sum(p)=1) — the 'hand-computed' cross-check of penaltyblog."""
    inv = [1.0 / o for o in odds]
    booksum = sum(inv)

    def probs_for(z: float) -> list[float]:
        return [(math.sqrt(z * z + 4 * (1 - z) * (pi * pi) / booksum) - z) / (2 * (1 - z)) for pi in inv]

    lo, hi = 0.0, 1.0 - 1e-9
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if sum(probs_for(mid)) > 1.0:
            lo = mid
        else:
            hi = mid
    return probs_for(0.5 * (lo + hi))


def test_shin_matches_hand_computed_reference():
    odds = [1.5, 2.5]  # a margined (over-round) book — Shin's domain
    probs, method = devig(odds)
    assert method == "shin"
    assert abs(sum(probs) - 1.0) < 1e-9
    for p, r in zip(probs, _shin_reference(odds)):
        assert abs(p - r) < 1e-6
    assert probs[0] == pytest.approx(0.63333, abs=1e-4)  # locked hand value


def test_power_fallback_on_underround_demargined_book():
    tick = load("odds-updates")[0]  # real TxLINE demargined sample: booksum < 1 -> Shin raises -> power
    odds = [x / 1000.0 for x in tick["Prices"]]
    probs, method = devig(odds)
    assert method == "power"  # the fallback is load-bearing on the real feed, not decorative
    assert abs(sum(probs) - 1.0) < 1e-6
    assert all(0.0 < p < 1.0 for p in probs)
