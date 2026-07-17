// Engine runtime (ADR-025): the single logical writer. One serialized lane per market (strict arrival order
// across marks AND lifecycle events); each command runs validate → JOURNAL (durable) → apply → emit. A Redis
// SET NX PX lease guarantees one writer process — a second one exits loudly. A queue-depth cap yields a typed
// BACKPRESSURE rejection. Commands arriving during a market's recovery queue behind it (never dropped). A
// market whose recovery fails is quarantined (refuse to serve, alert) — never seeded fresh onto a wrong state.
// LAWS: journal-then-ack, deterministic apply (time from event payloads), no LMSR math here (amm.ts is pure),
// no http/ws imports.
import { hostname } from "node:os";
import type { Redis } from "ioredis";
import { createBus } from "@omnipitch/bus";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import { Journal, RedisJournalStore, hashState, type JournalStore } from "./journal";
import { transition, initialMarket, fromEnvelope, canAcceptOrder, spreadAt, shouldReopen, IllegalTransitionError, type MarketState, type MarketEffect, type MarketCommand } from "./market";
import { applyOrder, type Side, type RejectCode } from "./order";
import { MarkWatchdog, type StaleAlert } from "./watchdog";
import { effectsToEnvelopes } from "./emit";

const B0_DEFAULT = 300; // base LMSR liquidity until a mark re-anchors it
const B_MAX = 3 * B0_DEFAULT; // mark-tether bound: b stays in [b0, 3·b0] (ADR-022); the engine re-clamps defensively
const SPREAD_FLOOR = 0.01; // purely defensive floor on the b divisor; spreadAt() is lifecycle-derived ∈ [1,3] so it never binds
const STALE_MARK_MS = 10_000; // a HALTED market with no fresh mark for this long is alerted (ADR-028)

// Effects the engine emits — a superset of the lifecycle MarketEffect: fills, position updates, credit-ledger
// events, and typed order rejections. The engine only emits; the bus/ledger apply them.
export type EngineEffect =
  | MarketEffect
  | { type: "fill"; user: string; outcome: number; side: Side; price: number; size: number; cost: number; fee: number }
  | { type: "position"; user: string; outcome: number; qty: number }
  | { type: "ledger"; user: string; kind: "debit" | "credit" | "burn"; amount: number }
  | { type: "reject"; user: string; code: RejectCode };

// The full per-market state the engine owns: the lifecycle machine + the AMM anchor tethered from prices.marks +
// the LMSR shares outstanding (q) and per-user positions. q/positions are part of the journaled state → replay
// reproduces them exactly (determinism law).
export interface EngineMarket {
  lifecycle: MarketState;
  bHint: number; // AMM liquidity b(t) = b0·(1+κ·hazard), FULLY computed by cortex (ADR-022) — the engine does NOT
  // re-apply hazard (that double-counts). The only extra thinning is the ADR-005 reopen decay via spreadAt().
  q: number[]; // LMSR shares outstanding per outcome (the AMM position vector)
  positions: Record<string, number[]>; // user → per-outcome position in THIS market
}

// An order on a market's lane. balance + recentOrderTimes are provided BY THE CALLER (the ledger is the balance
// authority, ADR-003; the gateway supplies the user's rate-window) — the engine owns only per-market AMM state.
export interface OrderCmd {
  user: string;
  side: Side;
  outcome: number;
  size: number;
  balance: number;
  recentOrderTimes: number[];
  limit?: number; // client slippage guard (server price still wins)
}

// A command on a market's lane. `at` is event-time (payload), used for deterministic seeding + rate windowing.
export type EngineCmd =
  | { kind: "lifecycle"; at: number; cmd: MarketCommand }
  | { kind: "mark"; at: number; bHint: number }
  | { kind: "order"; at: number; order: OrderCmd };

function seedMarket(marketId: string, matchId: string, cmd: EngineCmd): EngineMarket {
  // q seeded to 3 outcomes (1X2) in v1. ponytail: fixed 3; n-outcome sizing from the mark is a follow-up (ADR-026).
  return { lifecycle: initialMarket(marketId, matchId, cmd.at), bHint: B0_DEFAULT, q: [0, 0, 0], positions: {} };
}

