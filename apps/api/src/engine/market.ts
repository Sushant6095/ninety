// Market lifecycle state machine (engine LAW: deterministic, time-from-events-only, single-writer).
// SCHEDULED → OPEN → LIVE ⇄ HALTED → RESOLVING → SETTLED | VOIDED
//
// transition() is a PURE reducer: (state, command) → { state, effects }. It never reads a wall clock —
// every timestamp comes from cmd.at (the source event's payload time). Illegal transitions throw a typed
// IllegalTransitionError; benign redeliveries and late-feed events resolve to a no-op (never a crash).
// The engine turns effects into bus emissions / AMM re-anchors / refunds; this file emits, never does IO.

import type { Envelope } from "@omnipitch/schema";

export type MarketStatus = "SCHEDULED" | "OPEN" | "LIVE" | "HALTED" | "RESOLVING" | "SETTLED" | "VOIDED";

// The guard-table vocabulary. Match-feed triggers (kickoff, pivot, ft) vs control triggers (open, reopen,
// settle, abandon). `pivot` = any halt-worthy event (goal | red card | penalty).
export type Trigger = "open" | "kickoff" | "pivot" | "reopen" | "ft" | "settle" | "abandon";

export const STATUSES: readonly MarketStatus[] = ["SCHEDULED", "OPEN", "LIVE", "HALTED", "RESOLVING", "SETTLED", "VOIDED"];
export const TRIGGERS: readonly Trigger[] = ["open", "kickoff", "pivot", "reopen", "ft", "settle", "abandon"];

// ADR-005: goal → HALT → reopen with 3× spread decaying over 60s.
export const SPREAD_MAX = 3;
export const SPREAD_DECAY_MS = 60_000;
export const HALT_WINDOW_MS = 10_000; // min halt before the reopen policy fires (calibration knob; ADR-005)

export interface MarketState {
  readonly marketId: string;
  readonly matchId: string;
  readonly status: MarketStatus;
  readonly haltedAt?: number; // event-time the current halt began; a pivot during HALTED EXTENDS this (no re-halt)
  readonly reopenAt?: number; // event-time of the last reopen → drives the spread decay
  readonly result?: string; // winning outcome, set on settle
  readonly settleSig?: string; // Solana settlement tx signature
  readonly committed: number; // play-credits staked into this market — refunded EXACTLY on VOID
  readonly updatedAt: number; // event-time of the last applied command
}

export type MarketEffect =
  | { type: "open" }
  | { type: "live" }
  | { type: "halt"; spreadMult: number; reason: string }
  | { type: "halt_extend"; reason: string } // extend an in-progress halt; do NOT re-anchor from scratch
  | { type: "reopen"; spreadMult: number; decayMs: number }
  | { type: "resolving" }
  | { type: "settled"; result: string; sig: string }
  | { type: "voided"; refund: number }; // refund === committed, exactly

export interface MarketCommand {
  readonly trigger: Trigger;
  readonly at: number; // event-time (ms) from the source payload — NEVER a wall clock
  readonly reason?: string; // pivot: "goal" | "red" | "penalty"
  readonly result?: string; // settle
  readonly sig?: string; // settle
}

export interface TransitionResult {
  readonly state: MarketState;
  readonly effects: readonly MarketEffect[];
}

export class IllegalTransitionError extends Error {
  constructor(
    readonly from: MarketStatus,
    readonly trigger: Trigger,
    readonly marketId: string,
  ) {
    super(`illegal transition: ${from} --${trigger}--> (market ${marketId})`);
    this.name = "IllegalTransitionError";
  }
}

export function initialMarket(marketId: string, matchId: string, at: number): MarketState {
  return { marketId, matchId, status: "SCHEDULED", committed: 0, updatedAt: at };
}

// Guard table. A cell value is the destination status; "noop" tolerates a benign redelivery / late feed;
// a MISSING cell is illegal (throws). The effect for a legal move is derived in applyLegal() below, because
// LIVE→HALTED (fresh halt) and HALTED→HALTED (extend) share a destination but emit different effects.
const TABLE: Record<MarketStatus, Partial<Record<Trigger, MarketStatus | "noop">>> = {
  SCHEDULED: { open: "OPEN", abandon: "VOIDED" },
  OPEN: { open: "noop", kickoff: "LIVE", abandon: "VOIDED" },
  LIVE: { open: "noop", kickoff: "noop", reopen: "noop", pivot: "HALTED", ft: "RESOLVING", abandon: "VOIDED" },
  HALTED: { open: "noop", kickoff: "noop", pivot: "HALTED", reopen: "LIVE", ft: "RESOLVING", abandon: "VOIDED" },
  RESOLVING: { open: "noop", kickoff: "noop", pivot: "noop", ft: "noop", settle: "SETTLED", abandon: "VOIDED" },
  // terminal: late match-feed events (pivot/ft) are ignored; a re-fire of the entering trigger is a no-op;
  // any control trigger that would mutate a finished market is illegal.
  SETTLED: { pivot: "noop", ft: "noop", settle: "noop" },
  VOIDED: { pivot: "noop", ft: "noop", abandon: "noop" },
};

export function transition(state: MarketState, cmd: MarketCommand): TransitionResult {
  const dest = TABLE[state.status][cmd.trigger];
  if (dest === undefined) throw new IllegalTransitionError(state.status, cmd.trigger, state.marketId);
  const at = Math.max(state.updatedAt, cmd.at); // monotone event-time; an out-of-order stamp never rewinds it
  if (dest === "noop") return { state: { ...state, updatedAt: at }, effects: [] };
  return applyLegal(state, cmd, at);
}

