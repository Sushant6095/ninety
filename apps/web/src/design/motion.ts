// OMNIPITCH motion tokens — THE SINGLE SOURCE OF TRUTH for timing + easing.
//
// Every animated component imports from here; the design-cop judge checks observed timings
// against these values. Do not hardcode durations/easings in components — reference these.
// Law: animate transform/opacity ONLY (never layout properties); ease-out, no bounce; honor
// prefers-reduced-motion (fall back to `reduced`).

export const motion = {
  /** Price / number tick flash on change — the signature 180ms up/down colour pulse. */
  flash: 180,
  /** Standard UI transition (hover, reveal, panel) — inside the 150–250ms band. */
  transition: 200,
  /** Fast affordance (focus ring, small state change). */
  fast: 150,
  /** Slow, deliberate reveal (ProofBadge on settle, sheet enter). */
  slow: 250,
  /** Count-up reveal (NumberTicker) — the 500ms ceiling, spent deliberately on stat proof. */
  count: 500,
  /** Landing hero word reveal — per-word duration + stagger (hyperfoundation letter-reveal analog). */
  heroWord: 400,
  heroStagger: 45,
  /** The River drawing itself — the one sanctioned loud beat outside the halt (ADR-052 signature). */
  riverDraw: 1400,
  /** cubic-bezier for CSS transitions / Framer `ease` — expo-out, calm and premium. */
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Framer Motion spring — selection indicators, number rolls, badge pulse. Apple-style duration/bounce
   *  form (easier to reason about than stiffness/damping): fast settle with a breath of life, no wobble —
   *  crisp terminal personality. Interruptible by nature; springs carry velocity when retargeted. */
  spring: { type: "spring", duration: 0.3, bounce: 0.15 } as const,
  /** Reduced-motion budget: near-instant, no travel. Swap in when prefers-reduced-motion. */
  reduced: { duration: 0.01, ease: "linear" } as const,
} as const;

/** CSS `transition` shorthand for a property, using the standard duration + easeOut. */
export const ease = `cubic-bezier(${motion.easeOut.join(", ")})`;
export const transition = (prop: string, ms: number = motion.transition): string => `${prop} ${ms}ms ${ease}`;

export type Motion = typeof motion;
export default motion;
