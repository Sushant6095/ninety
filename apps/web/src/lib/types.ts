// Frontend view types — mirror the API contract in docs/api-samples/ so the fixture→live swap (chunk 5) is 1:1.
export type Outcome = "H" | "D" | "A";
export type MarketStatus = "SCHEDULED" | "OPEN" | "LIVE" | "HALTED" | "RESOLVING" | "SETTLED" | "VOIDED";

export interface MarketRow {
  marketId: string;
  matchId: string;
  kind: string; // "1X2"
  status: MarketStatus;
  home: string;
  away: string;
  homeCode: string; // FIFA 3-letter, e.g. "ESP"
  awayCode: string;
  homeFlag: string; // emoji
  awayFlag: string;
  stage: string; // "Round of 16"
  competition: string; // grouping label, e.g. "Favourites" | "World Cup — Round of 16"
  kickoffAt: string; // ISO
  minute: number | null; // live match minute
  score: { home: number; away: number } | null;
  mark: Record<string, number> | null; // outcome → probability 0..1 (null until priced)
  spark: number[]; // recent fair[H]×100 series for the mini-river
  favourite: boolean;
}

export interface LeaderRow {
  rank: number;
  handle: string; // "@hexfan"
  pnl: number; // net credit P&L (play-money)
}

export interface SessionUser {
  handle: string;
  credits: number;
  rank: number;
  rankDelta: number;
}
