// Odds endpoint schemas (O1–O3). Shapes verified LIVE against txline-dev (ADR-015). Odds arrive as
// per-bookmaker records with parallel PriceNames/Prices/Pct arrays (TxLINE "StablePrice"/SuperOdds).
// A snapshot for a not-yet-live fixture is `[]`; the tick shape comes from the updates/stream feed.
import { z } from "zod";

// One odds record (a bookmaker's price set for a fixture).
export const OddsTick = z
  .object({
    FixtureId: z.number(),
    Ts: z.number(),
    MessageId: z.string().optional(),
    Bookmaker: z.string().optional(),
    BookmakerId: z.number().optional(),
    SuperOddsType: z.string().optional(),
    GameState: z.union([z.string(), z.number()]).nullable().optional(),
    InRunning: z.boolean().optional(),
    MarketParameters: z.string().nullable().optional(), // devnet O1 sends null here (verified 18257865) — was .optional() only, which threw and dropped ALL odds for the fixture
    MarketPeriod: z.string().nullable().optional(),
    PriceNames: z.array(z.string()).optional(), // e.g. ["1","X","2"]
    Prices: z.array(z.number()).optional(), // parallel to PriceNames
    Pct: z.array(z.string()).optional(), // implied probabilities
  })
  .passthrough();
export type OddsTick = z.infer<typeof OddsTick>;

// O1 — GET /api/odds/snapshot/{fixtureId}?asOf=  ([] until the fixture has odds)
export const OddsSnapshot = z.array(OddsTick);
export type OddsSnapshot = z.infer<typeof OddsSnapshot>;

// O2 — GET /api/odds/updates/{epochDay}/{hourOfDay}/{interval}
export const OddsUpdates = z.array(OddsTick);
export type OddsUpdates = z.infer<typeof OddsUpdates>;
