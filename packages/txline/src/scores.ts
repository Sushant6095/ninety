// Scores endpoint schemas (S1–S4). Shapes verified LIVE against txline-dev (ADR-015). Real payloads are
// rich and PascalCase; we model the fields we consume and .passthrough() the rest so the wrappers return
// real types (not any) without being brittle to the full feed. Goals live in Score.*.Total.Goals — the
// numeric Stats map keys are NOT goals (the map's 1002/1003≈goals guess was wrong; see statkeys.ts).
import { z } from "zod";

const HalfScore = z
  .object({
    Goals: z.number().optional(),
    YellowCards: z.number().optional(),
    RedCards: z.number().optional(),
    Corners: z.number().optional(),
  })
  .passthrough();

const SideScore = z
  .object({ H1: HalfScore.optional(), HT: HalfScore.optional(), H2: HalfScore.optional(), Total: HalfScore.optional() })
  .passthrough();

// One scores state/event. S1 snapshot and S2 updates are arrays of these; an S3 stream event is one.
export const ScoreState = z
  .object({
    FixtureId: z.number(),
    GameState: z.union([z.string(), z.number()]),
    Seq: z.number().optional(),
    Ts: z.number().optional(),
    StatusId: z.number().optional(),
    StartTime: z.number().optional(),
    CompetitionId: z.number().optional(),
    Participant1Id: z.number().optional(),
    Participant2Id: z.number().optional(),
    Participant1IsHome: z.boolean().optional(),
    Clock: z.object({ Running: z.boolean(), Seconds: z.number() }).passthrough().optional(),
    Score: z.object({ Participant1: SideScore, Participant2: SideScore }).passthrough().optional(),
    Stats: z.record(z.string(), z.number()).optional(), // statKey → value (see statkeys.ts)
  })
  .passthrough();
export type ScoreState = z.infer<typeof ScoreState>;

// S1 — GET /api/scores/snapshot/{fixtureId}?asOf=
export const ScoresSnapshot = z.array(ScoreState);
export type ScoresSnapshot = z.infer<typeof ScoresSnapshot>;

// S2 — GET /api/scores/updates/{epochDay}/{hourOfDay}/{interval}
export const ScoresUpdates = z.array(ScoreState);
export type ScoresUpdates = z.infer<typeof ScoresUpdates>;

// S3 — one event from GET /api/scores/stream (SSE)
export const ScoreEvent = ScoreState;
export type ScoreEvent = z.infer<typeof ScoreEvent>;

// S4 — GET /api/scores/stat-validation?fixtureId&seq&statKey[&statKey2]
// Real Merkle proof bundle feeding on-chain txoracle.validateStat (TXLINE-MAP §3).
const ProofNode = z.object({ hash: z.array(z.number()), isRightSibling: z.boolean() });
export const StatValidation = z
  .object({
    ts: z.number(),
    statToProve: z.object({ key: z.number(), value: z.number(), period: z.number() }).passthrough(),
    eventStatRoot: z.array(z.number()),
    summary: z
      .object({
        fixtureId: z.number(),
        updateStats: z.object({ updateCount: z.number(), minTimestamp: z.number(), maxTimestamp: z.number() }).passthrough(),
        eventStatsSubTreeRoot: z.array(z.number()),
      })
      .passthrough(),
    statProof: z.array(ProofNode),
    subTreeProof: z.array(ProofNode),
    mainTreeProof: z.array(ProofNode),
  })
  .passthrough();
export type StatValidation = z.infer<typeof StatValidation>;
