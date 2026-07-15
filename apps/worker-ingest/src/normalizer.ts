// TxLINE payload → canonical Envelope (packages/schema). Idempotency (source, source_seq); partition key = match_id.
// Reality (ADR-015/018): the live odds feed is per-bookmaker/per-market (e.g. OVERUNDER_PARTICIPANT_GOALS),
// not clean 1X2, so odds.raw carries the RAW tick as a loose Envelope (type "odds_tick" as category);
// cortex derives the 1X2 fair prices downstream. Scores are derived into discrete match events by diffing.
import { randomUUID } from "node:crypto";
import { Envelope } from "@omnipitch/schema";
import type { OddsTick, ScoreState } from "@omnipitch/txline";

export const SRC_ODDS = "txline.odds";
export const SRC_SCORE = "txline.score";
export const SRC_ACTION = "txline.action";
export const SRC_REPLAY = "replay";

// source_seq slots reserved per score state: home goals [0, BLOCK/2), away goals [BLOCK/2, BLOCK).
// State Seq is a stream-global +1 counter, so ×BLOCK gives every state a disjoint block → distinct goals
// never share a source_seq (see normalizeScore). BLOCK/2 = 4 same-team goals per state is more than football allows.
const GOAL_SEQ_BLOCK = 8;

/** Deterministic positive 31-bit seq from a string id (djb2) — for feeds without a numeric seq (odds MessageId).
 *  Same id → same seq, so a redelivered tick dedupes on (source, source_seq). */
export function seqFromId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return h & 0x7fffffff;
}

const nowIso = () => new Date().toISOString();
const tsIso = (ts: number | undefined): string => (typeof ts === "number" ? new Date(ts < 1e12 ? ts * 1000 : ts).toISOString() : nowIso());
const minuteOf = (s: ScoreState): number => Math.min(130, Math.max(0, Math.floor((s.Clock?.Seconds ?? 0) / 60)));

/** Participant slot (1|2) + Participant1IsHome → home/away. Slot absent or unknown → undefined. */
const teamOf = (s: ScoreState): "home" | "away" | undefined => {
  const p = (s as Record<string, unknown>).Participant;
  if (p !== 1 && p !== 2) return undefined;
  const p1Home = s.Participant1IsHome !== false; // field absent → Participant1 is home (TxLINE convention)
  return (p === 1) === p1Home ? "home" : "away";
};

// TxLINE game phases that kill the match (ADR-059): 15 Abandoned, 16 Cancelled, 19 Postponed → market VOID.
const VOID_PHASES: Record<number, string> = { 15: "abandoned", 16: "cancelled", 19: "postponed" };

/** The void phase name if this state sits in one — matched by numeric phase code (GameState or StatusId)
 *  OR by a phase-name string, since devnet serves GameState as a string and mainnet codes are numeric. */
export function voidPhase(s: ScoreState | undefined): string | undefined {
  if (!s) return undefined;
  const code = typeof s.GameState === "number" ? s.GameState : s.StatusId;
  if (typeof code === "number" && VOID_PHASES[code]) return VOID_PHASES[code];
  if (typeof s.GameState === "string" && /aband|cancel|postpon/i.test(s.GameState)) return s.GameState.toLowerCase();
  return undefined;
}

/** Raw odds tick → odds.raw Envelope. source_seq derived from MessageId (stable per tick).
 *  `recovered` marks events re-emitted during gap recovery (they dedupe against a live counterpart).
 *  `replay` stamps source=replay so replayed events are DISTINGUISHABLE from live data on the shared topics —
 *  a consumer (e.g. the engine) must never let a replay of a currently-live match move real market state. */
export function normalizeOdds(tick: OddsTick, recovered = false, replay = false): Envelope {
  const id = tick.MessageId ?? `${tick.FixtureId}:${tick.Ts}`;
  return Envelope.parse({
    event_id: randomUUID(),
    source: replay ? SRC_REPLAY : SRC_ODDS,
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
      ...(recovered ? { recovered: true } : {}),
    },
  });
}

/** ScoreState → discrete match events (goals) by diffing vs the previous state for that fixture.
 *  Returns [] for a no-change update. GameState→kickoff/ht/ft mapping is deferred (devnet GameState is
 *  unreliable — "scheduled" with a running clock, see ADR-015). */
