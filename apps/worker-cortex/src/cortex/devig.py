"""Shin's method (penaltyblog) with a power-method fallback. Decimal odds → fair outcome probabilities.

TxLINE ships a demargined book ("TXLineStablePriceDemargined") whose booksum is ~1 and often slightly UNDER 1.
Shin's root-finder (penaltyblog uses scipy ridder on z in [0, 100]) has no sign change on an under-round book
and raises — so the live path falls back to the power method. Shin is still exercised on genuinely margined
books. (ADR-022. Canon says "use penaltyblog, don't reimplement", so both methods come from there.)
"""
from penaltyblog.implied import ImpliedMethod, calculate_implied


def _valid(probs: list[float]) -> bool:
    return (
        len(probs) >= 2
        and all(p == p for p in probs)  # reject NaN
        and all(0.0 <= p <= 1.0 for p in probs)
        and abs(sum(probs) - 1.0) < 1e-6
    )


def devig(odds: list[float]) -> tuple[list[float], str]:
    """Return (fair_probs, method). Try Shin; fall back to power on failure/invalid (under-round books)."""
    try:
        probs = list(calculate_implied(odds, method=ImpliedMethod.SHIN).probabilities)
        if _valid(probs):
            return probs, "shin"
    except Exception:
        pass  # under-round book / non-convergent → power fallback below
    probs = list(calculate_implied(odds, method=ImpliedMethod.POWER).probabilities)
    return probs, "power"
