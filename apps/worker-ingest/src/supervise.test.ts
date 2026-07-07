// VERIFY: kill network to a stream mid-replay → recovery (feed.gap) event, no missed goal, no duplicate goal.
// Deterministic, in-memory (capturing bus, mock streams, instant backoff). No Redis/network needed.
import { describe, it, expect } from "vitest";
import type { Bus } from "@omnipitch/bus";
import type { Envelope } from "@omnipitch/schema";
import type { ScoreState } from "@omnipitch/txline";
import { createPipeline } from "./ingest";
import { superviseStream, type GapInfo } from "./supervise";

function captureBus() {
  const published: { topic: string; key: string; env: Envelope }[] = [];
  const bus: Bus = {
    publish: async (topic, key, env) => void published.push({ topic: topic as string, key, env }),
    consume: async () => {},
    close: async () => {},
  };
  return { bus, published };
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
        if (failGoal && env.type === "goal") {
          failGoal = false;
          throw new Error("bus down");
        }
        void published.push({ env });
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