/** Total apply (never throws): lifecycle → market machine (illegal parks); mark → re-anchor; order → risk+fill. */
export function engineApply(state: EngineMarket, cmd: EngineCmd): { state: EngineMarket; effects: readonly EngineEffect[] } {
  if (cmd.kind === "mark") {
    const bHint = Number.isFinite(cmd.bHint) ? Math.min(Math.max(cmd.bHint, B0_DEFAULT), B_MAX) : B0_DEFAULT; // bounded + NaN/Inf-safe re-anchor (ADR-022 [b0, 3·b0])
    // Auto-reopen (ADR-005 "next mark → REOPEN"): a HALTED market whose 10s halt window has elapsed reopens on
    // THIS mark. Deterministic (uses cmd.at) → replay reproduces the reopen. The new bHint applies on top, and
    // spreadAt() then decays 3×→1× over 60s from reopenAt. A mark before the window just re-anchors (stays HALTED).
    if (shouldReopen(state.lifecycle, cmd.at)) {
      const { state: lifecycle, effects } = transition(state.lifecycle, { trigger: "reopen", at: cmd.at });
      return { state: { ...state, lifecycle, bHint }, effects };
    }
    return { state: { ...state, bHint }, effects: [] };
  }
  if (cmd.kind === "order") return applyOrderCmd(state, cmd.order, cmd.at);
  try {
    const { state: lifecycle, effects } = transition(state.lifecycle, cmd.cmd);
    return { state: { ...state, lifecycle }, effects };
  } catch (e) {
    if (e instanceof IllegalTransitionError) return { state, effects: [] }; // park — deterministic on replay too
    throw e;
  }
}

// Order branch: delegate the risk+fill decision to the pure applyOrder (amm math stays out of here), then apply
// the q + position deltas and turn the result into emitted effects. A reject emits one typed reject, no state change.
function applyOrderCmd(state: EngineMarket, o: OrderCmd, at: number): { state: EngineMarket; effects: readonly EngineEffect[] } {
  const held = state.positions[o.user] ?? new Array<number>(state.q.length).fill(0);
  const res = applyOrder({
    side: o.side,
    outcome: o.outcome,
    size: o.size,
    q: state.q,
    // live b: the hazard-adjusted bHint (from cortex, ADR-022) thinned ONLY by the ADR-005 reopen decay
    // (spreadAt 3×→1× over 60s). Hazard is NOT re-applied here — it already lives in bHint. Floored vs a bad mark.
    b: state.bHint / Math.max(spreadAt(state.lifecycle, at), SPREAD_FLOOR),
    tradeable: canAcceptOrder(state.lifecycle),
    balance: o.balance,
    position: held[o.outcome] ?? 0,
    recentOrderTimes: o.recentOrderTimes,
    now: at, // event-time, never a wall clock
    limit: o.limit,
  });
  if (!res.ok) return { state, effects: [{ type: "reject", user: o.user, code: res.code }] };
  const q = [...state.q];
  q[o.outcome] += res.shareDelta;
  const nextPos = [...held];
  nextPos[o.outcome] = (held[o.outcome] ?? 0) + res.positionDelta;
  const effects: EngineEffect[] = [
    { type: "fill", user: o.user, outcome: o.outcome, side: o.side, price: res.fill.price, size: res.fill.size, cost: res.fill.cost, fee: res.fill.fee },
    { type: "position", user: o.user, outcome: o.outcome, qty: nextPos[o.outcome] },
    ...res.ledger.map((l) => ({ type: "ledger" as const, user: o.user, kind: l.kind, amount: l.amount })),
  ];
  return { state: { ...state, q, positions: { ...state.positions, [o.user]: nextPos } }, effects };
}
const engineReduce = (state: EngineMarket, cmd: EngineCmd): EngineMarket => engineApply(state, cmd).state;

export interface EngineLock {
  acquire(): Promise<boolean>;
  release(): Promise<void>;
}
export class EngineLeaseError extends Error {
  constructor() {
    super("engine lease NOT acquired — another engine process holds it; exiting (single-writer law)");
    this.name = "EngineLeaseError";
  }
}
// A submit is accepted (and returns a `durable` promise that resolves once the command is journaled, plus an
// `applied` promise that resolves with the effects THIS command produced once apply completes) or rejected with a
// typed reason. BACKPRESSURE = queue full (retry/redeliver). UNSERVEABLE = market quarantined. `applied` lets a
// synchronous caller (POST /orders, ADR-071) read its own fill/reject instead of a blind 202 — the effects are
// already computed by the deterministic reducer; this only surfaces them (no law change).
export type SubmitResult =
  | { accepted: true; durable: Promise<void>; applied: Promise<readonly EngineEffect[]> }
  | { accepted: false; reason: "BACKPRESSURE" | "UNSERVEABLE" };
