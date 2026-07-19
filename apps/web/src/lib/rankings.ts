// Home-board depth: Ninety Power Rankings — the Ninety model's WC26 strength table.
// Modeled (see BLOCKERS B2); the live version derives ratings from mark distributions once the feed is live.
// Group standings live on their own /competition surface (real, baked WC26 data) — not duplicated here.

export interface RankRow {
  rank: number;
  code: string; // FIFA 3-letter
  rating: number; // modeled strength (Elo-ish)
  delta: number; // movement vs last update
}

export const POWER_RANKINGS: RankRow[] = [
  { rank: 1, code: "ARG", rating: 2087, delta: 0 },
  { rank: 2, code: "FRA", rating: 2065, delta: 1 },
  { rank: 3, code: "ESP", rating: 2041, delta: 2 },
  { rank: 4, code: "BRA", rating: 2038, delta: -1 },
  { rank: 5, code: "ENG", rating: 2019, delta: 0 },
  { rank: 6, code: "POR", rating: 1998, delta: 1 },
  { rank: 7, code: "NED", rating: 1984, delta: -2 },
  { rank: 8, code: "GER", rating: 1971, delta: 3 },
  { rank: 9, code: "BEL", rating: 1955, delta: -1 },
  { rank: 10, code: "CRO", rating: 1940, delta: 0 },
  { rank: 11, code: "ITA", rating: 1928, delta: 2 },
  { rank: 12, code: "URU", rating: 1915, delta: -1 },
];
