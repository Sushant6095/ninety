import type { Metadata } from "next";
import { DocTitle, Lead, H2, P } from "../../../features/docs/DocsProse";

export const metadata: Metadata = {
  title: "Future plans — Ninety docs",
  description: "A prototype built in thirteen days, intended to run for years. Where the money goes, the product roadmap, and why it compounds.",
};

const MONEY: readonly { name: string; body: string }[] = [
  { name: "Infrastructure", body: "Proper compute — dedicated EC2 instances sized for the engine and the quant worker, rather than shared 512MB machines. Managed Postgres with real connection pooling instead of a 20-connection free tier. A production Redis. Proper observability." },
  { name: "TxLINE credits", body: "The free World Cup tier is generous, but paid TxLINE access unlocks more competitions, deeper markets, and higher rate limits. That is the single highest-leverage purchase — it turns one tournament into every league." },
  { name: "Sportmonks subscription", body: "For the general football data the current free tiers ration — squads, deep player statistics, historical results, and the wider competition coverage that makes a consumer experience feel complete rather than tournament-shaped." },
];

const PRODUCT: readonly { name: string; body: string }[] = [
  { name: "Mobile", body: "A native application is the obvious next surface. Football is watched with a phone in hand, and a scroll-and-tap experience built for that context will always beat a responsive website." },
  { name: "A more seamless interface", body: "The current UI is dense and functional. The next pass is about flow — fewer decisions, faster paths, better transitions, and an experience that feels effortless rather than merely complete." },
  { name: "Deeper data", body: "Lineups, expected goals, head-to-head history, heatmaps, and per-player market impact across every competition." },
  { name: "The AI Pundit Bot", body: "EarlyWhistle with text-to-speech, so the match can talk to you while you are doing something else." },
  { name: "Social and creator layers", body: "Shareable Moments, rivalries, group leagues, and a public record of who actually predicts football best." },
];

export default function RoadmapPage() {
  return (
    <article>
      <DocTitle eyebrow="Future plans">This is a prototype. I intend to run it for years.</DocTitle>
      <Lead>
        Ninety was built in thirteen days for a hackathon. What exists today is a working prototype — a real
        distributed system with a real data feed and a real on-chain component, but a prototype nonetheless.
      </Lead>
      <P>
        I am not building this to win a prize and move on. This is a long-term project, and the World Cup is a
        starting point rather than the destination. There is a football match somewhere every single day, and
        the loop Ninety is built on works for all of them.
      </P>

      <H2>Where the money goes</H2>
      <P>
        Everything currently runs on free tiers — Vercel, Aiven, Fly, Solana devnet. That was a deliberate
        constraint and it produced a better architecture, but it is also the ceiling. The first investments:
      </P>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {MONEY.map((m, i) => (
          <div key={m.name} className="flex flex-col rounded-card border border-hairline bg-surface p-5">
            <span className="num text-label font-semibold tabular-nums text-up">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-2 text-body font-semibold text-hi">{m.name}</h3>
            <p className="mt-2 text-caption leading-[1.65] text-lo">{m.body}</p>
          </div>
        ))}
      </div>

      <H2>The product roadmap</H2>
      <ol className="mt-6 max-w-[72ch]">
        {PRODUCT.map((p, i) => (
          <li key={p.name} className="relative flex gap-5 pb-8 last:pb-0">
            {/* rail */}
            <div className="relative flex flex-col items-center">
              <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-up/40 bg-surface">
                <span className="num text-label font-semibold tabular-nums text-up">{i + 1}</span>
              </span>
              {i < PRODUCT.length - 1 && <span aria-hidden className="absolute top-8 h-full w-px bg-hairline" />}
            </div>
            <div className="pt-0.5">
              <h3 className="text-body font-semibold text-hi">{p.name}</h3>
              <p className="mt-1.5 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-lo">{p.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <H2>Why this compounds</H2>
      <P>
        The interesting long-term asset is not the interface — it is the data. A play-money exchange produces a
        record of how people actually price football when they have no financial incentive to distort it. No
        bookmaker can farm that, because nobody plays honestly when their own money is at risk.
      </P>
      <P>
        That record is what makes everything else possible: a better prediction engine, a genuinely useful
        consumer product, and a clean, legal top-of-funnel that a sportsbook could never build for itself.
      </P>
    </article>
  );
}