export interface EngineMetrics {
  processed: number;
  backpressureRejects: number;
  maxDepth: number;
  unserveable: number; // markets quarantined after a recovery failure
  staleMarkAlerts: number; // HALTED markets whose pricing feed went stale (ADR-028)
}
export interface EngineDeps {
  store: JournalStore<EngineCmd, EngineMarket>;
  // n = journal seq (deterministic id source), at = event-time (ts_source). The adapter turns effects into
  // bus Envelopes with deterministic event_ids; a projection consumer writes DB + Redis idempotently (ADR-027).
  emit: (marketId: string, n: number, at: number, effects: readonly EngineEffect[]) => Promise<void> | void;
  lock?: EngineLock;
  maxQueueDepth?: number; // default 1000
  snapshotEvery?: number;
  onApplied?: (marketId: string, cmd: EngineCmd) => void; // observability hook (tracing/tests)
  onError?: (marketId: string, err: unknown) => void;
  onStaleMark?: (a: StaleAlert) => void; // enables the stale-mark watchdog when provided (ADR-028)
  staleMarkMs?: number; // stale threshold; default STALE_MARK_MS
  now?: () => number; // operational wall clock (injectable for tests); default Date.now
}

interface Lane {
  chain: Promise<void>;
  depth: number;
  matchId: string;
  state?: EngineMarket;
  dead: boolean; // set if recovery failed → refuse to serve this market
}

