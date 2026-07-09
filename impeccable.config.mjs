// Impeccable — CI anti-slop gate for apps/web (impeccable.style).
//
// GOVERNING LAW: Impeccable enforces UNIVERSAL design-quality rules. OMNIPITCH's design system
// (the ui-craft skill + apps/web/src/design/tokens.ts + motion.ts) is the HIGHER law. On any
// conflict, OMNIPITCH's tokens and the trading-terminal domain WIN. The whitelist below exempts
// intentional financial-terminal choices that a generic SaaS-landing-page linter would
// misread as "slop." Everything not whitelisted is treated as a real gap.
//
// This is OMNIPITCH — a live financial exchange terminal, not a marketing site. Judge it as
// Bloomberg/Hyperliquid/Polymarket would be judged, not as a startup splash page.
//
// NOTE: this config's shape is written to match impeccable.style/docs; validate the exact keys
// against `npx impeccable --help` on the first (report-only) CI run and adjust if the schema differs.

export default {
  // What to scan.
  target: "apps/web/src",

  // WHITELIST — intentional OMNIPITCH design tokens, NOT slop. Each with its rationale.
  whitelist: [
    {
      id: "dark-theme-accent-tokens",
      reason:
        "Dark theme with semantic accent colors is correct for a financial terminal. --halt (amber) marks market HALTS only; --chain (violet) marks ON-CHAIN UI only. These are meaning-bearing state tokens, not decoration. (tokens.ts)",
    },
    {
      id: "mono-numeric-tabular",
      reason:
        "IBM Plex Mono on all numeric/tabular content is trading-terminal-correct — prices must align and not jitter on tick. A generic linter flags mono-for-body; here mono is scoped to numbers, which is exactly right.",
    },
    {
      id: "hairline-surface-cards",
      reason:
        "Hairline-bordered surface cards (1px --hairline on --surface) create depth without shadow spam — the terminal aesthetic. Not the flat/borderless SaaS card the linter expects.",
    },
    {
      id: "inter-ui-archivo-display",
      reason:
        "Inter for UI text paired with Archivo for display/hero numbers IS a deliberate type hierarchy (two families, scale contrast). This is a pairing strategy, not a monotonous single-font fallback.",
    },
  ],

  // HARD FAILURES in CI — these match ui-craft law; a violation is a real gap to fix.
  rules: {
    "nested-cards": "error", // a card inside a card = lost hierarchy
    "monotonous-spacing": "error", // uniform padding everywhere = no rhythm (use the spacing scale)
    "flat-type-hierarchy": "error", // no scale contrast = stats-site flatness
    "side-tab-accent-border": "error", // the classic left-accent-bar slop pattern
    "oversized-icons": "error", // icons competing with content
    "gradient-text": "error", // banned — reads as demo-ware
    "layout-property-animation": "error", // animate transform/opacity only (motion.ts law)
    "bounce-easing": "error", // no bounce — ease-out only (motion.ts)
    "low-contrast": "error", // text contrast must clear 4.5:1
    "cramped-padding": "error", // touch targets + breathing room
    "line-length": "error", // readable measure
    "redundant-ux-writing": "error", // no filler microcopy; plain verbs
    "modal-abuse": "error", // don't trap flows in modals
  },
};
