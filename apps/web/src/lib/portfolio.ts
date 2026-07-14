// Portfolio + History fixtures — shaped like GET /me/portfolio, /me/positions, /me/history (SCREEN-DATA-MAP).
// Internally reconciling to the cent: equity = free + Σ(shares·markNow); unrealized = Σ shares·(markNow − avgEntry).
// Prices are 0..100 (a winning share settles to 100 credits), so 1 share currently worth `markNow` credits.
import type { Outcome } from "./types";

export interface OpenPosition {
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

// Ordered biggest-conviction first. markNow drives current value; the live swap feeds it from m:{match}:prices.
export const OPEN_POSITIONS: OpenPosition[] = [
  { marketId: "wc26-aus-egy:1x2", matchId: "wc26-aus-egy", homeCode: "AUS", awayCode: "EGY", outcome: "A", pick: "EGY", shares: 60, avgEntry: 41.0, markNow: 31.0, minute: 74, status: "LIVE" },
  { marketId: "wc26-can-mar:1x2", matchId: "wc26-can-mar", homeCode: "CAN", awayCode: "MAR", outcome: "H", pick: "CAN", shares: 40, avgEntry: 52.0, markNow: 61.4, minute: 74, status: "LIVE" },
  { marketId: "wc26-esp-jpn:1x2", matchId: "wc26-esp-jpn", homeCode: "ESP", awayCode: "JPN", outcome: "H", pick: "ESP", shares: 30, avgEntry: 60.0, markNow: 68.2, minute: 58, status: "LIVE" },
  { marketId: "wc26-fra-sen:1x2", matchId: "wc26-fra-sen", homeCode: "FRA", awayCode: "SEN", outcome: "H", pick: "FRA", shares: 25, avgEntry: 63.0, markNow: 74.0, minute: 41, status: "LIVE" },
  { marketId: "wc26-ger-col:1x2", matchId: "wc26-ger-col", homeCode: "GER", awayCode: "COL", outcome: "H", pick: "GER", shares: 20, avgEntry: 50.0, markNow: 48.5, minute: null, status: "PRE" },
];

export interface Account {
  free: number; // uncommitted credits (matches SESSION.credits)
  curve: number[]; // equity over the session, ending at current equity
}
// free is the header CreditPill balance; curve ends at free + Σ market value (computed in the page).
export const ACCOUNT: Account = {
  free: 2450,
  curve: [11800, 11720, 11960, 12010, 12240, 12180, 12520, 12760, 12690, 12980, 13160, 13040, 13320, 13470, 13511],
};

export interface Fill {
  id: string;
  ts: string; // "50'" for in-match, or "6 Jul" for settled — display label
  matchId: string;
  homeCode: string;
  awayCode: string;
  side: "buy" | "sell";
  pick: string; // outcome team code / "DRAW"
  shares: number;
  price: number; // 0..100 executed price
  credits: number; // credits moved (buy: paid, sell: received)
  status: "OPEN" | "SETTLED";
  pnl: number | null; // realized P&L (settled fills only)
}

// Newest first. Buys/sells while live + settled outcomes. Filters slice by side/status.
export const FILLS: Fill[] = [
  { id: "f1", ts: "74'", matchId: "wc26-aus-egy", homeCode: "AUS", awayCode: "EGY", side: "buy", pick: "EGY", shares: 20, price: 55.0, credits: 1100, status: "OPEN", pnl: null },
  { id: "f2", ts: "13'", matchId: "wc26-aus-egy", homeCode: "AUS", awayCode: "EGY", side: "buy", pick: "EGY", shares: 40, price: 34.0, credits: 1360, status: "OPEN", pnl: null },
  { id: "f3", ts: "72'", matchId: "wc26-can-mar", homeCode: "CAN", awayCode: "MAR", side: "buy", pick: "CAN", shares: 40, price: 52.0, credits: 2080, status: "OPEN", pnl: null },
  { id: "f4", ts: "Today", matchId: "wc26-srb-cmr", homeCode: "SRB", awayCode: "CMR", side: "sell", pick: "SRB", shares: 50, price: 88.0, credits: 4400, status: "SETTLED", pnl: 1490 },
  { id: "f5", ts: "Today", matchId: "wc26-cro-bel", homeCode: "CRO", awayCode: "BEL", side: "buy", pick: "CRO", shares: 30, price: 47.0, credits: 1410, status: "SETTLED", pnl: -1410 },
  { id: "f6", ts: "5 Jul", matchId: "wc26-bra-kor", homeCode: "BRA", awayCode: "KOR", side: "buy", pick: "BRA", shares: 25, price: 68.0, credits: 1700, status: "SETTLED", pnl: 800 },
];

/** Unrealized P&L on an open position, in credits. */
export const unrealized = (p: OpenPosition): number => p.shares * (p.markNow - p.avgEntry) / 1;
/** Current market value of an open position, in credits (share worth `markNow`). */
export const marketValue = (p: OpenPosition): number => p.shares * p.markNow;
/** Cost basis of an open position, in credits. */
export const costBasis = (p: OpenPosition): number => p.shares * p.avgEntry;
