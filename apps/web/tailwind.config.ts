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
      // named type scale (the terminal's precise sizes) — from tokens.ts intent; use over arbitrary text-[Npx].
      micro: ["9px", "1.3"], "2xs": ["10px", "1.4"], xs: ["11px", "1.45"], sm: ["12px", "1.45"],
      base: ["13px", "1.5"], md: ["14px", "1.5"], lg: ["17px", "1.2"], xl: ["19px", "1.1"],
      "2xl": ["26px", "1.1"], "3xl": ["30px", "1.05"],
    },
  } },
} satisfies Config;
