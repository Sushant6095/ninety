// The ONLY place that calls TxLINE (CLAUDE.md law). Consumers: worker-ingest, worker-jobs (proofs), replayer.
// Auth flow (TXLINE-MAP §0): guest JWT → on-chain subscribe → sign "{txSig}:{leagues}:{jwt}" → activate.
// Every data request carries BOTH headers: Authorization: Bearer {jwt} + X-Api-Token: {apiToken}.
import { NETWORKS, assertOriginMatchesCluster, type Cluster } from "./network";
import { z } from "zod";
import { ScoresSnapshot, ScoresUpdates, ScoreEvent, StatValidation } from "./scores";
import { OddsSnapshot, OddsUpdates, OddsTick } from "./odds";
import { FixturesSnapshot } from "./fixtures";
import { goalsFromScore, STAT_KEY_HOME_GOALS, STAT_KEY_AWAY_GOALS } from "./statkeys";

/** The Action value on the score record that marks a match complete — settlement proves goals from THIS record only. */
export const GAME_FINALISED_ACTION = "game_finalised";

/** HOME=1 · DRAW=2 · AWAY=3 — matches the on-chain settle_market `result` encoding + txoracle predicate mapping. */
export function resultFromGoals(home: number, away: number): 1 | 2 | 3 {
  return home > away ? 1 : home < away ? 3 : 2;
}

export interface SettlementProof {
  fixtureId: number;
  seq: number;
  home: number;
  away: number;
  result: 1 | 2 | 3; // from TOTAL GOALS
  /**
   * true when home === away. A level total-goals score is AMBIGUOUS: a genuine draw OR a penalty-shootout win
   * (ADR-037 Q3). Callers settling a KNOCKOUT must NOT trust result===2 (DRAW) while this is true — hold until the
   * game_finalised decision/winner stat is known. Group-stage draws are genuine; the caller supplies the stage.
   */
  levelScore: boolean;
  proof: StatValidation;
}

// Consumers import the client + all wire schemas/types from the package entry.
export * from "./scores";
export * from "./odds";
export * from "./fixtures";
export * from "./statkeys";
export * from "./network";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface StreamOptions {
  /** Fired when the seq field jumps (missed events) — the consumer should recover via a snapshot. */
  onGap?: (prevSeq: number, seq: number) => void;
  /** Fired on any non-event frame (SSE comment / keepalive, e.g. bare `{Ts}`) — a liveness signal so a
   *  heartbeat watchdog can tell "alive but quiet" apart from a real stall. */
  onHeartbeat?: () => void;
  /** Abort the stream. */
  signal?: AbortSignal;
}

/** Builds + sends the on-chain txoracle.subscribe(level, weeks) tx (via packages/chain, the only place
 *  allowed to build Solana txs) and returns the confirmed signature. Injected so the client stays
 *  transport-agnostic and never imports @solana/web3.js itself. */
export interface Subscriber {
  subscribe(input: { level: number; weeks: number; cluster: Cluster }): Promise<string>;
}

/** Signs the activation message with the subscribing wallet (ed25519). */
export interface MessageSigner {
  publicKey: string;
  sign(message: string): Promise<string>;
}

export interface TxLineClientOptions {
  cluster?: Cluster; // default: SOLANA_CLUSTER env or "devnet"
  apiOrigin?: string; // default: the cluster's registered origin (TXLINE_BASE_URL only if it matches)
  serviceLevel?: number; // free WC tier: devnet SL1 (60s delay), mainnet SL12 (real-time)
  weeks?: number; // subscription length
  leagues?: number[]; // numeric league ids; [] = standard bundle (signed into the activation message)
  tokenTtlMs?: number; // proactive re-auth window (default ~50 min)
  fetch?: FetchLike; // default: global fetch
  subscriber: Subscriber;
  signer: MessageSigner;
}

interface Session {
  jwt: string;
  apiToken: string;
  obtainedAt: number;
}

const DEFAULT_TTL_MS = 50 * 60_000;

export class TxLineClient {
  private readonly cluster: Cluster;
  private readonly apiOrigin: string;
  private readonly serviceLevel: number;
  private readonly weeks: number;
  private readonly leagues: number[];
  private readonly tokenTtlMs: number;
  private readonly fetchImpl: FetchLike;
  private readonly subscriber: Subscriber;
  private readonly signer: MessageSigner;
  private session: Session | null = null;
  private inflight: Promise<Session> | null = null; // coalesce concurrent handshakes (subscribe is an on-chain tx — never do it twice)

