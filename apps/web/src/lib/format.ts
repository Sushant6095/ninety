// Shared number formatting — one home for credits/price/percent display so every screen reads identically.
// Numbers render in IBM Plex Mono via the `.num` class; these only produce the string.

/** Credits, thousands-grouped, no sign. e.g. 13511 → "13,511". */
export const fmtCR = (n: number): string => Math.round(n).toLocaleString("en-US");

/** Signed credits with the design's minus glyph. e.g. -640 → "−640", 1490 → "+1,490". */
export const signedCR = (n: number): string => (n >= 0 ? "+" : "−") + fmtCR(Math.abs(n));

/** A price/probability point, one decimal (design law). e.g. 66.9. */
export const fmtPrice = (n: number): string => n.toFixed(1);

/** Signed percent, one decimal. e.g. 14.5 → "+14.5%". */
export const signedPct = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(1) + "%";
