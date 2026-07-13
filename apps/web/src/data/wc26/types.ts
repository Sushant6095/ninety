// WC26 static context types (baked from worldcup26.ir at build time — ADR-051). Static only:
// no scores/goals/prices/state ever live here — those are TxLINE's and only TxLINE's.

export interface WcTeam {
  id: string;
  name: string;
  code: string; // FIFA 3-letter
  iso2: string; // lowercase, for flagcdn
  flag: string; // flagcdn URL
  group: string; // "A".."L"
}

export interface WcStanding {
  teamId: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface WcGroup {
  name: string; // "A".."L"
  standings: WcStanding[];
}

export interface WcStadium {
  id: string;
  name: string;
  fifaName: string | null;
  city: string;
  country: string;
  capacity: number;
  region: string | null;
}

export type WcGameType = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface WcGame {
  id: string; // "1".."104"
  type: WcGameType;
  matchday: number;
  kickoff: string; // "MM/DD/YYYY HH:MM" venue-local
  stadiumId: string;
  homeTeamId: string | null; // group only; null for knockouts (result-dependent — not ours to assert)
  awayTeamId: string | null;
  homeLabel: string | null; // "Winner Group A" / "Winner Match 101" (knockouts)
  awayLabel: string | null;
}
