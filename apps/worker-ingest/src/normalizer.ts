// TxLINE payload → canonical Envelope (packages/schema). Idempotency (source, source_seq); partition key = match_id.
// Reality (ADR-015/018): the live odds feed is per-bookmaker/per-market (e.g. OVERUNDER_PARTICIPANT_GOALS),
// not clean 1X2, so odds.raw carries the RAW tick as a loose Envelope (type "odds_tick" as category);
// cortex derives the 1X2 fair prices downstream. Scores are derived into discrete match events by diffing.
import { randomUUID } from "node:crypto";
import { Envelope } from "@omnipitch/schema";
import type { OddsTick, ScoreState } from "@omnipitch/txline";

export const SRC_ODDS = "txline.odds";
export const SRC_SCORE = "txline.score";
export const SRC_REPLAY = "replay";

/** Deterministic positive 31-bit seq from a string id (djb2) — for feeds without a numeric seq (odds MessageId).
 *  Same id → same seq, so a redelivered tick dedupes on (source, source_seq). */
export function seqFromId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return h & 0x7fffffff;
}

const nowIso = () => new Date().toISOString();
const tsIso = (ts: number | undefined): string => (typeof ts === "number" ? new Date(ts < 1e12 ? ts * 1000 : ts).toISOString() : nowIso());

/** Raw odds tick → odds.raw Envelope. source_seq derived from MessageId (stable per tick). */
export function normalizeOdds(tick: OddsTick, source: string = SRC_ODDS): Envelope {
  const id = tick.MessageId ?? `${tick.FixtureId}:${tick.Ts}`;
  return Envelope.parse({
    event_id: randomUUID(),
    source,
    source_seq: seqFromId(id),
    match_id: String(tick.FixtureId),
    ts_source: tsIso(tick.Ts),
    ts_ingest: nowIso(),
    type: "odds_tick",
    payload: {
      fixtureId: tick.FixtureId,
      ts: tick.Ts,
      bookmaker: tick.Bookmaker,
      bookmakerId: tick.BookmakerId,
      superOddsType: tick.SuperOddsType,
      marketParameters: tick.MarketParameters,
      inRunning: tick.InRunning,
      priceNames: tick.PriceNames,
      prices: tick.Prices,
      pct: tick.Pct,
    },
  });
}

/** ScoreState → discrete match events (goals) by diffing vs the previous state for that fixture.
 *  Returns [] for a no-change update. GameState→kickoff/ht/ft mapping is deferred (devnet GameState is
 *  unreliable — "scheduled" with a running clock, see ADR-015). */
export function normalizeScore(state: ScoreState, prev: ScoreState | undefined, source: string = SRC_SCORE): Envelope[] {
  const matchId = String(state.FixtureId);
  const baseSeq = state.Seq ?? seqFromId(`${matchId}:${state.Ts ?? 0}`);
  const hg = state.Score?.Participant1?.Total?.Goals ?? 0;
  const ag = state.Score?.Participant2?.Total?.Goals ?? 0;
  const phg = prev?.Score?.Participant1?.Total?.Goals ?? 0;
  const pag = prev?.Score?.Participant2?.Total?.Goals ?? 0;
  const minute = Math.min(130, Math.max(0, Math.floor((state.Clock?.Seconds ?? 0) / 60)));
  const goal = (team: "home" | "away", n: number) =>
    Envelope.parse({
      event_id: randomUUID(),
      source,
      source_seq: n,
      match_id: matchId,
      ts_source: tsIso(state.Ts),
      ts_ingest: nowIso(),
      type: "goal",
      payload: { team, minute, score: { home: hg, away: ag } },
    });
  const out: Envelope[] = [];
  if (hg > phg) out.push(goal("home", baseSeq));
  if (ag > pag) out.push(goal("away", baseSeq + 1));
  return out;
}

/** Bounded per-process idempotency filter on (source, source_seq). */
export class Dedup {
  private readonly seen = new Set<string>();
  private readonly order: string[] = [];
  constructor(private readonly cap = 100_000) {}
  /** true if this (source, source_seq) is NEW; false if a duplicate. */
  accept(source: string, sourceSeq: number): boolean {
    const key = `${source}:${sourceSeq}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    this.order.push(key);
    if (this.order.length > this.cap) {
      const evicted = this.order.shift();
      if (evicted) this.seen.delete(evicted);
    }
    return true;
  }
  // ponytail: per-process bounded set. Multi-instance / restart-durable dedup needs a shared Redis SET
  // or a monotonic per-(source,match) seq watermark; upgrade when ingest scales past one process.
}
