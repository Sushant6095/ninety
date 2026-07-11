// Match-view depth (Sofascore-style) for the Terminal fixture match (AUS vs EGY). Illustrative fixture data —
// TxLINE gives scores/odds/proofs, not lineups/ratings, so these populate the Stats/Lineups/H2H tabs for the demo.

export interface StatRow {
  label: string;
  home: number;
  away: number;
  pct?: boolean; // render as a percentage split (possession, pass acc.)
}
// AUS (home) vs EGY (away) — Egypt lead 0–1 on the counter.
export const MATCH_STATS: StatRow[] = [
  { label: "Possession", home: 57, away: 43, pct: true },
  { label: "Total shots", home: 9, away: 11 },
  { label: "Shots on target", home: 2, away: 5 },
  { label: "Expected goals (xG)", home: 0.7, away: 1.4 },
  { label: "Corners", home: 6, away: 4 },
  { label: "Fouls", home: 9, away: 12 },
  { label: "Offsides", home: 2, away: 1 },
  { label: "Yellow cards", home: 1, away: 2 },
  { label: "Pass accuracy", home: 84, away: 79, pct: true },
];

export interface Player {
  num: number;
  name: string;
}
export interface Lineup {
  code: string; // team code
  formation: string; // "4-3-3"
  rows: number[]; // outfield rows front→back is handled in the component; GK implicit as first entry here
  xi: Player[]; // 11, ordered GK → forwards
  subs: Player[];
}

// rows include the GK row (1) first, then defence → attack.
export const LINEUPS: { home: Lineup; away: Lineup } = {
  home: {
    code: "AUS",
    formation: "4-3-3",
    rows: [1, 4, 3, 3],
    xi: [
      { num: 1, name: "Ryan" },
      { num: 19, name: "Atkinson" }, { num: 20, name: "Souttar" }, { num: 4, name: "Rowles" }, { num: 16, name: "Behich" },
      { num: 22, name: "Baccus" }, { num: 13, name: "Irvine" }, { num: 25, name: "McGree" },
      { num: 17, name: "Leckie" }, { num: 15, name: "Duke" }, { num: 8, name: "Goodwin" },
    ],
    subs: [{ num: 18, name: "Vukovic" }, { num: 5, name: "Bos" }, { num: 23, name: "Tilio" }, { num: 11, name: "Boyle" }],
  },
  away: {
    code: "EGY",
    formation: "4-2-3-1",
    rows: [1, 4, 2, 3, 1],
    xi: [
      { num: 23, name: "El Shenawy" },
      { num: 2, name: "Fathy" }, { num: 6, name: "Hegazi" }, { num: 3, name: "Abdelmonem" }, { num: 13, name: "Hamdi" },
      { num: 17, name: "Elneny" }, { num: 8, name: "Attia" },
      { num: 21, name: "Trezeguet" }, { num: 10, name: "Zizo" }, { num: 14, name: "Ashour" },
      { num: 9, name: "Marmoush" },
    ],
    subs: [{ num: 1, name: "Sobhy" }, { num: 7, name: "Kahraba" }, { num: 11, name: "Sherif" }, { num: 19, name: "Fotouh" }],
  },
};

export interface H2HMatch {
  date: string;
  comp: string;
  home: string;
  away: string;
  score: string;
  win: "H" | "A" | "D";
}
export const H2H: H2HMatch[] = [
  { date: "Jun 2024", comp: "Friendly", home: "EGY", away: "AUS", score: "2–1", win: "H" },
  { date: "Nov 2022", comp: "Friendly", home: "AUS", away: "EGY", score: "0–0", win: "D" },
  { date: "Mar 2021", comp: "Friendly", home: "EGY", away: "AUS", score: "1–2", win: "A" },
  { date: "Sep 2019", comp: "Friendly", home: "AUS", away: "EGY", score: "3–1", win: "H" },
  { date: "Jun 2018", comp: "World Cup", home: "EGY", away: "AUS", score: "1–1", win: "D" },
];

// Recent form, most-recent first.
export const FORM: { home: ("W" | "D" | "L")[]; away: ("W" | "D" | "L")[] } = {
  home: ["W", "L", "D", "W", "L"],
  away: ["W", "W", "D", "L", "W"],
};
