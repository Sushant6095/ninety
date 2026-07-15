"use client";
import dynamic from "next/dynamic";

// The proof section's flowing backdrop (godui flow-field, re-skinned) — signed data streaming as
// silky lo/up trails behind the on-chain story. Canvas discipline: next/dynamic ssr:false,
// IO-gated rAF (≥20% visible), dpr ≤ 1.5, transparent stage so the section's bg-surface/60 tonal
// break shows through. Reduced motion → one primed static frame.
const FlowField = dynamic(
  () => import("../../components/vendor/godui/flow-field").then((m) => m.FlowField),
  { ssr: false, loading: () => null },
);

export function FlowFieldLazy({ className = "" }: { className?: string }) {
  return <FlowField className={className} />;
}
