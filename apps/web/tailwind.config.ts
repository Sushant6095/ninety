import type { Config } from "tailwindcss";
import { space, tracking } from "./src/design/tokens";
// Colors are CSS vars (styles/tokens.css); the spacing rhythm + type live in src/design/tokens.ts (the authority).
export default {
  content: ["./src/**/*.{ts,tsx}"],
  // Dark-only (v1): html carries a permanent `dark` class (layout.tsx). class-strategy (not media) so
  // the notio pull's `dark:` variants resolve deterministically, not by the visitor's OS preference.
  darkMode: "class",
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
      // shadcn/notio semantic aliases → Ninety tokens (styles/tokens.css). Same color-mix+<alpha-value>
      // pattern so notio's opacity modifiers (bg-primary/10, border-border/50, text-muted-foreground/40)
      // apply. Nested {DEFAULT,foreground} matches shadcn: bg-card + text-card-foreground both resolve.
      background: "color-mix(in srgb, var(--background) calc(<alpha-value> * 100%), transparent)",
      foreground: "color-mix(in srgb, var(--foreground) calc(<alpha-value> * 100%), transparent)",
      card: { DEFAULT: "color-mix(in srgb, var(--card) calc(<alpha-value> * 100%), transparent)", foreground: "color-mix(in srgb, var(--card-foreground) calc(<alpha-value> * 100%), transparent)" },
      popover: { DEFAULT: "color-mix(in srgb, var(--popover) calc(<alpha-value> * 100%), transparent)", foreground: "color-mix(in srgb, var(--popover-foreground) calc(<alpha-value> * 100%), transparent)" },
      primary: { DEFAULT: "color-mix(in srgb, var(--primary) calc(<alpha-value> * 100%), transparent)", foreground: "color-mix(in srgb, var(--primary-foreground) calc(<alpha-value> * 100%), transparent)" },
      secondary: { DEFAULT: "color-mix(in srgb, var(--secondary) calc(<alpha-value> * 100%), transparent)", foreground: "color-mix(in srgb, var(--secondary-foreground) calc(<alpha-value> * 100%), transparent)" },
      muted: { DEFAULT: "color-mix(in srgb, var(--muted) calc(<alpha-value> * 100%), transparent)", foreground: "color-mix(in srgb, var(--muted-foreground) calc(<alpha-value> * 100%), transparent)" },
      accent: { DEFAULT: "color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)", foreground: "color-mix(in srgb, var(--accent-foreground) calc(<alpha-value> * 100%), transparent)" },
      destructive: { DEFAULT: "color-mix(in srgb, var(--destructive) calc(<alpha-value> * 100%), transparent)", foreground: "color-mix(in srgb, var(--destructive-foreground) calc(<alpha-value> * 100%), transparent)" },
      border: "color-mix(in srgb, var(--border) calc(<alpha-value> * 100%), transparent)",
      input: "color-mix(in srgb, var(--input) calc(<alpha-value> * 100%), transparent)",
      ring: "color-mix(in srgb, var(--ring) calc(<alpha-value> * 100%), transparent)",
    },
    fontFamily: { display: ["var(--font-display)"], ui: ["var(--font-ui)"], mono: ["var(--font-mono)"], aleo: ["var(--font-display)"] },
    borderRadius: { card: "var(--radius-card)", chip: "var(--radius-chip)", "4xl": "2rem" },
    // notio hero/footer radials — re-skinned: a faint up-green dome (hero) / chain-violet (footer) over
    // near-black. Dark-only, so light == dark. Replaces notio's orange (#dc8e43/#c76829/#9c3a21).
    backgroundImage: {
      "hero-radial-light": "radial-gradient(ellipse 120% 90% at 50% -10%, color-mix(in srgb, var(--up) 12%, var(--bg)) 0%, var(--bg) 55%, var(--bg) 100%)",
      "hero-radial-dark": "radial-gradient(ellipse 120% 90% at 50% -10%, color-mix(in srgb, var(--up) 12%, var(--bg)) 0%, var(--bg) 55%, var(--bg) 100%)",
      "footer-radial-light": "radial-gradient(ellipse 120% 90% at 50% 0%, color-mix(in srgb, var(--chain) 16%, var(--bg)) 0%, var(--bg) 60%)",
      "footer-radial-dark": "radial-gradient(ellipse 120% 90% at 50% 0%, color-mix(in srgb, var(--chain) 16%, var(--bg)) 0%, var(--bg) 60%)",
      "footer-radial-light-mobile": "radial-gradient(ellipse 150% 90% at 50% 0%, color-mix(in srgb, var(--chain) 16%, var(--bg)) 0%, var(--bg) 60%)",
      "footer-radial-dark-mobile": "radial-gradient(ellipse 150% 90% at 50% 0%, color-mix(in srgb, var(--chain) 16%, var(--bg)) 0%, var(--bg) 60%)",
    },
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
