import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";
import { Globe, Server } from "lucide-react";
import { DocTitle, H2 } from "../../../features/docs/DocsProse";

// Official GitHub mark (Simple Icons) — lucide dropped brand icons; a brand logo is the sanctioned SVG exception.
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden focusable="false">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "About — Ninety docs",
  description: "Who built Ninety, and why. A backend and blockchain engineer, and the two honesty decisions that matter most.",
};

// About reads slower than the other pages: narrower measure, larger body, more leading.
function AboutP({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 max-w-[68ch] text-[1.1875rem] leading-[1.85] text-lo [&_strong]:font-semibold [&_strong]:text-hi [&_em]:not-italic [&_em]:text-up">
      {children}
    </p>
  );
}

const LINKS: readonly { label: string; value: string; href: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "Repository", value: "github.com/Sushant6095/ninety", href: "https://github.com/Sushant6095/ninety", icon: GithubMark },
  { label: "Live app", value: "ninety-nu.vercel.app", href: "https://ninety-nu.vercel.app", icon: Globe },
  { label: "Live API + Swagger", value: "omnipitch.fly.dev/docs", href: "https://omnipitch.fly.dev/docs", icon: Server },
];

const SOLANA_PROGRAM = "6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj";

export default function AboutPage() {
  return (
    <article className="max-w-[68ch]">
      <DocTitle eyebrow="About">Who built this</DocTitle>

      <AboutP>
        I am a <strong>backend and blockchain engineer</strong>. I have built more than twenty applications,
        and I currently work as a backend and infrastructure engineer at a startup serving roughly{" "}
        <strong>half a million active users</strong>. My depth is in distributed systems, scalable
        architecture, and the parts of a product that are invisible when they work.
      </AboutP>
      <AboutP>
        That is what Ninety is really made of. The single-writer engine with journal-then-ack, the two-plane
        event bus, the polyglot quant worker, the on-chain verification path, the two-source data law, the 87
        decision records — that is the part I know how to do well, and it is why the system holds together on
        free-tier infrastructure.
      </AboutP>
      <AboutP>
        <strong>The interface is not my home ground.</strong> I am a backend engineer, and the frontend was
        built fast, with heavy AI assistance, against a strict design system that kept it coherent. I would
        rather say that plainly than pretend otherwise. What it demonstrates is that a backend engineer with a
        rigorous design system and modern tooling can ship a consumer-grade surface — and that the architecture
        underneath it is the real work.
      </AboutP>

      <H2>The honesty thread</H2>
      <AboutP>Two decisions in this project matter more to me than any feature:</AboutP>
      <AboutP>
        <strong>We fail-closed on settlement.</strong> We found the sponsor&#39;s proof could not bind match
        finality on-chain, proved it forgeable, and switched settlement off rather than ship it. It cost us a
        headline feature.
      </AboutP>
      <AboutP>
        <strong>We never fabricate data.</strong> Where the interface shows a replay rather than a live feed,
        it says so. Where a market cannot be priced honestly, it stays unpriced instead of printing a
        plausible-looking number.
      </AboutP>
      <AboutP>Both come from the same instinct, and it is the instinct I would want judged.</AboutP>

      <H2>Links</H2>
      <div className="mt-5 flex flex-col gap-3">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-card border border-hairline bg-surface px-4 py-3 outline-none transition-colors duration-200 hover:border-up/40 hover:bg-hairline/15 focus-visible:ring-2 focus-visible:ring-up/60"
            >
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-chip bg-bg text-lo ring-1 ring-inset ring-hairline transition-colors duration-200 group-hover:text-hi">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-label uppercase tracking-label text-lo">{l.label}</span>
                <span className="num block truncate text-caption text-hi">{l.value}</span>
              </span>
            </a>
          );
        })}
        <div className="flex items-center gap-3 rounded-card border border-chain/50 bg-surface px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-chip bg-chain/10 text-chain ring-1 ring-inset ring-chain/40">
            <Server className="h-4 w-4" aria-hidden strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-label uppercase tracking-label text-chain">Solana program (devnet)</span>
            <span className="num block truncate text-caption text-hi">{SOLANA_PROGRAM}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
