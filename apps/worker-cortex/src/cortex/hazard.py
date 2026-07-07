"""Hazard v1 heuristic (ADR-022): recent-tick variance + game state (goal spike with decay, late-game
scaling) -> h(t). Drives dynamic LMSR liquidity b(t) = b0*(1 + kappa*h), clamped [b0, 3*b0]."""
import math
from collections import deque
from statistics import pvariance

from .config import B0, KAPPA

GOAL_SPIKE = 1.5      # hazard bump the instant a goal lands
DECAY_TAU_S = 90.0    # goal-spike e-folding time (seconds) — spike ~ 0 after ~5 minutes
VAR_WINDOW = 20       # ticks kept for the volatility term
VAR_SCALE = 40.0      # maps leading-prob variance -> hazard units (calibration knob)
LATE_MINUTE = 75      # late-game scaling starts here...
LATE_SPAN = 15.0      # ...and grows by 1.0 per LATE_SPAN minutes beyond it


class HazardModel:
    """Per-market hazard state. Fed by odds ticks (variance) and goal events (spike + minute)."""

    def __init__(self) -> None:
        self._recent: deque[float] = deque(maxlen=VAR_WINDOW)
        self._goal_ts: float | None = None
        self._minute: int = 0

    def update_tick(self, probs: list[float], ts_s: float) -> None:
        # the leading outcome's probability; its variance is the in-play volatility signal
        self._recent.append(max(probs))

    def on_goal(self, minute: int | None, ts_s: float) -> None:
        self._goal_ts = ts_s
        self.set_minute(minute)

    def set_minute(self, minute: int | None) -> None:
        if minute is not None:
            self._minute = max(self._minute, minute)

    def value(self, ts_s: float) -> float:
        var_term = pvariance(self._recent) * VAR_SCALE if len(self._recent) >= 2 else 0.0
        # elapsed floored at 0 so an out-of-order tick (ts before the goal) can't push the spike above GOAL_SPIKE
        dt = max(0.0, ts_s - self._goal_ts) if self._goal_ts is not None else 0.0
        spike = GOAL_SPIKE * math.exp(-dt / DECAY_TAU_S) if self._goal_ts is not None else 0.0
        late = 1.0 + max(0.0, (self._minute - LATE_MINUTE) / LATE_SPAN)
        return max(0.0, (var_term + spike) * late)


def b_hint(hazard: float, b0: float = B0, kappa: float = KAPPA) -> float:
    """b(t) = b0*(1 + kappa*hazard), clamped to [b0, 3*b0]."""
    return min(3.0 * b0, max(b0, b0 * (1.0 + kappa * hazard)))
