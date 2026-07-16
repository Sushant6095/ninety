// Shared number formatting — one home for credits/price/percent display so every screen reads identically.
// Numbers render in IBM Plex Mono via the `.num` class; these only produce the string.

// The shadcn `utils` alias (components.json) points here, so registry-pulled components import `cn` from
// "src/lib/format". The implementation lives in ./utils (clsx + tailwind-merge) — re-export it so the
// notio pull (and any future `shadcn add`) resolves cn without touching every component. (ADR-068)
export { cn } from "./utils";

/** Credits, thousands-grouped, no sign. e.g. 13511 → "13,511". */
export const fmtCR = (n: number): string => Math.round(n).toLocaleString("en-US");

/** Signed credits with the design's minus glyph. e.g. -640 → "−640", 1490 → "+1,490". */
export const signedCR = (n: number): string => (n >= 0 ? "+" : "−") + fmtCR(Math.abs(n));

/** A price/probability point, one decimal (design law). e.g. 66.9. */
export const fmtPrice = (n: number): string => n.toFixed(1);

/** Signed percent, one decimal. e.g. 14.5 → "+14.5%". */
export const signedPct = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(1) + "%";
