// Portfolio read service (ADR-046 / ADR-027 / ADR-071). Pure read model: Prisma `Position` (qty, avgPrice) ⨝ the
// live marks (markets-read Redis) + the `bal:` credit cache → open positions with live P&L, free credits, and
// total equity. No engine state, no bus. Field names match the frontend contract (shares / avgEntry / markNow) so
// the fixture→API swap is mechanical. Display convention: prices 0..100, a winning share pays 100 credits.
// (Note: `free` reads the bal: cache in engine-native units while `value`/`held` scale ×100 — a pre-existing
//  read-model scaling inconsistency flagged for the quant-reviewer in ADR-071; not reconciled here.)
import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";
import { getMarks } from "./markets-read";
import { getBalance } from "./balance";
import { hasCompleteFair } from "./quote";

const PAYOUT_PER_SHARE = 100;

export interface PortfolioPosition {
  marketId: string;
  outcome: string;
  shares: number; // Prisma Position.qty
  avgEntry: number; // 0..100 (engine stores 0..1; scaled at the read boundary)
  markNow: number | null; // live price 0..100, null until the market has a COMPLETE 1X2 mark (ADR-071)
  value: number | null; // shares × markNow, credits
  pnl: number | null; // value − shares × avgEntry, credits
  pnlPct: number | null;
}

/** The full position row the /portfolio route returns — the math fields plus match identity for rendering. Team
 *  codes/flags are derived frontend-side from baked wc26 by name (ADR-051); the API sends names + ids. */
export interface PortfolioPositionFull extends PortfolioPosition {
  matchId: string;
  home: string;
  away: string;
  minute: number | null;
  status: "LIVE" | "PRE";
}

export interface Portfolio {
  free: number; // uncommitted credits (bal: cache; CreditLedger is the authority, ADR-003)
  held: number; // Σ position value at the live mark
  equity: number; // free + held
  positions: PortfolioPosition[];
}

export interface PortfolioView extends Omit<Portfolio, "positions"> {
  positions: PortfolioPositionFull[];
}

/** Position row shape (subset of Prisma Position) the pure computation needs. */
export interface RawPosition {
  marketId: string;
  outcome: string;
  qty: number;
  avgPrice: number; // 0..1 (engine units)
}

/** Pure: positions ⨝ marks + free credits → the portfolio math. An incomplete mark (over/under or low-confidence)
 *  yields markNow=null (unpriced) — NEVER a fabricated even book (ADR-071). Extracted from getPortfolio so the
 *  null-mark / zero-cost / empty branches are unit-testable without a DB or Redis. Output order matches input. */
export function computePortfolio(rows: RawPosition[], marks: Map<string, { fair: Record<string, number> }>, free: number): Portfolio {
  let held = 0;
  const positions: PortfolioPosition[] = rows.map((r) => {
    const fair = marks.get(r.marketId)?.fair;
    const markNow = hasCompleteFair(fair) ? (fair[r.outcome] ?? 0) * PAYOUT_PER_SHARE : null;
    const avgEntry = r.avgPrice * PAYOUT_PER_SHARE;
    const value = markNow != null ? r.qty * markNow : null;
    const cost = r.qty * avgEntry;
    const pnl = value != null ? value - cost : null;
    const pnlPct = pnl != null && cost > 0 ? (pnl / cost) * 100 : null;
    if (value != null) held += value;
    return { marketId: r.marketId, outcome: r.outcome, shares: r.qty, avgEntry, markNow, value, pnl, pnlPct };
  });
  return { free, held, equity: free + held, positions };
}

export async function getPortfolio(prisma: PrismaClient, redis: Redis, userId: string): Promise<PortfolioView> {
  const rows = await prisma.position.findMany({
    where: { userId, qty: { not: 0 } },
    include: { market: { include: { match: true } } },
  });
  const raw: RawPosition[] = rows.map((r) => ({ marketId: r.marketId, outcome: r.outcome, qty: r.qty, avgPrice: r.avgPrice }));
  const marks = await getMarks(redis, [...new Set(raw.map((r) => r.marketId))]);
  const free = await getBalance(prisma, userId); // ADR-003 authority: Σ CreditLedger.delta, not the stale bal: cache
  const base = computePortfolio(raw, marks, free);
  // Enrich each math row with its match identity (rows and base.positions are 1:1 in order).
  const positions: PortfolioPositionFull[] = base.positions.map((p, i) => ({
    ...p,
    matchId: rows[i].market.matchId,
    home: rows[i].market.match.home,
    away: rows[i].market.match.away,
    minute: rows[i].market.match.minute ?? null,
    // LIVE or HALTED (mid-match, briefly paused) → the position is on a live match; else PRE. (The frontend
    // OpenPosition.status is only LIVE|PRE; a SETTLED/RESOLVING position is transient here and maps to PRE — a
    // documented edge, not the common open-position case.)
    status: rows[i].market.status === "LIVE" || rows[i].market.status === "HALTED" ? "LIVE" : "PRE",
  }));
  return { free: base.free, held: base.held, equity: base.equity, positions };
}
