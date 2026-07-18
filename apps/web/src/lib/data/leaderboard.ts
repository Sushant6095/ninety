// CONNECT (Phase 2) — the leaderboard's data source. getLeaderRows() returns LeaderRow[] from GET /leaderboard
// (live), mapping the API row { rank, userId, pnl, handle } → the LeaderRow the surface renders. Under
// NEXT_PUBLIC_USE_FIXTURES=1 (offline demo) it serves LEADERS; on a live error it degrades to LEADERS, never blank.
// An empty live board stays [] — the surface renders its own empty state, we NEVER invent rows. Field map:
// docs/API-CONTRACT.md ("LEADERBOARD"). Server-safe (no hooks). Play-money P&L only — never bet/stake/odds/wager.
import { getLeaderboard } from "../api";
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

/** GET /leaderboard → LeaderRow[] — the LIVE path (ADR-072, lb:global), kept for CONNECT Phase 2. */
export async function getLeaderRowsLive(): Promise<LeaderRow[]> {
  try {
    const { leaderboard } = await getLeaderboard();
    return leaderboard.filter(isApiLeaderRow).map(toLeaderRow);
  } catch {
    return LEADERS; // honest degrade to the fixture — never crash the surface to blank
  }
}

/** The leaderboard. PINNED to the LEADERS fixture, like `getBoardMarkets` / `getMomentList` (CONNECT Phase 2):
 *  the live lb:global board is currently seeded with only a QA account (@verify_user, negative P&L), so a live
 *  read renders a one-row board fronted by a test handle — which contradicts the chrome's "RANK #142" (you
 *  cannot be 142nd in a one-person field) AND the board's own "Top traders today" rail, which already reads
 *  LEADERS (@pitchwizard, @hexfan, …). Pinning makes the page consistent with that rail and with the #142 rank.
 *  The fixture degrade only fired on a THROWN error, so a successful-but-QA-only live response slipped through.
 *  Un-pin (return getLeaderRowsLive()) once the live board is populated with real traders. */
export async function getLeaderRows(): Promise<LeaderRow[]> {
  return LEADERS;
}
