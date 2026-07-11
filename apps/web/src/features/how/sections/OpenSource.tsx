import { Code2, ArrowRight } from "lucide-react";
import { Section } from "./Section";

// ponytail: placeholder repo URL — swap for the real public repo before launch.
const REPO_URL = "https://github.com/omnipitch/ninety";

const BUILT_WITH = ["Next.js", "React", "Solana + Anchor", "Node + Fastify", "TxLINE", "Redis", "Postgres"];

const POINTS = [
  { title: "Auditable by anyone", body: "The engine, the pricing math, and the settlement path are all in the open. Read exactly how a price is formed and how a market resolves." },
  { title: "Verifiable on-chain", body: "You don't have to trust us — every settlement is a Solana transaction you can check on Solscan yourself." },
  { title: "No hidden result path", body: "The Anchor program verifies a TxLINE proof on-chain. There is no admin override; no one can change how a market settles." },
];

export function OpenSource() {
  return (
    <Section eyebrow="Open source" title="Nothing to trust — everything to verify." lede="Ninety is open source. The whole system is auditable, and every result is checkable on-chain.">
      <div className="grid gap-4 sm:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.title} className="elev rounded-card border border-hairline bg-surface p-5">
            <h3 className="text-strong font-semibold text-hi">{p.title}</h3>
            <p className="mt-1.5 text-caption leading-relaxed text-lo">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Built with</span>
          {BUILT_WITH.map((t) => (
            <span key={t} className="rounded-chip bg-bg/40 px-2.5 py-1 text-caption text-hi ring-1 ring-inset ring-hairline">{t}</span>
          ))}
        </div>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-chip bg-bg/40 px-4 text-strong font-medium text-hi ring-1 ring-inset ring-hairline outline-none transition-colors duration-200 hover:ring-up/40 focus-visible:ring-up/40">
          <Code2 className="h-4 w-4" aria-hidden strokeWidth={2} /> View the source <ArrowRight className="h-4 w-4 text-lo" aria-hidden strokeWidth={2} />
        </a>
      </div>
    </Section>
  );
}
