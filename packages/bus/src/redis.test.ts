import Redis from "ioredis";
import { busContract } from "./contract";
import { RedisBus } from "./redis";
import type { Topic } from "@omnipitch/schema";

// Runs the driver-agnostic Bus contract against RedisBus + the docker redis on REDIS_URL.
// Skips (does not fail) when redis is unreachable, so `pnpm test` stays green without infra.
const URL = process.env.REDIS_URL ?? "redis://localhost:6379";
let counter = 0;

busContract("RedisBus", {
  makeBus: () => new RedisBus(URL),
  makeTopic: () => `test.bus.${Date.now()}.${++counter}` as unknown as Topic, // ephemeral stream, not a real TOPICS value
  available: async () => {
    const r = new Redis(URL, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });
    try {
      await r.connect();
      await r.ping();
      return true;
    } catch {
      return false;
    } finally {
      r.disconnect();
    }
  },
  baseOpts: { blockMs: 200 }, // default 60s min-idle → a consumer never reclaims its own pending mid-test
  recoveryOpts: { blockMs: 200, minIdleMs: 100 }, // fast XAUTOCLAIM reclaim for the crash-recovery test
  pending: async (topic, group) => {
    const r = new Redis(URL, { maxRetriesPerRequest: 1, retryStrategy: () => null });
    try {
      const res = (await r.xpending(topic, group)) as [number, ...unknown[]];
      return Number(res?.[0] ?? 0);
    } finally {
      r.disconnect();
    }
  },
});
