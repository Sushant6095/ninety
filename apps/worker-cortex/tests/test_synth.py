"""VERIFY (ADR-072): the 1X2 synthesis reconstructs Home/Draw/Away from Over/Under + Asian-handicap books.

These are property + round-trip checks, not a snapshot: solve Lambda / supremacy from a book, feed them back
through the forward model, and assert the implied probability matches the input. Plus the invariants that matter
for the product: sums to 1, monotone in supremacy, symmetric on a pick-em, draws thin out as goals rise, and —
the load-bearing one — degenerate books return None instead of a fabricated even book.
"""
import math

import pytest
from cortex.dixon_coles import outcome_1x2, score_matrix
from cortex.synth import (
    lambda_total_from_ou,
    supremacy_from_ah,
    synthesize_1x2,
    _cover_prob,
)


# ---- the Dixon-Coles forward model -----------------------------------------------------------------

def test_score_matrix_is_a_normalized_distribution():
    g = score_matrix(1.6, 1.1)
    assert abs(g.sum() - 1.0) < 1e-9
    assert (g >= 0).all()  # the rho correction must never push a cell negative at sane intensities


def test_outcome_1x2_sums_to_one_and_favors_the_stronger_side():
    h, d, a = outcome_1x2(1.9, 0.9)  # home scores ~twice as often
    assert abs(h + d + a - 1.0) < 1e-9
    assert h > a  # stronger attack, higher win prob
    assert h > d


def test_equal_intensities_give_symmetric_win_probs():
    h, d, a = outcome_1x2(1.3, 1.3)
    assert h == pytest.approx(a, abs=1e-9)  # symmetry: identical intensities => P(H) == P(A)
    assert d > 0.20  # a real draw mass, never zero


def test_draw_probability_falls_as_total_goals_rises():
    _, d_low, _ = outcome_1x2(0.6, 0.6)   # low-scoring => draws common
    _, d_high, _ = outcome_1x2(2.6, 2.6)  # high-scoring => draws rarer
    assert d_low > d_high


# ---- inverting the Over/Under book -> total-goals intensity -----------------------------------------

def test_lambda_total_round_trips_through_the_poisson_cdf():
    for p_under, line in [(0.50, 2.5), (0.35, 2.5), (0.62, 3.5), (0.20, 1.5)]:
        lam = lambda_total_from_ou(p_under, line)
        assert lam is not None
        from scipy.stats import poisson
        assert float(poisson.cdf(math.floor(line), lam)) == pytest.approx(p_under, abs=1e-3)


def test_lower_under_prob_means_more_goals():
    lam_goalfest = lambda_total_from_ou(0.30, 2.5)  # under is unlikely => lots of goals
    lam_grind = lambda_total_from_ou(0.70, 2.5)     # under is likely => few goals
    assert lam_goalfest > lam_grind


def test_ou_book_at_the_rails_is_unpriceable():
    assert lambda_total_from_ou(0.0, 2.5) is None
    assert lambda_total_from_ou(1.0, 2.5) is None
    assert lambda_total_from_ou(0.9999, 2.5) is None  # pinned => no information


# ---- inverting the Asian-handicap book -> supremacy -------------------------------------------------

def test_supremacy_round_trips_through_the_cover_prob():
    lam = 2.7
    for p_cover, line in [(0.58, -0.5), (0.50, 0.0), (0.40, 0.5), (0.66, -1.0)]:
        s = supremacy_from_ah(p_cover, line, lam)
        assert s is not None
        assert _cover_prob(s, lam, line) == pytest.approx(p_cover, abs=1e-3)


def test_pickem_line_gives_zero_supremacy():
    s = supremacy_from_ah(0.50, 0.0, 2.6)  # draw-no-bet at 50% => dead even
    assert s == pytest.approx(0.0, abs=1e-2)


def test_higher_cover_prob_means_more_supremacy():
    lam = 2.6
    s_small = supremacy_from_ah(0.55, -0.5, lam)
    s_big = supremacy_from_ah(0.75, -0.5, lam)
    assert s_big > s_small > 0


# ---- the full synthesis ----------------------------------------------------------------------------

def test_synthesis_sums_to_one_and_is_never_the_uniform_book():
    mark = synthesize_1x2(p_under=0.50, ou_line=2.5, p_home_cover=0.58, ah_line=-0.5)
    assert mark is not None
    assert abs(mark["H"] + mark["D"] + mark["A"] - 1.0) < 1e-9
    # the whole point: a real match is never 33/33/33
    assert max(mark.values()) - min(mark.values()) > 0.05
    assert mark["H"] == max(mark.values())  # home was favored on the handicap


def test_synthesis_is_monotone_in_the_handicap():
    weak = synthesize_1x2(0.50, 2.5, 0.54, -0.5)
    strong = synthesize_1x2(0.50, 2.5, 0.72, -0.5)
    assert strong["H"] > weak["H"]
    assert strong["A"] < weak["A"]


def test_symmetric_books_give_symmetric_1x2():
    mark = synthesize_1x2(0.50, 2.5, 0.50, 0.0)  # pick-em on both books
    assert mark["H"] == pytest.approx(mark["A"], abs=1e-6)
    assert mark["D"] > 0.22  # and a substantial draw, not a coin flip


def test_degenerate_books_return_none_never_a_fabricated_book():
    assert synthesize_1x2(0.0, 2.5, 0.58, -0.5) is None       # O/U pinned
    assert synthesize_1x2(0.50, 2.5, 1.0, -0.5) is None       # AH pinned
    assert synthesize_1x2(0.9999, 2.5, 0.0001, -0.5) is None  # both at the rails


def test_realistic_favorite_lands_in_a_sane_band():
    # A mild home favorite: O/U 2.5 slightly under-leaning, home -0.5 at ~58%. Bookmaker 1X2 for such a match is
    # roughly ~55/25/20; assert we land in that neighbourhood (not pinned, not uniform, home clearly on top).
    mark = synthesize_1x2(0.52, 2.5, 0.58, -0.5)
    assert 0.48 < mark["H"] < 0.62
    assert 0.20 < mark["D"] < 0.30
    assert 0.15 < mark["A"] < 0.28