  constructor(opts: TxLineClientOptions) {
    this.cluster = opts.cluster ?? (process.env.SOLANA_CLUSTER as Cluster | undefined) ?? "devnet";
    this.apiOrigin = (opts.apiOrigin ?? process.env.TXLINE_BASE_URL ?? NETWORKS[this.cluster].apiOrigin).replace(/\/+$/, "");
    assertOriginMatchesCluster(this.apiOrigin, this.cluster); // fail fast: never mix networks
    this.serviceLevel = opts.serviceLevel ?? (this.cluster === "devnet" ? 1 : 12);
    this.weeks = opts.weeks ?? 4;
    this.leagues = opts.leagues ?? [];
    this.tokenTtlMs = opts.tokenTtlMs ?? DEFAULT_TTL_MS;
    const f = opts.fetch ?? globalThis.fetch;
    if (!f) throw new Error("TxLINE: no fetch available — pass opts.fetch");
    this.fetchImpl = f;
    this.subscriber = opts.subscriber;
    this.signer = opts.signer;
  }

  // --- auth handshake (cached, coalesced) ---
  async authenticate(): Promise<Session> {
    if (this.session && !this.isExpired(this.session)) return this.session;
    if (this.inflight) return this.inflight;
    this.inflight = this.handshake();
    try {
      this.session = await this.inflight;
      return this.session;
    } finally {
      this.inflight = null;
    }
  }

  /** Force a fresh handshake (e.g. after a 401). */
  async refresh(): Promise<Session> {
    this.session = null;
    return this.authenticate();
  }

  private isExpired(s: Session): boolean {
    return Date.now() - s.obtainedAt >= this.tokenTtlMs;
  }

  private async handshake(): Promise<Session> {
    const jwt = await this.guestStart();
    const txSig = await this.subscriber.subscribe({ level: this.serviceLevel, weeks: this.weeks, cluster: this.cluster });
    const message = `${txSig}:${this.leagues.join(",")}:${jwt}`; // "{txSig}:{leagues}:{jwt}"
    const signature = await this.signer.sign(message);
    const apiToken = await this.activate({ txSig, jwt, signature });
    return { jwt, apiToken, obtainedAt: Date.now() };
  }

