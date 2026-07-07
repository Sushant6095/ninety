// Per-match card state (52B). One MatchCard per match_id — independent, so N concurrent matches never share
// state. Marks feed bounded ring buffers (15-min window) for the sparkline; events drive the state machine
// (live → halted → live → settled). toCardState() is the only bridge to the pure renderer.
import type { Envelope } from "@omnipitch/schema";
import { boothVoice, sparkline, type CardState, type MatchState, type PriceRow, type TeamMeta } from "./card";

const WINDOW_MS = 15 * 60 * 1000; // sparkline horizon
const RING_CAP = 512; // hard cap per market → no unbounded memory even under a firehose
const DELTA_LOOKBACK_MS = 4 * 60 * 1000; // Δ vs ~4 min ago

class RingBuffer {
  private pts: Array<{ t: number; v: number }> = [];
  push(t: number, v: number): void {
    this.pts.push({ t, v });
    const cutoff = t - WINDOW_MS;
    while (this.pts.length && this.pts[0].t < cutoff) this.pts.shift();
    if (this.pts.length > RING_CAP) this.pts.splice(0, this.pts.length - RING_CAP);
  }
  values(): number[] {
    return this.pts.map((p) => p.v);
  }
  latest(): number | undefined {
    return this.pts.length ? this.pts[this.pts.length - 1].v : undefined;
  }
  valueBefore(t: number): number | undefined {
    let found: number | undefined;
    for (const p of this.pts) {
      if (p.t <= t) found = p.v;
      else break;
    }
    return found ?? (this.pts.length ? this.pts[0].v : undefined);
  }
}

export interface FixtureMeta {
  home: TeamMeta;
  away: TeamMeta;
  stage: string;
}

const code = (t: TeamMeta): string => (t.code ?? t.name.slice(0, 3)).toUpperCase();
const round1 = (n: number): number => Math.round(n * 10) / 10;

export class MatchCard {
  state: MatchState = "live";
  minute = 0;
  score = { home: 0, away: 0 };
  messageId?: number;
  lastChangeTs: number;
  dirty = false;
  settledAt?: number; // when the match settled — the orchestrator evicts the card a grace period later

  private marketId?: string;
  private order: string[] = [];
  private readonly rings = new Map<string, RingBuffer>();
  private readonly latest = new Map<string, number>();
  private frozenSpark?: Map<string, string>;
  private lastEventBase?: string;
  private lastEventFrom?: number;
  private booth?: string;
  private settled?: { result: string; sig: string };

  constructor(
    readonly matchId: string,
    private meta: FixtureMeta,
    now: number,
  ) {
    this.lastChangeTs = now;
  }

  /** Refine team/stage metadata after an async fixture lookup (the card is created with a placeholder first). */
  setMeta(meta: FixtureMeta): void {
    this.meta = meta;
  }

  /** A mark for THIS match. Pins to the first market_id seen (the card tracks one market). Returns changed. */
  applyMark(env: Envelope, now: number): boolean {
    const p = env.payload as { market_id?: string; fair?: Record<string, number> };
    if (!p.fair) return false;
    if (this.marketId === undefined) {
      this.marketId = p.market_id;
      this.order = orderOutcomes(Object.keys(p.fair));
    } else if (p.market_id !== this.marketId) {
      return false; // ignore other markets — the card is dedicated to one market (v1)
    }
    for (const o of this.order) {
      const prob = p.fair[o];
      if (typeof prob !== "number") continue;
      const price = prob * 100;
      this.latest.set(o, price);
      (this.rings.get(o) ?? this.setRing(o)).push(now, price);
    }
    this.lastChangeTs = now;
    this.dirty = true;
    return true;
  }

