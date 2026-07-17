// The live API client (ADR-072). One typed function per endpoint the backend actually serves; the frontend calls
// THESE, never raw fetch. `USE_FIXTURES` is the CONNECT switch: when NEXT_PUBLIC_USE_FIXTURES=1 the data layer
// (lib/data) serves baked fixtures for offline/demo; otherwise these hit the deployed API. Shapes mirror
// docs/API-CONTRACT.md 1:1 — if you change a field here, change it there and in the route.
//
// Play-money vocabulary only: price, trade, credits, pick — never bet/stake/odds/wager.

// Server components fetch the API directly (server-to-server, no CORS). The BROWSER fetches same-origin "/api"
// — rewritten to the API by next.config.mjs — because the API sends no CORS headers, so a direct :3000→:4000
// browser fetch is blocked and would silently fall back to fixtures.
const BASE = typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL ?? "" : "/api";
export const USE_FIXTURES = process.env.NEXT_PUBLIC_USE_FIXTURES === "1" || process.env.NEXT_PUBLIC_USE_FIXTURES === "true";

/** Low-level JSON fetch. Throws on non-2xx so callers can surface an error state instead of rendering `undefined`. */
export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { Accept: "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`api ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

const auth = (token?: string): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

/** The local demo session token (verify-user-1) for auth-gated calls. Empty when unset — callers then render the
 *  signed-out state. Local demo only (NEXT_PUBLIC_DEMO_TOKEN, gitignored); a real login is a separate task. */
export const demoToken = (): string | undefined => process.env.NEXT_PUBLIC_DEMO_TOKEN || undefined;
const jsonHeaders = { "Content-Type": "application/json" };

// ---- markets / trading -----------------------------------------------------------------------------
export interface MarketView {
  marketId: string; matchId: string; kind: string; status: string;
  home: string; away: string; stage: string; kickoffAt: string;
  minute: number | null; score: { home: number; away: number } | null;
  mark: Record<string, number> | null; hazard: number | null; markTs: number | null;
  settledOutcome: string | null; settleSig: string | null;
}
export const getMarkets = () => api<{ markets: MarketView[] }>("/markets");
export const getMarket = (matchId: string, token?: string) =>
  api<{ market: MarketView; granted: boolean; amm: { q: number[] | null; b: number; spread_mult: number; markImplied: true } }>(`/markets/${matchId}`, { headers: auth(token) });
export const getQuote = (matchId: string, outcome: "H" | "D" | "A", size: number, side: "buy" | "sell", token?: string) =>
  api(`/markets/${matchId}/quote?outcome=${outcome}&size=${size}&side=${side}`, { headers: auth(token) });

export interface OrderResult { accepted: boolean; matchId: string; outcome?: string; side?: string; fill?: { size: number; price: number; cost: number; fee: number }; status?: string }
export const placeOrder = (body: { matchId: string; outcome: "H" | "D" | "A"; side: "buy" | "sell"; size: number; limit?: number }, token: string) =>
  api<OrderResult>("/orders", { method: "POST", headers: { ...jsonHeaders, ...auth(token) }, body: JSON.stringify(body) });
export const getOrders = (token: string, limit = 100) => api<{ orders: unknown[] }>(`/orders?limit=${limit}`, { headers: auth(token) });

// ---- read models -----------------------------------------------------------------------------------
export const getLeaderboard = () => api<{ leaderboard: unknown[] }>("/leaderboard");
// GET /portfolio returns the WRAPPED shape { portfolio: { free, held, equity, positions } } — NOT a bare
// { positions }. The old type dropped the wrapper, so `res.positions` was undefined at runtime (it's
// `res.portfolio.positions`); `api<T>`'s unchecked `as T` cast hid it from tsc. Fields match API-CONTRACT.md.
export interface PortfolioPosition {
  marketId: string;
  outcome: string; // "H" | "D" | "A"
  shares: number;
  avgEntry: number; // 0..100
  markNow: number | null; // 0..100; null when unpriced (never 0, ADR-071)
  value: number | null;
  pnl: number | null;
  pnlPct: number | null;
  matchId: string;
  home: string;
  away: string;
  minute: number | null;
  status: string; // "LIVE" | "PRE"
}
export interface PortfolioView {
  free: number; // credits (play-money)
  held: number;
  equity: number;
  positions: PortfolioPosition[];
}
export const getPortfolio = (token: string) => api<{ portfolio: PortfolioView }>("/portfolio", { headers: auth(token) });

// ---- moments ---------------------------------------------------------------------------------------
export interface MomentView { id: string; createdAt: string; matchId: string; home: string; away: string; imageUri: string; swing: number | null; mintSig: string | null; minted: boolean }
export const getMoments = (matchId?: string, limit = 50) => api<{ moments: MomentView[] }>(`/moments?limit=${limit}${matchId ? `&matchId=${matchId}` : ""}`);
export const getMoment = (id: string) => api<{ moment: MomentView }>(`/moments/${id}`);

// ---- the Next-Goal game (play-money picks) ---------------------------------------------------------
export interface PickView { id: string; matchId: string; kind: string; choice: "home" | "away" | "none"; status: "OPEN" | "WON" | "LOST" | "VOID"; openMinute: number | null; createdAt: string; resolvedAt: string | null }
export const getPicks = (token: string, matchId?: string) => api<{ picks: PickView[] }>(`/games/picks${matchId ? `?matchId=${matchId}` : ""}`, { headers: auth(token) });
export const makePick = (body: { matchId: string; choice: "home" | "away" | "none"; kind?: string }, token: string) =>
  api<{ pick: PickView }>("/games/picks", { method: "POST", headers: { ...jsonHeaders, ...auth(token) }, body: JSON.stringify(body) });

// ---- in-play timeline ------------------------------------------------------------------------------
export const getMatchEvents = (matchId: string, limit = 50) => api<{ matchId: string; events: unknown[] }>(`/matches/${matchId}/events?limit=${limit}`);
export const getMatchActions = (matchId: string, limit = 50) => api<{ matchId: string; actions: unknown[] }>(`/matches/${matchId}/actions?limit=${limit}`);

// ---- search ----------------------------------------------------------------------------------------
export const search = (q: string) => api<{ q: string; teams: { name: string }[]; matches: unknown[] }>(`/search?q=${encodeURIComponent(q)}`);

// ---- rich STILL data (cost-aware proxy; may 503 if a source is unkeyed) -----------------------------
export const getStandings = (competition: string) => api(`/rich/standings/${competition}`);
export const getScorers = (competition: string) => api(`/rich/scorers/${competition}`);
export const getTeam = (id: string) => api(`/rich/teams/${id}`);
export const getH2H = (matchId: string) => api(`/rich/matches/${matchId}/h2h`);
export const getLineups = (fixture: string) => api(`/rich/lineups/${fixture}`);
export const getPlayer = (id: string, season?: number) => api(`/rich/players/${id}${season ? `?season=${season}` : ""}`);

// ---- live WS (re-export the resume-capable client so lib/ws.ts is consumed, not dead) --------------
export { connect as wsConnect, type Frame } from "./ws";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";
