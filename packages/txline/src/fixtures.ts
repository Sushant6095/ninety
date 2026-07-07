// Fixtures endpoint schema (F1). Shape verified LIVE against txline-dev (ADR-015): the real payload
// is a top-level array of PascalCase records. .passthrough() keeps fields we don't model.
import { z } from "zod";

export const Fixture = z
  .object({
    FixtureId: z.number(),
    Competition: z.string(),
    CompetitionId: z.number(),
    StartTime: z.number(), // epoch ms
    Ts: z.number().optional(),
    FixtureGroupId: z.number().optional(),
    Participant1: z.string(),
    Participant1Id: z.number(),
    Participant2: z.string(),
    Participant2Id: z.number(),
    Participant1IsHome: z.boolean().optional(),
    GameState: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();
export type Fixture = z.infer<typeof Fixture>;

// F1 — GET /api/fixtures/snapshot
export const FixturesSnapshot = z.array(Fixture);
export type FixturesSnapshot = z.infer<typeof FixturesSnapshot>;
