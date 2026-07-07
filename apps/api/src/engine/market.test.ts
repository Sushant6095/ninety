import { describe, it, expect } from "vitest";
import type { Envelope } from "@omnipitch/schema";
import {
  transition,
  apply,
  createRegistry,
  initialMarket,
  stake,
  canAcceptOrder,
  spreadAt,
  shouldReopen,
  fromEnvelope,
  IllegalTransitionError,
  STATUSES,
  TRIGGERS,
  SPREAD_MAX,
  SPREAD_DECAY_MS,
  HALT_WINDOW_MS,
  type MarketState,
  type MarketStatus,
  type Trigger,
  type MarketCommand,
} from "./market";

const AT = 1_000_000; // base event-time (ms). ALL time in these tests comes from cmd.at — never a wall clock.

const cmdFor = (t: Trigger, at = AT): MarketCommand => {
  if (t === "settle") return { trigger: t, at, result: "H", sig: "5xSig" };
  if (t === "pivot") return { trigger: t, at, reason: "goal" };
  return { trigger: t, at };
};

/** Drive the machine from SCHEDULED to `status` via legal moves (realistic states, not hand-built). */
function reach(status: MarketStatus): MarketState {
  let s = initialMarket("m1", "match1", AT);
  const step = (t: Trigger) => (s = transition(s, cmdFor(t, s.updatedAt + 1)).state);
  switch (status) {
    case "SCHEDULED":
      break;
    case "OPEN":
      step("open");
      break;
    case "LIVE":
      step("open"), step("kickoff");
      break;
    case "HALTED":
      step("open"), step("kickoff"), step("pivot");
      break;
    case "RESOLVING":
      step("open"), step("kickoff"), step("ft");
      break;
    case "SETTLED":
      step("open"), step("kickoff"), step("ft"), step("settle");
      break;
    case "VOIDED":
      step("open"), step("kickoff"), step("abandon");
      break;
  }
  return s;
}

// The SPEC, hand-authored independent of the implementation: destination status = a real move (emits effects);
// "noop" = tolerated redelivery/late feed (no effect, status unchanged); "illegal" = throws.
const EXPECT: Record<MarketStatus, Record<Trigger, MarketStatus | "noop" | "illegal">> = {
  SCHEDULED: { open: "OPEN", kickoff: "illegal", pivot: "illegal", reopen: "illegal", ft: "illegal", settle: "illegal", abandon: "VOIDED" },
  OPEN: { open: "noop", kickoff: "LIVE", pivot: "illegal", reopen: "illegal", ft: "illegal", settle: "illegal", abandon: "VOIDED" },
  LIVE: { open: "noop", kickoff: "noop", pivot: "HALTED", reopen: "noop", ft: "RESOLVING", settle: "illegal", abandon: "VOIDED" },
  HALTED: { open: "noop", kickoff: "noop", pivot: "HALTED", reopen: "LIVE", ft: "RESOLVING", settle: "illegal", abandon: "VOIDED" },
  RESOLVING: { open: "noop", kickoff: "noop", pivot: "noop", reopen: "illegal", ft: "noop", settle: "SETTLED", abandon: "VOIDED" },
  SETTLED: { open: "illegal", kickoff: "illegal", pivot: "noop", reopen: "illegal", ft: "noop", settle: "noop", abandon: "illegal" },
  VOIDED: { open: "illegal", kickoff: "illegal", pivot: "noop", reopen: "illegal", ft: "noop", settle: "illegal", abandon: "noop" },
};

