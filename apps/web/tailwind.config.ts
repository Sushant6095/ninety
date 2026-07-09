import type { Config } from "tailwindcss";
// Tokens come from styles/tokens.css as CSS variables — tailwind maps to them.
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
  } },
} satisfies Config;
