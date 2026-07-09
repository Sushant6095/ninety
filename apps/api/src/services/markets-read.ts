// Markets read-model (the price read cache). The projection (ADR-027) persists orders/positions/credits/leaderboard
// but NOT the live prices — those ride `prices.marks` (cortex, ADR-022). This consumer persists the latest mark per
// market to Redis so GET /markets can serve real live prices without touching engine state or recomputing.
//
// Redis: hash `market:{marketId}` = { matchId, fair (JSON), hazard, bHint, ts }. Derived cache (README rule 3):
// rebuildable by replaying the retained prices.marks stream. NOTE: `fair` (the mark) is the price the frontend
// shows; the full LMSR amm state (q = shares outstanding, spread_mult) lives ONLY in the engine's journaled state
// and is not exposed here — GET /markets/:match returns b (from b_hint) with q/spread_mult flagged for a guarded
// engine-emit follow-up (ADR).
import type { Bus } from "@omnipitch/bus";
import type { Redis } from "ioredis";
import { TOPICS, type Envelope } from "@omnipitch/schema";

export const MARK_KEY = (marketId: string): string => `market:${marketId}`;

export interface MarkSnapshot {
  marketId: string;
  matchId: string;
  fair: Record<string, number>; // outcome → probability (0..1); the price the client shows
  hazard: number;
  bHint: number; // LMSR liquidity the mark implies — the real part of `amm`
  ts: number; // ms; source-event time (freshness / live-ness)
}

/** Pure: a prices.marks envelope → the hash fields to persist, or null if it isn't a usable mark. */
export function planMark(env: Envelope): { marketId: string; fields: Record<string, string> } | null {
  const p = env.payload as { market_id?: string; fair?: Record<string, number>; hazard?: number; b_hint?: number };
  if (!p.market_id || !p.fair) return null;
  const ts = Date.parse(env.ts_ingest) || Date.parse(env.ts_source) || 0;
  return {
    marketId: p.market_id,
    fields: { matchId: env.match_id, fair: JSON.stringify(p.fair), hazard: String(p.hazard ?? 0), bHint: String(p.b_hint ?? 0), ts: String(ts) },
  };
}

/** Wire the consumer onto a bus + Redis. Own group cursor so it replays the retained stream on a fresh deploy. */
export async function startMarketsRead(bus: Bus, redis: Redis): Promise<void> {
  await bus.consume(TOPICS.pricesMarks, "markets-read", async (env: Envelope) => {
    const plan = planMark(env);
    if (plan) await redis.hset(MARK_KEY(plan.marketId), plan.fields);
  });
}

const parseSnapshot = (marketId: string, h: Record<string, string>): MarkSnapshot | null => {
  if (!h || !h.fair) return null;
  try {
    return { marketId, matchId: h.matchId ?? "", fair: JSON.parse(h.fair), hazard: Number(h.hazard ?? 0), bHint: Number(h.bHint ?? 0), ts: Number(h.ts ?? 0) };
  } catch {
    return null;
  }
};

export async function getMark(redis: Redis, marketId: string): Promise<MarkSnapshot | null> {
  return parseSnapshot(marketId, await redis.hgetall(MARK_KEY(marketId)));
}

/** Batch-read marks for a set of market ids (GET /markets list). Missing marks are simply absent from the map. */
export async function getMarks(redis: Redis, marketIds: string[]): Promise<Map<string, MarkSnapshot>> {
  if (marketIds.length === 0) return new Map();
  const pipe = redis.pipeline();
  for (const id of marketIds) pipe.hgetall(MARK_KEY(id));
  const res = await pipe.exec();
  const out = new Map<string, MarkSnapshot>();
  res?.forEach(([, h], i) => {
    const snap = parseSnapshot(marketIds[i], (h as Record<string, string>) ?? {});
    if (snap) out.set(marketIds[i], snap);
  });
  return out;
}
