// CONNECT read-model loaders for player profiles (ADR-082/072), mirroring lib/data/moments.ts. The profiles are
// baked STILL data (ADR-051), so the page renders from the fixtures by DEFAULT and prerenders as SSG — it never
// depends on a booted API at build time. The *Live paths call the typed client (GET /players, /players/:id) and are
// the un-pin target once the API read-model is canonical; the live profile fetch keeps the baked fixture on error so
// a transient API failure never blanks a known player page.
import { getPlayerProfiles, getPlayerProfile } from "../../lib/api";
import { PROFILES, playerById, type PlayerProfile } from "./data";

/** The live top-20 index — GET /players. Kept for CONNECT; un-pin `loadPlayerIndex` to this once live is canonical. */
export async function getPlayerIndexLive(): Promise<PlayerProfile[]> {
  const { players } = await getPlayerProfiles();
  return players as PlayerProfile[];
}

/** One live profile — GET /players/:id, with the baked fixture as the on-error fallback (never blanks a known page). */
export async function getPlayerProfileLive(id: string): Promise<PlayerProfile | null> {
  try {
    const { player } = await getPlayerProfile(id);
    return (player as PlayerProfile) ?? playerById(id) ?? null;
  } catch {
    return playerById(id) ?? null; // api() throws on non-2xx (incl. 404/503) — degrade to the baked STILL data
  }
}

/** The top-20 index. PINNED to the baked fixtures (the honest default: STILL data, ADR-055, SSG-friendly). */
export function loadPlayerIndex(): PlayerProfile[] {
  return PROFILES;
}

/** One profile for /player/[id]. PINNED to the baked fixtures — an unknown id stays null → a real 404. */
export function loadPlayerProfile(id: string): PlayerProfile | null {
  return playerById(id) ?? null;
}