export class Engine {
  readonly metrics: EngineMetrics = { processed: 0, backpressureRejects: 0, maxDepth: 0, unserveable: 0, staleMarkAlerts: 0 };
  private readonly journal: Journal<EngineCmd, EngineMarket>;
  private readonly lanes = new Map<string, Lane>();
  private readonly maxDepth: number;
  private readonly now: () => number;
  private readonly watchdog?: MarkWatchdog;
  private watchdogTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly deps: EngineDeps) {
    this.maxDepth = deps.maxQueueDepth ?? 1000;
    this.now = deps.now ?? Date.now;
    if (deps.onStaleMark) {
      this.watchdog = new MarkWatchdog(deps.staleMarkMs ?? STALE_MARK_MS, (a) => {
        this.metrics.staleMarkAlerts++;
        deps.onStaleMark!(a);
      });
    }
    this.journal = new Journal<EngineCmd, EngineMarket>({
      store: deps.store,
      reduce: engineReduce,
      seed: (key, first) => seedMarket(key, key, first), // MUST match process's live seed exactly (see process)
      hash: hashState,
      snapshotEvery: deps.snapshotEvery,
    });
  }

  /** Operational stale-mark scan (ADR-028): alert HALTED markets whose pricing feed went stale. The `now` arg
   *  makes it deterministic for tests; the prod interval (startWatchdog) passes the wall clock. */
  checkStaleMarks(now?: number): StaleAlert[] {
    if (!this.watchdog) return [];
    const halted = [...this.lanes].filter(([, l]) => l.state?.lifecycle.status === "HALTED").map(([id]) => id);
    return this.watchdog.check(now ?? this.now(), halted);
  }

  /** Start the periodic stale-mark scan (prod). No-op without onStaleMark; unref'd so it never holds the process open. */
  startWatchdog(): void {
    if (!this.watchdog || this.watchdogTimer) return;
    const period = Math.max(1000, Math.floor((this.deps.staleMarkMs ?? STALE_MARK_MS) / 2));
    this.watchdogTimer = setInterval(() => this.checkStaleMarks(), period);
    this.watchdogTimer.unref?.();
  }

  /** Graceful stop: halt the watchdog timer and release the single-writer lease. */
  async stop(): Promise<void> {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = undefined;
    }
    await this.deps.lock?.release();
  }

  /** Acquire the single-writer lease before serving. Throws EngineLeaseError if another process holds it. */
  async start(): Promise<void> {
    if (this.deps.lock && !(await this.deps.lock.acquire())) throw new EngineLeaseError();
  }

  /** Enqueue a command on the market's serialized lane. Fire-and-forget; `durable` resolves once journaled. */
  submit(marketId: string, matchId: string, cmd: EngineCmd): SubmitResult {
    const lane = this.lane(marketId, matchId);
    if (lane.dead) return { accepted: false, reason: "UNSERVEABLE" }; // quarantined market (already alerted)
    if (lane.depth >= this.maxDepth) {
      this.metrics.backpressureRejects++;
      return { accepted: false, reason: "BACKPRESSURE" };
    }
    lane.depth++;
    this.metrics.maxDepth = Math.max(this.metrics.maxDepth, lane.depth);
    let resolveDurable!: () => void;
    let rejectDurable!: (e: unknown) => void;
    const durable = new Promise<void>((res, rej) => {
      resolveDurable = res;
      rejectDurable = rej;
    });
    let resolveApplied!: (e: readonly EngineEffect[]) => void;
    let rejectApplied!: (e: unknown) => void;
    const applied = new Promise<readonly EngineEffect[]>((res, rej) => {
      resolveApplied = res;
      rejectApplied = rej;
    });
    void applied.catch(() => {}); // observe it — most callers (the bus consumers) ignore `applied`; keeps a
    // command failure from surfacing as an unhandledRejection. A caller that awaits `applied` still sees the error.
    lane.chain = lane.chain
      .then(() => this.process(marketId, cmd, resolveDurable, resolveApplied))
      .catch((err) => {
        rejectDurable(err); // no-op if durable already resolved (append succeeded) — surfaces a pre-durability failure
        rejectApplied(err); // no-op if applied already resolved
        this.deps.onError?.(marketId, err);
      })
      .finally(() => {
        lane.depth--;
      });
    return { accepted: true, durable, applied };
  }

  /** Await all in-flight lanes (tests / graceful drain). */
  async drain(): Promise<void> {
    await Promise.all([...this.lanes.values()].map((l) => l.chain.catch(() => {})));
  }

  stateOf(marketId: string): EngineMarket | undefined {
    return this.lanes.get(marketId)?.state;
  }

  private lane(marketId: string, matchId: string): Lane {
    let lane = this.lanes.get(marketId);
    if (!lane) {
      // recovery is the head of the lane's chain; any command submitted now queues behind it (never dropped).
      lane = { chain: Promise.resolve(), depth: 0, matchId, state: undefined, dead: false };
      lane.chain = this.recoverLane(marketId, lane);
      this.lanes.set(marketId, lane);
    }
    return lane;
  }

  private async recoverLane(marketId: string, lane: Lane): Promise<void> {
    try {
      const rec = await this.journal.recover(marketId);
      lane.state = rec?.state; // undefined if nothing journaled yet → seeded on the first command
    } catch (err) {
      // FAIL SAFE: quarantine on ANY recovery failure — a JournalError (corrupt/gap) OR a transient store
      // error. Never fall through to a fresh seed: that would serve a silently-wrong state and pollute the
      // journal with a duplicate n=0. Refuse to serve + alert; metrics.unserveable drives the alarm.
      lane.dead = true;
      this.metrics.unserveable++;
      this.deps.onError?.(marketId, err);
    }
  }

  private async process(marketId: string, cmd: EngineCmd, onDurable: () => void, onEffects: (effects: readonly EngineEffect[]) => void): Promise<void> {
    const lane = this.lanes.get(marketId)!;
    if (lane.dead) {
      onDurable(); // quarantined → drop safely (already alerted); let the caller ack (redelivery would poison-loop)
      onEffects([]); // no effects on a quarantined lane — unblock a synchronous `applied` awaiter
      return;
    }
    const n = await this.journal.append(marketId, cmd); // JOURNAL before apply (journal-then-ack)
    onDurable(); // the command is now durable — the caller may ack its source (end-to-end journal-then-ack)
    const prev = lane.state ?? seedMarket(marketId, marketId, cmd); // seed IDENTICAL to the journal seed (marketId as matchId)
    const { state, effects } = engineApply(prev, cmd);
    lane.state = state; // apply
    onEffects(effects); // surface the applied effects to a synchronous submitter (after apply; the emit IO below still runs)
    if (cmd.kind === "mark") this.watchdog?.markSeen(marketId, this.now()); // watchdog: fresh pricing feed seen
    if (state.lifecycle.status !== "HALTED") this.watchdog?.clear(marketId); // re-arm once the market leaves HALTED
    await this.journal.maybeSnapshot(marketId, state, n);
    await this.deps.emit(marketId, n, cmd.at, effects); // emit (a failed emit is logged; at-least-once re-emit via outbox is a follow-up)
    this.metrics.processed++;
    this.deps.onApplied?.(marketId, cmd);
  }
}

