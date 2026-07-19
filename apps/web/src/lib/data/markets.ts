// CONNECT (Phase 2) — the board's data source. getBoardMarkets() returns MarketRow[] either from the baked
// fixtures (NEXT_PUBLIC_USE_FIXTURES=1, offline demo) or from GET /markets (live), mapping the API's MarketView
// → the MarketRow the board renders. Field map: docs/API-CONTRACT.md ("BOARD / HOME"). Server-safe (no hooks).
//
// Honest degrade (ADR-071): a live market with no COMPLETE H/D/A `mark` stays `mark: null` — the board renders
// it unpriced. We NEVER fabricate a 33/33/33 book to fill the gap.
import { getMarkets, type MarketView } from "../api";
import { MARKETS } from "../fixtures";
import { iso2 } from "../flags";
import type { MarketRow, MarketStatus } from "../types";

// Full team name (as the API returns it) → FIFA 3-letter code. The API sends full names ("Belgium") or, for the
// demo seed, an already-3-letter token ("USA"). Codes drive flags/crests client-side (flagUrl(homeCode), ADR-055).
const NAME_TO_CODE: Record<string, string> = {
  "United States": "USA", USA: "USA", Belgium: "BEL", Canada: "CAN", Morocco: "MAR", Spain: "ESP", Japan: "JPN",
  Argentina: "ARG", Mexico: "MEX", Netherlands: "NED", Germany: "GER", Colombia: "COL", Brazil: "BRA",
  "South Korea": "KOR", France: "FRA", Senegal: "SEN", Portugal: "POR", Uruguay: "URU", England: "ENG",
  Australia: "AUS", Croatia: "CRO", Egypt: "EGY", "Cape Verde": "CPV", Switzerland: "SUI", Italy: "ITA",
  Nigeria: "NGA", Denmark: "DEN", Sweden: "SWE", Poland: "POL", Ghana: "GHA", Iran: "IRN", Austria: "AUT",
  "Türkiye": "TUR", Turkey: "TUR", Hungary: "HUN", Czechia: "CZE", Slovakia: "SVK", Ukraine: "UKR", Serbia: "SRB",
  Cameroon: "CMR", Qatar: "QAT", Norway: "NOR", "Saudi Arabia": "KSA", Ecuador: "ECU", "Costa Rica": "CRC",
  Tunisia: "TUN", Paraguay: "PAR",
};

/** Resolve a team's FIFA code from the name the API returns. Falls back to the first 3 letters uppercased. */
export function deriveCode(name: string): string {
  return NAME_TO_CODE[name] ?? (name.length <= 3 ? name.toUpperCase() : name.slice(0, 3).toUpperCase());
}

/** Best-effort flag emoji from the FIFA code (secondary — components prefer flagUrl(code) PNGs, ADR-055). */
function flagEmoji(code: string): string {
  let cc: string | null = null;
  try {
    cc = iso2(code); // throws in dev for an unmapped code — treat as "no emoji", not a crash
  } catch {
    cc = null;
  }
  if (!cc || cc.includes("-")) return ""; // sub-national (gb-eng) has no single regional-indicator emoji
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)));
}

const favouriteOf = (mark: Record<string, number> | null): boolean => {
  if (!mark) return false;
  const vals = Object.values(mark);
  return vals.length > 0 && Math.max(...vals) >= 0.5;
};

/** MarketView (API) → MarketRow (board). Client-derived fields per API-CONTRACT.md: codes/flags/competition/spark. */
export function toMarketRow(v: MarketView): MarketRow {
  const homeCode = deriveCode(v.home);
  const awayCode = deriveCode(v.away);
  return {
    marketId: v.marketId,
    matchId: v.matchId,
    kind: v.kind,
    status: v.status as MarketStatus,
    home: v.home,
    away: v.away,
    homeCode,
    awayCode,
    homeFlag: flagEmoji(homeCode),
    awayFlag: flagEmoji(awayCode),
    stage: v.stage,
    competition: v.stage || "World Cup 2026",
    kickoffAt: v.kickoffAt,
    minute: v.minute,
    score: v.score,
    mark: v.mark, // null when unpriced — the board renders it unpriced, never a fabricated even book
    spark: [], // the live store fills the mini-river from mark ticks over the WS; empty until then
    favourite: favouriteOf(v.mark),
  };
}

/** The live GET /markets mapped to MarketRow[]. Ready for when the live universe is populated + the store seam
 *  is rewired; NOT wired into the board yet (see getBoardMarkets). */
export async function getBoardMarketsLive(): Promise<MarketRow[]> {
  const { markets } = await getMarkets();
  return markets.map(toMarketRow);
}

/** The board's markets — NOW LIVE (ADR-084). GET /markets carries the real WC Final priced from the TxLINE feed
 *  (cortex-synthesized 1X2). We serve those real markets and DROP the fixture slate so the board never shows the
 *  eight fabricated simultaneous "live" matches (the #1 mockup signal). The fixture MARKETS remain only as an
 *  offline safety net if the API is unreachable at request time (server component, force-dynamic). */
export async function getBoardMarkets(): Promise<MarketRow[]> {
  try {
    const live = await getBoardMarketsLive();
    if (live.length) return live;
  } catch {
    /* API unreachable → fall through to the offline fixture slate */
  }
  return MARKETS;
}
