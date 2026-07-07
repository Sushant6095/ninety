// VERIFY: kill network to a stream mid-replay → recovery (feed.gap) event, no missed goal, no duplicate goal.
// Deterministic, in-memory (capturing bus, mock streams, instant backoff). No Redis/network needed.
import { describe, it, expect } from "vitest";
import type { Bus } from "@omnipitch/bus";
import { TOPICS, parseSysEvent, type Envelope, type SysEvent } from "@omnipitch/schema";
import type { ScoreState } from "@omnipitch/txline";
import { createPipeline, feedGapSignal } from "./ingest";
import { superviseStream, type GapInfo } from "./supervise";

function captureBus() {
  const published: { topic: string; key: string; env: Envelope }[] = [];
  const bus: Bus = {
    // Mocks implement the generic Bus method, so the payload arrives as the type param — cast to the domain plane's Envelope.
    publish: async (topic, key, env) => void published.push({ topic: topic as string, key, env: env as unknown as Envelope }),
    consume: async () => {},
    close: async () => {},
  };
  return { bus, published };
}

// Minimal in-memory Bus: publish fans out to live consumers (and replays prior entries on subscribe).
// Enough to prove a signal published on one plane is consumed VIA the bus, without Redis.
function memBus(): Bus {
  const log = new Map<string, unknown[]>();
  const subs = new Map<string, ((e: unknown) => Promise<void>)[]>();
  const push = <T>(m: Map<string, T[]>, k: string, v: T): void => void (m.get(k) ?? m.set(k, []).get(k)!).push(v);
  return {
    publish: async (topic, _key, e) => {
      push(log, topic, e as unknown);
      for (const h of subs.get(topic) ?? []) await h(e as unknown);
    },
    consume: async (topic, _group, handler) => {
      const h = handler as (e: unknown) => Promise<void>;
      push(subs, topic, h);
      for (const e of log.get(topic) ?? []) await h(e);
    },
    close: async () => {},
  };
}

// Minimal ScoreState with only the fields the normalizer reads.
const state = (fixture: number, home: number, away: number, seq: number): ScoreState =>
  ({
    FixtureId: fixture,
    GameState: "in_play",
    Seq: seq,
    Ts: 1_700_000_000_000 + seq,
    Clock: { Running: true, Seconds: 3600 },
    Score: { Participant1: { Total: { Goals: home } }, Participant2: { Total: { Goals: away } } },
  }) as unknown as ScoreState;

const goals = (published: { env: Envelope }[]) => published.filter((p) => p.env.type === "goal");
const recoveredFlag = (env: Envelope) => (env.payload as { recovered?: boolean }).recovered === true;
const instant = { now: () => Date.now(), sleep: async () => {}, rand: () => 0 };

