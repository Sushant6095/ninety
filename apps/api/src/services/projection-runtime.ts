// Projection runtime (ADR-027): subscribe to the engine effect topics and apply each event through the store,
// idempotently. This is the thin IO shell around the pure mapping (projection.ts) + the store (projection-store.ts).
// The consumer group "projection" gets its own cursor, independent of the engine/earlywhistle groups, so a fresh
// deploy replays the retained streams. A throwing store leaves the entry unacked → the bus redelivers (dedup makes
// that safe). All inter-service data arrives via the bus (CLAUDE.md law); the DB + Redis are this service's store.
import { createBus, type Bus } from "@omnipitch/bus";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import type { Redis } from "ioredis";
import { planProjection } from "./projection";
import { PrismaRedisProjectionStore, type ProjectionStore } from "./projection-store";
import { prisma } from "../db";

// Domain topics the engine emits and this projection persists (orders/fills/positions/credits). Settlement is
// consumed by the settlement saga, not here.
const PROJECTION_TOPICS = [TOPICS.orders, TOPICS.fills, TOPICS.positions, TOPICS.credits] as const;

/** Wire the projection consumer onto a bus + store. Exposed for tests (inject a Mem store + fake bus). */
export async function startProjection(bus: Bus, store: ProjectionStore): Promise<void> {
  for (const topic of PROJECTION_TOPICS) {
    await bus.consume(topic, "projection", async (env: Envelope) => {
      const plan = planProjection(env);
      if (plan) await store.apply(env.event_id, topic, plan);
    });
  }
}

/** Boot the projection as a service (prod): its own bus subscription writing Postgres + Redis. */
export async function startProjectionService(redis: Redis): Promise<{ stop: () => Promise<void> }> {
  const bus = await createBus();
  await startProjection(bus, new PrismaRedisProjectionStore(prisma, redis));
  return { stop: async () => void (await bus.close()) };
}
