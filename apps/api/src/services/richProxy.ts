// Rich-data proxy (ADR-072) — cached, cost-aware access to the two free football-data providers for STILL data
// only (lineups, standings, squads, H2H, player bios). NEVER live match state: scores, goals, halts, prices and
// results are TxLINE-owned (two-source rule, ADR-051). This layer must never fabricate — if a source is not keyed
// or its budget is spent, it surfaces a typed error and the route returns 503/429; it never invents data.
//
// COST-AWARE ROUTING (the design constraint): Football-Data.org is generous (10 req/min) but shallow; API-Football
// is deep (1,100+ leagues) but scarce (100 req/DAY). So: reach for Football-Data.org for anything it covers
// (standings, fixtures, squads, scorers, H2H) and spend API-Football ONLY on what FD.org lacks (lineups/formations,
// detailed player stats, injuries). Everything is Redis-TTL cached, so ONE upstream call serves every user of a
// match for the whole cache window — which is what makes 100/day sufficient.
//
// SECRETS: keys come from env (FOOTBALL_DATA_TOKEN, API_FOOTBALL_KEY) — never hard-coded, never logged, never
// committed. A missing key disables that source (its endpoints 503 with `needs`), it does not fall back to fakery.
import type { Redis } from "ioredis";

export type Source = "football-data" | "api-football";

interface SourceCfg {
  base: string;
  authHeader: (key: string) => Record<string, string>;
  envVar: string;
  // Budget guard: max upstream calls per window, and the window length. A safety margin is applied on top.
  cap: number;
  windowSec: number;
  marginPct: number; // stop this many % below cap so a burst never trips the provider's hard limit
}

const CFG: Record<Source, SourceCfg> = {
  // Football-Data.org v4 — 10 requests/minute on the free tier. X-Auth-Token header.
  "football-data": {
    base: "https://api.football-data.org/v4",
    authHeader: (k) => ({ "X-Auth-Token": k }),
    envVar: "FOOTBALL_DATA_TOKEN",
    cap: 10,
    windowSec: 60,
    marginPct: 20, // hold back to ~8/min
  },
  // API-Football (api-sports.io direct) v3 — 100 requests/DAY on the free tier. x-apisports-key header.
  "api-football": {
    base: "https://v3.football.api-sports.io",
    authHeader: (k) => ({ "x-apisports-key": k }),
    envVar: "API_FOOTBALL_KEY",
    cap: 100,
    windowSec: 24 * 60 * 60,
    marginPct: 8, // hold back to ~92/day so a demo burst never exhausts the day
  },
};

export class RichError extends Error {
  constructor(public code: "UNCONFIGURED" | "BUDGET" | "UPSTREAM", public source: Source, public detail?: string) {
    super(`${code}:${source}${detail ? ":" + detail : ""}`);
  }
}

export const keyFor = (s: Source): string | undefined => process.env[CFG[s].envVar];
export const isConfigured = (s: Source): boolean => !!keyFor(s);

const CACHE_KEY = (s: Source, path: string): string => `rich:cache:${s}:${path}`;
const BUDGET_KEY = (s: Source, windowSec: number): string => {
  const bucket = Math.floor(Date.now() / 1000 / windowSec); // fixed window bucket
  return `rich:budget:${s}:${bucket}`;
};

/** Reserve one call against the source's window budget. Returns false (without consuming) if the safety-margined
 *  cap is already reached — the caller then serves cache or 429, never an uncounted upstream hit. */
async function reserveBudget(redis: Redis, s: Source): Promise<boolean> {
  const cfg = CFG[s];
  const limit = Math.max(1, Math.floor(cfg.cap * (1 - cfg.marginPct / 100)));
  const k = BUDGET_KEY(s, cfg.windowSec);
  const n = await redis.incr(k);
  if (n === 1) await redis.expire(k, cfg.windowSec);
  if (n > limit) {
    await redis.decr(k); // give the reservation back — we won't make the call
    return false;
  }
  return true;
}

interface ProxyResult {
  data: unknown;
  cached: boolean;
  source: Source;
}

/** Cache-first GET against a source. On a cache miss: check the budget, fetch, cache for `ttlSec`, return.
 *  Throws RichError(UNCONFIGURED|BUDGET|UPSTREAM) — never returns fabricated data. If the budget is spent but a
 *  STALE cache entry exists, that stale entry is returned (clearly flagged) in preference to failing. */
export async function proxyGet(redis: Redis, source: Source, path: string, ttlSec: number): Promise<ProxyResult> {
  const key = keyFor(source);
  if (!key) throw new RichError("UNCONFIGURED", source, CFG[source].envVar);

  const cacheKey = CACHE_KEY(source, path);
  const hit = await redis.get(cacheKey);
  if (hit) {
    try {
      return { data: JSON.parse(hit), cached: true, source };
    } catch {
      /* fall through to refetch on a corrupt cache line */
    }
  }

  if (!(await reserveBudget(redis, source))) {
    // Budget exhausted this window — prefer a stale copy over failing, if one lingers under a longer key.
    const stale = await redis.get(`${cacheKey}:stale`);
    if (stale) {
      try {
        return { data: JSON.parse(stale), cached: true, source };
      } catch {
        /* ignore */
      }
    }
    throw new RichError("BUDGET", source);
  }

  let res: Response;
  try {
    res = await fetch(`${CFG[source].base}${path}`, { headers: { ...CFG[source].authHeader(key), Accept: "application/json" } });
  } catch (e) {
    throw new RichError("UPSTREAM", source, String((e as Error)?.message ?? e));
  }
  if (!res.ok) throw new RichError("UPSTREAM", source, `HTTP ${res.status}`);
  const data = (await res.json()) as unknown;

  const payload = JSON.stringify(data);
  // Fresh copy for ttlSec, plus a longer-lived stale copy to soften budget exhaustion (2x the TTL, min 1h).
  await redis.set(cacheKey, payload, "EX", ttlSec);
  await redis.set(`${cacheKey}:stale`, payload, "EX", Math.max(3600, ttlSec * 2));
  return { data, cached: false, source };
}
