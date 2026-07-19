import type { Metadata } from "next";
import { DocTitle, Lead, H2, P, Callout } from "../../features/docs/DocsProse";
import { DocsSlider } from "../../features/docs/DocsSlider";
import { DocsLoop } from "../../features/docs/DocsLoop";

export const metadata: Metadata = {
  title: "Overview — Ninety docs",
  description: "Ninety is a live, play-money football exchange for the FIFA World Cup 2026. Here's what's live today.",
};

const LIVE_TODAY: readonly { k: string; v: string }[] = [
  { k: "Live data", v: "TxLINE devnet, activated on-chain — real World Cup fixtures, scores and prices" },
  { k: "Markets", v: "1X2 synthesised from the feed's Over/Under + Asian-handicap books" },
  { k: "Surfaces", v: "21 routes — board, terminal, match, player, team, moments, bracket, proofs" },
  { k: "API", v: "30 endpoints, live Swagger at omnipitch.fly.dev/docs" },
  { k: "Chain", v: "Anchor program on Solana devnet; proof verification, no admin result path" },
  { k: "Bot", v: "EarlyWhistle on Telegram — live cards plus inbound commands" },
  { k: "Cost", v: "The entire live stack runs on $0 of free tier" },
];

const SYNTH: readonly { team: string; value: string }[] = [
  { team: "Spain", value: "30.58" },
  { team: "Draw", value: "48.92" },
  { team: "Argentina", value: "20.50" },
];

export default function OverviewPage() {
  return (
    <article>
      <DocTitle eyebrow="Overview">Ninety</DocTitle>
      <Lead><em>Every match is a market for ninety minutes.</em></Lead>

      {/* The product tour — above the fold */}
      <div className="mt-8">
        <DocsSlider />
      </div>

      <P>
        Ninety is a live, play-money football exchange for the FIFA World Cup 2026. Every match opens a
        Home / Draw / Away market priced 0–100, where the price <em>is</em> the probability. A goal halts the
        market, it reprices to the new reality, an AI Booth explains the swing, and the result is verified
        on-chain.
      </P>
      <P>
        <strong>Play-money, always.</strong> A thousand free credits every match. No deposits, no cash
        payouts, ever — enforced in code, not in policy. That is what lets Ninety open to any fan in any
        country.
      </P>

      <H2>What&#39;s live today</H2>
      <div className="mt-4 max-w-[72ch] overflow-hidden rounded-card border border-hairline bg-surface">
        <dl className="divide-y divide-hairline/60">
          {LIVE_TODAY.map((r) => (
            <div key={r.k} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[130px_1fr] sm:gap-4">
              <dt className="text-caption font-semibold text-hi">{r.k}</dt>
              <dd className="text-caption leading-relaxed text-lo">{r.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <H2>The loop</H2>
      <P>
        <strong>Goal → Halt → Reprice → The Booth → Settle.</strong> Every surface in the product is a
        different window onto that one loop.
      </P>
      <DocsLoop />

      <H2>How the price is made</H2>
      <P>
        TxLINE&#39;s free World Cup feed carries <strong>Over/Under totals</strong> and{" "}
        <strong>Asian handicap</strong> — both two-outcome books. It never ships a 1X2 market. Ninety trades
        Home / Draw / Away, so we recover it:
      </P>
      <ol className="mt-4 max-w-[70ch] space-y-2.5">
        {[
          <>Invert the <strong>Poisson</strong> CDF on Over/Under → total-goals λ</>,
          <>Invert the <strong>Skellam</strong> on the handicap → supremacy (λ_home − λ_away)</>,
          <>Feed both into a <strong>Dixon-Coles</strong> bivariate-Poisson grid → P(H) / P(D) / P(A)</>,
        ].map((li, i) => (
          <li key={i} className="flex gap-3 text-[1.0625rem] leading-[1.7] text-lo">
            <span className="num mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-label font-semibold tabular-nums text-up ring-1 ring-inset ring-up/40">{i + 1}</span>
            <span className="[&_strong]:font-semibold [&_strong]:text-hi">{li}</span>
          </li>
        ))}
      </ol>

      <P>
        Live example — the World Cup Final:
      </P>
      <div className="mt-3 grid max-w-[72ch] grid-cols-3 gap-3">
        {SYNTH.map((s) => (
          <div key={s.team} className="rounded-card border border-hairline bg-surface px-4 py-4 text-center">
            <div className="num font-display text-display font-bold tabular-nums text-hi">{s.value}</div>
            <div className="mt-1 text-label font-medium uppercase tracking-label text-lo">{s.team}</div>
          </div>
        ))}
      </div>
      <P>
        When the books are too thin to be honest, the market stays <strong>unpriced</strong>. We never print a
        fabricated 33/33/33.
      </P>

      <Callout tone="halt" title="Honest status">
        This is a <strong>working prototype</strong>, not a finished product. Settlement is deliberately
        switched off (see Architecture → <em>The forge</em>). Some surfaces run a recorded replay tape rather
        than an in-play feed, and where they do, the interface says so. Nothing on screen is invented data.
      </Callout>
    </article>
  );
}
