import { Section } from "./Section";

// The seven layers, top (what you touch) to bottom (what proves it). Chips are the real modules in each.
const LAYERS = [
  { n: "01", name: "Clients", parts: ["apps/web · Next.js", "mobile"], note: "the board + the trading terminal" },
  { n: "02", name: "Edge", parts: ["WS gateway · uWebSockets", "REST · Fastify"], note: "one socket, per-channel seq resume" },
  { n: "03", name: "Services", parts: ["markets-read", "portfolio", "leaderboard", "quote", "auth"], note: "read models + order intake" },
  { n: "04", name: "Engine", parts: ["single-writer market engine", "LMSR · journal · order · risk"], note: "the only writer of market state" },
  { n: "05", name: "Data", parts: ["Redis · streams + cache", "Postgres · projections"], note: "hot tape + durable read models" },
  { n: "06", name: "Ingest", parts: ["worker-ingest · TxLINE SSE → bus", "worker-cortex · Booth", "worker-jobs · settlement saga"], note: "feeds the bus, drives settlement" },
  { n: "07", name: "Chain", parts: ["Anchor program", "settle_market · validateStat CPI"], note: "verifies the TxLINE proof on Solana", chain: true },
];

export function Architecture() {
  return (
    <Section eyebrow="System architecture" title="Seven layers, one data flow." lede="TxLINE feeds the ingest workers, the engine reprices as the single writer, and Solana proves the result. Everything else is read models on top.">
      <ol className="relative">
        {LAYERS.map((l, i) => (
          <li key={l.n} className="relative grid grid-cols-[64px_1fr] gap-4 pb-4 last:pb-0">
            {/* spine */}
            {i < LAYERS.length - 1 && <span className="absolute left-[31px] top-10 h-full w-px bg-hairline" aria-hidden />}
            <div className="flex flex-col items-center gap-1 pt-2">
              <span className={`num grid h-8 w-8 place-items-center rounded-full text-caption font-semibold ring-1 ring-inset ${l.chain ? "bg-chain/10 text-chain ring-chain/40" : "bg-surface text-hi ring-hairline"}`}>{l.n}</span>
            </div>
            <div className={`elev rounded-card border bg-surface p-4 ${l.chain ? "border-chain/30" : "border-hairline"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className={`text-strong font-semibold ${l.chain ? "text-chain" : "text-hi"}`}>{l.name}</h3>
                <span className="text-caption text-lo">{l.note}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {l.parts.map((p) => (
                  <span key={p} className={`num rounded-chip px-2.5 py-1 text-label tabular-nums ring-1 ring-inset ${l.chain ? "bg-chain/[0.06] text-chain/90 ring-chain/30" : "bg-bg/40 text-hi/90 ring-hairline"}`}>{p}</span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
