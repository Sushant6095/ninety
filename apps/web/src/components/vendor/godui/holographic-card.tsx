"use client";
// godui "holographic-card" (godui.design/r/holographic-card), re-skinned to Ninety:
// - godui theme classes (z-raised/z-overlay, white borders/text) → Ninety tokens + plain z-index
// - the four stock foil colorways (rainbow/aurora/galaxy/gold — all raw hex) are gone: ONE Ninety
//   foil built entirely from color-mix() of the up/hi tokens over a surface→bg base. The foil IS
//   a gradient by essence — gradient-law tension flagged in the provenance report. chain violet is
//   deliberately absent: this card carries no on-chain element.
// - maxTilt default 14° → 6°; the gyroscope path is deleted (touch devices get the static card,
//   so a sensor tilt had no audience); tilt runs ONLY on fine-pointer hover devices
// - reduced motion / touch → the static card: foil at rest, no tilt, no tracking
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

export type HolographicCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Maximum tilt in degrees toward the pointer. Keep small — this is an accent, not a toy. */
  maxTilt?: number;
  /** Render a specular glare that tracks the pointer. */
  glare?: boolean;
  /** Overlay a fine glitter mask for a holo-flake finish. */
  sparkle?: boolean;
};

// SPRING.bouncy from the pull — lively follow-through for pointer-tracked motion.
const SPRING = { stiffness: 170, damping: 12, mass: 0.1 } as const;

const ROOT_BASE =
  "relative isolate overflow-hidden rounded-card border border-hairline bg-surface text-hi";

// Token-only layer paints (inline styles — the color-mix stops don't survive class syntax).
const BASE_PAINT: React.CSSProperties = {
  background: "radial-gradient(120% 120% at 30% 15%, var(--surface) 0%, var(--bg) 78%)",
};

// The Ninety foil: up/hi bands, screen-blended over the near-black base (color-dodge — the
// pull's blend — needs a mid-dark saturated base and dies on our tokens).
const FOIL_PAINT: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(115deg",
    "color-mix(in srgb, var(--up) 70%, transparent)",
    "color-mix(in srgb, var(--text-hi) 52%, transparent)",
    "color-mix(in srgb, var(--up) 26%, transparent)",
    "color-mix(in srgb, var(--text-hi) 60%, transparent)",
    "color-mix(in srgb, var(--up) 70%, transparent))",
  ].join(", "),
  backgroundSize: "200% 200%",
  backgroundPosition: "var(--holo-x) var(--holo-y)",
  mixBlendMode: "screen",
  maskImage:
    "radial-gradient(75% 75% at var(--holo-x) var(--holo-y), black 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
};

const SPARKLE_PAINT: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(color-mix(in srgb, var(--text-hi) 90%, transparent) 0.5px, transparent 1.6px)",
  backgroundSize: "6px 6px",
  mixBlendMode: "screen",
  maskImage:
    "radial-gradient(45% 45% at var(--holo-x) var(--holo-y), black, transparent 75%)",
};

const GLARE_PAINT: React.CSSProperties = {
  background:
    "radial-gradient(40% 40% at var(--holo-x) var(--holo-y), color-mix(in srgb, var(--text-hi) 22%, transparent), transparent 72%)",
  mixBlendMode: "screen",
};

// Premium edge: a crisp top light-line plus an inner vignette to seat the card.
const EDGE_PAINT: React.CSSProperties = {
  boxShadow:
    "inset 0 1px 0 0 color-mix(in srgb, var(--text-hi) 16%, transparent), inset 0 0 36px 0 color-mix(in srgb, var(--bg) 45%, transparent)",
};

const HolographicCard = React.forwardRef<HTMLDivElement, HolographicCardProps>(
  (
    { maxTilt = 6, glare = true, sparkle = false, className, style, children, onPointerMove, onPointerLeave, ...props },
    forwardedRef,
  ) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
    const reduceMotion = useReducedMotion();

    // Desktop hover only: touch and coarse pointers get the static card.
    const [finePointer, setFinePointer] = React.useState(false);
    React.useEffect(() => {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      const update = () => setFinePointer(mq.matches);
      update();
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }, []);

    // Pointer normalized to -0.5..0.5 over the card, spring-smoothed.
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const sx = useSpring(px, SPRING);
    const sy = useSpring(py, SPRING);
    const rotateX = useTransform(sy, [-0.5, 0.5], [maxTilt, -maxTilt]);
    const rotateY = useTransform(sx, [-0.5, 0.5], [-maxTilt, maxTilt]);
    const holoX = useTransform(sx, [-0.5, 0.5], ["0%", "100%"]);
    const holoY = useTransform(sy, [-0.5, 0.5], ["0%", "100%"]);

    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        px.set((e.clientX - rect.left) / rect.width - 0.5);
        py.set((e.clientY - rect.top) / rect.height - 0.5);
      }
      onPointerMove?.(e);
    };
    const handleLeave = (e: React.PointerEvent<HTMLDivElement>) => {
      px.set(0);
      py.set(0);
      onPointerLeave?.(e);
    };

    // Static card: reduced motion or any non-fine-pointer device.
    if (reduceMotion || !finePointer) {
      return (
        <div
          ref={ref}
          data-slot="holographic-card"
          className={`${ROOT_BASE} ${className ?? ""}`}
          style={{ "--holo-x": "50%", "--holo-y": "40%", ...style } as React.CSSProperties}
          {...props}
        >
          <div aria-hidden className="absolute inset-0" style={BASE_PAINT} />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={FOIL_PAINT} />
          <div className="relative z-10">{children}</div>
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]" style={EDGE_PAINT} />
        </div>
      );
    }

    return (
      // Outer wrapper owns the perspective so the tilt reads as real depth.
      <div className="[perspective:1200px]">
        <motion.div
          ref={ref}
          data-slot="holographic-card"
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          whileHover={{ scale: 1.02 }}
          style={
            {
              rotateX,
              rotateY,
              "--holo-x": holoX,
              "--holo-y": holoY,
              ...style,
            } as React.ComponentProps<typeof motion.div>["style"]
          }
          className={`${ROOT_BASE} ${className ?? ""}`}
          {...(props as React.ComponentProps<typeof motion.div>)}
        >
          <div aria-hidden className="absolute inset-0" style={BASE_PAINT} />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={FOIL_PAINT} />
          {sparkle ? <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={SPARKLE_PAINT} /> : null}
          <div className="relative z-10">{children}</div>
          {glare ? <div aria-hidden className="pointer-events-none absolute inset-0 z-20" style={GLARE_PAINT} /> : null}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]" style={EDGE_PAINT} />
        </motion.div>
      </div>
    );
  },
);
HolographicCard.displayName = "HolographicCard";

export { HolographicCard };
