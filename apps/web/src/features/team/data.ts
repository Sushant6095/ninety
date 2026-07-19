// Types + PURE helpers for /team/[code] (ADR-083). This module is CLIENT-SAFE — it never imports the 836 KB
// team-profiles.json, so client components (MatchesPanel, tabs) can pull helpers here without dragging the whole
// dataset into their bundle (the players.json lesson in data/wc26/index.ts). The JSON import + lookups live in
// loaders.ts (server-only). STILL data only (ADR-051); mirrors features/player/data.ts so the pages read as one system.

export type TeamKind = "nation" | "club";
export type MatchResult = "W" | "L" | "D" | null;
export type Zone = "advance" | "eliminated" | null;

export interface TeamMatchSide {
  code: string | null; // FIFA tla (nations) / club tla — the TeamCrest key when present
  name: string;
  crest: string | null; // provider crest url (used only when there's no FIFA code)
}
export interface TeamMatch {
  id: string;
  date: string; // ISO utc
  status: string; // FINISHED | TIMED | SCHEDULED | IN_PLAY | ...
  competition: { code: string | null; name: string; emblem: string | null };
  stage: string | null;
  home: TeamMatchSide;
  away: TeamMatchSide;
  side: "home" | "away";
  score: { h: number; a: number; winner: string | null } | null;
  result: MatchResult;
}
export interface StandingRow {
  position: number;
  teamId: string;
  code: string | null; // FIFA code when the row is a WC26 nation
  name: string;
  crest: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: string | null; // "W,W,D,L,W" (leagues); null for WC group stage
  zone: Zone;
}
export interface StandingsGroup {
  competition: string;
  groupName: string | null;
  note: string;
  rows: StandingRow[];
}
export interface SquadPlayer {
  id: string;
  name: string;
  pos: string | null;
  dob: string | null;
  photo: string | null;
  navigable: boolean; // true → links to /player/[id] (only players baked with a real profile)
}
export interface TeamCoach {
  name: string;
  nat: string | null;
  photo: string | null;
}
export interface TeamProfile {
  code: string; // route key: FIFA tla (nation) or slug (club)
  kind: TeamKind;
  fdId: number | null; // football-data team id — clubs only (highlights their own standings row); null for nations
  name: string;
  shortName: string | null;
  tla: string | null;
  fifaCode: string | null; // nations only — flag/crest + market-moment key
  crest: string | null; // baked local crest (clubs); null for nations (render via fifaCode)
  country: string | null;
  group: string | null; // nations: "A".."L"
  founded: number | null;
  clubColors: string | null;
  venue: string | null;
  website: string | null;
  coach: TeamCoach | null;
  squad: SquadPlayer[];
  matches: TeamMatch[];
  standings: StandingsGroup[];
}
export interface TeamProfilesFile {
  source: string;
  bakedAt: string;
  note: string;
  counts: { nations: number; clubs: number };
  teams: TeamProfile[];
}

/** dd Mon yyyy, deterministic (no locale drift) — matches the player page. */
export function fmtDate(iso: string): string {
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
/** dd Mon · HH:MM UTC — for upcoming kickoffs. */
export function fmtKickoff(iso: string): string {
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} · ${hh}:${mm}`;
}

const POS: Record<string, string> = { Offence: "Forwards", Midfield: "Midfielders", Defence: "Defenders", Goalkeeper: "Goalkeepers" };
export const posGroupLabel = (pos: string | null): string => (pos ? POS[pos] ?? pos : "Other");
const POS_ORDER = ["Goalkeeper", "Defence", "Midfield", "Offence"];
export const posRank = (pos: string | null): number => {
  const i = POS_ORDER.indexOf(pos ?? "");
  return i === -1 ? POS_ORDER.length : i;
};

const STAGE: Record<string, string> = {
  GROUP_STAGE: "Group",
  LAST_16: "Round of 16",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  THIRD_PLACE: "3rd place",
  FINAL: "Final",
  REGULAR_SEASON: "League",
};
export const stageLabel = (s: string | null): string =>
  !s ? "" : STAGE[s] ?? s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const resultToken = (r: MatchResult): { label: string; cls: string } =>
  r === "W" ? { label: "W", cls: "text-up" } : r === "L" ? { label: "L", cls: "text-down" } : r === "D" ? { label: "D", cls: "text-lo" } : { label: "—", cls: "text-lo" };

/** Left-border token per qualification zone — --up (advance), --down (eliminated), transparent otherwise. */
export const zoneBorder = (z: Zone): string =>
  z === "advance" ? "border-l-2 border-l-up" : z === "eliminated" ? "border-l-2 border-l-down" : "border-l-2 border-l-transparent";

export const isFinished = (m: TeamMatch): boolean => m.score != null;
export const previousMatch = (t: TeamProfile): TeamMatch | null => t.matches.find(isFinished) ?? null;
export const nextMatch = (t: TeamProfile): TeamMatch | null => t.matches.find((m) => !isFinished(m)) ?? null;

/** Opponent side of a match, from this team's perspective. */
export const opponentOf = (m: TeamMatch): TeamMatchSide => (m.side === "home" ? m.away : m.home);

/** Last-5 form (most-recent first) — derived from the finished matches, exactly as the reference does. */
export function recentForm(t: TeamProfile, limit = 5): { match: TeamMatch; result: MatchResult }[] {
  return t.matches.filter(isFinished).slice(0, limit).map((m) => ({ match: m, result: m.result }));
}

/** Real, match-derived tallies for the Statistics tab — never invented (played/W/D/L, goals for/against). */
export function tallies(t: TeamProfile): { played: number; won: number; drawn: number; lost: number; gf: number; ga: number } {
  const fin = t.matches.filter(isFinished);
  let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
  for (const m of fin) {
    const mine = m.side === "home" ? m.score!.h : m.score!.a;
    const theirs = m.side === "home" ? m.score!.a : m.score!.h;
    gf += mine; ga += theirs;
    if (m.result === "W") won++; else if (m.result === "D") drawn++; else lost++;
  }
  return { played: fin.length, won, drawn, lost, gf, ga };
}

/** Group matches by competition name, preserving the finished-then-upcoming order — the left panel's grouping. */
export function byCompetition(matches: TeamMatch[]): { competition: string; emblem: string | null; matches: TeamMatch[] }[] {
  const order: string[] = [];
  const map = new Map<string, { competition: string; emblem: string | null; matches: TeamMatch[] }>();
  for (const m of matches) {
    const key = m.competition.name;
    if (!map.has(key)) {
      map.set(key, { competition: key, emblem: m.competition.emblem, matches: [] });
      order.push(key);
    }
    map.get(key)!.matches.push(m);
  }
  return order.map((k) => map.get(k)!);
}

// Age against a FIXED tournament date, not Date.now — so SSG output == client and squad ages never drift.
const WC_ON = "2026-07-01";
export function ageApprox(dob: string | null): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  const d = new Date(WC_ON);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const m = d.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && d.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

/** This team's own row in its first table (for the Statistics tab) — by FIFA code (nations) or fd id (clubs). */
export function selfStandingRow(t: TeamProfile): StandingRow | null {
  const rows = t.standings[0]?.rows ?? [];
  return rows.find((r) => (t.kind === "nation" ? !!t.fifaCode && r.code === t.fifaCode : t.fdId != null && r.teamId === String(t.fdId))) ?? null;
}

/** Initials for the coach avatar (token colours only — the Design law forbids raw team hex). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
