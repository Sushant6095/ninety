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
  volume?: number; // credits traded on this market (play-money) — a live-exchange metric
}

export interface NewsItem {
  id: string;
  tag: string; // "WORLD CUP" | "MOMENTS" | "SETTLEMENT"
  title: string;
  when: string; // "2h ago"
}

export interface LeaderRow {
  rank: number;
  handle: string; // "@hexfan"
  pnl: number; // net credit P&L (play-money)
}

// A single open position in a trader's book — the shape GET /me/positions returns. Named Position so the
// per-user session (features/session) and the account surfaces share ONE type; lib/portfolio re-exports it as
// OpenPosition for its existing consumers. A brand-new session carries an empty Position[].
export interface Position {
  marketId: string;
  matchId: string;
  homeCode: string;
  awayCode: string;
  outcome: Outcome;
  pick: string; // the outcome's team code or "DRAW" — what you're long
  shares: number;
  avgEntry: number; // 0..100
  markNow: number; // 0..100 (current price = current value per share, credits)
  minute: number | null; // live match minute, null = upcoming (pre)
  status: "LIVE" | "PRE";
}

export interface SessionUser {
  handle: string;
  credits: number;
  rank: number;
  rankDelta: number;
}
