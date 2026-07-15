// Typed loader over the BAKED TheSportsDB media manifest (crests / jerseys / atmosphere / player faces).
// Stillness only (ADR-051/ADR-062): images live in public/teams/, this manifest is imported (bundled, zero
// runtime fetch). Never call TheSportsDB from the app — the bake (scripts/bake-teams.mjs) is the only fetch.
import media from "../data/wc26/media.json";
import { teamByCode } from "../data/wc26";

export interface PlayerMedia {
  name: string;
  slug: string;
  pos: string; // TheSportsDB strPosition, e.g. "Goalkeeper" | "Centre-Back" | "Manager"
  file: string; // public path, e.g. "/teams/15/players/aziz-behich.jpg"
}
export interface TeamMedia {
  code: string;
  name: string;
  tsdbId: string;
  tsdbName?: string;
  badge?: string; // crest
  jersey?: string; // kit — the source of the kit-colour accent
  stadium?: string; // strFanart1 atmosphere shot (free tier has no strStadiumThumb)
  players: PlayerMedia[];
}

const byId = (media as { teams: Record<string, TeamMedia> }).teams;

/** Baked media for a FIFA 3-letter code, or null if the team wasn't matched on TheSportsDB. */
export function teamMediaByCode(code?: string | null): TeamMedia | null {
  const t = teamByCode(code);
  return t ? byId[t.id] ?? null : null;
}

/** Crest path for a code, or null (callers fall back to the flag disc). */
export function crestByCode(code?: string | null): string | null {
  return teamMediaByCode(code)?.badge ?? null;
}

/** Squad players with a face, excluding the manager/coach (they get their own chip). */
export function squadByCode(code?: string | null): PlayerMedia[] {
  const m = teamMediaByCode(code);
  if (!m) return [];
  return m.players.filter((p) => !/manager|coach/i.test(p.pos));
}

/** The manager/coach entry for a code, if TheSportsDB has one. */
export function managerByCode(code?: string | null): PlayerMedia | null {
  return teamMediaByCode(code)?.players.find((p) => /manager|coach/i.test(p.pos)) ?? null;
}
