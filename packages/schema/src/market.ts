import { z } from "zod";
export const Outcome = z.enum(["H", "D", "A"]);
// fair is a probability distribution over a market's OUTCOMES, keyed by outcome label and summing to 1.
// Labels are market-specific: 1X2 (H/D/A) once a model derives them, or the raw TxLINE markets the cortex
// devigs today (over/under, part1/part2 — ADR-015: the live feed is per-market, not clean 1X2). market_id
// disambiguates. Kept a string-keyed record rather than the H/D/A enum so real (2-outcome) marks validate.
export const Mark = z.object({ market_id: z.string(), fair: z.record(z.string(), z.number()), hazard: z.number(), b_hint: z.number() });
export type Mark = z.infer<typeof Mark>;
