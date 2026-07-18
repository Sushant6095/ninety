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

// Roster context, baked from football-data.org competition 2000 (ADR-081). STILL data only — squads and
// staff sit still during a match; live scores/prices/results stay TxLINE's. Never fetched at runtime.

export interface WcPlayer {
  id: string; // football-data player id
  name: string;
  pos: string | null; // football-data position, e.g. "Goalkeeper" | "Defence" | "Midfield" | "Offence"
  dob: string | null; // "YYYY-MM-DD"
  nat: string | null; // nationality (country name)
  teamId: string; // wc26 team id (crest disc + linkage)
  teamCode: string; // FIFA 3-letter
  teamName: string;
  photo: string | null; // baked local path ("/teams/{id}/players/{slug}.jpg") or null (falls back to crest)
}

export interface WcCoach {
  id: string;
  name: string;
  nat: string | null;
  teamId: string;
  teamCode: string;
  teamName: string;
  photo: string | null;
}

export interface WcReferee {
  name: string;
  nat: string | null;
}
