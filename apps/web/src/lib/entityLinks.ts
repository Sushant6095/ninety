// The honesty-gate resolver (ADR-084): the ONE place that answers "does this entity have a real page?" so every
// surface links consistently and NEVER guesses an id or ships a 404. Backed by a tiny baked index (link-index.json,
// derived from player-profiles + team-profiles) so importing it anywhere adds ~2 KB, not the full profile JSONs.
//   resolvable  → routes.player(id) / routes.team(code)   (a real Link)
//   unresolvable → null                                    (the caller renders plain text)
import index from "../data/wc26/link-index.json";
import { routes } from "./routes";

interface LinkIndex {
  players: { id: string; name: string; last: string; nat: string }[];
  teamCodes: string[];
}
const IDX = index as LinkIndex;

const TEAM_CODES = new Set(IDX.teamCodes.map((c) => c.toUpperCase()));
const PLAYER_IDS = new Set(IDX.players.map((p) => p.id));

/** Diacritic-insensitive, case-insensitive normalization ("Mbappé" → "mbappe"). */
const COMBINING = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string): string => s.normalize("NFD").replace(COMBINING, "").toLowerCase().trim();

// name → id, and last-name → id (only when that last name is UNIQUE among the 20; ambiguous last names resolve to
// null so we never link the wrong player). Built once at module load over the 20-entry index.
const byName = new Map<string, string>();
const lastCount = new Map<string, number>();
for (const p of IDX.players) {
  byName.set(norm(p.name), p.id);
  const l = norm(p.last);
  lastCount.set(l, (lastCount.get(l) ?? 0) + 1);
}
const byLast = new Map<string, string>();
for (const p of IDX.players) {
  const l = norm(p.last);
  if (lastCount.get(l) === 1) byLast.set(l, p.id);
}

/** /team/[code] if that code has a baked profile, else null. Codes are FIFA-3 for nations, slugs for clubs. */
export function teamHref(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.toUpperCase();
  return TEAM_CODES.has(c) ? routes.team(c) : null;
}

/** /player/[id] if that football-data person id is one of the baked top-20, else null. */
export function playerHref(id: string | null | undefined): string | null {
  if (!id) return null;
  return PLAYER_IDS.has(String(id)) ? routes.player(String(id)) : null;
}

/** Resolve a player NAME (from lineups/events/booth, which carry names not ids) to /player/[id] — exact full-name
 *  first, then a UNIQUE last-name match. Returns null for anything unknown or ambiguous (stays plain text). */
export function playerHrefByName(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = norm(name);
  const id = byName.get(n) ?? byLast.get(n) ?? byLast.get(norm(name.split(/\s+/).slice(-1)[0] ?? ""));
  return id ? routes.player(id) : null;
}
