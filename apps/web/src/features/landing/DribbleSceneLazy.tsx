"use client";
import dynamic from "next/dynamic";

// ADR-053/058 discipline: three.js stays OUT of the initial chunk — the scene loads client-side
// only (landing-only, never /terminal or the board), a token skeleton holding its slot (no CLS).
const DribbleScene = dynamic(() => import("./DribbleScene").then((m) => m.DribbleScene), {
  ssr: false,
  loading: () => <div aria-hidden className="h-full w-full animate-pulse rounded-card bg-surface motion-reduce:animate-none" />,
});

export function DribbleSceneLazy({ className = "" }: { className?: string }) {
  return <DribbleScene className={className} />;
}
