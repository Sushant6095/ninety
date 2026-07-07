// The ONLY place that calls TxLINE (CLAUDE.md law). Consumers: worker-ingest, worker-jobs (proofs), replayer.
// Auth flow (TXLINE-MAP §0): guest JWT → on-chain subscribe → sign "{txSig}:{leagues}:{jwt}" → activate.
// Every data request carries BOTH headers: Authorization: Bearer {jwt} + X-Api-Token: {apiToken}.
import { NETWORKS, assertOriginMatchesCluster, type Cluster } from "./network";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

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
  serviceLevel?: number; // WC26 free tier: 12
  weeks?: number; // subscription length
  leagues?: string[]; // leagues covered by the subscription (signed into the activation message)
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
  private readonly leagues: string[];
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
    this.serviceLevel = opts.serviceLevel ?? 12;
    this.weeks = opts.weeks ?? 4;
    this.leagues = opts.leagues ?? ["wc26"];
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
      body: JSON.stringify({
        txSig: input.txSig,
        leagues: this.leagues,
        signature: input.signature,
        wallet: this.signer.publicKey,
        cluster: this.cluster,
      }),
    });
    const body = (await this.readJson(res, "token/activate")) as { apiToken?: string; token?: string; api_token?: string };
    const apiToken = body.apiToken ?? body.token ?? body.api_token;
    if (typeof apiToken !== "string" || !apiToken) throw new Error("TxLINE token/activate returned no apiToken");
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

  // --- typed endpoint wrappers (TXLINE-MAP §1) ---
  /** S1 — scores snapshot for a fixture (confirmed path). asOf → historical point-in-time. */
  scoresSnapshot<T = unknown>(fixtureId: string, asOf?: string): Promise<T> {
    return this.get<T>(`/api/scores/snapshot/${encodeURIComponent(fixtureId)}`, asOf ? { asOf } : undefined);
  }

  /** F1 — fixtures schedule / snapshot. ⚠ Day-0: confirm exact path from examples/fetching-snapshots. */
  fixtures<T = unknown>(query?: Record<string, string | number | undefined>): Promise<T> {
    return this.get<T>(`/api/scores/schedule`, query);
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