describe("gap recovery supervisor", () => {
  it("kill mid-stream BEFORE the goal → recovered exactly once (no missed goal) + feed.gap", async () => {
    const { bus, published } = captureBus();
    const pipe = createPipeline(bus);
    const ac = new AbortController();
    const gaps: GapInfo[] = [];
    async function* killStream(): AsyncGenerator<ScoreState> {
      yield state(1, 0, 0, 1); // 0-0
      throw new Error("ECONNRESET (network kill)"); // dies before the goal
    }
    const snapshot = state(1, 1, 0, 2); // recovery snapshot: goal happened (1-0) at Seq 2

    await superviseStream<ScoreState>({
      name: "scores",
      signal: ac.signal,
      live: true,
      silenceMs: 60_000,
      backoffBaseMs: 1,
      clock: instant,
      open: () => killStream(),
      onEvent: async (s) => void (await pipe.ingestScore(s)),
      recover: async () => pipe.ingestScore(snapshot, true), // snapshot reconcile
      onGap: async (info) => {
        gaps.push(info);
        ac.abort(); // one gap is enough for the test
      },
    });

    const g = goals(published);
    expect(g).toHaveLength(1); // recovered exactly once — the goal was NOT missed
    expect(recoveredFlag(g[0].env)).toBe(true); // flagged recovered:true
    expect(gaps).toHaveLength(1);
    expect(gaps[0].recovered).toBe(1);
    expect(gaps[0].reason).toBe("error");
  });

  it("kill mid-stream AFTER the goal → snapshot reconcile dedupes (no duplicate goal) + feed.gap", async () => {
    const { bus, published } = captureBus();
    const pipe = createPipeline(bus);
    const ac = new AbortController();
    const gaps: GapInfo[] = [];
    async function* killStream(): AsyncGenerator<ScoreState> {
      yield state(1, 0, 0, 1); // 0-0
      yield state(1, 1, 0, 2); // GOAL (1-0), delivered live
      throw new Error("network kill");
    }
    const snapshot = state(1, 1, 0, 3); // recovery snapshot: still 1-0 → no new goal to emit

    await superviseStream<ScoreState>({
      name: "scores",
      signal: ac.signal,
      live: true,
      silenceMs: 60_000,
      backoffBaseMs: 1,
      clock: instant,
      open: () => killStream(),
      onEvent: async (s) => void (await pipe.ingestScore(s)),
      recover: async () => pipe.ingestScore(snapshot, true),
      onGap: async (info) => {
        gaps.push(info);
        ac.abort();
      },
    });

    const g = goals(published);
    expect(g).toHaveLength(1); // the live goal only — NOT duplicated on recovery
    expect(recoveredFlag(g[0].env)).toBe(false); // it's the live one, not a recovered re-emit
    expect(gaps).toHaveLength(1);
    expect(gaps[0].recovered).toBe(0); // nothing missed → nothing re-emitted
  });

  it(">silence with no frame → gap(silence) → recovery", async () => {
    const { bus } = captureBus();
    createPipeline(bus);
    const ac = new AbortController();
    const gaps: GapInfo[] = [];
    async function* quiet(): AsyncGenerator<ScoreState> {
      await new Promise<void>((r) => (ac.signal.aborted ? r() : ac.signal.addEventListener("abort", () => r(), { once: true })));
    }
    await superviseStream<ScoreState>({
      name: "scores",
      signal: ac.signal,
      live: true,
      silenceMs: 30, // small so the watchdog fires fast
      backoffBaseMs: 1,
      clock: instant,
      open: () => quiet(),
      onEvent: async () => {},
      recover: async () => 0,
      onGap: async (info) => {
        gaps.push(info);
        ac.abort();
      },
    });
    expect(gaps).toHaveLength(1);
    expect(gaps[0].reason).toBe("silence");
  });

  it("heartbeats keep the watchdog alive (alive-but-quiet is NOT a gap)", async () => {
    const { bus } = captureBus();
    createPipeline(bus);
    const ac = new AbortController();
    const gaps: GapInfo[] = [];
    async function* neverYield(): AsyncGenerator<ScoreState> {
      await new Promise<void>((r) => ac.signal.addEventListener("abort", () => r(), { once: true }));
    }
    const open = (signal: AbortSignal, onHeartbeat: () => void) => {
      const hb = setInterval(onHeartbeat, 3); // keepalives faster than silenceMs
      signal.addEventListener("abort", () => clearInterval(hb), { once: true });
      return neverYield();
    };
    const sup = superviseStream<ScoreState>({
      name: "scores",
      signal: ac.signal,
      live: true,
      silenceMs: 40,
      backoffBaseMs: 1,
      clock: instant,
      open,
      onEvent: async () => {},
      recover: async () => 0,
      onGap: async (info) => void gaps.push(info),
    });
    await new Promise((r) => setTimeout(r, 130)); // several silenceMs windows, heartbeats flowing
    ac.abort();
    await sup;
    expect(gaps).toHaveLength(0); // no false gap while heartbeats flow
  }, 5000);
});

