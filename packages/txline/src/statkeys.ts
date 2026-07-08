// statKey encodings (K1 — scores/soccer-feed). REALITY CORRECTION (verified live, ADR-015):
// the map guessed 1002/1003 ≈ home/away goals, but the live scores feed shows goals live in
// Score.{Participant1,Participant2}.Total.Goals — NOT in the numeric Stats map. So for settlement
// (TXLINE-MAP §3) read goals from the Score object; the Stats map keys mean other metrics whose
// exact meanings still need the soccer-feed table.

/** Read final goals for a fixture from a live ScoreState's Score.*.Total.Goals (the source of truth). */
export function goalsFromScore(score: {
  Participant1?: { Total?: { Goals?: number } };
  Participant2?: { Total?: { Goals?: number } };
} | undefined): { home: number; away: number } | null {
  const h = score?.Participant1?.Total?.Goals;
  const a = score?.Participant2?.Total?.Goals;
  return typeof h === "number" && typeof a === "number" ? { home: h, away: a } : null;
}

// ⚠ Day-0: the numeric Stats map key → metric table (scores/soccer-feed) is not yet transcribed.
// Live samples show keys like 1..8, 1001..1008, 2001..2008, etc. Do NOT assume any key is goals.
export const STAT_KEY_TABLE_CONFIRMED = false;

// SETTLEMENT statKeys (admin-confirmed 2026-07-08, K1 scores feed): the txoracle-anchored stat-validation tree keys
// TOTAL GOALS as statKey 1 = Participant 1 (home), statKey 2 = Participant 2 (away). This is the anchored-proof tree,
// distinct from the live SSE Stats map (which carries no goals — see above). Settlement proves these from the score
// record whose Action === "game_finalised" (ADR-037). ⚠ Total goals read LEVEL for a penalty-shootout win.
export const STAT_KEY_HOME_GOALS = 1;
export const STAT_KEY_AWAY_GOALS = 2;
