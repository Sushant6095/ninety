// Pure mapper: football-data.org /competitions/{id}/matches JSON → grouped broadcast-strap chips (ADR-080).
// STILL data only — schedule + FINAL results. A LIVE chip carries NO score/minute here: those are TxLINE-owned
// (ADR-051) and read from the replay/fixture store in the component. This module never fabricates: a match with
// no usable teams is dropped, not invented.

export type ChipKind = "result" | "live" | "upcoming";

export interface BroadcastChip {
  id: string; // football-data match id (stable react key)
  matchId: string; // replay-store key, wc26-{home}-{away} — how the LIVE segment reads TxLINE state
  kind: ChipKind;
  sortMs: number; // utcDate epoch, for ordering
  dayLabel: string; // "YESTERDAY" | "TODAY" | "TOMORROW" | "WED 15"
  kickoff: string; // "HH:MM" UTC
  homeName: string;
  awayName: string;
  homeCode: string; // FIFA tla (flag lookup)
  awayCode: string;
  homeScore: number | null; // FINAL score — results only
  awayScore: number | null;
  stage: string | null; // "FINAL" | "3RD PLACE" | "SEMI-FINAL" | …
  status: string; // raw football-data status (aria/debug)
}

export interface BroadcastGroup {
  label: string; // "YESTERDAY" | "LIVE" | "TOMORROW" | …
  kind: ChipKind;
  chips: BroadcastChip[];
}

interface FdTeam {
  name?: string;
  shortName?: string;
  tla?: string;
}
interface FdMatch {
  id: number | string;
  utcDate: string;
  status: string;
  stage?: string;
  homeTeam?: FdTeam;
  awayTeam?: FdTeam;
  score?: { fullTime?: { home: number | null; away: number | null } };
}

const STAGE_LABEL: Record<string, string> = {
  FINAL: "FINAL",
  THIRD_PLACE: "3RD PLACE",
  SEMI_FINALS: "SEMI-FINAL",
  QUARTER_FINALS: "QUARTER-FINAL",
  LAST_16: "ROUND OF 16",
  LAST_32: "ROUND OF 32",
};

const LIVE_STATUS = new Set(["IN_PLAY", "PAUSED", "LIVE", "SUSPENDED"]);
const WD = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const dayStartMs = (ms: number) => {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

function dayLabel(matchMs: number, nowMs: number): string {
  const diff = Math.round((dayStartMs(matchMs) - dayStartMs(nowMs)) / 86_400_000);
  if (diff === -1) return "YESTERDAY";
  if (diff === 0) return "TODAY";
  if (diff === 1) return "TOMORROW";
  const d = new Date(matchMs);
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()}`;
}

const teamCode = (t?: FdTeam): string => (t?.tla || (t?.shortName || t?.name || "").slice(0, 3)).toUpperCase();
const teamName = (t?: FdTeam): string => t?.shortName || t?.name || t?.tla || "TBD";

function toChip(m: FdMatch, nowMs: number): BroadcastChip | null {
  if (!m.homeTeam || !m.awayTeam || !m.utcDate) return null;
  const kind: ChipKind = m.status === "FINISHED" ? "result" : LIVE_STATUS.has(m.status) ? "live" : "upcoming";
  const ms = Date.parse(m.utcDate);
  const ft = m.score?.fullTime;
  const homeCode = teamCode(m.homeTeam);
  const awayCode = teamCode(m.awayTeam);
  return {
    id: String(m.id),
    matchId: `wc26-${homeCode}-${awayCode}`.toLowerCase(),
    kind,
    sortMs: ms,
    dayLabel: dayLabel(ms, nowMs),
    kickoff: m.utcDate.slice(11, 16),
    homeName: teamName(m.homeTeam),
    awayName: teamName(m.awayTeam),
    homeCode,
    awayCode,
    homeScore: kind === "result" ? (ft?.home ?? null) : null,
    awayScore: kind === "result" ? (ft?.away ?? null) : null,
    stage: m.stage ? (STAGE_LABEL[m.stage] ?? null) : null,
    status: m.status,
  };
}

/** Group consecutive same-day chips into labelled segments, preserving the given order. */
function dayGroups(chips: BroadcastChip[], kind: ChipKind): BroadcastGroup[] {
  const out: BroadcastGroup[] = [];
  for (const chip of chips) {
    const last = out[out.length - 1];
    if (last && last.label === chip.dayLabel) last.chips.push(chip);
    else out.push({ label: chip.dayLabel, kind, chips: [chip] });
  }
  return out;
}

/**
 * Build the broadcast strap: results (past→today, by day) · LIVE (if any) · upcoming (today→future, by day).
 * `nowMs` is injected so the grouping is deterministic (and testable). Returns [] when there's nothing real.
 */
export function groupFixtures(matches: FdMatch[], nowMs: number): BroadcastGroup[] {
  const chips = matches.map((m) => toChip(m, nowMs)).filter((c): c is BroadcastChip => c !== null);
  chips.sort((a, b) => a.sortMs - b.sortMs);
  const results = chips.filter((c) => c.kind === "result");
  const live = chips.filter((c) => c.kind === "live");
  const upcoming = chips.filter((c) => c.kind === "upcoming");
  const groups: BroadcastGroup[] = [...dayGroups(results, "result")];
  if (live.length) groups.push({ label: "LIVE", kind: "live", chips: live });
  groups.push(...dayGroups(upcoming, "upcoming"));
  return groups;
}
