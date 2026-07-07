"""VERIFY (task 1): replay -> every mark's fair sums to 1 (+-1e-6); <20ms/tick.
VERIFY (task 2): a goal spikes the mark's hazard, then it decays."""
import time

from cortex.config import B0
from cortex.hazard import HazardModel
from cortex.pricing import tick_to_mark
from samples import all_odds_ticks, load, odds_env


def _ms(fn) -> float:
    t = time.perf_counter()
    fn()
    return (time.perf_counter() - t) * 1000.0


def test_every_replayed_mark_sums_to_one():
    ticks = all_odds_ticks()
    assert len(ticks) >= 1
    for tick in ticks:
        mark = tick_to_mark(odds_env(tick))  # task 1: no hazard model -> hazard 0, b_hint b0 placeholder
        assert mark is not None
        payload = mark["payload"]
        fair = payload["fair"]
        assert abs(sum(fair.values()) - 1.0) < 1e-6
        assert all(0.0 <= v <= 1.0 for v in fair.values())
        assert payload["hazard"] == 0.0
        assert payload["b_hint"] == B0
        assert mark["type"] == "mark" and mark["source"] == "cortex"
        assert set(fair.keys()) == set(tick["PriceNames"])  # keyed by the market's own outcomes


def test_tick_budget_under_20ms():
    env = odds_env(load("odds-stream-event"))
    tick_to_mark(env)  # warmup: amortize penaltyblog/scipy first-call import
    best = min(_ms(lambda: tick_to_mark(env)) for _ in range(5))
    assert best < 20.0, f"tick took {best:.2f}ms (budget 20ms)"


def test_goal_spikes_then_decays_the_mark_hazard():
    hz = HazardModel()
    m0 = tick_to_mark(odds_env(load("odds-stream-event")), hazard_model=hz)  # pre-goal
    hz.on_goal(minute=80, ts_s=0.0)

    def tick_at(ts_ms: int) -> dict:
        env = odds_env(load("odds-stream-event"))
        env["payload"]["ts"] = ts_ms
        return tick_to_mark(env, hazard_model=hz)

    m1 = tick_at(1000)     # 1s after the goal
    m2 = tick_at(180_000)  # 180s after the goal
    assert m1["payload"]["hazard"] > m0["payload"]["hazard"]  # the goal spiked hazard
    assert m1["payload"]["hazard"] > m2["payload"]["hazard"]  # then it decayed
    assert m1["payload"]["b_hint"] > B0                       # spike raised the liquidity hint
