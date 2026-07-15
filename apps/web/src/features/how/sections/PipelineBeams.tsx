"use client";
// The data pipeline as a live flow — four nodes (TxLINE → bus → engine → Solana) joined by
// godui animated beams (re-skinned): resting paths are hairline, the travelling light is
// text-hi, and ONLY the Solana hop runs chain violet (on-chain law). Calm travel (~4s),
// reduced motion → static connectors. Beams render under the cards, so the light reads in
// the gaps between nodes.
import { useRef } from "react";
import { Radio, GitBranch, Cpu, Link2, type LucideIcon } from "lucide-react";
import { AnimatedBeam } from "../../../components/vendor/godui/animated-beam";

const NODES: { id: string; icon: LucideIcon; label: string; sub: string; chain?: boolean }[] = [
  { id: "txline", icon: Radio, label: "TxLINE", sub: "prices · scores · proofs" },
  { id: "bus", icon: GitBranch, label: "bus", sub: "packages/bus events" },
  { id: "engine", icon: Cpu, label: "engine", sub: "single-writer · LMSR" },
  { id: "solana", icon: Link2, label: "Solana", sub: "validateStat on-chain", chain: true },
];

export function PipelineBeams() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  return (
    <div ref={containerRef} className="relative mt-3 flex items-stretch justify-between gap-2 sm:gap-4">
      {/* Beams first (absolute, under the cards) — one per hop, staggered so the light reads as one flow. */}
      {[0, 1, 2].map((i) => {
        const toChain = NODES[i + 1].chain;
        return (
          <AnimatedBeam
            key={i}
            containerRef={containerRef}
            fromRef={nodeRefs[i]}
            toRef={nodeRefs[i + 1]}
            duration={4}
            delay={i * 1.3}
            gradientStartColor={toChain ? "var(--chain)" : "var(--text-hi)"}
            gradientStopColor={toChain ? "color-mix(in srgb, var(--chain) 40%, transparent)" : "color-mix(in srgb, var(--text-hi) 40%, transparent)"}
          />
        );
      })}

      {NODES.map((n, i) => (
        <div
          key={n.id}
          ref={nodeRefs[i]}
          className={`elev relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-card border bg-surface px-2 py-3 sm:px-3 ${n.chain ? "border-chain/40" : "border-hairline"}`}
        >
          <span className={`grid h-8 w-8 place-items-center rounded-chip ring-1 ring-inset ${n.chain ? "bg-chain/10 text-chain ring-chain/40" : "bg-bg/50 text-hi ring-hairline"}`}>
            <n.icon className="h-4 w-4" aria-hidden strokeWidth={2} />
          </span>
          <span className={`text-strong font-semibold ${n.chain ? "text-chain" : "text-hi"}`}>{n.label}</span>
          <span className="num hidden truncate text-label tabular-nums text-lo sm:block">{n.sub}</span>
        </div>
      ))}
    </div>
  );
}
