// Typed loaders over the baked top-20 WC26 player profiles (ADR-082). STILL data only (ADR-051): identity +
// FINAL tournament results, baked once by scripts/bake-player-profiles.mjs — never fetched at runtime. Small
// enough (20 players) to import directly; heavier player index (players.json) stays lazy elsewhere.
import file from "../../data/wc26/player-profiles.json";
import { MOMENTS, swingOf, type Moment } from "../../lib/moments";

export interface NinetyAxis {
  key: string;
  label: string;
  input: string; // the honest formula, shown on hover
  value: number; // 0..100, normalised across the cohort
  raw: number; // the actual per-match figure
}
export interface PlayerMatch {
  id: string;
  date: string; // ISO utc
  status: string;
  stage: string; // football-data stage token
  home: { code: string; name: string };
  away: { code: string; name: string };
  opp: { code: string; name: string };
  score: { h: number; a: number; winner: string | null } | null;
  side: "home" | "away";
  result: "W" | "L" | "D" | null;
}
export interface PlayerProfile {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  nat: string; // FIFA 3-letter (baked flag/crest key)
  natName: string | null;
  pos: string | null; // "Offence" | "Midfield" | "Defence" | "Goalkeeper"
  shirt: number | null;
  photo: string | null; // baked-local path, or null → initials avatar
  rank: number;
  goals: number;
  assists: number;
  penalties: number;
  playedMatches: number;
  matches: PlayerMatch[];
  matchesError: string | null;
  ninetyIndex: NinetyAxis[];
}
export interface ProfilesFile {
  source: string;
  bakedAt: string;
  query: string;
  note: string;
  budget: Record<string, unknown>;
  players: PlayerProfile[];
}

const DATA = file as ProfilesFile;
export const PROFILES: PlayerProfile[] = DATA.players;
export const PROFILES_META = { source: DATA.source, bakedAt: DATA.bakedAt, query: DATA.query, note: DATA.note };

const byId = new Map(PROFILES.map((p) => [p.id, p]));
export const playerById = (id: string): PlayerProfile | undefined => byId.get(id);
export const playerIds = (): string[] => PROFILES.map((p) => p.id);

/** Whole-years age at the tournament (deterministic — computed against bakedAt, not Date.now, so SSR == client). */
export function ageAt(dob: string | null, on = DATA.bakedAt): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  const d = new Date(on);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const m = d.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && d.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

/** dd Mon yyyy, deterministic (no locale drift). */
export function fmtDate(iso: string): string {
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const POS: Record<string, string> = { Offence: "Forward", Midfield: "Midfielder", Defence: "Defender", Goalkeeper: "Goalkeeper" };
export const posLabel = (pos: string | null): string => (pos ? POS[pos] ?? pos : "—");

const STAGE: Record<string, string> = {
  GROUP_STAGE: "Group",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  THIRD_PLACE: "3rd place",
  FINAL: "Final",
};
export const stageLabel = (s: string): string => STAGE[s] ?? s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const resultToken = (r: PlayerMatch["result"]): { label: string; cls: string } =>
  r === "W" ? { label: "W", cls: "text-up" } : r === "L" ? { label: "L", cls: "text-down" } : r === "D" ? { label: "D", cls: "text-lo" } : { label: "—", cls: "text-lo" };

/** Modeled Ninety market moments involving this nation — TEAM-level (never attributed to one player's goal, which
 *  would be fabrication). Empty for nations with no modeled market. Sorted by absolute swing (biggest first). */
export function marketMomentsFor(nat: string): Moment[] {
  const code = nat.toUpperCase();
  return MOMENTS.filter((m) => m.homeCode === code || m.awayCode === code).sort((a, b) => Math.abs(swingOf(b)) - Math.abs(swingOf(a)));
}

/** A prose bio template-filled from REAL baked fields — never an invented fact. */
export function proseFor(p: PlayerProfile): string {
  const age = ageAt(p.dob);
  const role = posLabel(p.pos).toLowerCase();
  const who = `${p.name}${age ? `, ${age},` : ""} is ${p.natName ?? p.nat}'s number-${p.rank} scorer at the 2026 World Cup`;
  const prod = `${p.goals} ${p.goals === 1 ? "goal" : "goals"} and ${p.assists} ${p.assists === 1 ? "assist" : "assists"} in ${p.playedMatches} ${p.playedMatches === 1 ? "match" : "matches"}`;
  const pen = p.penalties > 0 ? ` (${p.penalties} from the spot)` : "";
  const last = p.matches[0];
  const lastLine = last && last.score ? ` His last outing: ${last.home.code} ${last.score.h}–${last.score.a} ${last.away.code} in the ${stageLabel(last.stage).toLowerCase()}.` : "";
  return `${who} — a ${role} with ${prod}${pen}.${lastLine}`;
}
