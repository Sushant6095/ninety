import { describe, it, beforeAll, afterEach, expect } from "vitest";
import type { Bus, ConsumeOptions } from "./index";
import type { RedisBus } from "./redis";
import type { KafkaBus } from "./kafka";
import type { Envelope, Topic } from "@omnipitch/schema";

// Driver-agnostic Bus contract. Any Bus implementation must satisfy these behaviours
// (ADR-007: one interface, two drivers). Point it at a driver via a ContractHarness.

// --- compile-time conformance (VERIFY: typecheck proves both drivers satisfy Bus) ---
// If a driver stops implementing Bus, `Conforms<Driver>` fails to typecheck.
type Conforms<T extends Bus> = T;
export type _RedisConforms = Conforms<RedisBus>;
export type _KafkaConforms = Conforms<KafkaBus>;

export interface ContractHarness {
  /** A fresh bus instance (own connections). */
  makeBus(): Bus;
  /** A unique topic/stream per call so tests don't interfere. */
  makeTopic(): Topic;
  /** Whether the backing broker is reachable; when false the whole suite skips (does not fail). */
  available(): boolean | Promise<boolean>;
  /** Options applied to every consume (e.g. a small blockMs to keep tests fast). */
  baseOpts?: ConsumeOptions;
  /** Options for the crash-recovery test (merged over baseOpts) — e.g. a small reclaim min-idle. */
  recoveryOpts?: ConsumeOptions;
  /** Optional: unacked (pending) count for a (topic, group) — strengthens ack assertions when available. */
  pending?(topic: Topic, group: string): Promise<number>;
}

// --- generic helpers ---
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (v: T) => void;
}
const deferred = <T>(): Deferred<T> => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const withTimeout = <T>(p: Promise<T>, ms: number, label = "timeout"): Promise<T> =>
  Promise.race([p, delay(ms).then(() => Promise.reject(new Error(label)))]) as Promise<T>;

const env = (matchId: string, n: number): Envelope => ({
  event_id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  source: "engine",
  source_seq: n,
  match_id: matchId,
  ts_source: new Date().toISOString(),
  ts_ingest: new Date().toISOString(),
  type: "commentary",
  payload: { text: `msg ${n}` },
});

export function busContract(name: string, h: ContractHarness): void {
  describe(`Bus contract: ${name}`, () => {
    let up = false;
    const open: Bus[] = [];
    const base = h.baseOpts ?? {};
    const recovery: ConsumeOptions = { ...base, ...h.recoveryOpts };
    const mk = (): Bus => {
      const b = h.makeBus();
      open.push(b);
      return b;
    };
    // Assert unacked count when the driver can introspect it; a no-op otherwise (stays driver-agnostic).
    const expectPending = async (topic: Topic, group: string, n: number): Promise<void> => {
      if (!h.pending) return;
      expect(await h.pending(topic, group)).toBe(n);
    };

    beforeAll(async () => {
      up = await h.available();
    });
    afterEach(async () => {
      await Promise.all(open.splice(0).map((b) => b.close().catch(() => {})));
    });

    // ORDER PER KEY — entries published under one key arrive in publish order.
    it("delivers entries for one key in publish order, then acks them", async (ctx) => {
      if (!up) return void ctx.skip?.();
      const topic = h.makeTopic();
      const bus = mk();
      for (let n = 1; n <= 3; n++) await bus.publish(topic, "m", env("m", n));

      const got: number[] = [];
      const done = deferred<void>();
      await bus.consume(
        topic,
        "g",
        async (e) => {
          got.push(e.source_seq);
          if (got.length === 3) done.resolve();
        },
        base,
      );
      await withTimeout(done.promise, 8000, "did not receive 3");
      expect(got).toEqual([1, 2, 3]);
      await delay(150); // let the final ack land
      await expectPending(topic, "g", 0);
    }, 15000);

    // ACK SEMANTICS — once acked, a restart does not redeliver.
    it("does not redeliver acked entries after a clean restart", async (ctx) => {
      if (!up) return void ctx.skip?.();
      const topic = h.makeTopic();
      const busA = mk();
      for (let n = 1; n <= 3; n++) await busA.publish(topic, "m", env("m", n));

      const a: number[] = [];
      const doneA = deferred<void>();
      await busA.consume(
        topic,
        "g",
        async (e) => {
          a.push(e.source_seq);
          if (a.length === 3) doneA.resolve();
        },
        base,
      );
      await withTimeout(doneA.promise, 8000, "A never drained");
      await delay(150);
      await busA.close(); // graceful shutdown, everything acked

      const busB = mk();
      const b: number[] = [];
      await busB.consume(topic, "g", async (e) => void b.push(e.source_seq), recovery);
      await delay(1500); // ample time for any (erroneous) redelivery

      expect(a).toEqual([1, 2, 3]);
      expect(b).toEqual([]); // zero redelivery of acked entries
      await expectPending(topic, "g", 0);
    }, 20000);

    // AT-LEAST-ONCE — an entry unacked at crash time is redelivered.
    it("redelivers an entry that was unacked when its consumer died mid-handle", async (ctx) => {
      if (!up) return void ctx.skip?.();
      const topic = h.makeTopic();
      const busA = mk();
      await busA.publish(topic, "m", env("m", 1));

      // A receives the entry and hangs mid-handle (never acks) — models a crash while processing.
      const reading = deferred<void>();
      await busA.consume(
        topic,
        "g",
        async () => {
          reading.resolve();
          await new Promise<void>(() => {}); // hang forever
        },
        base,
      );
      await withTimeout(reading.promise, 8000, "A never received");
      await expectPending(topic, "g", 1); // delivered, unacked
      await busA.close(); // kill A; entry left delivered-but-unacked

      // B must recover the orphaned entry (driver's crash-recovery path).
      const busB = mk();
      const b: number[] = [];
      const doneB = deferred<void>();
      await busB.consume(
        topic,
        "g",
        async (e) => {
          b.push(e.source_seq);
          doneB.resolve();
        },
        recovery,
      );
      await withTimeout(doneB.promise, 8000, "B never recovered");
      await delay(500); // guard against a second delivery
      expect(b).toEqual([1]); // redelivered (at least once; exactly once here)
      await expectPending(topic, "g", 0);
    }, 20000);
  });
}
