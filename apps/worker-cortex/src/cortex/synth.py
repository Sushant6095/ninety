"""Synthesize a 1X2 (Home / Draw / Away) fair vector from the 2-outcome books the free TxLINE feed actually ships.

WHY THIS EXISTS (ADR-072 — the outcome-space gap):
The live free feed carries Over/Under totals and Asian-handicap books, but NEVER a 1X2 book. The engine trades
H/D/A. So instead of inventing a book, we INFER the two scoring intensities the pitch implies and reconstruct
1X2 from them:

  1. Over/Under, de-vigged P(under `ou_line`)          -> total-goals intensity  Lambda = lambda_home + lambda_away
     via the Poisson CDF: P(total <= floor(line)) = poisson.cdf(floor(line), Lambda).
  2. Asian handicap, de-vigged P(home covers `ah_line`) + Lambda  -> supremacy  S = lambda_home - lambda_away
     via the Skellam (difference of two Poissons) survival function.
  3. (lambda_home, lambda_away) = ((Lambda + S)/2, (Lambda - S)/2) -> Dixon-Coles -> P(H)/P(D)/P(A).

De-vig is NOT done here — the caller passes already-devigged probabilities from `devig.py` (canon: use penaltyblog,
don't reimplement). This module is the outcome-space reconstruction only, so it is pure and dependency-light
(numpy/scipy), and unit-testable without Redis, the bus, or penaltyblog.

HARD INVARIANT (mirrors markets.ts `hasCompleteFair` / ADR-071):
If a book is missing, pinned at 0/1, or the solve is degenerate/out-of-band, return None. A null synthesis renders
as UNPRICED (`mark: null`) downstream — we NEVER fabricate a flat 33/33/33 book. A silent even book sitting on a
live match is precisely the bug this guards against.
"""
from __future__ import annotations

import math

from scipy.optimize import brentq
from scipy.stats import poisson, skellam

from .dixon_coles import DC_RHO, outcome_1x2

# Plausible band for total-goals intensity. A root outside this band means the book implies a scoreline profile no
# football match produces -> treat as unpriceable rather than clamp to a fabricated value.
LAMBDA_MIN, LAMBDA_MAX = 0.2, 8.0
# Reject books pinned at the rails (0 or 1): no information, or a rounding artifact on a demargined book.
_P_EPS = 1e-4


def lambda_total_from_ou(p_under: float, ou_line: float) -> float | None:
    """Total-goals intensity Lambda such that Poisson(Lambda).cdf(floor(ou_line)) == p_under.

    Returns None if p_under is at the rails or is unachievable within the plausible band (unpriceable, not clamped).
    """
    if not (_P_EPS < p_under < 1.0 - _P_EPS):
        return None
    k = math.floor(ou_line)  # "under 2.5" => total <= 2

    def f(lam: float) -> float:
        return float(poisson.cdf(k, lam)) - p_under

    lo, hi = f(LAMBDA_MIN), f(LAMBDA_MAX)
    if lo * hi > 0:  # no sign change -> p_under not reachable in-band
        return None
    return float(brentq(f, LAMBDA_MIN, LAMBDA_MAX, xtol=1e-4))


def _cover_prob(supremacy: float, lam_total: float, ah_line: float) -> float:
    """P(home covers Asian-handicap `ah_line`) under Skellam(lambda_home, lambda_away).

    D = home - away ~ Skellam(mu1=lambda_home, mu2=lambda_away). Home covers iff D > -ah_line. On an integer line
    (a possible push at D == -ah_line) half of the push mass is counted, which is the fair midpoint for inferring
    supremacy (a push refunds the stake).
    """
    lh = (lam_total + supremacy) / 2.0
    la = (lam_total - supremacy) / 2.0
    if lh <= 0.0 or la <= 0.0:
        return float("nan")
    thr = -ah_line
    fthr = math.floor(thr)
    p = float(skellam.sf(fthr, lh, la))  # P(D > fthr) = P(D >= fthr + 1)
    if abs(thr - round(thr)) < 1e-9:      # integer line -> D == thr is a push; count half
        p += 0.5 * float(skellam.pmf(int(round(thr)), lh, la))
    return p


def supremacy_from_ah(p_home_cover: float, ah_line: float, lambda_total: float) -> float | None:
    """Supremacy S = lambda_home - lambda_away such that cover_prob(S) == p_home_cover. None if out of band."""
    if not (_P_EPS < p_home_cover < 1.0 - _P_EPS):
        return None
    lam = lambda_total

    def f(s: float) -> float:
        return _cover_prob(s, lam, ah_line) - p_home_cover

    lo, hi = -lam + 1e-3, lam - 1e-3
    flo, fhi = f(lo), f(hi)
    if not (math.isfinite(flo) and math.isfinite(fhi)) or flo * fhi > 0:
        return None
    return float(brentq(f, lo, hi, xtol=1e-4))


def synthesize_1x2(
    p_under: float,
    ou_line: float,
    p_home_cover: float,
    ah_line: float,
    rho: float = DC_RHO,
) -> dict[str, float] | None:
    """Return {'H','D','A'} summing to 1, or None when the books cannot support a confident 1X2.

    Never returns a fabricated even book: if either solve is degenerate, the result is None and the mark stays
    unpriced (markets.ts renders `mark: null`).
    """
    lam_total = lambda_total_from_ou(p_under, ou_line)
    if lam_total is None:
        return None
    supremacy = supremacy_from_ah(p_home_cover, ah_line, lam_total)
    if supremacy is None:
        return None
    lh = (lam_total + supremacy) / 2.0
    la = (lam_total - supremacy) / 2.0
    if lh <= 0.0 or la <= 0.0:
        return None
    h, d, a = outcome_1x2(lh, la, rho)
    total = h + d + a
    if total <= 0.0:
        return None
    return {"H": h / total, "D": d / total, "A": a / total}
