"use client";
// magicui "highlighter" (magicui.design/r/highlighter), re-skinned to Ninety:
// - `motion/react` → "framer-motion"
// - the stock pastel-pink default color is gone: color is a Ninety ColorToken, resolved at runtime
//   because rough-notation writes the color into SVG presentation attributes where var() is invalid
// - default action → underline, duration → the motion.count token (the deliberate 500ms reveal)
// - draws ONCE in view (the pull's isView=false "always on" default inverted — landing use)
// - prefers-reduced-motion → a static token border underline, rough-notation never draws a stroke
// - the document.body ResizeObserver is dropped (it replayed the draw on ANY page-height change,
//   e.g. lazy sections mounting); only the annotated span itself is observed
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { annotate } from "rough-notation";
import { colors, resolveColor, type ColorToken } from "@/design/tokens";
import motion from "@/design/motion";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

interface HighlighterProps {
  children: ReactNode;
  action?: AnnotationAction;
  /** Ninety color token for the stroke. chain is legal ONLY on on-chain references. */
  token?: ColorToken;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
}

export function Highlighter({
  children,
  action = "underline",
  token = "up",
  strokeWidth = 2,
  animationDuration = motion.count,
  iterations = 2,
  padding = 2,
  multiline = true,
}: HighlighterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce) return;
    const annotation = annotate(el, {
      type: action,
      color: resolveColor(token),
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
    });
    annotation.show();
    const ro = new ResizeObserver(() => {
      annotation.hide();
      annotation.show();
    });
    ro.observe(el);
    return () => {
      annotation.remove();
      ro.disconnect();
    };
  }, [inView, reduce, action, token, strokeWidth, animationDuration, iterations, padding, multiline]);

  if (reduce) {
    // Static underline, token border — no draw-on, no rough stroke.
    return (
      <span className="border-b-2" style={{ borderColor: colors[token] }}>
        {children}
      </span>
    );
  }

  return (
    <span ref={ref} className="relative inline-block">
      {children}
    </span>
  );
}
