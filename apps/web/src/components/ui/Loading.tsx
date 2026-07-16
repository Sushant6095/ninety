"use client";

import { DotmSquare3 } from "../vendor/dotmatrix/dotm-square-3";

// THE app loading primitive — the dotmatrix spiral (vendor/dotmatrix, re-skinned to tokens).
// Use for true indeterminate waits; Skeleton stays for content-shaped placeholders.
// Active dots ride --up (via text-up → currentColor); reduced-motion renders a static
// --text-lo dot grid inside DotmSquare3 — no spin, no keyframes.

const SIZES = {
  sm: { size: 24, dotSize: 3 },
  lg: { size: 44, dotSize: 6 }
} as const;

export interface LoadingProps {
  size?: keyof typeof SIZES;
  /** Screen-reader announcement; visual dots are aria-hidden in the vendor component. */
  label?: string;
  className?: string;
}

export function Loading({ size = "sm", label = "Loading", className = "" }: LoadingProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`inline-flex items-center justify-center text-up ${className}`}
    >
      <DotmSquare3 {...SIZES[size]} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
