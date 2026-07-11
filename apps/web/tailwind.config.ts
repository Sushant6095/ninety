import type { Config } from "tailwindcss";
import { space } from "./src/design/tokens";
// Colors are CSS vars (styles/tokens.css); the spacing rhythm + type live in src/design/tokens.ts (the authority).
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      bg: "var(--bg)", surface: "var(--surface)", hairline: "var(--hairline)",
      up: "var(--up)", down: "var(--down)", halt: "var(--halt)", chain: "var(--chain)",
      hi: "var(--text-hi)", lo: "var(--text-lo)",
    },
    fontFamily: { display: ["var(--font-display)"], ui: ["var(--font-ui)"], mono: ["var(--font-mono)"] },
    borderRadius: { card: "var(--radius-card)", chip: "var(--radius-chip)" },
    spacing: { ...space }, // the intentional spacing scale from tokens.ts (p-md, gap-lg, …)
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
    },
  } },
} satisfies Config;
