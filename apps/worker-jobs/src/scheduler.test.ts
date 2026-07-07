import { describe, it, expect } from "vitest";
import { Scheduler } from "./scheduler";
import { TgApiError } from "./tg";

const noop = async () => {};

describe("Scheduler", () => {
  it("holds the global 25/s budget across all sends", async () => {
    const s = new Scheduler({ ratePerSec: 25, capacity: 25 });
    for (let i = 0; i < 40; i++) s.enqueueEvent(`e${i}`, noop);
    await s.pump(0);
    expect(s.stats.sent).toBeLessThanOrEqual(25); // first second capped at the bucket
    await s.pump(1000); // +25 tokens a second later
    expect(s.stats.sent).toBe(40);
  });

  it("sends events before edits under a scarce budget", async () => {
    const order: string[] = [];
    const s = new Scheduler({ capacity: 1, ratePerSec: 1 });
    s.enqueueEdit("m1", async () => void order.push("edit"));
    s.enqueueEvent("goal", async () => void order.push("event"));
    await s.pump(0); // 1 token → the event wins
    expect(order).toEqual(["event"]);
    await s.pump(1000); // next token → the edit
    expect(order).toEqual(["event", "edit"]);
  });

  it("never edits a message faster than 4s", async () => {
    const hits: number[] = [];
    const s = new Scheduler();
    s.enqueueEdit("m1", async () => void hits.push(0));
    await s.pump(0);
    s.enqueueEdit("m1", async () => void hits.push(1000));
    await s.pump(1000); // 1s later — throttled, not eligible
    expect(hits).toEqual([0]);
    await s.pump(4000); // 4s after the first edit — eligible
    expect(hits).toEqual([0, 1000]);
  });

  it("coalesces edits per message — a newer render supersedes the pending one", async () => {
    const sent: string[] = [];
    const s = new Scheduler();
    s.enqueueEdit("m1", async () => void sent.push("stale"));
    s.enqueueEdit("m1", async () => void sent.push("fresh")); // supersedes
    await s.pump(0);
    expect(sent).toEqual(["fresh"]);
    expect(s.stats.editsSuperseded).toBe(1);
  });

  it("retries a transient (non-429) event error without dropping it, bounded", async () => {
    let attempts = 0;
    const s = new Scheduler();
    s.enqueueEvent("post", async () => {
      attempts++;
      if (attempts < 3) throw new Error("network blip"); // transient
    });
    await s.pump(0); // attempt 1 → throws → back off + re-queue (never dropped)
    expect(attempts).toBe(1);
    await s.pump(1000); // attempt 2 → throws → re-queue
    await s.pump(2000); // attempt 3 → succeeds
    expect(attempts).toBe(3);
    expect(s.stats.sent).toBe(1);
  });

  it("backs off on a 429 edit WITHOUT losing the next event post", async () => {
    let eventRan = 0;
    const s = new Scheduler();
    s.enqueueEdit("m1", async () => {
      throw new TgApiError(429, "Too Many Requests", 1); // retry_after 1s
    });
    await s.pump(0); // attempt edit → 429 → paused until 1000
    expect(s.stats.rateLimited).toBe(1);
    s.enqueueEvent("goal", async () => void eventRan++);
    await s.pump(500); // still paused
    expect(eventRan).toBe(0);
    await s.pump(1000); // backoff elapsed → the event post survives
    expect(eventRan).toBe(1);
  });
});