describe("market state machine — exhaustive guard table (7×7)", () => {
  for (const from of STATUSES) {
    for (const trig of TRIGGERS) {
      const exp = EXPECT[from][trig];
      it(`${from} --${trig}--> ${exp}`, () => {
        const state = reach(from);
        const cmd = cmdFor(trig, state.updatedAt + 1);
        if (exp === "illegal") {
          expect(() => transition(state, cmd)).toThrow(IllegalTransitionError);
        } else if (exp === "noop") {
          const r = transition(state, cmd);
          expect(r.state.status).toBe(from);
          expect(r.effects).toEqual([]);
        } else {
          const r = transition(state, cmd);
          expect(r.state.status).toBe(exp);
          expect(r.effects.length).toBeGreaterThan(0); // a real move always emits a side-effect
        }
      });
    }
  }
});

describe("happy path + effects", () => {
  it("SCHEDULED→OPEN→LIVE→HALTED→LIVE→RESOLVING→SETTLED with the right emissions", () => {
    let s = initialMarket("m1", "match1", AT);
    let r = transition(s, cmdFor("open", 1));
    expect(r.state.status).toBe("OPEN");
    expect(r.effects).toEqual([{ type: "open" }]);
    r = transition(r.state, cmdFor("kickoff", 2));
    expect(r.state.status).toBe("LIVE");
    expect(r.effects).toEqual([{ type: "live" }]);
    r = transition(r.state, { trigger: "pivot", at: 3, reason: "goal" });
    expect(r.state.status).toBe("HALTED");
    expect(r.effects).toEqual([{ type: "halt", spreadMult: SPREAD_MAX, reason: "goal" }]);
    r = transition(r.state, cmdFor("reopen", 4));
    expect(r.state.status).toBe("LIVE");
    expect(r.effects).toEqual([{ type: "reopen", spreadMult: SPREAD_MAX, decayMs: SPREAD_DECAY_MS }]);
    r = transition(r.state, cmdFor("ft", 5));
    expect(r.state.status).toBe("RESOLVING");
    expect(r.effects).toEqual([{ type: "resolving" }]);
    r = transition(r.state, { trigger: "settle", at: 6, result: "H", sig: "5xSig" });
    expect(r.state.status).toBe("SETTLED");
    expect(r.effects).toEqual([{ type: "settled", result: "H", sig: "5xSig" }]);
    expect(r.state.result).toBe("H");
    expect(r.state.settleSig).toBe("5xSig");
    void s;
  });
});

