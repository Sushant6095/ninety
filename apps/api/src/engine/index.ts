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
import { transition, initialMarket, fromEnvelope, IllegalTransitionError, type MarketState, type MarketEffect, type MarketCommand } from "./market";

const B0_DEFAULT = 300; // base LMSR liquidity until a mark re-anchors it

// The full per-market state the engine owns: the lifecycle machine + the AMM anchor tethered from prices.marks.
export interface EngineMarket {
  lifecycle: MarketState;
  bHint: number; // AMM liquidity b(t), re-anchored from cortex marks
  spread: number; // current spread multiplier
}

// A command on a market's lane. `at` is event-time (payload), used for deterministic seeding.
export type EngineCmd =
  | { kind: "lifecycle"; at: number; cmd: MarketCommand }
  | { kind: "mark"; at: number; bHint: number; spread: number };

function seedMarket(marketId: string, matchId: string, cmd: EngineCmd): EngineMarket {
  return { lifecycle: initialMarket(marketId, matchId, cmd.at), bHint: B0_DEFAULT, spread: 1 };
}

/** Total apply (never throws): lifecycle → market machine (illegal parks); mark → re-anchor. Returns effects. */
export function engineApply(state: EngineMarket, cmd: EngineCmd): { state: EngineMarket; effects: readonly MarketEffect[] } {
  if (cmd.kind === "mark") {
    return { state: { ...state, bHint: cmd.bHint, spread: cmd.spread }, effects: [] };
  }
  try {
    const { state: lifecycle, effects } = transition(state.lifecycle, cmd.cmd);
    return { state: { ...state, lifecycle }, effects };
  } catch (e) {
    if (e instanceof IllegalTransitionError) return { state, effects: [] }; // park — deterministic on replay too
    throw e;
  }
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
// A submit is accepted (and returns a `durable` promise that resolves once the command is journaled) or
// rejected with a typed reason. BACKPRESSURE = queue full (retry/redeliver). UNSERVEABLE = market quarantined.
export type SubmitResult = { accepted: true; durable: Promise<void> } | { accepted: false; reason: "BACKPRESSURE" | "UNSERVEABLE" };
export interface EngineMetrics {
  processed: number;
  backpressureRejects: number;
  maxDepth: number;
  unserveable: number; // markets quarantined after a recovery failure
}
export interface EngineDeps {
  store: JournalStore<EngineCmd, EngineMarket>;
  emit: (marketId: string, effects: readonly MarketEffect[]) => Promise<void> | void;
  lock?: EngineLock;
  maxQueueDepth?: number; // default 1000
  snapshotEvery?: number;
  onApplied?: (marketId: string, cmd: EngineCmd) => void; // observability hook (tracing/tests)
  onError?: (marketId: string, err: unknown) => void;
}

interface Lane {
  chain: Promise<void>;
  depth: number;
  matchId: string;
  state?: EngineMarket;
  dead: boolean; // set if recovery failed → refuse to serve this market
}

export class Engine {
  readonly metrics: EngineMetrics = { processed: 0, backpressureRejects: 0, maxDepth: 0, unserveable: 0 };
  private readonly journal: Journal<EngineCmd, EngineMarket>;
  private readonly lanes = new Map<string, Lane>();
  private readonly maxDepth: number;

  constructor(private readonly deps: EngineDeps) {
    this.maxDepth = deps.maxQueueDepth ?? 1000;
    this.journal = new Journal<EngineCmd, EngineMarket>({
      store: deps.store,
      reduce: engineReduce,
      seed: (key, first) => seedMarket(key, key, first), // MUST match process's live seed exactly (see process)
      hash: hashState,
      snapshotEvery: deps.snapshotEvery,
    });
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
    lane.chain = lane.chain
      .then(() => this.process(marketId, cmd, resolveDurable))
      .catch((err) => {
        rejectDurable(err); // no-op if durable already resolved (append succeeded) — surfaces a pre-durability failure
        this.deps.onError?.(marketId, err);
      })
      .finally(() => {
        lane.depth--;
      });
    return { accepted: true, durable };
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

  private async process(marketId: string, cmd: EngineCmd, onDurable: () => void): Promise<void> {
    const lane = this.lanes.get(marketId)!;
    if (lane.dead) {
      onDurable(); // quarantined → drop safely (already alerted); let the caller ack (redelivery would poison-loop)
      return;
    }
    const n = await this.journal.append(marketId, cmd); // JOURNAL before apply (journal-then-ack)
    onDurable(); // the command is now durable — the caller may ack its source (end-to-end journal-then-ack)
    const prev = lane.state ?? seedMarket(marketId, marketId, cmd); // seed IDENTICAL to the journal seed (marketId as matchId)
    const { state, effects } = engineApply(prev, cmd);
    lane.state = state; // apply
    await this.journal.maybeSnapshot(marketId, state, n);
    await this.deps.emit(marketId, effects); // emit (a failed emit is logged; at-least-once re-emit via outbox is a follow-up)
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
    emit: async (marketId, effects) => {
      // publish each lifecycle effect + resulting fills/positions to the bus (adapter; topic mapping TBD)
      void marketId;
      void effects;
    },
    onError: (marketId, err) => console.error(JSON.stringify({ evt: "engine.error", marketId, msg: String((err as Error)?.message ?? err) })),
  });
  await engine.start(); // throws EngineLeaseError (exits loudly) if a second engine is already running

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
    const p = env.payload as { b_hint?: number; hazard?: number };
    const at = Date.parse(env.ts_source);
    await deliver(env, { kind: "mark", at: Number.isNaN(at) ? 0 : at, bHint: p.b_hint ?? B0_DEFAULT, spread: 1 + (p.hazard ?? 0) });
  });
  return engine;
}
