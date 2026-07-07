import { describe, it, expect } from "vitest";
import { MarkWatchdog, type StaleAlert } from "./watchdog";

describe("MarkWatchdog — stale-mark alerting (ADR-028)", () => {
  it("alerts once when a halted market's marks go stale past the threshold, then stays silent", () => {
    const alerts: StaleAlert[] = [];
    const w = new MarkWatchdog(10_000, (a) => alerts.push(a));
    w.markSeen("m", 1000);
    expect(w.check(5000, ["m"])).toEqual([]); // 4s stale < 10s → quiet
    expect(w.check(12_000, ["m"])).toEqual([{ marketId: "m", staleMs: 11_000 }]); // >10s → one alert
    expect(w.check(13_000, ["m"])).toEqual([]); // already alerted → silent (no alert storm)
    expect(alerts).toHaveLength(1);
  });

  it("re-arms after a fresh mark (a new stale episode alerts again)", () => {
    const alerts: StaleAlert[] = [];
    const w = new MarkWatchdog(10_000, (a) => alerts.push(a));
    w.markSeen("m", 0);
    w.check(20_000, ["m"]); // alert #1
    w.markSeen("m", 21_000); // fresh mark clears the standing alert
    expect(w.check(25_000, ["m"])).toEqual([]); // only 4s stale
    expect(w.check(32_000, ["m"])).toEqual([{ marketId: "m", staleMs: 11_000 }]); // stale again → alert #2
    expect(alerts).toHaveLength(2);
  });

  it("alerts a halted market that has NEVER seen a mark (staleMs = Infinity)", () => {
    const w = new MarkWatchdog(10_000, () => {});
    expect(w.check(100, ["m"])[0]).toMatchObject({ marketId: "m", staleMs: Infinity });
  });

  it("only checks markets in the halted set — a live/absent market never alerts", () => {
    const w = new MarkWatchdog(10_000, () => {});
    w.markSeen("m", 0);
    expect(w.check(999_999, [])).toEqual([]); // "m" not in the halted set → not checked
  });

  it("clear() drops a standing alert so the next halt episode can alert again", () => {
    const alerts: StaleAlert[] = [];
    const w = new MarkWatchdog(10_000, (a) => alerts.push(a));
    w.check(50_000, ["m"]); // alert (never saw a mark)
    w.clear("m"); // market reopened
    expect(w.check(60_000, ["m"])).toHaveLength(1); // halted again + still stale → re-alert
    expect(alerts).toHaveLength(2);
  });
});
