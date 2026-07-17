"""Dixon-Coles bivariate-Poisson outcome model + the (still-deferred) particle-filter model term.

Two DISTINCT jobs live here — do not confuse them:

  1. score_matrix / outcome_1x2 — the Dixon-Coles low-score-corrected bivariate Poisson that turns a pair of
     scoring intensities (lambda_home, lambda_away) into P(Home)/P(Draw)/P(Away). REVIVED (ADR-072): the free
     TxLINE feed carries only 2-outcome books (Over/Under totals + Asian handicap), never a 1X2 book, so
     `synth.py` fits (lambda_home, lambda_away) from those books and calls `outcome_1x2` to recover the H/D/A the
     engine actually trades. This path is now live.

  2. model_probs — the 0.2*model blend term (a ~500-particle in-play posterior). STILL DEFERRED (ADR-022): v1
     ships model term = 0 (devigged consensus is king), so `model_probs` returns None and pricing.py collapses
     the blend to pure consensus. (1) is the outcome-space reconstruction that is on; (2) is the alpha model
     that stays off. Reviving (1) does NOT turn on (2).
"""
from __future__ import annotations

import numpy as np
from scipy.stats import poisson

# Dixon-Coles low-score dependence. rho < 0 lifts the 0-0 and 1-1 cells (draws) and trims 1-0/0-1, matching
# Dixon & Coles (1997)'s empirical finding that low-scoring draws are underpriced by an independent Poisson.
# Small magnitude — a sane knob, not a fit, until we calibrate on WC26 data (ADR-072 follow-up).
DC_RHO = -0.10
# Score-grid truncation. P(> MAX_GOALS either side) is ~0 for football scoring intensities; the grid is
# renormalized to sum 1 so the tail truncation is absorbed, not fabricated away.
MAX_GOALS = 10


def _tau(i: int, j: int, lh: float, la: float, rho: float) -> float:
    """Dixon-Coles correction applied to the four lowest score cells; 1.0 everywhere else."""
    if i == 0 and j == 0:
        return 1.0 - lh * la * rho
    if i == 0 and j == 1:
        return 1.0 + lh * rho
    if i == 1 and j == 0:
        return 1.0 + la * rho
    if i == 1 and j == 1:
        return 1.0 - rho
    return 1.0


def score_matrix(lh: float, la: float, rho: float = DC_RHO, max_goals: int = MAX_GOALS) -> np.ndarray:
    """P(home=i, away=j) grid (rows = home goals, cols = away goals), Dixon-Coles corrected, renormalized to 1.

    Uses scipy Poisson pmf (numpy 2.x removed np.math.factorial) so there is no factorial overflow.
    """
    ks = np.arange(max_goals + 1)
    ph = poisson.pmf(ks, lh)  # P(home = k)
    pa = poisson.pmf(ks, la)  # P(away = k)
    grid = np.outer(ph, pa)
    for (a, b) in ((0, 0), (0, 1), (1, 0), (1, 1)):
        grid[a, b] *= _tau(a, b, lh, la, rho)
    s = float(grid.sum())
    return grid / s if s > 0 else grid


def outcome_1x2(lh: float, la: float, rho: float = DC_RHO, max_goals: int = MAX_GOALS) -> tuple[float, float, float]:
    """(P_home, P_draw, P_away) from scoring intensities via the Dixon-Coles score grid. Sums to 1."""
    g = score_matrix(lh, la, rho, max_goals)
    p_home = float(np.tril(g, -1).sum())  # home goals > away goals
    p_away = float(np.triu(g, 1).sum())   # away goals > home goals
    p_draw = float(np.trace(g))           # equal score (the diagonal)
    return p_home, p_draw, p_away


def model_probs(state=None) -> list[float] | None:
    """The 0.2*model blend term. STILL DEFERRED (ADR-022): v1 has no model term, so return None and let pricing
    collapse fair to pure devigged consensus. Wire the ~500-particle in-play filter here only when ahead of
    schedule — reviving the outcome-space synthesis (above) does NOT require turning this on."""
    return None  # v1: consensus is king