// Exactly-once regressions surfaced by adversarial review (ADR-019). Tested at the pipeline level — this is
// where the missed/duplicate-goal logic lives; the supervisor wiring is covered by the kill tests above.
describe("exactly-once goal semantics", () => {
  it("stale recovery snapshot must NOT cause a duplicate goal (monotonicity guard)", async () => {
    const { bus, published } = captureBus();
    const pipe = createPipeline(bus);
    await pipe.ingestScore(state(1, 1, 0, 10)); // live: 1-0 at Seq 10 → home goal published
    await pipe.ingestScore(state(1, 0, 0, 8), true); // lagging recovery snapshot (older Seq, regressed 0-0)
    await pipe.ingestScore(state(1, 1, 0, 13)); // reconnect: the true current 1-0 at Seq 13
    expect(goals(published)).toHaveLength(1); // stale snapshot did not regress prevScore → no re-derived duplicate
  });

  it("goal survives a publish failure — journal-then-ack lets recovery re-emit it (no missed goal)", async () => {
    const published: { env: Envelope }[] = [];
    let failGoal = true;
    const bus: Bus = {
      publish: async (_t, _k, env) => {
        const e = env as unknown as Envelope;
        if (failGoal && e.type === "goal") {
          failGoal = false;
          throw new Error("bus down");
        }
        void published.push({ env: e });
      },
      consume: async () => {},
      close: async () => {},
    };
    const pipe = createPipeline(bus);
    await expect(pipe.ingestScore(state(1, 1, 0, 2))).rejects.toThrow("bus down"); // live goal: publish throws
    const n = await pipe.ingestScore(state(1, 1, 0, 3), true); // recovery re-derives it (prevScore/dedup untouched by the failure)
    expect(n).toBe(1);
    expect(goals(published)).toHaveLength(1); // the goal reached a consumer on recovery — not silently lost
    expect(recoveredFlag(goals(published)[0].env)).toBe(true);
  });

  it("an away goal then an adjacent home goal both publish (no source_seq collision drop)", async () => {
    const { bus, published } = captureBus();
    const pipe = createPipeline(bus);
    await pipe.ingestScore(state(1, 0, 1, 41)); // away goal at Seq 41
    await pipe.ingestScore(state(1, 1, 1, 42)); // home goal at adjacent Seq 42 — the old baseSeq+1 scheme dropped this
    expect(goals(published)).toHaveLength(2);
  });

  it("multi-goal recovery snapshot emits one event per goal (not collapsed to one)", async () => {
    const { bus, published } = captureBus();
    const pipe = createPipeline(bus);
    await pipe.ingestScore(state(1, 0, 0, 1)); // 0-0
    const n = await pipe.ingestScore(state(1, 2, 0, 5), true); // gap snapshot: home scored twice during the outage
    expect(n).toBe(2);
    expect(goals(published)).toHaveLength(2);
  });

  it("a failed onEvent closes the stream generator (no leaked SSE socket)", async () => {
    const { bus } = captureBus();
    createPipeline(bus);
    const ac = new AbortController();
    let returned = false;
    async function* gen(): AsyncGenerator<ScoreState> {
      yield state(1, 1, 0, 2);
      yield state(1, 2, 0, 3); // never reached
    }
    await superviseStream<ScoreState>({
      name: "scores",
      signal: ac.signal,
      live: true,
      silenceMs: 60_000,
      backoffBaseMs: 1,
      clock: instant,
      open: () => {
        const it = gen();
        const ret = it.return.bind(it);
        return {
          [Symbol.asyncIterator]: () => ({
            next: () => it.next(),
            return: (v?: unknown) => {
              returned = true;
              return ret(v as never);
            },
          }),
        };
      },
      onEvent: async () => {
        throw new Error("publish down"); // rejects → supervisor catch path
      },
      recover: async () => 0,
      onGap: async () => void ac.abort(),
    });
    expect(returned).toBe(true); // catch called iterator.return(), like every other exit path
  });
});

// ADR-020: feed.gap rides the bus system plane (sys.signals.v1), not a raw side stream. Prove a simulated
// gap produces a feed_gap SysEvent that a bus consumer receives and parses.
describe("feed.gap on the system plane", () => {
  it("a gap publishes a feed_gap SysEvent consumed via the bus", async () => {
    const bus = memBus();
    const received: SysEvent[] = [];
    await bus.consume(TOPICS.sysSignals, "ops", async (sig) => void received.push(parseSysEvent(sig)));
    const pipe = createPipeline(bus);
    const ac = new AbortController();
    async function* killStream(): AsyncGenerator<ScoreState> {
      yield state(1, 0, 0, 1); // 0-0
      throw new Error("ECONNRESET (network kill)"); // dies before the goal
    }
    const snapshot = state(1, 1, 0, 2); // recovery snapshot: the goal happened during the gap

    await superviseStream<ScoreState>({
      name: "scores",
      signal: ac.signal,
      live: true,
      silenceMs: 60_000,
      backoffBaseMs: 1,
      clock: instant,
      open: () => killStream(),
      onEvent: async (s) => void (await pipe.ingestScore(s)),
      recover: async () => pipe.ingestScore(snapshot, true),
      onGap: async (info) => {
        await bus.publish(TOPICS.sysSignals, info.stream, feedGapSignal(info)); // system plane, same Bus
        ac.abort();
      },
    });

    expect(received).toHaveLength(1); // consumed via the bus
    const sig = received[0];
    expect(sig.kind).toBe("feed_gap");
    if (sig.kind !== "feed_gap") throw new Error("expected feed_gap");
    expect(sig.payload.stream).toBe("scores");
    expect(sig.payload.recovered).toBe(1); // the missed goal was recovered during the gap
    expect(sig.severity).toBe("warn"); // recovered > 0 → warn
  });
});
