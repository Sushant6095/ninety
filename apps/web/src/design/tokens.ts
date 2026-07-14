// Ninety design tokens — THE TYPED SOURCE OF TRUTH for the design system's SHAPE. (Brand: Ninety, ADR-044.)
//
// RECONCILIATION NOTE (important): this repo's design-law hook forbids raw hex in code —
// colors live exactly once, as CSS custom properties in tokens.css. So this file does NOT
// restate hex; it is the single TYPED authority that names every token, documents its
// semantics, and maps each color to its `var(--…)`. There is therefore only ONE hex copy
// in the whole codebase (styles/tokens.css). Consumers:
//   • styles/tokens.css        — defines the raw hex (the hook's sanctioned home)
//   • tailwind.config.ts        — maps Tailwind keys → the same CSS vars
//   • components / design-cop    — import THIS file for typed, legal values + semantics
// Change a token: edit the hex in tokens.css and (if the NAME changes) here. Never add a
// third palette copy.

/** Color tokens as CSS-var expressions — drop straight into `style` / className-free inline styles. */
export const colors = {
  bg: "var(--bg)", // app background (near-black, calm terminal)
  surface: "var(--surface)", // elevated card / panel
  hairline: "var(--hairline)", // 1px borders, dividers — depth without shadow spam
  up: "var(--up)", // price up / gain / winning outcome
  down: "var(--down)", // price down / loss / losing outcome
  halt: "var(--halt)", // AMBER — market halts ONLY (goal/red/pen). Never decorative.
  chain: "var(--chain)", // VIOLET — on-chain UI ONLY (ProofBadge, Solscan, mint sigs). Never decorative.
  textHi: "var(--text-hi)", // primary text / live numbers
  textLo: "var(--text-lo)", // secondary text / labels / axes
} as const;

/** The raw CSS custom-property names, for `getComputedStyle` resolution (canvas can't read var()). */
export const cssVars = {
  bg: "--bg",
  surface: "--surface",
  hairline: "--hairline",
  up: "--up",
  down: "--down",
  halt: "--halt",
  chain: "--chain",
  textHi: "--text-hi",
  textLo: "--text-lo",
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Resolve a color token to its concrete hex at runtime. Use this ONLY where a real color
 * string is required and CSS vars don't resolve — i.e. the lightweight-charts canvas (the
 * Momentum River). Everywhere else use `colors.*` (var expressions) so the CSS var stays
 * the single source. SSR-safe: returns "" on the server.
 */
export function resolveColor(token: ColorToken): string {
  if (typeof window === "undefined" || typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(cssVars[token]).trim();
}

export const fonts = {
  display: "Archivo", // hero numbers + headings (weight + character)
  ui: "Inter", // all UI text / labels
  mono: "IBM Plex Mono", // ALL numbers — tabular-nums, prices one decimal
} as const;

// Intentional spacing rhythm — NOT uniform Tailwind steps. Screens breathe by using these,
// not by scattering p-2/p-3/p-4 at random.
export const space = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "40px",
  "3xl": "64px",
  section: "clamp(4rem, 3rem + 5vw, 10rem)",
} as const;

export const radius = {
  card: "16px", // --radius-card
  chip: "999px", // --radius-chip (pills, badges)
  sm: "8px",
} as const;

// ── Series-C foundation (WS1/WS2) ────────────────────────────────────────────
// 8pt base with a 4pt sub-unit — the ONLY permitted spacing steps. No 6/10/14px strays.
export const grid = {
  1: "4px", 2: "8px", 3: "12px", 4: "16px", 6: "24px", 8: "32px", 12: "48px", 16: "64px",
} as const;

// Two-tier spacing rhythm: tight WITHIN a group, air BETWEEN groups. Premium feel lives here —
// uniform padding everywhere is what reads as MVP. Density (WS4) tunes these, not the type scale.
export const rhythm = {
  intra: "8px", // gaps inside a group (rows in a list, label→value)
  intraLoose: "12px", // a touch more air inside denser groups
  inter: "24px", // between sibling groups / cards
  interLoose: "32px", // between major regions
  section: "48px", // page-level section breaks
} as const;

// The enforceable 6-step type scale — mirrors tailwind.config `fontSize`. 11px is the floor (nothing below).
// display-xl (40px) is reserved for the big live score only. Change here AND in tailwind.config together.
export const type = {
  label: { size: "11px", lineHeight: "1.4" },
  caption: { size: "12px", lineHeight: "1.45" },
  body: { size: "13px", lineHeight: "1.5" },
  strong: { size: "14px", lineHeight: "1.45" },
  heading: { size: "19px", lineHeight: "1.15", letterSpacing: "-0.01em" },
  display: { size: "26px", lineHeight: "1.1", letterSpacing: "-0.01em" },
  displayXl: { size: "40px", lineHeight: "1", letterSpacing: "-0.02em" },
} as const;

// Letter-spacing scale — the ONLY tracking values components may use (tailwind.config maps them to
// tracking-micro … tracking-hero; `wide` re-pins Tailwind's default so tracking-wide is token-sourced).
export const tracking = {
  micro: "0.08em", // inline mono tags (score chips, ticker cells)
  tag: "0.1em", // small status tags
  label: "0.12em", // the standard uppercase section label
  caps: "0.14em", // wide eyebrow caps (landing labels)
  banner: "0.16em", // rare banner caps
  hero: "0.2em", // widest — one-off hero eyebrows
  wide: "0.025em", // Tailwind's default `wide`, pinned here so every tracking-* traces to tokens
  tight: "-0.02em", // display stat numbers (Jul 19 band, how-hero)
  tighter: "-0.03em", // the wordmark only
} as const;

export const tokens = { colors, cssVars, fonts, space, grid, rhythm, radius, type, tracking } as const;

export type SpaceToken = keyof typeof space;
export type TypeToken = keyof typeof type;
export type Tokens = typeof tokens;

export default tokens;
