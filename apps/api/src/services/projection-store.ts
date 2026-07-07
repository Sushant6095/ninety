// Projection store port (ADR-027) with two impls, mirroring the engine's JournalStore pattern (ADR-025):
//  - MemProjectionStore: in-memory, for tests + the replay VERIFY (runs in CI without a DB).
//  - PrismaRedisProjectionStore: prod — the exactly-once DB write (ProcessedEvent inbox in a $transaction) plus
//    the Redis hot-state update. Redis derives from Postgres (README rule 3), so it is rebuildable/repairable.
import type { Redis } from "ioredis";
import type { PrismaClient } from "@prisma/client";
import { BAL_KEY, BURNED_KEY, LB_KEY, type ProjectionPlan } from "./projection";

export interface ProjectionStore {
  /** Apply one event's plan idempotently. Returns true if newly applied, false if this event_id was already seen. */
  apply(eventId: string, topic: string, plan: ProjectionPlan): Promise<boolean>;
}

const posMapKey = (p: NonNullable<ProjectionPlan["position"]>): string => `${p.userId}|${p.marketId}|${p.outcome}`;

// In-memory store: the dedup gate is a Set; positions upsert (absolute), everything else appends. Read the public
// fields directly in tests to assert DB-equals-engine-state and zero-duplicates-on-re-consume.
export class MemProjectionStore implements ProjectionStore {
  readonly processed = new Set<string>();
  readonly orders: NonNullable<ProjectionPlan["order"]>[] = [];
  readonly fills: NonNullable<ProjectionPlan["fill"]>[] = [];
  readonly positions = new Map<string, NonNullable<ProjectionPlan["position"]>>();
  readonly credits: NonNullable<ProjectionPlan["credit"]>[] = [];
  readonly hot = { pos: new Map<string, number>(), bal: new Map<string, number>(), lb: new Map<string, number>(), burned: 0 };

  async apply(eventId: string, _topic: string, plan: ProjectionPlan): Promise<boolean> {
    if (this.processed.has(eventId)) return false; // idempotent: already applied
    this.processed.add(eventId);
    if (plan.order) this.orders.push(plan.order);
    if (plan.fill) this.fills.push(plan.fill);
    if (plan.position) this.positions.set(posMapKey(plan.position), plan.position); // absolute upsert
    if (plan.credit) this.credits.push(plan.credit);
    if (plan.hot.pos) this.hot.pos.set(plan.hot.pos.key, plan.hot.pos.qty);
    if (plan.hot.bal) this.hot.bal.set(plan.hot.bal.user, (this.hot.bal.get(plan.hot.bal.user) ?? 0) + plan.hot.bal.delta);
    if (plan.hot.lb) this.hot.lb.set(plan.hot.lb.user, (this.hot.lb.get(plan.hot.lb.user) ?? 0) + plan.hot.lb.delta);
    if (plan.hot.burned) this.hot.burned += plan.hot.burned;
    return true;
  }
}

const isUniqueViolation = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";

// Prod store: exactly-once DB writes gated by the ProcessedEvent inbox inside one $transaction (insert the inbox
// row first; a duplicate hits the PK → skip the whole apply), then the Redis hot-state update after commit.
export class PrismaRedisProjectionStore implements ProjectionStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
  ) {}

  async apply(eventId: string, topic: string, plan: ProjectionPlan): Promise<boolean> {
    const applied = await this.prisma.$transaction(async (tx) => {
      try {
        await tx.processedEvent.create({ data: { eventId, topic } }); // dedup gate — PK conflict = already processed
      } catch (err) {
        if (isUniqueViolation(err)) return false;
        throw err;
      }
      if (plan.order) await tx.order.create({ data: plan.order });
      if (plan.fill) await tx.fill.create({ data: plan.fill });
      if (plan.position) {
        const { userId, marketId, outcome, qty, avgPrice } = plan.position;
        await tx.position.upsert({
          where: { userId_marketId_outcome: { userId, marketId, outcome } },
          create: { userId, marketId, outcome, qty, avgPrice },
          update: { qty, avgPrice }, // absolute set — the engine emits the post-trade qty
        });
      }
      if (plan.credit) await tx.creditLedger.create({ data: plan.credit });
      return true;
    });
    if (!applied) return false;
    // Redis hot state after the DB commit. Postgres is the balance AUTHORITY (ADR-003): CreditLedger + Position
    // are exactly-once; these Redis keys are a derived READ CACHE. pos: is absolute (idempotent); bal:/lb:/burned
    // are INCR deltas applied once (the inbox skips a redelivery). KNOWN GAP (ADR-027 follow-up): a crash in the
    // commit→Redis window drops an INCR — pos: self-heals on the next position event, but bal:/lb: stay behind
    // until a rebuild-from-CreditLedger routine (not yet built) runs. Do NOT treat bal:/lb: as authoritative.
    if (plan.hot.pos) await this.redis.set(plan.hot.pos.key, String(plan.hot.pos.qty));
    if (plan.hot.bal) await this.redis.incrbyfloat(BAL_KEY(plan.hot.bal.user), plan.hot.bal.delta);
    if (plan.hot.lb) await this.redis.zincrby(LB_KEY, plan.hot.lb.delta, plan.hot.lb.user);
    if (plan.hot.burned) await this.redis.incrbyfloat(BURNED_KEY, plan.hot.burned);
    return true;
  }
}
