"use client";
// The proof pipeline — godui agent-flow (re-skinned to tokens) replaces the React Flow graph
// (one owner per element): four nodes with the auto-play light tracing feed → merkle root →
// validateStat → settled, looping as the "live-ish" status. Only txoracle.validateStat runs
// chain violet (on-chain law). Below it, the godui agent-timeline walks one settlement step by
// step with mono ids/sigs in the collapsible rows. Drag/pan stay on (this is the sanctioned
// flow-viz page); the nodes read fully without dragging. Reduced motion → instant states.
import { Radio, Hash, Cpu, CircleCheck } from "lucide-react";
import { AgentFlow, type AgentFlowNode, type AgentFlowEdge } from "../../../components/vendor/godui/agent-flow";
import { AgentStep, AgentTimeline } from "../../../components/vendor/godui/agent-timeline";
import { ProofBadge } from "../../../components/ui/ProofBadge";
import { Section } from "./Section";

const NODES: AgentFlowNode[] = [
  { id: "feed", label: "TxLINE fixture feed", sublabel: "scores + game_finalised", icon: <Radio aria-hidden strokeWidth={2} />, x: 0, y: 60 },
  { id: "root", label: "Score merkle root", sublabel: "stat-validation bundle", icon: <Hash aria-hidden strokeWidth={2} />, x: 280, y: 84 },
  { id: "verify", label: "validateStatV2", sublabel: "verified on Solana", icon: <Cpu aria-hidden strokeWidth={2} />, tone: "chain", x: 560, y: 60 },
  { id: "settled", label: "Market settled", sublabel: "winning shares pay 100", icon: <CircleCheck aria-hidden strokeWidth={2} />, x: 840, y: 84 },
];

const EDGES: AgentFlowEdge[] = [
  { id: "feed-root", from: "feed", to: "root", curvature: 16 },
  { id: "root-verify", from: "root", to: "verify", curvature: 16 },
  { id: "verify-settled", from: "verify", to: "settled", curvature: 16 },
];

const PANELS = [
  { title: "What TxLINE proves", body: "The final result, proven cryptographically. A game_finalised record plus a Merkle proof of each side's goals, signed at the source." },
  { title: "What Solana checks", body: "The Anchor program verifies that proof on-chain via validateStatV2. It trusts the math, not Ninety. No admin can change it." },
  { title: "What “settled” means", body: "The market resolves to the proven outcome, winning shares pay 100 credits, and the ProofBadge links the exact transaction on Solscan." },
];

export function ProofFlow() {
  return (
    <Section eyebrow="The proof" title="Why the result is trustworthy." lede="From the feed to the final settlement, every step is verifiable, and the last two happen on-chain, where no one can quietly change them.">
      <AgentFlow
        aria-label="The proof pipeline: TxLINE fixture feed, score merkle root, validateStatV2 verified on Solana, market settled"
        nodes={NODES}
        edges={EDGES}
        autoPlay
        continuous
        className="h-[280px] w-full sm:h-[320px]"
      />

      {/* One settlement, step by step (godui agent-timeline, re-skinned) — the ids behind the graph. */}
      <div className="mt-4 rounded-card border border-hairline bg-surface p-5">
        <h3 className="text-label font-semibold uppercase tracking-label text-lo">One settlement, step by step</h3>
        <AgentTimeline className="mt-4">
          <AgentStep status="success" title="Proof fetched" meta="S4 · stat-validation">
            <span className="num block tabular-nums">merkle root a3f19c…e402 · game_finalised · 2–1</span>
          </AgentStep>
          <AgentStep status="success" tone="chain" title="Verified on-chain" meta="validateStatV2" defaultOpen>
            <div className="flex flex-wrap items-center gap-2">
              <span className="num tabular-nums text-lo">settle tx</span>
              {/* No fabricated signature: settlement is fail-closed (ADR-036/037), so this reads the honest
                  pending state and links no Solscan tx until a real one exists. */}
              <ProofBadge label="Settled" pendingLabel="Proof pending · fail-closed" />
            </div>
          </AgentStep>
          <AgentStep status="success" title="Market settled" meta="100 credits / share" last>
            <span>The market resolves to the proven outcome. Winning shares pay 100 credits.</span>
          </AgentStep>
        </AgentTimeline>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {PANELS.map((p) => (
          <div key={p.title} className="rounded-card border border-hairline bg-surface p-4">
            <h3 className="text-strong font-semibold text-hi">{p.title}</h3>
            <p className="mt-1.5 text-caption leading-relaxed text-lo">{p.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-caption text-lo">Play money · no deposits, no cash payouts. The proof is what&#39;s real.</p>
    </Section>
  );
}
