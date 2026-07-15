"use client";
// skiper-ui "skiper19" (skiper-ui.com/registry/skiper19), re-skinned to Ninety:
// - the pull was a full demo page (cream background, lime 20px doodle stroke, skiperui footer);
//   what ships is the primitive it demonstrated — an SVG path whose stroke draws itself from a
//   framer MotionValue (scroll progress at the callsite)
// - stroke colors → tokens: a hairline track underneath, the up token for the drawn stroke
// - the `any`-typed scrollYProgress and the strokeDashoffset hack are gone; framer's pathLength
//   handles the dash math
// - reduced motion is the CALLSITE's job: pass progress={1} for a path at rest, fully drawn
import { motion, type MotionValue } from "framer-motion";

interface ScrollLinePathProps {
  /** 0..1 draw progress — a framer MotionValue (scroll-linked) or a static number. */
  progress: MotionValue<number> | number;
  /** The path to draw. */
  d: string;
  viewBox: string;
  className?: string;
  strokeWidth?: number;
  /** Render the hairline track under the drawn stroke. */
  track?: boolean;
}

export function ScrollLinePath({ progress, d, viewBox, className = "", strokeWidth = 1.5, track = true }: ScrollLinePathProps) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      overflow="visible"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
    >
      {track && (
        <path d={d} stroke="var(--hairline)" strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      )}
      <motion.path
        d={d}
        stroke="var(--up)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ pathLength: progress }}
      />
    </svg>
  );
}

/**
 * Skiper 19 — React + framer motion
 * Inspired by and adapted from https://comgio.ai/
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 *
 * Author: @gurvinder-singh02 · https://gxuri.me
 */