export function normalizeScore(state: ScoreState, prev: ScoreState | undefined, recovered = false, replay = false): Envelope[] {
  const matchId = String(state.FixtureId);
  const baseSeq = state.Seq ?? seqFromId(`${matchId}:${state.Ts ?? 0}`);
  const hg = state.Score?.Participant1?.Total?.Goals ?? 0;
  const ag = state.Score?.Participant2?.Total?.Goals ?? 0;
  const phg = prev?.Score?.Participant1?.Total?.Goals ?? 0;
  const pag = prev?.Score?.Participant2?.Total?.Goals ?? 0;
  const minute = minuteOf(state);
  // Globally-unique source_seq per goal. A naive baseSeq / baseSeq+1 scheme let an away goal at Seq N
  // collide with the next state's home goal at Seq N+1 (Seq is +1-monotonic), dropping a real goal as a
  // false duplicate; the block/team/index scheme keeps every distinct goal's key distinct.
  const goal = (team: "home" | "away", index: number) =>
    Envelope.parse({
      event_id: randomUUID(),
      source: replay ? SRC_REPLAY : SRC_SCORE,
      source_seq: baseSeq * GOAL_SEQ_BLOCK + (team === "away" ? GOAL_SEQ_BLOCK / 2 : 0) + index,
      match_id: matchId,
      ts_source: tsIso(state.Ts),
      ts_ingest: nowIso(),
      type: "goal",
      payload: { team, minute, score: { home: hg, away: ag }, ...(recovered ? { recovered: true } : {}) },
    });
  // One discrete event per goal in the delta — a recovery snapshot can span several goals for one team.
  // ponytail: payload.score is the final cumulative; intermediate scorelines during a gap are unknowable
  // from a snapshot diff, so the running tally rides on score, and the goal EVENT itself is what's restored.
  const out: Envelope[] = [];
  for (let i = 0; i < hg - phg; i++) out.push(goal("home", i));
  for (let i = 0; i < ag - pag; i++) out.push(goal("away", i));
  // Game-phase → VOID (ADR-059/ADR-024): on the transition INTO phase 15/16/19 emit ONE ft envelope whose
  // status matches the engine's /aband/i mapping (market.ts fromEnvelope) → abandon trigger → VOIDED,
  // refunding exactly the committed credits off the feed's own phase code — trustless, no admin path
  // (ADR-017). Deterministic seq (one void per match) keeps recovery snapshots idempotent under dedup.
  const phase = voidPhase(state);
  if (phase && !voidPhase(prev)) {
    out.push(
      Envelope.parse({
        event_id: randomUUID(),
        source: replay ? SRC_REPLAY : SRC_SCORE,
        source_seq: seqFromId(`void:${matchId}`),
        match_id: matchId,
        ts_source: tsIso(state.Ts),
        ts_ingest: nowIso(),
        type: "ft",
        payload: { status: `abandoned (${phase})`, ...(recovered ? { recovered: true } : {}) },
      }),
    );
  }
  return out;
}

// The Events-tab action set (ADR-059): timeline moments a fan cares about. Everything else on the scores
// feed (attack_possession, action_amend, additional_time, dangerous_attack…) is pace/possession noise.
const ACTION_KINDS = new Set(["shot", "free_kick", "var", "substitution", "penalty", "penalties"]);

/** ScoreState carrying a timeline Action → one match.actions Envelope; noise/non-actions → null.
 *  `detail` passes TxLINE's Data qualifiers through verbatim ({ Outcome: "OnTarget" }, { FreeKickType }…) —
 *  the taxonomy is feed-owned, so we don't chase variants. Own source lane (SRC_ACTION) keeps its hashed
 *  seqs out of the goal-block seq space for dedup. */
export function normalizeAction(state: ScoreState, recovered = false, replay = false): Envelope | null {
  const action = state.Action;
  if (!action || !ACTION_KINDS.has(action)) return null;
  const raw = state as Record<string, unknown>;
  const team = teamOf(state);
  const key = `${state.FixtureId}:${raw.Id ?? state.Seq ?? state.Ts ?? 0}:${action}`; // stable per action record
  return Envelope.parse({
    event_id: randomUUID(),
    source: replay ? SRC_REPLAY : SRC_ACTION,
    source_seq: seqFromId(key),
    match_id: String(state.FixtureId),
    ts_source: tsIso(state.Ts),
    ts_ingest: nowIso(),
    type: "action",
    payload: {
      action,
      ...(team ? { team } : {}),
      minute: minuteOf(state),
      ...(typeof raw.Confirmed === "boolean" ? { confirmed: raw.Confirmed } : {}),
      ...(raw.Data && typeof raw.Data === "object" ? { detail: raw.Data as Record<string, unknown> } : {}),
      ...(recovered ? { recovered: true } : {}),
    },
  });
}

/** Bounded per-process idempotency filter on (source, source_seq). */
export class Dedup {
  private readonly seen = new Set<string>();
  private readonly order: string[] = [];
  constructor(private readonly cap = 100_000) {}
  /** true if this (source, source_seq) has already been delivered. */
  has(source: string, sourceSeq: number): boolean {
    return this.seen.has(`${source}:${sourceSeq}`);
  }
  /** Mark (source, source_seq) delivered. Call AFTER a successful publish (journal-then-ack): a failed
   *  publish then leaves the event unmarked so gap recovery can still re-derive and re-emit it. */
  add(source: string, sourceSeq: number): void {
    const key = `${source}:${sourceSeq}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.order.push(key);
    if (this.order.length > this.cap) {
      const evicted = this.order.shift();
      if (evicted) this.seen.delete(evicted);
    }
  }
  // ponytail: per-process bounded set. Multi-instance / restart-durable dedup needs a shared Redis SET
  // or a monotonic per-(source,match) seq watermark; upgrade when ingest scales past one process.
}