// --- Redis single-writer lease (SET key val NX PX) + a renew loop; the operational clock (TTL) is not state ---
export class RedisLease implements EngineLock {
  private renew: ReturnType<typeof setInterval> | undefined;
  private readonly value = `${hostname()}-${process.pid}`;
  constructor(
    private readonly redis: Redis,
    private readonly key = "engine:lease",
    private readonly ttlMs = 30_000,
  ) {}
  async acquire(): Promise<boolean> {
    const ok = await this.redis.set(this.key, this.value, "PX", this.ttlMs, "NX");
    if (ok !== "OK") return false;
    // hold the lease; refresh at 1/3 the TTL. v1 uses a plain XX refresh — a fencing token / owner-checked Lua
    // renew (to survive a paused process past the TTL) is the documented upgrade path (ADR-025).
    this.renew = setInterval(() => void this.redis.set(this.key, this.value, "PX", this.ttlMs, "XX").catch(() => {}), Math.floor(this.ttlMs / 3));
    return true;
  }
  async release(): Promise<void> {
    if (this.renew) clearInterval(this.renew);
    await this.redis.del(this.key).catch(() => {});
  }
}

// --- production wiring: bus subscriptions → per-market lanes. Framework-free; only bus + journal + redis. ---
export async function startEngine(redis?: Redis): Promise<Engine | null> {
  if (!redis) return null; // no redis → engine cannot journal/lease; caller wires it (kept out of unit scope)
  const bus = await createBus();
  const store = new RedisJournalStore<EngineCmd, EngineMarket>(redis);
  const engine = new Engine({
    store,
    lock: new RedisLease(redis),
    emit: async (marketId, n, at, effects) => {
      // map effects → Envelopes (deterministic event_ids) and publish to fills/positions/orders/credits/settlement
      // for the projection consumer (ADR-027). ts_ingest is wall-time (adapter IO, not the deterministic reducer).
      const tsSource = new Date(at).toISOString();
      const tsIngest = new Date().toISOString();
      for (const { topic, env } of effectsToEnvelopes(marketId, n, effects, tsSource, tsIngest)) {
        await bus.publish(topic, env.match_id, env);
      }
    },
    onError: (marketId, err) => console.error(JSON.stringify({ evt: "engine.error", marketId, msg: String((err as Error)?.message ?? err) })),
    onStaleMark: (a) => console.warn(JSON.stringify({ evt: "engine.stale_mark", ...a })), // ADR-028: wedged pricing feed
  });
  await engine.start(); // throws EngineLeaseError (exits loudly) if a second engine is already running
  engine.startWatchdog(); // ADR-028: alert HALTED markets whose marks go stale (>10s)

  const marketId = (env: Envelope) => env.match_id; // one 1x2 market per match for now (marketId === matchId)
  // ack the bus only AFTER the command is durably journaled; redeliver on backpressure; drop on quarantine.
  const deliver = async (env: Envelope, cmd: EngineCmd): Promise<void> => {
    const r = engine.submit(marketId(env), env.match_id, cmd);
    if (!r.accepted) {
      if (r.reason === "BACKPRESSURE") throw new Error(`engine backpressure [${env.match_id}]`); // nack → bus redelivers
      return; // UNSERVEABLE: quarantined + already alerted; ack + drop (redelivery would poison-loop)
    }
    await r.durable; // end-to-end journal-then-ack: do not ack the source until the command is durable
  };
  await bus.consume(TOPICS.matchEvents, "engine", async (env) => {
    const cmd = fromEnvelope(env);
    if (cmd) await deliver(env, { kind: "lifecycle", at: cmd.at, cmd });
  });
  await bus.consume(TOPICS.pricesMarks, "engine", async (env) => {
    const p = env.payload as { b_hint?: number };
    const at = Date.parse(env.ts_source);
    if (Number.isNaN(at)) return; // drop a corrupt-timestamp mark (mirror fromEnvelope) — never stamp event-time 0
    await deliver(env, { kind: "mark", at, bHint: p.b_hint ?? B0_DEFAULT }); // bHint already carries hazard (ADR-022)
  });
  return engine;
}
