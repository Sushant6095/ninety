// Home-board depth: Ninety Power Rankings (market-implied strength) + WC26 group standings (all groups, tabbed).
// Fixture-seeded; the live version derives rankings from mark distributions and standings from settled results.

export interface RankRow {
  rank: number;
  code: string; // FIFA 3-letter
  rating: number; // market-implied strength (Elo-ish)
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

export interface StandingRow {
  code: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
}
export interface GroupTable {
  group: string; // "A"
  rows: StandingRow[]; // ordered; top 2 qualify
}

// row helper: [code, w, d, l, gf, ga] → played + points computed.
const r = (code: string, w: number, d: number, l: number, gf: number, ga: number): StandingRow => ({ code, w, d, l, p: w + d + l, gf, ga, pts: w * 3 + d });

export const GROUP_STANDINGS: GroupTable[] = [
  { group: "A", rows: [r("CAN", 2, 1, 0, 6, 2), r("MAR", 2, 0, 1, 5, 3), r("CRO", 1, 0, 2, 3, 4), r("QAT", 0, 1, 2, 1, 6)] },
  { group: "B", rows: [r("ESP", 3, 0, 0, 8, 2), r("EGY", 1, 1, 1, 3, 3), r("JPN", 1, 0, 2, 4, 6), r("CPV", 0, 1, 2, 2, 6)] },
  { group: "C", rows: [r("ARG", 2, 1, 0, 5, 1), r("MEX", 1, 1, 1, 4, 4), r("NED", 1, 1, 1, 3, 3), r("USA", 0, 1, 2, 2, 6)] },
  { group: "D", rows: [r("BRA", 3, 0, 0, 9, 2), r("FRA", 2, 0, 1, 6, 3), r("SEN", 1, 0, 2, 3, 5), r("KOR", 0, 0, 3, 1, 9)] },
  { group: "E", rows: [r("POR", 2, 1, 0, 5, 2), r("GER", 2, 0, 1, 6, 3), r("URU", 1, 1, 1, 4, 4), r("COL", 0, 0, 3, 2, 8)] },
  { group: "F", rows: [r("ENG", 2, 1, 0, 6, 1), r("ITA", 2, 0, 1, 5, 3), r("SUI", 1, 1, 1, 3, 4), r("NGA", 0, 0, 3, 1, 7)] },
  { group: "G", rows: [r("DEN", 2, 1, 0, 5, 2), r("POL", 2, 0, 1, 4, 3), r("SWE", 1, 0, 2, 3, 4), r("GHA", 0, 1, 2, 2, 5)] },
  { group: "H", rows: [r("NOR", 2, 1, 0, 6, 2), r("PAR", 1, 1, 1, 3, 3), r("ECU", 1, 1, 1, 2, 2), r("KSA", 0, 1, 2, 1, 5)] },
];
