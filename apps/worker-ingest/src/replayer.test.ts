// VERIFY: replay a fixture → downstream consumers receive ordered events; the goal lands at the correct
// relative minute; concurrent replays are isolated by match_id. Deterministic (virtual clock, capture bus).
import { describe, it, expect } from "vitest";
import type { Bus } from "@omnipitch/bus";
import type { Envelope } from "@omnipitch/schema";
import type { ScoreState } from "@omnipitch/txline";
import { replayItems, ReplayManager, type ReplayItem } from "./replayer";

function captureBus() {
  const published: { topic: string; key: string; env: Envelope }[] = [];
  const bus: Bus = {
    publish: async (topic, key, e) => void published.push({ topic: topic as string, key, env: e as unknown as Envelope }),
    consume: async () => {},
    close: async () => {},
  };
  return { bus, published };
}

// Virtual clock: sleep(ms) advances now() by ms (no real waiting), so relative timing is exact and instant.
function virtualClock(start = 1_800_000_000_000) {
  let t = start;
  return { start, clock: { now: () => t, sleep: async (ms: number) => void (t += ms), rand: () => 0 } };
}

const scoreState = (fixture: number, home: number, away: number, seq: number, ts: number, clockSec: number): ScoreState =>
  ({
    FixtureId: fixture,
    Seq: seq,
    Ts: ts,
    Clock: { Running: true, Seconds: clockSec },
    Score: { Participant1: { Total: { Goals: home } }, Participant2: { Total: { Goals: away } } },
  }) as unknown as ScoreState;

describe("replayer", () => {
  it("re-timestamps relative and lands the goal at the correct relative minute at Nx", async () => {
    const { bus, published } = captureBus();
    const { start, clock } = virtualClock();
    const T0 = 1_700_000_000_000;
    const GOAL_DT = 60_000; // the goal is scored 60s into the captured buckets
    const speed = 10;
    // buckets: 0-0 at T0 (game min 20'), then 1-0 at T0+60s (game min 21' → the goal)
    const items: ReplayItem[] = [
      { ts: T0, kind: "score", state: scoreState(18193785, 0, 0, 1, T0, 1200) },
      { ts: T0 + GOAL_DT, kind: "score", state: scoreState(18193785, 1, 0, 2, T0 + GOAL_DT, 1260) },
    ];

    const arrivals: { at: number; goals: number }[] = [];
    const stats = await replayItems(items, {
      matchId: "18193785",
      speed,
      bus,
      clock,
      onPublish: (p) => arrivals.push({ at: p.at, goals: p.goals }),
    });

    const goals = published.filter((p) => p.env.type === "goal");
    expect(stats.goals).toBe(1);
    expect(goals).toHaveLength(1); // exactly one goal event, ordered after the 0-0 state

    // it lands at the correct RELATIVE moment: GOAL_DT / speed after replay start (60_000/10 = 6_000ms)
    const goalArrival = arrivals[arrivals.length - 1];
    expect(goalArrival.goals).toBe(1);
    expect(goalArrival.at - start).toBe(GOAL_DT / speed);

    // and it keeps its REAL match minute — the game clock is untouched by replay speed (1260s = 21')
    expect((goals[0].env.payload as { minute: number }).minute).toBe(21);
    // replayed events are tagged source=replay — never indistinguishable from live data on the shared topics
    expect(goals[0].env.source).toBe("replay");
  });

  it("re-timestamps events onto the replay window (not the original capture time)", async () => {
    const { bus, published } = captureBus();
    const { start, clock } = virtualClock();
    const items: ReplayItem[] = [{ ts: 1_700_000_000_000, kind: "score", state: scoreState(1, 1, 0, 1, 1_700_000_000_000, 600) }];
    await replayItems(items, { matchId: "1", speed: 5, bus, clock });
    const goal = published.find((p) => p.env.type === "goal")!;
    // ts_source reflects the replay window (start ≈ now), never the 2023 capture Ts
    expect(new Date(goal.env.ts_source).getTime()).toBe(start);
  });

  it("isolates by match_id: different matches both start, a duplicate is rejected", async () => {
    const { bus } = captureBus();
    // now() constant + sleep that never resolves → the replay publishes item 0 then parks on the next wait,
    // staying active so the isolation invariant is observable (stop() aborts the parked wait to unwind).
    const hang = { now: () => 0, sleep: () => new Promise<void>(() => {}), rand: () => 0 };
    const mgr = new ReplayManager(bus, hang);
    const a = mgr.start("18193785", 10); // real buckets → publishes, then parks on the inter-event wait
    const b = mgr.start("77777777", 10); // a different match → own pipeline, accepted in parallel
    const dup = mgr.start("18193785", 10); // same match already active → rejected, not queued
    expect(a.started).toBe(true);
    expect(b.started).toBe(true);
    expect(dup.started).toBe(false);
    expect(dup.reason).toMatch(/already/);
    expect(mgr.isActive("18193785")).toBe(true);
    await mgr.stopAll(); // aborts the parked wait; unwinds cleanly
    expect(mgr.isActive("18193785")).toBe(false);
  });

  it("caps total concurrent replays", async () => {
    const { bus } = captureBus();
    const hang = { now: () => 0, sleep: () => new Promise<void>(() => {}), rand: () => 0 };
    const mgr = new ReplayManager(bus, hang, 1); // cap = 1
    expect(mgr.start("18193785", 10).started).toBe(true); // real buckets → parks, active.size = 1
    const capped = mgr.start("77777777", 10); // at the cap → rejected before starting
    expect(capped.started).toBe(false);
    expect(capped.reason).toMatch(/too many/);
    await mgr.stopAll();
  });
});
