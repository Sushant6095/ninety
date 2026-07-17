// Events read-model (ADR-072). The WS bridge fans match.events + match.actions out to live subscribers but never
// stores them, so a page that loads mid-match has no timeline to show. This consumer persists a capped, newest-first
// log per match to Redis so GET /matches/:id/events|actions can serve a snapshot; WS then streams the live delta.
//
// Redis: list `m:{matchId}:events:log` / `m:{matchId}:actions:log`, LPUSH + LTRIM to LOG_CAP, EXPIRE after a match
// window. Derived cache (README rule 3): rebuildable by replaying the retained match.events / match.actions streams.
// Two-source law (ADR-051): these are TxLINE-owned in-play events — Redis only mirrors them, never authors them.
//
// The stored shapes MATCH the WS frame `d` payloads (gateway.ts) so the frontend consumes snapshot + live delta
// identically: an event is `{ type, ...payload, ts }`; an action is `{ ...payload, ts }`.
import type { Bus } from "@omnipitch/bus";
import type { Redis } from "ioredis";
import { TOPICS, type Envelope } from "@omnipitch/schema";

export const EVENTS_LOG = (matchId: string): string => `m:${matchId}:events:log`;
export const ACTIONS_LOG = (matchId: string): string => `m:${matchId}:actions:log`;
const LOG_CAP = 200; // newest 200 in-play items per match — a full 90' timeline of meaningful events fits easily
const LOG_TTL_S = 6 * 60 * 60; // 6h: kickoff + extra time + settle window, then the cache self-evicts

const envTs = (env: Envelope): number => Date.parse(env.ts_source) || Date.parse(env.ts_ingest) || Date.now();

/** Pure: a match.events envelope → the log key + JSON line to store (mirrors the WS events frame `d`). */
export function planEvent(env: Envelope): { key: string; line: string } {
  return { key: EVENTS_LOG(env.match_id), line: JSON.stringify({ type: env.type, ...(env.payload as object), ts: envTs(env) }) };
}

/** Pure: a match.actions envelope → the log key + JSON line to store (mirrors the WS actions frame `d`). */
export function planAction(env: Envelope): { key: string; line: string } {
  return { key: ACTIONS_LOG(env.match_id), line: JSON.stringify({ ...(env.payload as object), ts: envTs(env) }) };
}

async function push(redis: Redis, key: string, line: string): Promise<void> {
  await redis.multi().lpush(key, line).ltrim(key, 0, LOG_CAP - 1).expire(key, LOG_TTL_S).exec();
}

/** Wire the consumer onto a bus + Redis. Own group cursor so a fresh deploy replays the retained streams. */
export async function startEventsRead(bus: Bus, redis: Redis): Promise<void> {
  await bus.consume(TOPICS.matchEvents, "events-read", async (env: Envelope) => {
    const p = planEvent(env);
    await push(redis, p.key, p.line);
  });
  await bus.consume(TOPICS.matchActions, "events-read", async (env: Envelope) => {
    const p = planAction(env);
    await push(redis, p.key, p.line);
  });
}

async function readLog(redis: Redis, key: string, limit: number): Promise<unknown[]> {
  const rows = await redis.lrange(key, 0, Math.max(0, limit - 1)); // newest-first (LPUSH order)
  const out: unknown[] = [];
  for (const r of rows) {
    try {
      out.push(JSON.parse(r));
    } catch {
      /* skip a corrupt line rather than fail the whole snapshot */
    }
  }
  return out;
}

/** Snapshot of a match's recent significant events (goal/red/half/…), newest first. */
export function getEvents(redis: Redis, matchId: string, limit = 50): Promise<unknown[]> {
  return readLog(redis, EVENTS_LOG(matchId), limit);
}

/** Snapshot of a match's in-play action feed (shot/free_kick/var/…), newest first. */
export function getActions(redis: Redis, matchId: string, limit = 50): Promise<unknown[]> {
  return readLog(redis, ACTIONS_LOG(matchId), limit);
}
