// Portfolio read service (ADR-046 / ADR-027). Pure read model: Prisma `Position` (qty, avgPrice) ⨝ the live marks
// (markets-read Redis) + the `bal:` credit cache → open positions with live P&L, free credits, and total equity.
// No engine state, no bus. Display convention: prices 0..100, a winning share pays 100 credits (matches the Terminal).
import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";
import { getMarks } from "./markets-read";
import { BAL_KEY } from "./projection";

const PAYOUT_PER_SHARE = 100;

export interface PortfolioPosition {
  marketId: string;
  outcome: string;
  qty: number;
  avgPrice: number; // 0..100 (engine stores 0..1; scaled at the read boundary)
  markPct: number | null; // live price 0..100, null until the market is priced
  value: number | null; // qty × markPct, credits
  pnl: number | null; // value − qty × avgPrice, credits
  pnlPct: number | null;
}

export interface Portfolio {
  free: number; // uncommitted credits (bal: cache; CreditLedger is the authority, ADR-003)
  held: number; // Σ position value at the live mark
  equity: number; // free + held
  positions: PortfolioPosition[];
}

export async function getPortfolio(prisma: PrismaClient, redis: Redis, userId: string): Promise<Portfolio> {
  const rows = await prisma.position.findMany({ where: { userId, qty: { not: 0 } } });
  const marks = await getMarks(redis, [...new Set(rows.map((r) => r.marketId))]);
  const free = Number((await redis.get(BAL_KEY(userId))) ?? 0);

  let held = 0;
  const positions: PortfolioPosition[] = rows.map((r) => {
    const fair = marks.get(r.marketId)?.fair;
    const markPct = fair ? (fair[r.outcome] ?? 0) * PAYOUT_PER_SHARE : null;
    const avgPrice = r.avgPrice * PAYOUT_PER_SHARE;
    const value = markPct != null ? r.qty * markPct : null;
    const cost = r.qty * avgPrice;
    const pnl = value != null ? value - cost : null;
    const pnlPct = pnl != null && cost > 0 ? (pnl / cost) * 100 : null;
    if (value != null) held += value;
    return { marketId: r.marketId, outcome: r.outcome, qty: r.qty, avgPrice, markPct, value, pnl, pnlPct };
  });

  return { free, held, equity: free + held, positions };
}
