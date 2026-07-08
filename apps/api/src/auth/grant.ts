// Per-match play-money grant (prompt 25): 1,000 credits to a user on their first exposure to a match, EXACTLY
// once per (user, match). Idempotency reuses the ADR-027 ProcessedEvent inbox keyed `grant:{userId}:{matchId}`,
// written in the SAME transaction as the CreditLedger row — a second grant hits the PK and the whole apply is a
// no-op. Injected store so the once-only logic is unit-tested without a DB.
import type { PrismaClient } from "@prisma/client";

export const MATCH_GRANT = 1000;
export const GRANT_REASON = "match_grant";

export interface GrantStore {
  /** Grant once. Returns true if newly granted, false if this (userId, matchId) was already granted. */
  grantOnce(userId: string, matchId: string, amount: number, reason: string): Promise<boolean>;
}

/** Grant the per-match credits to a user, idempotently. */
export async function grantMatchCredits(store: GrantStore, userId: string, matchId: string): Promise<{ granted: boolean }> {
  return { granted: await store.grantOnce(userId, matchId, MATCH_GRANT, GRANT_REASON) };
}

// In-memory store for tests: a Set of granted keys + the credit rows written.
export class MemGrantStore implements GrantStore {
  readonly granted = new Set<string>();
  readonly credits: Array<{ userId: string; matchId: string; delta: number; reason: string }> = [];
  async grantOnce(userId: string, matchId: string, amount: number, reason: string): Promise<boolean> {
    const key = `${userId}:${matchId}`;
    if (this.granted.has(key)) return false;
    this.granted.add(key);
    this.credits.push({ userId, matchId, delta: amount, reason });
    return true;
  }
}

const isUniqueViolation = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";

// Prod store: ProcessedEvent inbox (grant:{user}:{match}) + CreditLedger, one transaction → exactly-once.
export class PrismaGrantStore implements GrantStore {
  constructor(private readonly prisma: PrismaClient) {}
  async grantOnce(userId: string, matchId: string, amount: number, reason: string): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.processedEvent.create({ data: { eventId: `grant:${userId}:${matchId}`, topic: reason } }); // PK guard
        await tx.creditLedger.create({ data: { userId, matchId, delta: amount, reason } });
      });
      return true;
    } catch (err) {
      if (isUniqueViolation(err)) return false; // already granted (idempotent)
      throw err;
    }
  }
}
