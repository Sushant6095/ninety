"use client";
import dynamic from "next/dynamic";

// ADR-053 discipline: three.js stays OUT of the initial chunk — the globe loads client-side only,
// with a token skeleton holding its slot (same pattern as ProofFlowLazy).
const WorldGlobe = dynamic(() => import("./WorldGlobe").then((m) => m.WorldGlobe), {
  ssr: false,
  loading: () => <div aria-hidden className="h-full w-full animate-pulse rounded-full bg-surface motion-reduce:animate-none" />,
});

export function WorldGlobeLazy({ className = "" }: { className?: string }) {
  return <WorldGlobe className={className} />;
}
