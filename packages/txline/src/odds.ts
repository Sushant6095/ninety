// Odds endpoint schemas (O1–O3). The odds stream is TxLINE "StablePrice"; these consensus decimal
// odds are what cortex de-vigs into fair probabilities → prices.marks (TXLINE-MAP §2).
import { z } from "zod";

// 1X2 consensus decimal odds
export const Odds1x2 = z.object({
  H: z.number().positive(),
  D: z.number().positive(),
  A: z.number().positive(),
});
export type Odds1x2 = z.infer<typeof Odds1x2>;

// O1 — GET /api/odds/snapshot/{fixtureId}?asOf=  ⚠ Day-0 path (examples/fetching-snapshots)
export const OddsSnapshot = z.object({
  fixtureId: z.string(),
  market: z.string(), // "1X2"
  asOf: z.string(),
  seq: z.number().int(),
  odds: Odds1x2,
  overround: z.number().optional(), // book margin (>1)
});
export type OddsSnapshot = z.infer<typeof OddsSnapshot>;

// O3 — one StablePrice tick from GET /api/odds/stream (SSE)  ⚠ Day-0 path (examples/streaming-data)
export const OddsTick = z.object({
  fixtureId: z.string(),
  seq: z.number().int(),
  ts: z.string(),
  market: z.string(),
  odds: Odds1x2,
  stable: z.boolean().optional(), // StablePrice smoothing flag
});
export type OddsTick = z.infer<typeof OddsTick>;

// O2 — GET /api/odds/updates/{epochDay}/{hourOfDay}/{interval}  ⚠ Day-0 path (examples/fetching-snapshots)
export const OddsUpdates = z.object({
  epochDay: z.number().int(),
  hourOfDay: z.number().int(),
  interval: z.number().int(),
  ticks: z.array(OddsTick),
});
export type OddsUpdates = z.infer<typeof OddsUpdates>;
