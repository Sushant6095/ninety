// Redis-backed read providers for EarlyWhistle (GAP 1, ADR-085). These wire the previously-stubbed lookups to the
// REAL read-models written elsewhere — never invent a key name, never fabricate a score/price/rank:
//   fixtures:current  (hash, field=FixtureId, value=Fixture json) — written by worker-ingest (ingest.ts)
//   lb:global         (zset, member=userId, score=net credit P&L)  — written by the api projection (ADR-027)
// A missing field → null / honest degrade, never a made-up value.
import type { FixtureMeta } from "./matchcard";

export const FIXTURES_KEY = "fixtures:current";
export const LB_KEY = "lb:global";

// Structural subset of ioredis used here — lets tests pass a tiny fake instead of a real client.
export interface RedisReader {
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  zcard(key: string): Promise<number>;
  zrevrange(key: string, start: number, stop: number, withScores: "WITHSCORES"): Promise<string[]>;
}

export interface FixtureLite {
  matchId: string;
  home: string;
  away: string;
  competition: string;
  startTime: number; // epoch ms
  live: boolean; // best-effort: kickoff time has passed (GameState codes aren't decoded here — honest, coarse)
}

export interface TraderRow {
  rank: number;
  userId: string;
  pnl: number; // net credit P&L (play-money)
}

// A txline Fixture json → home/away (respecting Participant1IsHome) + competition. Pure; null on unusable input.
function readFixture(json: string): { home: string; away: string; competition: string; startTime: number } | null {
  try {
    const f = JSON.parse(json) as {
      Participant1?: string;
      Participant2?: string;
      Participant1IsHome?: boolean;
      Competition?: string;
      StartTime?: number;
    };
    if (!f.Participant1 || !f.Participant2) return null;
    const p1Home = f.Participant1IsHome !== false; // default: Participant1 is home
    return {
      home: String(p1Home ? f.Participant1 : f.Participant2),
      away: String(p1Home ? f.Participant2 : f.Participant1),
      competition: String(f.Competition ?? ""),
      startTime: Number(f.StartTime ?? 0),
    };
  } catch {
    return null;
  }
}

/** FixtureMeta for one match (team names + stage) — the still metadata a card needs; score/minute ride the bus. */
export function parseFixtureMeta(json: string): FixtureMeta | null {
  const f = readFixture(json);
  return f ? { home: { name: f.home }, away: { name: f.away }, stage: f.competition } : null;
}

/** getFixture(matchId): read fixtures:current[matchId] → FixtureMeta, or null (card keeps its placeholder, no fake). */
export function makeGetFixture(redis: RedisReader): (matchId: string) => Promise<FixtureMeta | null> {
  return async (matchId) => {
    const json = await redis.hget(FIXTURES_KEY, matchId);
    return json ? parseFixtureMeta(json) : null;
  };
}

/** getLeaderboard(matchId): the card's {traders, topSwing}. HONEST DEGRADE — the projection has NO per-match trader
 *  count or top-swing yet (ADR-085), so we show the real PLATFORM trader count (ZCARD lb:global) and a 0 swing rather
 *  than a fabricated per-match number. matchId is unused until a per-match source exists. */
export function makeGetLeaderboardStat(redis: RedisReader): (matchId: string) => Promise<{ traders: number; topSwing: number }> {
  return async () => {
    const traders = await redis.zcard(LB_KEY).catch(() => 0);
    return { traders: traders ?? 0, topSwing: 0 };
  };
}

/** Every current fixture (for /matches) — real teams + competition + kickoff, soonest first. */
export async function listFixtures(redis: RedisReader, now = Date.now()): Promise<FixtureLite[]> {
  const all = await redis.hgetall(FIXTURES_KEY).catch(() => ({}));
  const out: FixtureLite[] = [];
  for (const [field, json] of Object.entries(all ?? {})) {
    const f = readFixture(json);
    if (!f) continue;
    out.push({ matchId: field, home: f.home, away: f.away, competition: f.competition, startTime: f.startTime, live: f.startTime > 0 && f.startTime <= now });
  }
  out.sort((a, b) => a.startTime - b.startTime);
  return out;
}

/** Top-N traders from lb:global (for /leaderboard) — same zrevrange shape as the api read service. */
export async function topTraders(redis: RedisReader, n = 5): Promise<TraderRow[]> {
  const flat = await redis.zrevrange(LB_KEY, 0, Math.max(0, n - 1), "WITHSCORES").catch(() => [] as string[]);
  const rows: TraderRow[] = [];
  for (let i = 0; i < flat.length; i += 2) rows.push({ rank: i / 2 + 1, userId: flat[i], pnl: Number(flat[i + 1]) });
  return rows;
}