  /** A match event. Returns whether it demands an immediate (event-priority) edit. */
  applyEvent(env: Envelope, now: number): { immediate: boolean } {
    const type = env.type;
    const p = env.payload as { minute?: number; team?: "home" | "away"; color?: string; score?: { home: number; away: number }; result?: string; sig?: string };
    if (typeof p.minute === "number") this.minute = p.minute;
    this.lastChangeTs = now;
    this.dirty = true;

    switch (type) {
      case "kickoff":
        this.state = "live";
        return { immediate: false };
      case "goal":
        if (p.score) this.score = p.score;
        this.setEvent(`${this.minute}' Goal — ${this.teamName(p.team)}`);
        return { immediate: true };
      case "card":
        if (p.color === "red") {
          this.setEvent(`${this.minute}' Red card — ${this.teamName(p.team)}`);
          return { immediate: true };
        }
        this.setEvent(`${this.minute}' Yellow — ${this.teamName(p.team)}`);
        return { immediate: false };
      case "halt":
        this.state = "halted";
        this.freezeSparkline();
        this.setEvent(`${this.minute}' Market halted — repricing`);
        return { immediate: true };
      case "reopen":
        this.state = "live";
        this.frozenSpark = undefined; // resume the live sparkline
        this.setEvent(`${this.minute}' Market reopened`);
        return { immediate: true };
      case "settled":
        this.state = "settled";
        this.frozenSpark = undefined; // unfreeze even on a direct halt→settled (else the final card shows a stale spark)
        this.settled = { result: p.result ?? "?", sig: p.sig ?? "" };
        this.settledAt = now;
        return { immediate: true };
      default:
        return { immediate: false };
    }
  }

  applyBooth(text: string, now: number): void {
    this.booth = boothVoice(text.trim());
    this.lastChangeTs = now;
    this.dirty = true;
  }

  toCardState(now: number, lb: { traders: number; topSwing: number }): CardState {
    const rows: PriceRow[] = this.order.map((o) => {
      const price = this.latest.get(o) ?? 0;
      const ring = this.rings.get(o);
      const prior = ring?.valueBefore(now - DELTA_LOOKBACK_MS);
      const spark = this.frozenSpark?.get(o) ?? sparkline(ring?.values() ?? []);
      return { label: this.rowLabel(o), price: round1(price), delta: round1(price - (prior ?? price)), spark };
    });
    const leading = rows.length ? Math.round(rows[0].price) : 0;
    const lastEvent = this.lastEventBase
      ? this.lastEventFrom !== undefined
        ? `${this.lastEventBase} · market ${this.lastEventFrom} → ${leading}`
        : this.lastEventBase
      : undefined;
    return {
      matchId: this.matchId,
      state: this.state,
      minute: this.minute,
      stage: this.meta.stage,
      home: this.meta.home,
      away: this.meta.away,
      score: { ...this.score },
      marketLabel: marketLabel(this.order),
      rows,
      lastEvent,
      booth: this.booth,
      traders: lb.traders,
      topSwing: lb.topSwing,
      updatedSecondsAgo: Math.max(0, Math.round((now - this.lastChangeTs) / 1000)),
      settled: this.settled ? { result: this.settled.result, sig: this.settled.sig, solscanUrl: `https://solscan.io/tx/${this.settled.sig}?cluster=devnet` } : undefined,
    };
  }

  markClean(): void {
    this.dirty = false;
  }

  private setRing(o: string): RingBuffer {
    const r = new RingBuffer();
    this.rings.set(o, r);
    return r;
  }
  private setEvent(base: string): void {
    this.lastEventBase = base;
    this.lastEventFrom = this.order.length ? Math.round(this.latest.get(this.order[0]) ?? 0) : undefined;
  }
  private freezeSparkline(): void {
    this.frozenSpark = new Map(this.order.map((o) => [o, sparkline(this.rings.get(o)?.values() ?? [])]));
  }
  private teamName(side?: "home" | "away"): string {
    return side === "away" ? this.meta.away.name : this.meta.home.name;
  }
  private rowLabel(o: string): string {
    const u = o.toUpperCase();
    if (u === "H") return code(this.meta.home);
    if (u === "A") return code(this.meta.away);
    if (u === "D") return "DRW";
    return u.slice(0, 5);
  }
}

function orderOutcomes(keys: string[]): string[] {
  const set = new Set(keys.map((k) => k.toUpperCase()));
  if (set.has("H") && set.has("D") && set.has("A")) {
    const byUpper = new Map(keys.map((k) => [k.toUpperCase(), k]));
    return ["H", "D", "A"].map((u) => byUpper.get(u)!).filter(Boolean);
  }
  return keys;
}

function marketLabel(order: string[]): string {
  const u = order.map((o) => o.toUpperCase());
  if (u.includes("H") && u.includes("D") && u.includes("A")) return "WIN MARKET (play credits)";
  if (u.includes("OVER") || u.includes("UNDER")) return "GOALS MARKET (play credits)";
  return "MARKET (play credits)";
}