  private async guestStart(): Promise<string> {
    const res = await this.fetchImpl(`${this.apiOrigin}/auth/guest/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    const body = (await this.readJson(res, "auth/guest/start")) as { jwt?: string; token?: string; access_token?: string };
    const jwt = body.jwt ?? body.token ?? body.access_token;
    if (typeof jwt !== "string" || !jwt) throw new Error("TxLINE auth/guest/start returned no jwt");
    return jwt;
  }

  private async activate(input: { txSig: string; jwt: string; signature: string }): Promise<string> {
    const res = await this.fetchImpl(`${this.apiOrigin}/api/token/activate`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${input.jwt}` },
      body: JSON.stringify({ txSig: input.txSig, walletSignature: input.signature, leagues: this.leagues }),
    });
    // Reality (ADR-015): /api/token/activate returns the apiToken as a BARE STRING, not JSON.
    const text = await res.text();
    if (!res.ok) throw new Error(`TxLINE token/activate failed: ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
    let apiToken: string | undefined;
    try {
      const j = JSON.parse(text) as string | { token?: string; apiToken?: string; api_token?: string };
      apiToken = typeof j === "string" ? j : (j.token ?? j.apiToken ?? j.api_token);
    } catch {
      apiToken = text.trim(); // bare-string token
    }
    if (!apiToken) throw new Error("TxLINE token/activate returned no apiToken");
    return apiToken;
  }

  // --- authenticated data requests: BOTH headers, one refresh-and-retry on 401/403 ---
  async get<T = unknown>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const url = this.buildUrl(path, query);
    let session = await this.authenticate();
    let res = await this.fetchImpl(url, { method: "GET", headers: this.authHeaders(session) });
    if (res.status === 401 || res.status === 403) {
      session = await this.refresh();
      res = await this.fetchImpl(url, { method: "GET", headers: this.authHeaders(session) });
    }
    return (await this.readJson(res, path)) as T;
  }

  private authHeaders(s: Session): Record<string, string> {
    return { authorization: `Bearer ${s.jwt}`, "x-api-token": s.apiToken };
  }

  private async getParsed<T>(path: string, schema: z.ZodType<T>, query?: Record<string, string | number | undefined>): Promise<T> {
    return schema.parse(await this.get(path, query));
  }

  // --- typed endpoint wrappers (TXLINE-MAP §1) — every one returns a parsed schema type ---

  /** S1 — scores snapshot for a fixture. asOf → historical point-in-time. */
  scoresSnapshot(fixtureId: string, asOf?: string): Promise<ScoresSnapshot> {
    return this.getParsed(`/api/scores/snapshot/${encodeURIComponent(fixtureId)}`, ScoresSnapshot, asOf ? { asOf } : undefined);
  }

  /** S2 — historical score events in a 5-minute bucket. */
  scoresUpdates(epochDay: number, hourOfDay: number, interval: number): Promise<ScoresUpdates> {
    return this.getParsed(`/api/scores/updates/${epochDay}/${hourOfDay}/${interval}`, ScoresUpdates);
  }

  /** S3 — live score events (SSE). Yields parsed events; onGap fires on a seq gap. */
  scoresStream(opts?: StreamOptions): AsyncGenerator<ScoreEvent> {
    return this.stream(`/api/scores/stream`, ScoreEvent, undefined, opts);
  }

  /** S4 — Merkle proof bundle for a stat (feeds on-chain validateStat, §3). */
  statValidation(fixtureId: string, seq: number, statKey: number, statKey2?: number): Promise<StatValidation> {
    // admin-confirmed wire form (ADR-037): ?fixtureId&seq&statKeys=1,2 — a single comma-joined `statKeys` param.
    const statKeys = [statKey, statKey2].filter((k): k is number => k !== undefined).join(",");
    const query: Record<string, string | number | undefined> = { fixtureId, seq, statKeys };
    return this.getParsed(`/api/scores/stat-validation`, StatValidation, query);
  }

  /**
   * Settlement proof bundle for a FINISHED fixture (ADR-037 recipe). Finds the score record whose
   * Action === "game_finalised", then proves statKey 1 (home total goals) + statKey 2 (away total goals) from THAT
   * record's Seq — never a mid-match snapshot. Returns null if the fixture is not yet finalised.
   * ⚠ `result` is derived from TOTAL GOALS, so it is DRAW for a penalty-shootout win — do NOT settle knockouts on it
   * until the game_finalised decision/winner stat is confirmed (ADR-037 open item).
   */
  async settlementProof(fixtureId: string): Promise<SettlementProof | null> {
    const states = await this.scoresSnapshot(fixtureId);
    // ADR-037 Q5: game_finalised is read from the SNAPSHOT (S1). If TxLINE emits it stream-only, this is null for a
    // finished fixture — the CALLER (saga) MUST alert on null-after-FT, never wait silently (ADR-035 proof-not-found
    // path). TODO(Q5): if confirmed stream-only, add an S2 /scores/updates fallback here.
    const finals = states.filter((s) => s.Action === GAME_FINALISED_ACTION);
    if (finals.length === 0) return null; // not finalised yet (caller alerts if this persists past FT)
    // The LATEST game_finalised record wins — a VAR correction may re-finalise at a higher Seq (ADR-037 Q2).
    const final = finals.reduce((a, b) => ((b.Seq ?? -1) > (a.Seq ?? -1) ? b : a));
    if (final.Seq === undefined) throw new Error(`game_finalised record for fixture ${fixtureId} has no Seq`);
    if (final.FixtureId !== Number(fixtureId)) throw new Error(`game_finalised fixtureId ${final.FixtureId} != requested ${fixtureId}`);
    // ADR-037 Q8: a shut-out side must still have an anchored 0-goals leaf. If either side's Total.Goals is absent,
    // throw LOUDLY (market flagged unsettleable) rather than settle on a partial score. TODO(Q8): once the V2 two-stat
    // response shape is confirmed, also assert the returned bundle carries a proof leaf for BOTH statKey 1 and 2.
    const goals = goalsFromScore(final.Score);
    if (!goals) throw new Error(`game_finalised record for fixture ${fixtureId} missing a side's Score.*.Total.Goals — unsettleable`);
    const proof = await this.statValidation(fixtureId, final.Seq, STAT_KEY_HOME_GOALS, STAT_KEY_AWAY_GOALS);
    return {
      fixtureId: final.FixtureId,
      seq: final.Seq,
      home: goals.home,
      away: goals.away,
      result: resultFromGoals(goals.home, goals.away),
      levelScore: goals.home === goals.away, // ADR-037 Q3: knockout callers must not trust DRAW while true
      proof,
    };
  }

  /** F1 — fixtures snapshot (verified live: /api/fixtures/snapshot). */
  fixtures(query?: Record<string, string | number | undefined>): Promise<FixturesSnapshot> {
    return this.getParsed(`/api/fixtures/snapshot`, FixturesSnapshot, query);
  }

  /** O1 — odds snapshot for a fixture (verified live). */
  oddsSnapshot(fixtureId: string, asOf?: string): Promise<OddsSnapshot> {
    return this.getParsed(`/api/odds/snapshot/${encodeURIComponent(fixtureId)}`, OddsSnapshot, asOf ? { asOf } : undefined);
  }

  /** O2 — historical odds ticks in a 5-minute bucket (verified live). */
  oddsUpdates(epochDay: number, hourOfDay: number, interval: number): Promise<OddsUpdates> {
    return this.getParsed(`/api/odds/updates/${epochDay}/${hourOfDay}/${interval}`, OddsUpdates);
  }

  /** O3 — live StablePrice ticks (SSE). */
  oddsStream(opts?: StreamOptions): AsyncGenerator<OddsTick> {
    return this.stream(`/api/odds/stream`, OddsTick, undefined, opts);
  }

  // SSE reader: authenticated GET, parses each frame's `data:` payload with `schema`, yields typed events.
  private async *stream<T>(
    path: string,
    schema: z.ZodType<T>,
    query?: Record<string, string | number | undefined>,
    opts?: StreamOptions,
  ): AsyncGenerator<T> {
    const url = this.buildUrl(path, query);
    const session = await this.authenticate();
    const res = await this.fetchImpl(url, {
      method: "GET",
      headers: { ...this.authHeaders(session), accept: "text/event-stream" },
      signal: opts?.signal,
    });
    if (!res.ok || !res.body) throw new Error(`TxLINE ${path} stream failed: ${res.status} ${res.statusText}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let lastSeq: number | undefined;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buf.indexOf("\n\n")) >= 0) {
          const frame = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          const data = sseData(frame);
          if (data === null) {
            opts?.onHeartbeat?.(); // comment / no-data frame = liveness
            continue;
          }
          let raw: unknown;
          try {
            raw = JSON.parse(data);
          } catch {
            opts?.onHeartbeat?.();
            continue;
          }
          // The live scores stream interleaves keepalive frames (e.g. bare `{Ts}`) with real events;
          // skip anything that isn't a valid event rather than throwing (never quote blind).
          const result = schema.safeParse(raw);
          if (!result.success) {
            opts?.onHeartbeat?.(); // keepalive frame = liveness
            continue;
          }
          const event = result.data;
          const seq = (event as { Seq?: unknown; seq?: unknown }).Seq ?? (event as { seq?: unknown }).seq;
          if (typeof seq === "number") {
            if (opts?.onGap && lastSeq !== undefined && seq > lastSeq + 1) opts.onGap(lastSeq, seq);
            lastSeq = seq;
          }
          yield event;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const url = new URL(path, this.apiOrigin);
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    return url.toString();
  }

  private async readJson(res: Response, ctx: string): Promise<unknown> {
    const text = await res.text();
    if (!res.ok) throw new Error(`TxLINE ${ctx} failed: ${res.status} ${res.statusText} ${text.slice(0, 300)}`);
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`TxLINE ${ctx} returned non-JSON: ${text.slice(0, 200)}`);
    }
  }
}

/** Extract the joined `data:` payload from an SSE frame; null for comment/heartbeat frames. */
function sseData(frame: string): string | null {
  const data = frame
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).replace(/^ /, ""))
    .join("\n");
  return data.length > 0 ? data : null;
}