function applyLegal(state: MarketState, cmd: MarketCommand, at: number): TransitionResult {
  const base = { ...state, updatedAt: at };
  switch (cmd.trigger) {
    case "open":
      return { state: { ...base, status: "OPEN" }, effects: [{ type: "open" }] };
    case "kickoff":
      return { state: { ...base, status: "LIVE" }, effects: [{ type: "live" }] };
    case "pivot": {
      const reason = cmd.reason ?? "goal";
      if (state.status === "HALTED") {
        // red/goal/pen during a halt EXTENDS it (push the window to this event), never re-halts from scratch
        return { state: { ...base, status: "HALTED", haltedAt: at }, effects: [{ type: "halt_extend", reason }] };
      }
      return { state: { ...base, status: "HALTED", haltedAt: at }, effects: [{ type: "halt", spreadMult: SPREAD_MAX, reason }] };
    }
    case "reopen":
      return {
        state: { ...base, status: "LIVE", haltedAt: undefined, reopenAt: at },
        effects: [{ type: "reopen", spreadMult: SPREAD_MAX, decayMs: SPREAD_DECAY_MS }],
      };
    case "ft":
      return { state: { ...base, status: "RESOLVING" }, effects: [{ type: "resolving" }] };
    case "settle": {
      // Settlement is the one irreversible, financial transition — it MUST carry a verified result + on-chain
      // sig. A settle lacking either is rejected (→ parked), never minted into a placeholder terminal state.
      if (cmd.result === undefined || cmd.sig === undefined) {
        throw new IllegalTransitionError(state.status, cmd.trigger, state.marketId);
      }
      return {
        state: { ...base, status: "SETTLED", result: cmd.result, settleSig: cmd.sig },
        effects: [{ type: "settled", result: cmd.result, sig: cmd.sig }],
      };
    }
    case "abandon":
      return { state: { ...base, status: "VOIDED" }, effects: [{ type: "voided", refund: state.committed }] };
    default:
      // Unreachable: the guard table only yields a destination for the triggers handled above.
      throw new IllegalTransitionError(state.status, cmd.trigger, state.marketId);
  }
}

// --- pure helpers used by the order/risk path (engine LAW: halted markets reject orders) ---

/** Orders are accepted only while OPEN or LIVE. HALTED → MARKET_HALTED; RESOLVING/terminal → closed. */
export function canAcceptOrder(state: MarketState): boolean {
  return state.status === "OPEN" || state.status === "LIVE";
}

/** Credits staked accumulate here so VOID can refund exactly what was committed. Pure accumulator. */
export function stake(state: MarketState, credits: number): MarketState {
  return { ...state, committed: state.committed + credits };
}

/** Effective LMSR spread multiplier at event-time `at`: 3× on halt, decaying 3→1 over 60s after reopen. */
export function spreadAt(state: MarketState, at: number): number {
  if (state.status === "HALTED") return SPREAD_MAX;
  if (state.status === "LIVE" && state.reopenAt !== undefined) {
    const f = Math.min(1, Math.max(0, (at - state.reopenAt) / SPREAD_DECAY_MS));
    return SPREAD_MAX - (SPREAD_MAX - 1) * f;
  }
  return 1;
}

/** Reopen policy (time-from-events): a HALTED market is due to reopen once `at` clears the halt window. */
export function shouldReopen(state: MarketState, at: number): boolean {
  return state.status === "HALTED" && state.haltedAt !== undefined && at - state.haltedAt >= HALT_WINDOW_MS;
}

// --- bus adapter: map a canonical Envelope to a lifecycle command (best-effort; null = not a lifecycle event) ---
export function fromEnvelope(env: Envelope): MarketCommand | null {
  const at = Date.parse(env.ts_source); // event-time from the payload, not a wall clock
  if (Number.isNaN(at)) return null; // unparseable timestamp is a data-integrity signal → drop, don't stamp epoch 0
  const p = env.payload as { color?: string; status?: string; result?: string; sig?: string };
  switch (env.type) {
    case "kickoff":
      return { trigger: "kickoff", at };
    case "goal":
    case "penalty":
      return { trigger: "pivot", at, reason: env.type === "goal" ? "goal" : "penalty" };
    case "card":
      return p.color === "red" ? { trigger: "pivot", at, reason: "red" } : null; // only a red halts
    case "reopen":
      return { trigger: "reopen", at };
    case "ft":
      return /aband/i.test(p.status ?? "") ? { trigger: "abandon", at } : { trigger: "ft", at };
    case "settled":
      // a settle command needs both the result and the on-chain sig, or it is not actionable → drop
      return p.result !== undefined && p.sig !== undefined ? { trigger: "settle", at, result: p.result, sig: p.sig } : null;
    default:
      return null; // odds_tick, mark, commentary, ht, order/fill/position, engine-emitted halt → not lifecycle
  }
}

// --- registry: create-or-park. An event for an unknown market creates it (SCHEDULED); an event that is
// illegal for the current state is PARKED (dropped) rather than crashing the single-writer loop. ---
export interface MarketRegistry {
  readonly markets: Map<string, MarketState>;
}
export function createRegistry(): MarketRegistry {
  return { markets: new Map() };
}

export interface ApplyResult {
  readonly effects: readonly MarketEffect[];
  readonly parked: boolean; // true if the command was illegal for the current state and was dropped
}

export function apply(reg: MarketRegistry, marketId: string, matchId: string, cmd: MarketCommand): ApplyResult {
  const existing = reg.markets.get(marketId) ?? initialMarket(marketId, matchId, cmd.at);
  reg.markets.set(marketId, existing); // create-on-first-sight so an unknown market never crashes the loop
  try {
    const { state, effects } = transition(existing, cmd);
    reg.markets.set(marketId, state);
    return { effects, parked: false };
  } catch (err) {
    if (err instanceof IllegalTransitionError) return { effects: [], parked: true }; // park, never crash
    throw err;
  }
}
