// Append-only durable journal for the single-writer engine (ADR-025). The "engine journal" is the named
// raw-Redis exception to the bus-only architecture law. Discipline: JOURNAL-THEN-ACK — a command is made
// durable BEFORE it is applied, so a crash between append and apply is recovered by replay and the command
// is applied EXACTLY ONCE. A snapshot every N events bounds replay; recover() = latest snapshot + replay of
// the contiguous tail. A per-command monotone seq `n` makes gap detection exact: a journal trimmed below the
// snapshot is a HARD error, never a silent wrong state. hashState() gives deterministic equivalence checks.
//
// Storage is injected (JournalStore) so the reducer logic is pure and property-testable without Redis; the
// only clock read anywhere is the caller's event-time. Nothing here does LMSR math or imports http/ws.
import { createHash } from "node:crypto";
import type { Redis } from "ioredis"; // type-only: the Redis client is injected, no runtime redis import here

export interface JournalEntry<C> {
  n: number; // per-key monotone command index (0,1,2,…) — the source of truth for gap detection
  cmd: C;
}
export interface Snapshot<S> {
  n: number; // the last command index this snapshot has applied
  state: S;
  hash: string; // hashState(state) at snapshot time — verified on recover to catch a torn/corrupt snapshot
}

export class JournalError extends Error {
  constructor(
    readonly code: "gap" | "corrupt-snapshot",
    readonly key: string,
    detail: string,
  ) {
    super(`journal ${code} [${key}]: ${detail}`);
    this.name = "JournalError";
  }
}

/** Storage port. append is ordered per key; entriesAfter returns entries with n > afterN in ascending n. */
export interface JournalStore<C, S> {
  append(key: string, entry: JournalEntry<C>): Promise<void>;
  entriesAfter(key: string, afterN: number): Promise<JournalEntry<C>[]>;
  putSnapshot(key: string, snap: Snapshot<S>): Promise<void>; // MUST be a single atomic write (no torn state)
  getSnapshot(key: string): Promise<Snapshot<S> | null>;
  trimBelow(key: string, n: number): Promise<void>; // drop entries with entry.n < n (keep the tail ≥ n)
}

