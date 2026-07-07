// Fixtures endpoint schema (F1). Drives auto market creation + countdowns (TXLINE-MAP §2).
import { z } from "zod";

export const Fixture = z.object({
  fixtureId: z.string(),
  kickoff: z.string(),
  stage: z.string(), // group | round_of_32 | round_of_16 | quarterfinal | semifinal | final
  group: z.string().optional(),
  home: z.string(),
  away: z.string(),
  status: z.string(),
});
export type Fixture = z.infer<typeof Fixture>;

// F1 — GET /api/scores/schedule  ⚠ Day-0 path (examples/fetching-snapshots + scores/schedule)
export const FixturesSchedule = z.object({
  competition: z.string(),
  updated: z.string(),
  fixtures: z.array(Fixture),
});
export type FixturesSchedule = z.infer<typeof FixturesSchedule>;
