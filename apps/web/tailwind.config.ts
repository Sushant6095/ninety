import type { Config } from "tailwindcss";
import { space, tracking } from "./src/design/tokens";
// Colors are CSS vars (styles/tokens.css); the spacing rhythm + type live in src/design/tokens.ts (the authority).
export default {
  content: ["./src/**/*.{ts,tsx}"],
  // hover: variants compile behind @media (hover:hover) — touch taps stop triggering sticky hovers.
  future: { hoverOnlyWhenSupported: true },
  theme: { extend: {
    colors: {
      // color-mix + <alpha-value> so the slash-opacity modifier (bg-halt/15, text-hi/90, ring-hairline/60 …)
      // actually applies alpha. A bare `var(--x)` makes `/NN` emit invalid `rgb(#hex / a)` → the browser drops
      // it (transparent bg / gray-fallback border / inherited text) — proven broken across 294 usages. Solid
      // usage (text-halt) resolves to 100% = the raw token, unchanged.
      bg: "color-mix(in srgb, var(--bg) calc(<alpha-value> * 100%), transparent)",
      surface: "color-mix(in srgb, var(--surface) calc(<alpha-value> * 100%), transparent)",
      hairline: "color-mix(in srgb, var(--hairline) calc(<alpha-value> * 100%), transparent)",
      up: "color-mix(in srgb, var(--up) calc(<alpha-value> * 100%), transparent)",
      down: "color-mix(in srgb, var(--down) calc(<alpha-value> * 100%), transparent)",
      halt: "color-mix(in srgb, var(--halt) calc(<alpha-value> * 100%), transparent)",
      chain: "color-mix(in srgb, var(--chain) calc(<alpha-value> * 100%), transparent)",
      hi: "color-mix(in srgb, var(--text-hi) calc(<alpha-value> * 100%), transparent)",
      lo: "color-mix(in srgb, var(--text-lo) calc(<alpha-value> * 100%), transparent)",
    },
    fontFamily: { display: ["var(--font-display)"], ui: ["var(--font-ui)"], mono: ["var(--font-mono)"] },
    borderRadius: { card: "var(--radius-card)", chip: "var(--radius-chip)" },
    // Motion routed through the tokens (styles/tokens.css mirrors design/motion.ts): `duration-200`
    // keeps working, and every transition utility now runs the ninety ease, not Tailwind's default.
    transitionDuration: { fast: "var(--duration-fast)", DEFAULT: "var(--duration)", slow: "var(--duration-slow)" },
    transitionTimingFunction: { DEFAULT: "var(--ease-out)" },
    spacing: { ...space }, // the intentional spacing scale from tokens.ts (p-md, gap-lg, …)
    letterSpacing: { ...tracking }, // tracking-micro … tracking-hero from tokens.ts — no arbitrary tracking-[…em]
    fontSize: {
      // The enforceable 6-step type scale (Series-C foundation). Use these named steps over arbitrary text-[Npx];
      // line-height is baked in, tracking stays on classes (label/body carry none by default). 11px is the label
      // floor — nothing renders below it. display-xl is reserved for hero score numbers only.
      label: ["11px", "1.4"], // micro tags, uppercase meta — the floor
      caption: ["12px", "1.45"], // secondary / meta
      body: ["13px", "1.5"], // default UI text
      strong: ["14px", "1.45"], // labels, buttons, active values
      heading: ["19px", { lineHeight: "1.15", letterSpacing: "-0.01em" }], // panel titles (Archivo)
      display: ["26px", { lineHeight: "1.1", letterSpacing: "-0.01em" }], // big data numbers — position, portfolio, movers (Archivo)
      "display-xl": ["40px", { lineHeight: "1", letterSpacing: "-0.02em" }], // the big live match score only
      // Marketing display steps (landing/how) — fluid clamps from tokens.css; line-height/tracking baked in.
      hero: ["var(--text-hero)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
      section: ["var(--text-section)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      stat: ["var(--text-stat)", { lineHeight: "1" }],
      number: ["var(--text-number)", { lineHeight: "1", letterSpacing: "-0.03em" }],
    },
    // Marquee (magicui pull, re-skinned). Vars are --marquee-* on purpose: the global --duration
    // is the 200ms motion token and MUST NOT drive an infinite scroll loop.
    keyframes: {
      marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(calc(-100% - var(--marquee-gap)))" } },
      "marquee-vertical": { from: { transform: "translateY(0)" }, to: { transform: "translateY(calc(-100% - var(--marquee-gap)))" } },
    },
    animation: {
      marquee: "marquee var(--marquee-duration) linear infinite",
      "marquee-vertical": "marquee-vertical var(--marquee-duration) linear infinite",
    },
  } },
} satisfies Config;
