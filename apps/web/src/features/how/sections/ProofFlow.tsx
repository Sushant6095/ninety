"use client";
import { ReactFlow, Background, BackgroundVariant, Handle, Position, type Node, type Edge, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useReducedMotion } from "framer-motion";
import { Radio, Flag, FileCheck2, Cpu, CircleCheck, type LucideIcon } from "lucide-react";
import { ProofBadge } from "../../../components/ui/ProofBadge";
import { Section } from "./Section";

type Kind = "off" | "chain" | "settled";
interface PFData { label: string; sub: string; kind: Kind; icon: LucideIcon; sig?: string; [k: string]: unknown }

const RING: Record<Kind, string> = {
  off: "border-hairline bg-surface",
  chain: "border-chain/50 bg-chain/[0.05]",
  settled: "border-up/50 bg-up/[0.06]",
};
const ICONWRAP: Record<Kind, string> = {
  off: "bg-bg/50 text-hi ring-hairline",
  chain: "bg-chain/10 text-chain ring-chain/40",
  settled: "bg-up/10 text-up ring-up/40",
};

/** One re-skinned proof-flow node — Ninety tokens, never React Flow's stock blue. Handles are invisible. */
function PFNode({ data }: NodeProps) {
  const d = data as PFData;
  const Icon = d.icon;
  return (
    <div className={`w-[184px] rounded-card border p-3 elev ${RING[d.kind]}`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1, minWidth: 0, border: 0 }} />
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 ring-inset ${ICONWRAP[d.kind]}`}>
          <Icon className="h-4 w-4" aria-hidden strokeWidth={2} />
        </span>
        <span className={`text-strong font-semibold leading-tight ${d.kind === "settled" ? "text-up" : d.kind === "chain" ? "text-chain" : "text-hi"}`}>{d.label}</span>
      </div>
      <p className="num mt-2 text-label leading-snug tabular-nums text-lo">{d.sub}</p>
      {d.sig && <div className="mt-2"><ProofBadge sig={d.sig} label="Settled" /></div>}
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1, minWidth: 0, border: 0 }} />
    </div>
  );
}

const nodeTypes = { pf: PFNode };

const NODES: Node[] = [
  { id: "feed", type: "pf", position: { x: 0, y: 40 }, data: { label: "TxLINE feed", sub: "consensus odds + live scores", kind: "off", icon: Radio } },
  { id: "score", type: "pf", position: { x: 232, y: 40 }, data: { label: "Score event", sub: "game_finalised at full time", kind: "off", icon: Flag } },
  { id: "proof", type: "pf", position: { x: 464, y: 40 }, data: { label: "Stat-validation", sub: "Merkle proof of the goals", kind: "off", icon: FileCheck2 } },
  { id: "chain", type: "pf", position: { x: 696, y: 40 }, data: { label: "validateStatV2", sub: "verified on Solana", kind: "chain", icon: Cpu } },
  { id: "settled", type: "pf", position: { x: 928, y: 20 }, data: { label: "Market settled", sub: "winners paid · 100 credits", kind: "settled", icon: CircleCheck, sig: "7hNq…devnetAusEgy4kP" } },
];

const PANELS = [
  { title: "What TxLINE proves", body: "The final result — cryptographically. A game_finalised record plus a Merkle proof of each side's goals, signed at the source." },
  { title: "What Solana checks", body: "The Anchor program verifies that proof on-chain via validateStatV2. It trusts the math, not Ninety — no admin can change it." },
  { title: "What “settled” means", body: "The market resolves to the proven outcome, winning shares pay 100 credits, and the ProofBadge links the exact transaction on Solscan." },
];

export function ProofFlow() {
  const reduce = useReducedMotion();
  const edges: Edge[] = ["feed-score", "score-proof", "proof-chain", "chain-settled"].map((id, i) => {
    const [source, target] = [["feed", "score"], ["score", "proof"], ["proof", "chain"], ["chain", "settled"]][i];
    const stroke = i === 3 ? "var(--up)" : i === 2 ? "var(--chain)" : "var(--hairline)";
    return { id, source, target, animated: !reduce, style: { stroke, strokeWidth: 1.75 } };
  });

  return (
    <Section eyebrow="The proof" title="Why the result is trustworthy." lede="From the feed to the final settlement, every step is verifiable — and the last two happen on-chain, where no one can quietly change them.">
      <div className="elev overflow-hidden rounded-card border border-hairline bg-bg">
        <div className="h-[280px] w-full sm:h-[320px]">
          <ReactFlow
            nodes={NODES}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.14 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--hairline)" />
          </ReactFlow>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {PANELS.map((p) => (
          <div key={p.title} className="rounded-card border border-hairline bg-surface p-4">
            <h3 className="text-strong font-semibold text-hi">{p.title}</h3>
            <p className="mt-1.5 text-caption leading-relaxed text-lo">{p.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-caption text-lo">Play money — no deposits, no cash payouts. The proof is what&#39;s real.</p>
    </Section>
  );
}
