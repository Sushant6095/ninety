import { Activity, Radio, ShieldCheck, ArrowRight } from "lucide-react";
import { PipelineBeams } from "./PipelineBeams";
import { Section } from "./Section";

// Violet is on-chain ONLY (token law): the proofs card and the S4 endpoint earn it; prices/scores
// and REST plumbing are data-plane and stay neutral.
const PROVIDES = [
  { icon: Activity, title: "Consensus prices", body: "A live, book-consensus price for every outcome — the fair-value signal Ninety's LMSR market prices against.", chain: false },
  { icon: Radio, title: "Live scores", body: "Score events the instant they happen, including the game_finalised record that decides the result.", chain: false },
  { icon: ShieldCheck, title: "Cryptographic proofs", body: "A Merkle stat-validation bundle for each score — the proof Solana verifies on-chain to settle.", chain: true },
];

// The real client surface (packages/txline) — the tech-doc endpoint list.
const ENDPOINTS = [
  { id: "O3", path: "/api/prices/stream", use: "live consensus prices (SSE) → LMSR price" },
  { id: "S3", path: "/api/scores/stream", use: "live goals (SSE) → the River + halts" },
  { id: "S1", path: "/api/scores/snapshot/:fixture", use: "point-in-time score + gap recovery" },
  { id: "S4", path: "/api/scores/stat-validation", use: "Merkle proof bundle → on-chain validateStat" },
  { id: "F1", path: "/api/fixtures/snapshot", use: "the match slate" },
];

export function TxLineSection() {
  return (
    <Section eyebrow="Data backbone" title="Powered by TxLINE." lede="Ninety runs on TxLINE — the signed sports-data layer that feeds the prices, the scores, and the proofs that make settlement trustless.">
      <div className="grid gap-4 sm:grid-cols-3">
        {PROVIDES.map((p) => (
          <div key={p.title} className="elev rounded-card border border-hairline bg-surface p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset ${p.chain ? "bg-chain/10 text-chain ring-chain/40" : "bg-hairline/30 text-hi ring-hairline/60"}`}>
              <p.icon className="h-5 w-5" aria-hidden strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-strong font-semibold text-hi">{p.title}</h3>
            <p className="mt-1.5 text-caption leading-relaxed text-lo">{p.body}</p>
          </div>
        ))}
      </div>

      {/* Pipeline — the four hops as a live beam flow (godui animated-beam, re-skinned) */}
      <div className="mt-4 rounded-card border border-hairline bg-surface p-5">
        <h3 className="text-label font-semibold uppercase tracking-label text-lo">How Ninety consumes it</h3>
        <PipelineBeams />
      </div>

      {/* Endpoints (tech-doc) */}
      <div className="mt-4 overflow-hidden rounded-card border border-hairline bg-surface">
        <h3 className="border-b border-hairline px-5 py-3 text-label font-semibold uppercase tracking-label text-lo">Endpoints Ninety calls (packages/txline)</h3>
        <ul className="divide-y divide-hairline/60">
          {ENDPOINTS.map((e) => (
            <li key={e.id} className="grid grid-cols-[36px_1fr] items-center gap-3 px-5 py-2.5 sm:grid-cols-[36px_minmax(0,320px)_1fr]">
              <span className={`num rounded bg-bg px-1.5 py-0.5 text-center text-label font-semibold ring-1 ring-inset ${e.id === "S4" ? "text-chain ring-chain/30" : "text-lo ring-hairline"}`}>{e.id}</span>
              <span className="num truncate text-caption tabular-nums text-hi">{e.path}</span>
              <span className="col-span-2 text-caption text-lo sm:col-span-1">{e.use}</span>
            </li>
          ))}
        </ul>
      </div>

      <a href="https://www.txodds.com" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-caption font-medium text-lo transition-colors duration-200 hover:text-hi">
        TxLINE documentation <ArrowRight className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
      </a>
    </Section>
  );
}
