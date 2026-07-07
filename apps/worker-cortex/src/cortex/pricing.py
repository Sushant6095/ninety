"""odds.raw tick -> prices.marks Mark (ADR-022). De-vig the book (Shin -> power), blend with the model term
(0 in v1 -> pure consensus), attach hazard + b_hint. fair sums to 1. Budget: < 20ms/tick."""
import uuid
from datetime import datetime, timezone

from .config import B0, CONSENSUS_W, MODEL_W, ODDS_SCALE
from .devig import devig
from .hazard import HazardModel, b_hint


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def env_seconds(env: dict) -> float:
    """Best wall-clock (seconds) for an envelope: odds carry payload.ts (ms); events carry ts_source (ISO)."""
    ts_ms = env.get("payload", {}).get("ts")
    if isinstance(ts_ms, (int, float)):
        return ts_ms / 1000.0
    ts_src = env.get("ts_source")
    if isinstance(ts_src, str):
        try:
            return datetime.fromisoformat(ts_src.replace("Z", "+00:00")).timestamp()
        except ValueError:
            pass
    return 0.0


def market_id_of(env: dict) -> str:
    p = env.get("payload", {})
    return f'{p.get("fixtureId")}:{p.get("superOddsType")}:{p.get("marketParameters")}'


def _blend(consensus: list[float], model: list[float] | None) -> list[float]:
    """fair = MODEL_W*model + CONSENSUS_W*consensus, renormalized. model=None -> consensus (v1, model term 0)."""
    if model is None or len(model) != len(consensus):
        return consensus
    mixed = [MODEL_W * m + CONSENSUS_W * c for m, c in zip(model, consensus)]
    s = sum(mixed)
    return [x / s for x in mixed] if s > 0 else consensus


def tick_to_mark(env: dict, hazard_model: HazardModel | None = None, model: list[float] | None = None, b0: float = B0) -> dict | None:
    """Return a prices.marks Envelope (type 'mark'), or None if the tick has no usable 2+ outcome book."""
    p = env.get("payload", {})
    prices = p.get("prices") or []
    if len(prices) < 2:
        return None
    names = p.get("priceNames") or [str(i) for i in range(len(prices))]
    odds = [x / ODDS_SCALE for x in prices]
    consensus, _method = devig(odds)
    fair_vec = _blend(consensus, model)
    fair = {names[i]: fair_vec[i] for i in range(len(fair_vec))}

    hazard = 0.0
    hint = b0
    if hazard_model is not None:
        ts_s = env_seconds(env)
        hazard_model.update_tick(fair_vec, ts_s)
        hazard = hazard_model.value(ts_s)
        hint = b_hint(hazard, b0)

    mark = {"market_id": market_id_of(env), "fair": fair, "hazard": hazard, "b_hint": hint}
    return {
        "event_id": str(uuid.uuid4()),
        "source": "cortex",
        "source_seq": env.get("source_seq", 0),  # one mark per odds tick -> inherit its seq (idempotent on cortex,seq)
        "match_id": env.get("match_id", str(p.get("fixtureId"))),
        "ts_source": env.get("ts_source", _now_iso()),
        "ts_ingest": _now_iso(),
        "type": "mark",
        "payload": mark,
    }
