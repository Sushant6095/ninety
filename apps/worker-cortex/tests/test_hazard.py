"""VERIFY (task 2): goal spike -> decay; b_hint clamped to [b0, 3*b0]; late-game scaling raises hazard."""
from cortex.config import B0
from cortex.hazard import HazardModel, b_hint


def test_goal_spike_then_decay():
    hz = HazardModel()
    hz.set_minute(60)
    base = hz.value(1000.0)
    hz.on_goal(minute=61, ts_s=1000.0)
    at_goal = hz.value(1000.0)
    soon = hz.value(1030.0)
    later = hz.value(1120.0)
    assert at_goal > base            # a goal spikes hazard
    assert at_goal > soon > later    # then it decays monotonically
    assert later < at_goal


def test_b_hint_clamped_to_band():
    assert b_hint(0.0, B0) == B0
    assert b_hint(100.0, B0) == 3 * B0     # clamps at 3*b0
    assert B0 <= b_hint(0.5, B0) <= 3 * B0


def test_late_game_scaling_raises_hazard():
    early = HazardModel()
    early.on_goal(30, 0.0)
    late = HazardModel()
    late.on_goal(88, 0.0)
    assert late.value(0.0) > early.value(0.0)  # same spike, later minute -> higher hazard
