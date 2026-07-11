import { Activity, Radio, ShieldCheck, ArrowRight } from "lucide-react";
import { Section } from "./Section";

const PROVIDES = [
  { icon: Activity, title: "Consensus odds", body: "A live, book-consensus price for every outcome — the fair-value signal Ninety's LMSR market prices against." },
  { icon: Radio, title: "Live scores", body: "Score events the instant they happen, including the game_finalised record that decides the result." },
  { icon: ShieldCheck, title: "Cryptographic proofs", body: "A Merkle stat-validation bundle for each score — the proof Solana verifies on-chain to settle." },
];

// The real client surface (packages/txline) — the tech-doc endpoint list.
const ENDPOINTS = [
  { id: "O3", path: "/api/odds/stream", use: "live consensus odds (SSE) → LMSR price" },
  { id: "S3", path: "/api/scores/stream", use: "live goals (SSE) → the River + halts" },
  { id: "S1", path: "/api/scores/snapshot/:fixture", use: "point-in-time score + gap recovery" },
  { id: "S4", path: "/api/scores/stat-validation", use: "Merkle proof bundle → on-chain validateStat" },
  { id: "F1", path: "/api/fixtures/snapshot", use: "the match slate" },
];

const PIPELINE = ["TxLINE SSE", "Normalize + dedup", "Event bus", "Engine reprices (LMSR)", "Settle on Solana"];

export function TxLineSection() {
  return (
    <Section eyebrow="Data backbone" title="Powered by TxLINE." lede="Ninety runs on TxLINE / TxODDS — the sports-data layer that feeds the prices, the scores, and the proofs that make settlement trustless.">
      <div className="grid gap-4 sm:grid-cols-3">
        {PROVIDES.map((p) => (
          <div key={p.title} className="elev rounded-card border border-hairline bg-surface p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-chain/10 text-chain ring-1 ring-inset ring-chain/40">
              <p.icon className="h-5 w-5" aria-hidden strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-strong font-semibold text-hi">{p.title}</h3>
            <p className="mt-1.5 text-caption leading-relaxed text-lo">{p.body}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="mt-4 rounded-card border border-hairline bg-surface p-5">
        <h3 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">How Ninety consumes it</h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
          {PIPELINE.map((n, i) => (
            <span key={n} className="flex items-center gap-2">
              <span className={`rounded-chip px-3 py-1.5 text-caption font-medium ring-1 ring-inset ${i === PIPELINE.length - 1 ? "bg-chain/10 text-chain ring-chain/40" : "bg-bg/40 text-hi ring-hairline"}`}>{n}</span>
              {i < PIPELINE.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-lo" aria-hidden strokeWidth={2} />}
            </span>
          ))}
        </div>
      </div>

      {/* Endpoints (tech-doc) */}
      <div className="mt-4 overflow-hidden rounded-card border border-hairline bg-surface">
        <h3 className="border-b border-hairline px-5 py-3 text-label font-semibold uppercase tracking-[0.12em] text-lo">Endpoints Ninety calls (packages/txline)</h3>
        <ul className="divide-y divide-hairline/60">
          {ENDPOINTS.map((e) => (
            <li key={e.id} className="grid grid-cols-[36px_1fr] items-center gap-3 px-5 py-2.5 sm:grid-cols-[36px_minmax(0,320px)_1fr]">
              <span className="num rounded bg-bg px-1.5 py-0.5 text-center text-label font-semibold text-chain ring-1 ring-inset ring-chain/30">{e.id}</span>
              <span className="num truncate text-caption tabular-nums text-hi">{e.path}</span>
              <span className="col-span-2 text-caption text-lo sm:col-span-1">{e.use}</span>
            </li>
          ))}
        </ul>
      </div>

      <a href="https://www.txodds.com" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-caption font-medium text-chain transition-opacity duration-200 hover:opacity-80">
        TxLINE / TxODDS documentation <ArrowRight className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
      </a>
    </Section>
  );
}
