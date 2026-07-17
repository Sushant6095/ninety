// CONNECT (Phase 2) — live global search (ADR-072). Wraps the api `search()` and maps its rows into the shape
// the ⌘K palette renders. The live /search returns team NAMES + Match rows only (no crest codes — team metadata is
// baked, ADR-051), so we derive the FIFA code from the baked wc26 team set here. Score/minute stay TxLINE-owned
// (the match store fills them at render). Play-money vocabulary only: matches, teams — never bet/odds/stake.
import { search } from "../api";
import { TEAMS } from "../../data/wc26";

/** A ⌘K match hit — the subset MatchCommandItem needs; live minute/status come from the match store, not here. */
export interface SearchMatch {
  matchId: string;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
}
export interface SearchResults {
  teams: { name: string; code: string }[];
  matches: SearchMatch[];
}

// name → FIFA code, over the baked wc26 team set (the only place names and codes coexist client-side).
const codeByName = new Map(TEAMS.map((t) => [t.name.toLowerCase(), t.code]));
const codeFor = (name: string): string => codeByName.get(name.toLowerCase()) ?? "";

interface RawMatch {
  id: string;
  home: string;
  away: string;
}

/** Query the live /search and reshape rows for the palette. Throws on a network/API error so the caller can
 *  fall back to the baked fixture path — this never invents results (only what the API returned). */
export async function searchLive(q: string): Promise<SearchResults> {
  const { teams, matches } = await search(q);
  return {
    teams: teams.map((t) => ({ name: t.name, code: codeFor(t.name) })),
    matches: (matches as RawMatch[]).map((m) => ({
      matchId: m.id,
      home: m.home,
      away: m.away,
      homeCode: codeFor(m.home),
      awayCode: codeFor(m.away),
    })),
  };
}
