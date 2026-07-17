// Balance authority (ADR-003 / ADR-071). A user's credit balance is Σ(CreditLedger.delta) — the durable
// Postgres truth. The `bal:${user}` Redis key (projection.ts) is a derived fast cache and is explicitly NOT
// authoritative, so the order path reads the ledger sum: a stale or missing cache can never over-credit a trade.
// Play-money: this is a total of play-credits, never a cash balance.
import type { PrismaClient } from "@prisma/client";

/** Authoritative credit balance for a user = Σ CreditLedger.delta (grants add, buys subtract, sell refunds add). */
export async function getBalance(prisma: PrismaClient, userId: string): Promise<number> {
  const agg = await prisma.creditLedger.aggregate({ _sum: { delta: true }, where: { userId } });
  return agg._sum.delta ?? 0; // no rows → 0 credits (never null): a user with no grant yet has no balance
}
