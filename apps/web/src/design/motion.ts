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
  /** cubic-bezier for CSS transitions / Framer `ease` — expo-out, calm and premium. */
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Framer Motion spring — number rolls, badge pulse. Snappy but not bouncy. */
  spring: { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const,
  /** Reduced-motion budget: near-instant, no travel. Swap in when prefers-reduced-motion. */
  reduced: { duration: 0.01, ease: "linear" } as const,
} as const;

/** CSS `transition` shorthand for a property, using the standard duration + easeOut. */
export const ease = `cubic-bezier(${motion.easeOut.join(", ")})`;
export const transition = (prop: string, ms: number = motion.transition): string => `${prop} ${ms}ms ${ease}`;

export type Motion = typeof motion;
export default motion;
