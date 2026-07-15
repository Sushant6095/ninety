interface LogomarkProps {
  size?: number;
  /** Footer / monochrome contexts: the tail drops from up-green to the inherited ink. */
  mono?: boolean;
  className?: string;
}

/**
 * The Ninety mark — the "River-9" (brand, ADR-064). A geometric "9" whose tail is a
 * momentum line: it drops, then kicks up in up-green — the goal-cliff. It reads as both
 * the numeral (Ninety / 90 minutes) and a market tick-up, and it IS the Momentum River
 * compressed into one glyph.
 *
 * Pure paths, so the identical mark ships as favicon.svg with zero font dependency.
 * Tokens only: the head + stem take `currentColor` (parent sets `text-hi`); the rising
 * tail is `var(--up)` (the semantic price-up token) unless `mono` folds it into the ink.
 */
export function Logomark({ size = 28, mono = false, className }: LogomarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Ninety"
      className={className}
    >
      <circle cx="41" cy="39" r="22" stroke="currentColor" strokeWidth="12" />
      <path d="M63 39 L63 72" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      <path
        d="M63 72 L88 54"
        stroke={mono ? "currentColor" : "var(--up)"}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
