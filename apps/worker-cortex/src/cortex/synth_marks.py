"""Turn the fixture's latest Over/Under + Asian-handicap ticks into ONE synthesized 1X2 mark (ADR-072).

pricing.tick_to_mark emits a mark per (fixture, superOddsType, marketParameters) book — so an Over/Under tick makes
an {Over,Under} mark and a handicap tick makes a {home,away} mark; neither is the 1X2 the engine trades. This
aggregator keeps, per fixture, the LATEST de-vigged Over/Under and Asian-handicap vectors, and whenever both are
present it publishes a synthesized 1X2 mark under the fixture's canonical market id.

TWO SEAMS, split on purpose so the risky half is isolated:
  • update_ou / update_ah / synth  — pure, de-vig-free aggregation + synthesis. Unit-tested in-sandbox.
  • classify_tick                   — parses a raw TxLINE tick (PriceNames/Prices/MarketParameters) and de-vigs it.
    It depends on the exact SuperOddsType / MarketParameters STRING values, which are runtime (ADR-015, confirmed
    only against a live tick). Treat its string matching as PROVISIONAL: confirm the Over/Under and Asian-handicap
    identifiers against a real feed sample before trusting it in production. The math above does not depend on it.

MARKET ID: the synth mark is published under `str(fixtureId)` — the engine's v1 invariant is marketId === matchId
=== txline fixtureId, and markets-read keys marks by Market.id. Confirm this mapping against the seed/projection on
first live run (the one integration point this module cannot self-verify).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .config import B0, ODDS_SCALE
from .synth import synthesize_1x2


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SynthAggregator:
    """Per-fixture store of the latest (p_under, ou_line) and (p_home_cover, ah_line); synthesizes 1X2 on demand."""

    def __init__(self, b0: float = B0) -> None:
        self._ou: dict[str, tuple[float, float]] = {}   # fixture -> (p_under, line)
        self._ah: dict[str, tuple[float, float]] = {}   # fixture -> (p_home_cover, line)
        self._b0 = b0

    def update_ou(self, fixture: str, p_under: float, line: float) -> None:
        self._ou[fixture] = (p_under, line)

    def update_ah(self, fixture: str, p_home_cover: float, line: float) -> None:
        self._ah[fixture] = (p_home_cover, line)

    def synth(self, fixture: str) -> dict[str, float] | None:
        """The synthesized {'H','D','A'} for this fixture, or None until BOTH books have arrived and are priceable."""
        ou = self._ou.get(fixture)
        ah = self._ah.get(fixture)
        if ou is None or ah is None:
            return None
        return synthesize_1x2(p_under=ou[0], ou_line=ou[1], p_home_cover=ah[0], ah_line=ah[1])

    def mark_envelope(self, fixture: str, source_seq: int = 0, hazard: float = 0.0, b_hint: float | None = None) -> dict | None:
        """A prices.marks envelope carrying the synthesized 1X2, or None if not yet priceable. Mirrors
        pricing.tick_to_mark's shape so the downstream projection treats it identically."""
        fair = self.synth(fixture)
        if fair is None:
            return None
        payload = {
            "market_id": str(fixture),  # == matchId (v1 invariant) — confirm against seed/projection on first live run
            "fair": fair,
            "hazard": hazard,
            "b_hint": self._b0 if b_hint is None else b_hint,
        }
        return {
            "event_id": str(uuid.uuid4()),
            "source": "cortex",
            "source_seq": source_seq,
            "match_id": str(fixture),
            "ts_source": _now_iso(),
            "ts_ingest": _now_iso(),
            "type": "mark",
            "payload": payload,
        }


def classify_tick(payload: dict) -> tuple[str, float, float] | None:
    """PROVISIONAL (see module docstring): classify a cortex odds-envelope PAYLOAD as ('ou'|'ah', line, p_side).

    Reads the SAME lowercase envelope keys pricing.py/market_id_of consume (`priceNames`, `prices`,
    `marketParameters`, `superOddsType`) — the ingest normalizes TxLINE's capitalized keys before publishing.
    Returns (kind, line, p) where for 'ou' p is P(Under) and for 'ah' p is P(home covers), both DE-VIGGED, or None
    if the tick is neither / unusable. De-vig uses devig.py (penaltyblog) — this runs on the Mac/live stack, not the
    in-sandbox unit tests. The exact name / marketParameters strings below MUST be confirmed against a live tick.
    """
    from .devig import devig  # local import: penaltyblog dep, kept off the pure-synth import path

    names = [str(n).lower() for n in (payload.get("priceNames") or [])]
    prices = payload.get("prices") or []
    if len(names) != 2 or len(prices) != 2:
        return None
    try:
        line = float(str(payload.get("marketParameters", "")).strip())
    except (TypeError, ValueError):
        return None
    odds = [x / ODDS_SCALE for x in prices]
    fair, _method = devig(odds)

    if any("under" in n or "over" in n for n in names):
        under_ix = next((i for i, n in enumerate(names) if "under" in n), None)
        if under_ix is None:
            return None
        return ("ou", line, fair[under_ix])
    # otherwise treat a 2-way non-total book as an Asian handicap: first name is the home side, p = P(home covers)
    sot = str(payload.get("superOddsType", "")).lower()
    if "handicap" in sot or "asian" in sot or len(names) == 2:
        return ("ah", line, fair[0])
    return None