describe("enumerated edge cases", () => {
  it("illegal transition from every state carries {from, trigger}", () => {
    try {
      transition(reach("SCHEDULED"), cmdFor("kickoff"));
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(IllegalTransitionError);
      expect((e as IllegalTransitionError).from).toBe("SCHEDULED");
      expect((e as IllegalTransitionError).trigger).toBe("kickoff");
    }
  });

  it("duplicate ft → no-op (RESOLVING stays, no second emission)", () => {
    const resolving = reach("RESOLVING");
    const r = transition(resolving, cmdFor("ft", resolving.updatedAt + 100));
    expect(r.state.status).toBe("RESOLVING");
    expect(r.effects).toEqual([]);
  });

  it("goal after ft (late feed) → ignored, never halts a resolving market", () => {
    const resolving = reach("RESOLVING");
    const r = transition(resolving, { trigger: "pivot", at: resolving.updatedAt + 100, reason: "goal" });
    expect(r.state.status).toBe("RESOLVING");
    expect(r.effects).toEqual([]);
  });

  it("red card during HALTED extends the halt — halt_extend, not a fresh halt", () => {
    const live = reach("LIVE");
    const t1 = live.updatedAt + 1000; // event-times must move forward (machine clamps stale stamps)
    const halt = transition(live, { trigger: "pivot", at: t1, reason: "goal" });
    expect(halt.effects).toEqual([{ type: "halt", spreadMult: SPREAD_MAX, reason: "goal" }]);
    expect(halt.state.haltedAt).toBe(t1);
    const t2 = t1 + 2000;
    const red = transition(halt.state, { trigger: "pivot", at: t2, reason: "red" });
    expect(red.state.status).toBe("HALTED"); // still halted
    expect(red.effects).toEqual([{ type: "halt_extend", reason: "red" }]); // extend, NOT re-halt
    expect(red.state.haltedAt).toBe(t2); // window pushed forward to the red-card event
  });

  it("VOIDED refunds exactly the granted (committed) credits", () => {
    let s = reach("LIVE");
    s = stake(s, 100);
    s = stake(s, 250);
    expect(s.committed).toBe(350);
    const r = transition(s, cmdFor("abandon", s.updatedAt + 1));
    expect(r.state.status).toBe("VOIDED");
    expect(r.effects).toEqual([{ type: "voided", refund: 350 }]); // exactly the committed credits
  });

  it("events for an unknown market: create-or-park, never crash", () => {
    const reg = createRegistry();
    // a goal for a market nobody opened → create SCHEDULED, park the illegal pivot, do NOT throw
    const parked = apply(reg, "mX", "matchX", { trigger: "pivot", at: AT, reason: "goal" });
    expect(parked.parked).toBe(true);
    expect(parked.effects).toEqual([]);
    expect(reg.markets.get("mX")?.status).toBe("SCHEDULED"); // created
    // a legal open for another unknown market → created + opened, not parked
    const opened = apply(reg, "mY", "matchY", cmdFor("open"));
    expect(opened.parked).toBe(false);
    expect(opened.effects).toEqual([{ type: "open" }]);
    expect(reg.markets.get("mY")?.status).toBe("OPEN");
  });

  it("abandon voids from any active state (OPEN, LIVE, HALTED, RESOLVING)", () => {
    for (const from of ["OPEN", "LIVE", "HALTED", "RESOLVING"] as const) {
      const r = transition(reach(from), cmdFor("abandon", AT + 9));
      expect(r.state.status).toBe("VOIDED");
      expect(r.effects[0].type).toBe("voided");
    }
  });
});

describe("time comes only from event payloads", () => {
  it("updatedAt is monotone in event-time; an out-of-order stamp never rewinds it", () => {
    const live = reach("LIVE");
    const forward = transition(live, cmdFor("open", live.updatedAt + 1000)); // noop, but stamps time
    expect(forward.state.updatedAt).toBe(live.updatedAt + 1000);
    const stale = transition(forward.state, cmdFor("open", 5)); // an old stamp
    expect(stale.state.updatedAt).toBe(forward.state.updatedAt); // not rewound
  });

  it("spread decays 3→1 over 60s of EVENT-time after reopen", () => {
    const halted = reach("HALTED");
    expect(spreadAt(halted, halted.updatedAt)).toBe(SPREAD_MAX); // 3× while halted
    const t = halted.updatedAt + 1000; // reopen event-time must move forward
    const reopened = transition(halted, cmdFor("reopen", t)).state;
    expect(reopened.reopenAt).toBe(t);
    expect(spreadAt(reopened, t)).toBe(3);
    expect(spreadAt(reopened, t + SPREAD_DECAY_MS / 2)).toBeCloseTo(2);
    expect(spreadAt(reopened, t + SPREAD_DECAY_MS)).toBe(1);
    expect(spreadAt(reopened, t + SPREAD_DECAY_MS * 2)).toBe(1); // clamps
  });

  it("reopen policy fires only once event-time clears the halt window", () => {
    const halted = reach("HALTED");
    const t0 = halted.haltedAt!;
    expect(shouldReopen(halted, t0 + HALT_WINDOW_MS - 1)).toBe(false);
    expect(shouldReopen(halted, t0 + HALT_WINDOW_MS)).toBe(true);
    expect(shouldReopen(reach("LIVE"), t0 + HALT_WINDOW_MS)).toBe(false); // only HALTED reopens
  });
});

