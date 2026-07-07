import { describe, it, expect } from "vitest";
import { SysEvent, parseSysEvent, safeParseSysEvent } from "./sys";

const base = { sig_id: "22222222-2222-4222-8222-222222222222", ts: "2026-07-07T20:00:00.000Z" } as const;

// One valid signal per kind — the round-trip corpus for the system plane.
const sampleByKind: Record<string, unknown> = {
  feed_gap: { ...base, severity: "warn", kind: "feed_gap", payload: { stream: "scores", reason: "error", silentMs: 21000, recovered: 1 } },
  backpressure: { ...base, severity: "warn", kind: "backpressure", payload: { topic: "match.events.v1", lag: 4200 } },
  saga_stuck: { ...base, severity: "crit", kind: "saga_stuck", payload: { saga: "settle", step: "await-proof", match_id: "18193785" } },
  replay_request: { ...base, severity: "info", kind: "replay_request", payload: { match_id: "18193785", speed: 10 } },
};

describe("system signal plane (SysEvent)", () => {
  it("covers every kind in the discriminated union with a sample", () => {
    const kinds = SysEvent.options.map((o) => o.shape.kind.value);
    for (const k of kinds) expect(sampleByKind, `sample missing ${k}`).toHaveProperty(k);
    expect(SysEvent.options.length).toBe(Object.keys(sampleByKind).length);
  });

  it("round-trips every kind without loss and narrows on the discriminant", () => {
    for (const [kind, sample] of Object.entries(sampleByKind)) {
      const parsed = parseSysEvent(sample);
      expect(parsed).toEqual(sample);
      expect(parsed.kind).toBe(kind);
    }
    const r = parseSysEvent(sampleByKind.replay_request);
    if (r.kind !== "replay_request") throw new Error("expected replay_request");
    expect(r.payload.speed).toBe(10); // typed access, no cast
  });

  it("rejects a bad payload, an unknown kind, and a malformed header", () => {
    expect(safeParseSysEvent({ ...base, severity: "info", kind: "replay_request", payload: { match_id: "x", speed: -1 } }).success).toBe(false); // speed must be positive
    expect(safeParseSysEvent({ ...base, severity: "info", kind: "nope", payload: {} }).success).toBe(false);
    expect(safeParseSysEvent({ ...(sampleByKind.feed_gap as Record<string, unknown>), sig_id: "not-a-uuid" }).success).toBe(false);
  });
});
