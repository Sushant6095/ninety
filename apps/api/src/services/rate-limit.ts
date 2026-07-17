// Per-user order rate window (ADR-071). The engine's RATE_LIMIT gate (order.ts) is pure — it needs the CALLER to
// supply the user's recent accepted-order event-times; the engine owns no per-user store. This holds them in a
// Redis sorted set (score = event-time ms), read before a submit and appended on acceptance. Trimmed on every
// read + a TTL, so it can never grow unbounded. Redis is a derived cache — losing it only resets a rate window,
// never any credits.
import type { Redis } from "ioredis";
import { RATE_WINDOW_MS } from "../engine/order";

const KEY = (userId: string): string => `orders:recent:${userId}`;
const TTL_MS = RATE_WINDOW_MS * 4; // self-cleaning: an idle user's key expires well after the 1s window closes

/** The user's accepted-order times within the trailing RATE_WINDOW_MS of `now` (ms). Trims entries older than the
 *  window first, so the returned times are exactly what the engine's RATE_LIMIT check counts. */
export async function recentOrderTimes(redis: Redis, userId: string, now: number): Promise<number[]> {
  const key = KEY(userId);
  const floor = now - RATE_WINDOW_MS;
  await redis.zremrangebyscore(key, "-inf", `(${floor}`); // drop < floor (exclusive) — keeps the set bounded
  const flat = await redis.zrangebyscore(key, floor, now, "WITHSCORES"); // [member, score, member, score, …]
  const times: number[] = [];
  for (let i = 1; i < flat.length; i += 2) times.push(Number(flat[i])); // read the SCORE (= the event-time)
  return times.filter((t) => Number.isFinite(t));
}

/** Record an accepted order at `now` (ms). Member is uniquified so two orders in the same ms both count against
 *  the rate limit (a colliding member would silently under-count). Refreshes the key TTL. */
export async function recordOrder(redis: Redis, userId: string, now: number): Promise<void> {
  const key = KEY(userId);
  const member = `${now}:${Math.random().toString(36).slice(2, 10)}`; // unique per call; score carries the time
  await redis.zadd(key, now, member);
  await redis.pexpire(key, TTL_MS);
}
