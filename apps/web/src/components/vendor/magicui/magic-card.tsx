"use client";

import { useCallback, useEffect, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/** magicui magic-card, re-skinned to Ninety.
 *
 *  Stripped from the stock component: next-themes (Ninety is dark-only), the orb mode (blurred
 *  brand-hex glow — off-token), and the raw-hex gradient defaults. What remains is the ordered
 *  essence: a pointer-following border highlight + faint interior wash, both built from
 *  color-mix() of token vars (--text-hi / --hairline) at low alpha. GRADIENT-LAW NOTE: the
 *  spotlight IS a radial gradient — sanctioned here because the effect's essence is the gradient,
 *  and it never carries a non-token color. Spotlight shows on hover only; prefers-reduced-motion
 *  renders a plain static card (no pointer tracking, no wash). */
interface MagicCardProps {
  children?: ReactNode;
  className?: string;
  /** Extra wash painted between the surface and the content — e.g. the chain card's violet tint. */
  innerClassName?: string;
  gradientSize?: number;
  /** Border highlight under the pointer. CSS color — token vars / color-mix of tokens ONLY. */
  spotlightColor?: string;
  /** Faint interior wash under the pointer. Same rule. */
  glowColor?: string;
  /** Resting border color. Same rule. */
  baseBorder?: string;
}

export function MagicCard({
  children,
  className,
  innerClassName,
  gradientSize = 200,
  spotlightColor = "color-mix(in srgb, var(--text-hi) 24%, transparent)",
  glowColor = "color-mix(in srgb, var(--text-hi) 5%, transparent)",
  baseBorder = "color-mix(in srgb, var(--hairline) 70%, transparent)",
}: MagicCardProps) {
  const reduce = useReducedMotion();
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const reset = useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [mouseX, mouseY, gradientSize]);

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  useEffect(() => {
    const handleGlobalPointerOut = (e: globalThis.PointerEvent) => {
      if (!e.relatedTarget) reset();
    };
    const handleBlur = () => reset();
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") reset();
    };

    window.addEventListener("pointerout", handleGlobalPointerOut);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pointerout", handleGlobalPointerOut);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reset]);

  const borderBackground = useMotionTemplate`
    linear-gradient(var(--surface) 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${spotlightColor},
      ${baseBorder} 100%
    ) border-box
  `;
  const glowBackground = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${glowColor},
      transparent 100%
    )
  `;

  if (reduce) {
    return (
      <div className={cn("relative isolate overflow-hidden rounded-card border border-hairline/70 bg-surface", className)}>
        {innerClassName ? <div aria-hidden className={cn("absolute inset-0 z-0", innerClassName)} /> : null}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("group/magic relative isolate overflow-hidden rounded-card border border-transparent", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={{ background: borderBackground }}
    >
      <div aria-hidden className="absolute inset-px z-0 rounded-[inherit] bg-surface" />
      {innerClassName ? <div aria-hidden className={cn("absolute inset-px z-0 rounded-[inherit]", innerClassName)} /> : null}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-px z-10 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover/magic:opacity-100"
        style={{ background: glowBackground }}
      />
      <div className="relative z-20">{children}</div>
    </motion.div>
  );
}
