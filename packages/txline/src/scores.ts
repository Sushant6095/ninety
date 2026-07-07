// Scores endpoint schemas (S1–S4). Typed TxLINE wire shapes — the client parses every response into
// these, so no consumer ever sees `any`. worker-ingest maps them onto the canonical bus Envelope.
import { z } from "zod";

const Side = z.object({
  team: z.string(),
  code: z.string(),
  goals: z.number().int().nonnegative(),
});

// S1 — GET /api/scores/snapshot/{fixtureId}?asOf=
export const ScoresSnapshot = z.object({
  fixtureId: z.string(),
  competition: z.string(),
  stage: z.string(),
  group: z.string().optional(),
  status: z.string(), // scheduled | in_play | ht | ft | ...
  minute: z.number().int().optional(),
  home: Side,
  away: Side,
  asOf: z.string(),
  seq: z.number().int(),
  stats: z.record(z.string(), z.number()), // statKey → value (K1)
});
export type ScoresSnapshot = z.infer<typeof ScoresSnapshot>;

// S3 — one score event from GET /api/scores/stream (SSE)
export const ScoreEvent = z.object({
  fixtureId: z.string(),
  seq: z.number().int(),
  ts: z.string(),
  type: z.enum(["goal", "card", "penalty", "kickoff", "ht", "ft", "status", "stat"]),
  team: z.enum(["home", "away"]).optional(),
  minute: z.number().int().optional(),
  score: z.object({ home: z.number().int(), away: z.number().int() }).optional(),
  statKey: z.number().int().optional(),
  value: z.number().optional(),
  status: z.string().optional(),
});
export type ScoreEvent = z.infer<typeof ScoreEvent>;

// S2 — GET /api/scores/updates/{epochDay}/{hourOfDay}/{interval} (5-min bucket)
export const ScoresUpdates = z.object({
  epochDay: z.number().int(),
  hourOfDay: z.number().int(),
  interval: z.number().int(),
  events: z.array(ScoreEvent),
});
export type ScoresUpdates = z.infer<typeof ScoresUpdates>;

// S4 — GET /api/scores/stat-validation?fixtureId&seq&statKey[&statKey2]
// Merkle proof bundle feeding on-chain txoracle.validateStat (TXLINE-MAP §3). ⚠ Day-0: confirm exact
// proof field shapes from examples/onchain-validation.
export const StatValidation = z.object({
  fixtureId: z.string(),
  seq: z.number().int(),
  epochDay: z.number().int(),
  stats: z.array(z.object({ statKey: z.number().int(), value: z.number() })),
  fixtureSummary: z.string(), // serialized summary the predicate runs over
  subTreeProof: z.array(z.string()),
  mainTreeProof: z.array(z.string()),
  statProof: z.array(z.string()),
  rootPda: z.string(), // ["daily_scores_roots", epochDay] PDA
});
export type StatValidation = z.infer<typeof StatValidation>;