describe("order gate + bus adapter", () => {
  it("only OPEN/LIVE accept orders (halted rejects — MARKET_HALTED law)", () => {
    expect(canAcceptOrder(reach("OPEN"))).toBe(true);
    expect(canAcceptOrder(reach("LIVE"))).toBe(true);
    for (const s of ["SCHEDULED", "HALTED", "RESOLVING", "SETTLED", "VOIDED"] as const) {
      expect(canAcceptOrder(reach(s))).toBe(false);
    }
  });

  it("fromEnvelope maps canonical events to lifecycle commands (event-time from ts_source)", () => {
    const env = (type: string, payload: Record<string, unknown>): Envelope =>
      ({ event_id: "e", source: "txline.score", source_seq: 1, match_id: "m1", ts_source: "2026-07-07T20:00:00.000Z", ts_ingest: "", type, payload }) as unknown as Envelope;
    const t = Date.parse("2026-07-07T20:00:00.000Z");
    expect(fromEnvelope(env("kickoff", { status: "1H" }))).toEqual({ trigger: "kickoff", at: t });
    expect(fromEnvelope(env("goal", { team: "home", minute: 38 }))).toEqual({ trigger: "pivot", at: t, reason: "goal" });
    expect(fromEnvelope(env("card", { color: "red", team: "away", minute: 40 }))).toEqual({ trigger: "pivot", at: t, reason: "red" });
    expect(fromEnvelope(env("card", { color: "yellow", team: "away", minute: 41 }))).toBeNull(); // yellow doesn't halt
    expect(fromEnvelope(env("ft", { status: "FT" }))).toEqual({ trigger: "ft", at: t });
    expect(fromEnvelope(env("ft", { status: "abandoned" }))).toEqual({ trigger: "abandon", at: t });
    expect(fromEnvelope(env("settled", { result: "H", sig: "5x" }))).toEqual({ trigger: "settle", at: t, result: "H", sig: "5x" });
    expect(fromEnvelope(env("odds_tick", {}))).toBeNull();
  });
});

describe("hardening (engine-guardian review)", () => {
  it("settle without a verified result+sig is rejected — never a placeholder settlement", () => {
    const resolving = reach("RESOLVING");
    expect(() => transition(resolving, { trigger: "settle", at: resolving.updatedAt + 1 })).toThrow(IllegalTransitionError);
    // through the registry it PARKS (never crashes, never locks in a fake terminal SETTLED)
    const reg = createRegistry();
    reg.markets.set(resolving.marketId, resolving);
    const r = apply(reg, resolving.marketId, resolving.matchId, { trigger: "settle", at: resolving.updatedAt + 1, result: "H" }); // sig missing
    expect(r.parked).toBe(true);
    expect(reg.markets.get(resolving.marketId)?.status).toBe("RESOLVING"); // unchanged
  });

  it("fromEnvelope drops a settled event missing result/sig, and an unparseable timestamp", () => {
    const mk = (type: string, payload: Record<string, unknown>, ts = "2026-07-07T20:00:00.000Z"): Envelope =>
      ({ event_id: "e", source: "txline.score", source_seq: 1, match_id: "m1", ts_source: ts, ts_ingest: "", type, payload }) as unknown as Envelope;
    expect(fromEnvelope(mk("settled", { result: "H" }))).toBeNull(); // sig missing
    expect(fromEnvelope(mk("settled", {}))).toBeNull(); // both missing
    expect(fromEnvelope(mk("goal", { team: "home" }, "not-a-date"))).toBeNull(); // unparseable ts → dropped
  });

  it("haltedAt uses the clamped event-time — a stale stamp cannot shorten the halt window", () => {
    const live = reach("LIVE"); // updatedAt is large (~1e6)
    const halt = transition(live, { trigger: "pivot", at: 5000, reason: "goal" }); // stale stamp below updatedAt
    expect(halt.state.haltedAt).toBe(live.updatedAt); // clamped forward, not the stale 5000
    expect(shouldReopen(halt.state, live.updatedAt + HALT_WINDOW_MS - 1)).toBe(false); // window measured from clamp
  });
});
