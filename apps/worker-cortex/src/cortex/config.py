"""Cortex constants. Topics mirror packages/schema/src/topics.ts (same Redis Streams names)."""
import os

TOPIC_ODDS_RAW = "odds.raw.v1"
TOPIC_MATCH_EVENTS = "match.events.v1"
TOPIC_PRICES_MARKS = "prices.marks.v1"

ODDS_SCALE = 1000.0  # TxLINE prices are milli-decimal-odds (2998 → 2.998). Calibration knob if a feed rescales.
B0 = 300.0           # base LMSR liquidity (matches the engine's b0; Mark.b_hint is in these units)
KAPPA = 1.0          # b_hint sensitivity: b(t) = b0·(1 + κ·hazard), clamped [b0, 3·b0]
CONSENSUS_W = 0.8    # fair = 0.2·model + 0.8·consensus (quant canon); the model term is 0 in v1
MODEL_W = 0.2
TICK_BUDGET_MS = 20.0

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
