// Typed loaders over the baked WC26 context JSON. Import from here, never fetch worldcup26 at runtime.
import teamsJson from "./teams.json";
import groupsJson from "./groups.json";
import stadiumsJson from "./stadiums.json";
import gamesJson from "./games.json";
import type { WcTeam, WcGroup, WcStadium, WcGame } from "./types";

export type { WcTeam, WcGroup, WcStadium, WcGame, WcStanding, WcGameType } from "./types";

export const TEAMS = teamsJson as WcTeam[];
export const GROUPS = groupsJson as WcGroup[];
export const STADIUMS = stadiumsJson as WcStadium[];
export const GAMES = gamesJson as WcGame[];

const teamsById = new Map(TEAMS.map((t) => [t.id, t]));
const teamsByCode = new Map(TEAMS.map((t) => [t.code, t]));
const stadiumsById = new Map(STADIUMS.map((s) => [s.id, s]));

export const teamById = (id: string | null | undefined): WcTeam | undefined => (id ? teamsById.get(id) : undefined);
export const teamByCode = (code: string | null | undefined): WcTeam | undefined => (code ? teamsByCode.get(code.toUpperCase()) : undefined);
export const stadiumById = (id: string | null | undefined): WcStadium | undefined => (id ? stadiumsById.get(id) : undefined);
export const gamesByType = (type: WcGame["type"]): WcGame[] => GAMES.filter((g) => g.type === type);
