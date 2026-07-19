import { Radio, Cpu, Server, Boxes, Globe, Database, ShieldCheck, ChevronRight, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// The real live path, drawn — TxLINE → ingest → Redis bus → engine → API → web, with cortex feeding the
// engine and storage beneath. Boxes are --surface; the live path borders --up; the on-chain node --chain.
// Pure CSS; the flow pulse is motion-reduce:animate-none. No graph library, no canvas (nothing to go blank).

type Tone = "up" | "chain" | "neutral";
const toneRing: Record<Tone, string> = {
  up: "border-up/45",
  chain: "border-chain/50",
  neutral: "border-hairline",
};
const toneIcon: Record<Tone, string> = {
  up: "text-up",
  chain: "text-chain",
  neutral: "text-lo",
};

function Node({ icon: Icon, name, role, tone = "up", strong = false }: { icon: LucideIcon; name: string; role: string; tone?: Tone; strong?: boolean }) {
  return (
    <div className={`flex flex-1 flex-col rounded-card border bg-surface px-3.5 py-3 ${toneRing[tone]} ${strong ? "ring-1 ring-inset ring-up/30" : ""}`}>
      <span className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${toneIcon[tone]}`} aria-hidden strokeWidth={2} />
        <span className={`num text-caption font-semibold tabular-nums ${strong ? "text-hi" : "text-hi"}`}>{name}</span>
      </span>
      <span className="mt-1 text-label leading-snug text-lo">{role}</span>
    </div>
  );
}

/** The directional connector between two nodes: a chevron with a subtle traveling pulse on the live path. */
function Flow({ tone = "up" }: { tone?: Tone }) {
  const color = tone === "chain" ? "text-chain/70" : "text-up/70";
  return (
    <span className="flex items-center justify-center py-1 lg:py-0" aria-hidden>
      <ChevronRight className={`hidden h-5 w-5 ${color} motion-safe:animate-pulse lg:block`} strokeWidth={2.5} />
      <ChevronDown className={`h-5 w-5 ${color} motion-safe:animate-pulse lg:hidden`} strokeWidth={2.5} />
    </span>
  );
}

export function ArchDiagram() {
  return (
    <figure className="mt-8 rounded-card border border-hairline bg-bg/40 p-4 sm:p-6" aria-label="The live data path: TxLINE to ingest to the Redis bus to the engine to the API to the web, with the Python cortex feeding the engine and storage beneath.">
      <p className="mb-4 text-label font-semibold uppercase tracking-label text-up">The live path</p>

      {/* Pipeline — horizontal on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <Node icon={Radio} name="TxLINE" role="signed WC feed · SSE" tone="up" />
        <Flow />
        <Node icon={Server} name="ingest" role="consumes the feed" tone="up" />
        <Flow />
        <Node icon={Boxes} name="Redis bus" role="two planes · no direct calls" tone="up" />
        <Flow />
        <Node icon={Cpu} name="engine" role="single-writer LMSR · journal-then-ack" tone="up" strong />
        <Flow />
        <Node icon={Server} name="API" role="Fastify · 30 endpoints" tone="up" />
        <Flow />
        <Node icon={Globe} name="web" role="Next.js surfaces" tone="up" />
      </div>

      {/* cortex feeds the engine */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
        <div className="flex flex-col rounded-card border border-up/45 bg-surface px-3.5 py-3">
          <span className="flex items-center gap-2">
            <Cpu className="h-4 w-4 shrink-0 text-up" aria-hidden strokeWidth={2} />
            <span className="num text-caption font-semibold text-hi">cortex</span>
            <span className="text-label text-lo">Python quant</span>
          </span>
          <span className="mt-1 text-label leading-snug text-lo">
            de-vig · Poisson + Skellam inversion · Dixon-Coles grid → feeds P(H) / P(D) / P(A) into the engine
          </span>
        </div>
        <div className="flex flex-col rounded-card border border-chain/50 bg-surface px-3.5 py-3">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-chain" aria-hidden strokeWidth={2} />
            <span className="num text-caption font-semibold text-hi">Anchor program</span>
            <span className="text-label text-chain">Solana</span>
          </span>
          <span className="mt-1 text-label leading-snug text-lo">
            verifies TxLINE&#39;s signed statistics on-chain before settlement · no admin result path
          </span>
        </div>
      </div>

      {/* storage beneath */}
      <div className="mt-3 flex items-center gap-2 rounded-card border border-hairline bg-surface px-3.5 py-3">
        <Database className="h-4 w-4 shrink-0 text-lo" aria-hidden strokeWidth={2} />
        <span className="num text-caption font-semibold text-hi">storage</span>
        <span className="text-label text-lo">Postgres via Prisma (Aiven) · Valkey for cache and streams</span>
      </div>
    </figure>
  );
}
