// statKey encodings (K1 — scores/soccer-feed). ⚠ Day-0: extract the FULL table from the soccer-feed
// page; the two below are confirmed in TxLINE's own example and are the ones settlement relies on
// (final home/away goals → 1X2 result derivation, TXLINE-MAP §3).
export const STAT_KEYS = {
  HOME_GOALS: 1002,
  AWAY_GOALS: 1003,
} as const;

export type StatKeyName = keyof typeof STAT_KEYS;
export type StatKey = (typeof STAT_KEYS)[StatKeyName];

const NAME_BY_ID: Record<number, StatKeyName> = { 1002: "HOME_GOALS", 1003: "AWAY_GOALS" };

/** Human label for a statKey id (falls back to `stat_<id>` for keys not yet in the table). */
export function statKeyName(id: number): string {
  return NAME_BY_ID[id] ?? `stat_${id}`;
}

/** The two statKeys needed to derive a 1X2 result from a final score (TXLINE-MAP §3). */
export const RESULT_STAT_KEYS = [STAT_KEYS.HOME_GOALS, STAT_KEYS.AWAY_GOALS] as const;
