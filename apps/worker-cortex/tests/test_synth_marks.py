"""VERIFY (ADR-072): the per-fixture aggregator holds one book at a time and only synthesizes once BOTH arrive,
and the emitted envelope matches the prices.marks shape. (The de-vig tick classifier is confirmed on the live
stack, not here — this covers the pure aggregation seam.)"""
from cortex.synth_marks import SynthAggregator


def test_no_synth_until_both_books_present():
    agg = SynthAggregator()
    assert agg.synth("F1") is None          # nothing yet
    agg.update_ou("F1", p_under=0.52, line=2.5)
    assert agg.synth("F1") is None          # only O/U -> still unpriced, never guessed
    agg.update_ah("F1", p_home_cover=0.58, line=-0.5)
    mark = agg.synth("F1")
    assert mark is not None
    assert abs(mark["H"] + mark["D"] + mark["A"] - 1.0) < 1e-9
    assert mark["H"] == max(mark.values())  # home favored on the handicap


def test_fixtures_are_isolated():
    agg = SynthAggregator()
    agg.update_ou("A", 0.5, 2.5)
    agg.update_ah("B", 0.5, 0.0)            # different fixture -> neither is complete
    assert agg.synth("A") is None
    assert agg.synth("B") is None


def test_mark_envelope_shape_matches_prices_marks():
    agg = SynthAggregator()
    agg.update_ou("18241006", 0.50, 2.5)
    agg.update_ah("18241006", 0.50, 0.0)
    env = agg.mark_envelope("18241006", source_seq=7)
    assert env is not None
    assert env["type"] == "mark"
    assert env["source"] == "cortex"
    assert env["source_seq"] == 7
    assert env["match_id"] == "18241006"
    p = env["payload"]
    assert p["market_id"] == "18241006"     # == matchId (v1 invariant)
    assert set(p["fair"].keys()) == {"H", "D", "A"}
    assert "hazard" in p and "b_hint" in p
