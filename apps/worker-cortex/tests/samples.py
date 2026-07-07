"""Load real captured TxLINE samples and shape them into the odds.raw envelope the cortex consumes
(mirrors apps/worker-ingest/src/normalizer.ts normalizeOdds)."""
import json
import os

_SAMPLES = os.path.join(os.path.dirname(__file__), "..", "..", "..", "docs", "txline-samples")


def load(name: str):
    with open(os.path.join(_SAMPLES, name + ".json"), encoding="utf-8") as f:
        return json.load(f)


def odds_env(tick: dict) -> dict:
    return {
        "source": "txline.odds",
        "source_seq": 1,
        "match_id": str(tick["FixtureId"]),
        "ts_source": "2026-07-07T20:00:00.000Z",
        "type": "odds_tick",
        "payload": {
            "fixtureId": tick["FixtureId"],
            "ts": tick["Ts"],
            "superOddsType": tick["SuperOddsType"],
            "marketParameters": tick["MarketParameters"],
            "priceNames": tick["PriceNames"],
            "prices": tick["Prices"],
        },
    }


def all_odds_ticks() -> list[dict]:
    ticks = list(load("odds-updates"))
    ticks.append(load("odds-stream-event"))
    return ticks