/** Deterministic content hash (stable key order, no wall clock) — used for recover-vs-live equivalence. */
export function hashState(state: unknown): string {
  return createHash("sha256").update(stableStringify(state)).digest("hex");
}
function stableStringify(x: unknown): string {
  if (x === null || typeof x !== "object") return JSON.stringify(x) ?? "null";
  if (Array.isArray(x)) return "[" + x.map(stableStringify).join(",") + "]";
  const obj = x as Record<string, unknown>;
  // Skip undefined-valued keys so an in-memory state ({ haltedAt: undefined }) and a JSON-round-tripped one
  // (key dropped by JSON.stringify) hash identically — recover-vs-live equivalence must hold across stores.
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

export interface JournalConfig<C, S> {
  store: JournalStore<C, S>;
  reduce: (state: S, cmd: C) => S; // MUST be total (never throw — park illegal internally) so replay === live
  seed: (key: string, first: C) => S; // initial state, no command applied yet; time from the first command
  hash?: (state: S) => string;
  snapshotEvery?: number; // default 10_000
}

export class Journal<C, S> {
  private readonly store: JournalStore<C, S>;
  private readonly reduce: (state: S, cmd: C) => S;
  private readonly seed: (key: string, first: C) => S;
  private readonly hashFn: (state: S) => string;
  private readonly every: number;
  private readonly nextN = new Map<string, number>();
  private readonly sinceSnap = new Map<string, number>();

  constructor(cfg: JournalConfig<C, S>) {
    this.store = cfg.store;
    this.reduce = cfg.reduce;
    this.seed = cfg.seed;
    this.hashFn = cfg.hash ?? hashState;
    this.every = cfg.snapshotEvery ?? 10_000;
  }

  hash(state: S): string {
    return this.hashFn(state);
  }

  /** Durably append a command BEFORE it is applied. Returns its monotone seq n. (journal-then-ack) */
  async append(key: string, cmd: C): Promise<number> {
    const n = this.nextN.get(key) ?? 0;
    await this.store.append(key, { n, cmd });
    this.nextN.set(key, n + 1);
    return n;
  }

  /** Call after apply with the resulting state + the seq it was applied at. Snapshots every N events. */
  async maybeSnapshot(key: string, state: S, n: number): Promise<boolean> {
    const c = (this.sinceSnap.get(key) ?? 0) + 1;
    if (c < this.every) {
      this.sinceSnap.set(key, c);
      return false;
    }
    await this.store.putSnapshot(key, { n, state, hash: this.hash(state) });
    await this.store.trimBelow(key, n); // everything ≤ n is captured by the snapshot; keep the tail ≥ n
    this.sinceSnap.set(key, 0);
    return true;
  }

  /** Recover = latest snapshot + replay of the contiguous tail. Throws JournalError on gap/corruption. */
  async recover(key: string): Promise<{ state: S; n: number } | null> {
    const snap = await this.store.getSnapshot(key);
    let state: S | null = null;
    let fromN = -1;
    if (snap) {
      if (this.hash(snap.state) !== snap.hash) {
        throw new JournalError("corrupt-snapshot", key, `stored hash ≠ recomputed at n=${snap.n} (torn/corrupt snapshot)`);
      }
      state = snap.state;
      fromN = snap.n;
    }
    const tail = await this.store.entriesAfter(key, fromN);
    if (!snap && tail.length === 0) return null; // nothing journaled for this key
    if (!snap) state = this.seed(key, tail[0].cmd);
    let expect = fromN + 1;
    for (const e of tail) {
      if (e.n !== expect) {
        // a hole in the monotone tail ⇒ entries were trimmed below the snapshot (or the head was lost). Never
        // reconstruct from a partial history — refuse loudly so the caller can quarantine + alert.
        throw new JournalError("gap", key, `expected n=${expect}, got n=${e.n} (journal trimmed below snapshot?)`);
      }
      state = this.reduce(state as S, e.cmd);
      expect++;
    }
    this.nextN.set(key, expect);
    this.sinceSnap.set(key, tail.length); // events accrued since the last snapshot (bounded < snapshotEvery)
    return { state: state as S, n: expect - 1 };
  }
}

// --- in-memory store (property + edge tests; deterministic, no Redis) ---
export class MemJournalStore<C, S> implements JournalStore<C, S> {
  private readonly log = new Map<string, JournalEntry<C>[]>();
  private readonly snaps = new Map<string, Snapshot<S>>();

  async append(key: string, entry: JournalEntry<C>): Promise<void> {
    const l = this.log.get(key) ?? [];
    l.push(structuredClone(entry));
    this.log.set(key, l);
  }
  async entriesAfter(key: string, afterN: number): Promise<JournalEntry<C>[]> {
    return (this.log.get(key) ?? []).filter((e) => e.n > afterN).map((e) => structuredClone(e));
  }
  async putSnapshot(key: string, snap: Snapshot<S>): Promise<void> {
    this.snaps.set(key, structuredClone(snap)); // clone → durable copy, no aliasing of live state
  }
  async getSnapshot(key: string): Promise<Snapshot<S> | null> {
    const s = this.snaps.get(key);
    return s ? structuredClone(s) : null;
  }
  async trimBelow(key: string, n: number): Promise<void> {
    const l = this.log.get(key);
    if (l) this.log.set(key, l.filter((e) => e.n >= n));
  }
  // --- test-only fault injection ---
  _dropEntries(key: string, pred: (e: JournalEntry<C>) => boolean): void {
    const l = this.log.get(key);
    if (l) this.log.set(key, l.filter((e) => !pred(e)));
  }
  _corruptSnapshotState(key: string, mutate: (s: S) => void): void {
    const s = this.snaps.get(key);
    if (s) mutate(s.state); // change state without updating s.hash → simulates a torn/corrupt snapshot
  }
}

// --- Redis store (production; the client is injected, so this file needs no runtime redis import) ---
export class RedisJournalStore<C, S> implements JournalStore<C, S> {
  constructor(private readonly redis: Redis) {}
  private jkey(key: string): string {
    return `journal:${key}`; // redis stream of commands
  }
  private skey(key: string): string {
    return `journal:snap:${key}`; // string; a single SET is atomic → no torn snapshot
  }
  async append(key: string, entry: JournalEntry<C>): Promise<void> {
    await this.redis.xadd(this.jkey(key), "*", "n", String(entry.n), "cmd", JSON.stringify(entry.cmd));
  }
  async entriesAfter(key: string, afterN: number): Promise<JournalEntry<C>[]> {
    const raw = (await this.redis.xrange(this.jkey(key), "-", "+")) as [string, string[]][];
    return raw
      .map(([, fields]) => decodeEntry<C>(fields))
      .filter((e): e is JournalEntry<C> => e !== null && e.n > afterN)
      .sort((a, b) => a.n - b.n);
  }
  async putSnapshot(key: string, snap: Snapshot<S>): Promise<void> {
    await this.redis.set(this.skey(key), JSON.stringify(snap));
  }
  async getSnapshot(key: string): Promise<Snapshot<S> | null> {
    const s = await this.redis.get(this.skey(key));
    return s ? (JSON.parse(s) as Snapshot<S>) : null;
  }
  async trimBelow(key: string, n: number): Promise<void> {
    const raw = (await this.redis.xrange(this.jkey(key), "-", "+")) as [string, string[]][];
    const toDel = raw.filter(([, f]) => (decodeEntry<C>(f)?.n ?? Infinity) < n).map(([id]) => id);
    if (toDel.length) await this.redis.xdel(this.jkey(key), ...toDel);
  }
}
function decodeEntry<C>(fields: string[]): JournalEntry<C> | null {
  const ni = fields.indexOf("n");
  const ci = fields.indexOf("cmd");
  if (ni < 0 || ci < 0) return null;
  try {
    return { n: Number(fields[ni + 1]), cmd: JSON.parse(fields[ci + 1]) as C };
  } catch {
    return null;
  }
}
