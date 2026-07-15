// magicui "backlight" (magicui.design/r/backlight), rebuilt for Ninety:
// - the pull's SVG feGaussianBlur filter re-blurs its child on every repaint — unusable behind
//   the LIVE hero tape (GPU contention on the live-price path is a hard law). Rebuilt as a STATIC
//   ambient under-glow: two soft radial pools built from color-mix() of the hi/up tokens, blurred
//   once, zero animation, aria-hidden. The glow IS a gradient by essence — tension flagged in the
//   provenance report; every stop is a token var, no raw color anywhere.
// - hi/up tints only (never chain here — nothing on-chain lives in the hero).
// - no hooks, server-safe, and removable by deleting its one wrapper.
import type { ReactNode } from "react";

interface BacklightProps {
  children: ReactNode;
  className?: string;
  /** Blur radius in px for the glow layer. */
  blur?: number;
}

export function Backlight({ children, className = "", blur = 48 }: BacklightProps) {
  return (
    // `isolate` pins the -z-10 glow INSIDE this wrapper's stacking context — without it the layer
    // can fall behind an opaque ancestor background and silently vanish.
    <div className={`relative isolate ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-12 -z-10"
        style={{
          background: [
            "radial-gradient(42% 46% at 32% 30%, color-mix(in srgb, var(--up) 9%, transparent), transparent 70%)",
            "radial-gradient(52% 56% at 70% 62%, color-mix(in srgb, var(--text-hi) 5%, transparent), transparent 72%)",
          ].join(", "),
          filter: `blur(${blur}px)`,
        }}
      />
      {children}
    </div>
  );
}
