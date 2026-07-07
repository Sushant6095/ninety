"""Cortex entrypoint. bus in: odds.raw, match.events -> bus out: prices.marks {fair, hazard, b_hint}.
fair = 0.2*model + 0.8*devigged_consensus (model 0 in v1); a goal spikes hazard which drives b(t). Only
bus.py touches Redis (architecture law). ADR-022."""
import json
import logging

from .bus import Bus
from .config import B0, TOPIC_MATCH_EVENTS, TOPIC_ODDS_RAW, TOPIC_PRICES_MARKS
from .hazard import HazardModel
from .pricing import env_seconds, market_id_of, tick_to_mark

log = logging.getLogger("cortex")


def run(bus: Bus | None = None, b0: float = B0) -> None:
    bus = bus or Bus()
    hazards: dict[str, HazardModel] = {}

    def on_odds(env: dict) -> None:
        mid = market_id_of(env)
        hz = hazards.setdefault(mid, HazardModel())
        mark = tick_to_mark(env, hazard_model=hz, b0=b0)
        if mark is not None:
            bus.publish(TOPIC_PRICES_MARKS, mark["match_id"], mark)

    def on_event(env: dict) -> None:
        # a goal spikes hazard for every market of that fixture; minute drives late-game scaling
        if env.get("type") != "goal":
            return
        fid = f'{env.get("match_id")}:'
        ts_s = env_seconds(env)
        minute = env.get("payload", {}).get("minute")
        for mid, hz in hazards.items():
            if mid.startswith(fid):
                hz.on_goal(minute, ts_s)

    log.info(json.dumps({"evt": "cortex.ready", "in": [TOPIC_ODDS_RAW, TOPIC_MATCH_EVENTS], "out": TOPIC_PRICES_MARKS}))
    bus.consume({TOPIC_ODDS_RAW: on_odds, TOPIC_MATCH_EVENTS: on_event}, group="cortex")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    run()


if __name__ == "__main__":
    main()
