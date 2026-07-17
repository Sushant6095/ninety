// CONNECT (Phase 2) — the leaderboard's data source. getLeaderRows() returns LeaderRow[] from GET /leaderboard
// (live), mapping the API row { rank, userId, pnl, handle } → the LeaderRow the surface renders. Under
// NEXT_PUBLIC_USE_FIXTURES=1 (offline demo) it serves LEADERS; on a live error it degrades to LEADERS, never blank.
// An empty live board stays [] — the surface renders its own empty state, we NEVER invent rows. Field map:
// docs/API-CONTRACT.md ("LEADERBOARD"). Server-safe (no hooks). Play-money P&L only — never bet/stake/odds/wager.
import { getLeaderboard, USE_FIXTURES } from "../api";
import { LEADERS } from "../fixtures";
import type { LeaderRow } from "../types";

/** One API leaderboard row (docs/API-CONTRACT.md). `userId` is dropped; the surface keys on handle + rank. */
interface ApiLeaderRow {
  rank: number;
  pnl: number;
  handle: string;
  userId?: string;
}

/** Validate an untrusted API row before mapping — a malformed row is skipped, not rendered as `undefined`. */
function isApiLeaderRow(v: unknown): v is ApiLeaderRow {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.rank === "number" && typeof r.pnl === "number" && typeof r.handle === "string";
}

/** ApiLeaderRow → LeaderRow. The API sends a bare handle ("hexfan"); the frontend renders the "@". */
export function toLeaderRow(v: ApiLeaderRow): LeaderRow {
  const handle = v.handle.startsWith("@") ? v.handle : `@${v.handle}`;
  return { rank: v.rank, handle, pnl: v.pnl };
}

/** GET /leaderboard → LeaderRow[]. USE_FIXTURES or a live failure → LEADERS (the type-consistent fixture
 *  fallback); an empty live board → [] (the surface shows its empty state, never a fabricated row). */
export async function getLeaderRows(): Promise<LeaderRow[]> {
  if (USE_FIXTURES) return LEADERS;
  try {
    const { leaderboard } = await getLeaderboard();
    return leaderboard.filter(isApiLeaderRow).map(toLeaderRow);
  } catch {
    return LEADERS; // honest degrade to the fixture — never crash the surface to blank
  }
}
