// SERVER-ONLY loaders for /team/[code] (ADR-083). This is the ONLY module that imports the 836 KB baked
// team-profiles.json — it must never be pulled into a client bundle, so client components import from data.ts
// (pure) instead. PINNED to the baked profiles: the honest default (STILL data, ADR-051), prerenders every team
// at build, never depends on a booted API. Mirrors the player page's pinned loaders. Unknown code → null → 404.
import file from "../../data/wc26/team-profiles.json";
import type { TeamProfile, TeamProfilesFile } from "./data";

const DATA = file as TeamProfilesFile;
export const TEAM_PROFILES: TeamProfile[] = DATA.teams;
export const PROFILES_META = { source: DATA.source, bakedAt: DATA.bakedAt, note: DATA.note };

const byCode = new Map(TEAM_PROFILES.map((t) => [t.code.toLowerCase(), t]));

export function loadTeamProfile(code: string): TeamProfile | null {
  return byCode.get(code.toLowerCase()) ?? null;
}

export function teamProfileCodes(): string[] {
  return TEAM_PROFILES.map((t) => t.code);
}

/** Group-mates (nations, same group) or league rivals (clubs) — for the "related teams" rail. Server-only. */
export function relatedTeams(t: TeamProfile, limit = 3): TeamProfile[] {
  if (t.kind === "nation" && t.group) {
    return TEAM_PROFILES.filter((x) => x.kind === "nation" && x.group === t.group && x.code !== t.code).slice(0, limit);
  }
  return TEAM_PROFILES.filter((x) => x.kind === "club" && x.code !== t.code).slice(0, limit);
}
