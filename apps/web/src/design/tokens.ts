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

export const tokens = { colors, cssVars, fonts, space, radius } as const;

export type SpaceToken = keyof typeof space;
export type Tokens = typeof tokens;

export default tokens;
