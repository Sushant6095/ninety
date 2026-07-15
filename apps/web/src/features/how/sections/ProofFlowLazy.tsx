"use client";
import dynamic from "next/dynamic";

// The proof-flow graph (godui agent-flow + agent-timeline) stays in this dynamically-imported chunk — never the shared bundle.
const ProofFlow = dynamic(() => import("./ProofFlow").then((m) => m.ProofFlow), {
  ssr: false,
  loading: () => (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-14 sm:px-6 sm:py-20">
      <div className="h-6 w-40 animate-pulse rounded bg-hairline/40" />
      <div className="mt-8 h-[320px] animate-pulse rounded-card border border-hairline bg-surface" />
    </div>
  ),
});

export function ProofFlowLazy() {
  return <ProofFlow />;
}
