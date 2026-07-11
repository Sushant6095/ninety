// Knockout bracket fixture — GET /markets?stage. Each tie carries the two sides' advance price (win %) so a
// PriceChip reads at a glance; live ties link into the match. Later rounds are TBD until R16 resolves.
export type TieStatus = "LIVE" | "UPCOMING" | "TBD";

export interface Tie {
  id: string;
  matchId: string | null; // null = TBD (no market yet)
  home: string | null; // FIFA code, null = TBD
  away: string | null;
  homeProb: number | null; // 0..100 advance price
  awayProb: number | null;
  status: TieStatus;
  minute: number | null;
  time: string | null; // kickoff clock for upcoming
}

export interface Round {
  name: string;
  short: string;
  ties: Tie[];
}

const tbd = (id: string): Tie => ({ id, matchId: null, home: null, away: null, homeProb: null, awayProb: null, status: "TBD", minute: null, time: null });

export const BRACKET: Round[] = [
  {
    name: "Round of 16",
    short: "R16",
    ties: [
      { id: "r16-1", matchId: "wc26-can-mar", home: "CAN", away: "MAR", homeProb: 44.0, awayProb: 28.5, status: "LIVE", minute: 74, time: null },
      { id: "r16-2", matchId: "wc26-esp-jpn", home: "ESP", away: "JPN", homeProb: 68.2, awayProb: 12.2, status: "LIVE", minute: 58, time: null },
      { id: "r16-3", matchId: "wc26-arg-mex", home: "ARG", away: "MEX", homeProb: 44.1, awayProb: 27.2, status: "LIVE", minute: 12, time: null },
      { id: "r16-4", matchId: "wc26-ned-usa", home: "NED", away: "USA", homeProb: 45.5, awayProb: 26.4, status: "LIVE", minute: 30, time: null },
      { id: "r16-5", matchId: "wc26-ger-col", home: "GER", away: "COL", homeProb: 48.5, awayProb: 24.5, status: "UPCOMING", minute: null, time: "19:00" },
      { id: "r16-6", matchId: "wc26-bra-kor", home: "BRA", away: "KOR", homeProb: 72.0, awayProb: 10.0, status: "UPCOMING", minute: null, time: "22:00" },
      { id: "r16-7", matchId: "wc26-fra-sen", home: "FRA", away: "SEN", homeProb: 56.0, awayProb: 19.0, status: "UPCOMING", minute: null, time: "02:30" },
      { id: "r16-8", matchId: "wc26-por-uru", home: "POR", away: "URU", homeProb: 47.0, awayProb: 26.0, status: "UPCOMING", minute: null, time: "05:00" },
    ],
  },
  { name: "Quarter-finals", short: "QF", ties: [tbd("qf-1"), tbd("qf-2"), tbd("qf-3"), tbd("qf-4")] },
  { name: "Semi-finals", short: "SF", ties: [tbd("sf-1"), tbd("sf-2")] },
  { name: "Final", short: "F", ties: [tbd("f-1")] },
];
