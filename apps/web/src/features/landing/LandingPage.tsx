import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHero } from "./LandingHero";
import { LoopStage, LoopLegend } from "./LoopStage";
import { PriceScrub } from "./PriceScrub";
import { CtaPair } from "./Ctas";
import { NumberTicker } from "../../components/ui/NumberTicker";
import { Reveal } from "../../components/ui/Reveal";
import { Footer } from "../home/Footer";
import { routes } from "../../lib/routes";

const PROOF_STEPS = [
  { n: "01", title: "TxLINE signs the feed", copy: "Every goal, halt and final whistle arrives as a signed message — the data carries its own evidence." },
  { n: "02", title: "The program verifies", copy: "The Solana program checks that signature before any market settles. There is no admin override, by design." },
  { n: "03", title: "Settlement is public", copy: "Every settled market leaves a proof on devnet that anyone can open — no trust required, ever." },
] as const;

/** The landing — where a visitor arrives (the board at /board is where a trader goes). Structure follows the
 *  hyperfoundation research: thesis → the loop shown live → one number → proof → numbers band → close, one
 *  filled CTA repeated verbatim, accent spent once, everything quiet except the River and the halt beat. */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <main>
        <LandingHero />

        {/* 2 — the loop, told by the product itself */}
        <section aria-labelledby="loop-h" className="border-b border-hairline">
          <Reveal className="mx-auto grid w-full max-w-[1040px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_minmax(360px,420px)] lg:items-center lg:gap-16 lg:py-28">
            <div>
              <h2 id="loop-h" className="max-w-[14ch] font-display text-[clamp(1.9rem,1rem+2.6vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-hi">
                Goal. Halt. Reprice.
              </h2>
              <p className="mt-5 max-w-[48ch] text-strong leading-relaxed text-lo">
                A goal freezes the market for a beat — the halt. Prices land at the new reality, the Booth
                explains the move in plain words, and the result settles on-chain. Watch it happen, live,
                on a real market:
              </p>
              <LoopLegend />
            </div>
            <LoopStage />
          </Reveal>
        </section>

        {/* 3 — price is probability: one giant number does the explaining */}
        <section aria-labelledby="price-h" className="border-b border-hairline">
          <Reveal className="mx-auto w-full max-w-[1040px] px-4 py-20 text-center sm:px-6 lg:py-28">
            <h2 id="price-h" className="text-label font-semibold uppercase tracking-[0.14em] text-lo">
              Price is probability
            </h2>
            <p className="mt-6">
              <PriceScrub className="text-[clamp(4.5rem,2rem+9vw,10rem)] font-bold leading-none tracking-[-0.03em] text-hi" />
            </p>
            <p className="mx-auto mt-6 max-w-[52ch] text-strong leading-relaxed text-lo">
              A price of 61.4 means the market gives that side a 61.4% chance of winning. When the
              goal goes in, the probability moves first — and you can trade it, every minute of the match.
            </p>
          </Reveal>
        </section>

        {/* 4 — proof: the one violet (on-chain) surface on the page, on a tonal chapter break */}
        <section aria-labelledby="proof-h" className="border-b border-hairline bg-surface/60">
          <Reveal className="mx-auto w-full max-w-[1040px] px-4 py-20 sm:px-6 lg:py-28">
            <p className="inline-flex items-center gap-1.5 text-label font-semibold uppercase tracking-[0.14em] text-chain">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-chain shadow-[0_0_5px_var(--chain)]" />
              On-chain
            </p>
            <h2 id="proof-h" className="mt-4 max-w-[22ch] font-display text-[clamp(1.9rem,1rem+2.6vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-hi">
              Nobody is trusted. Everything is proven.
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {PROOF_STEPS.map((s) => (
                <div key={s.n}>
                  <p className="num text-label font-semibold tracking-[0.14em] text-lo">{s.n}</p>
                  <h3 className="mt-2 text-strong font-semibold text-hi">{s.title}</h3>
                  <p className="mt-2 text-body leading-relaxed text-lo">{s.copy}</p>
                </div>
              ))}
            </div>
            <Link
              href={routes.proofs}
              className="mt-8 inline-flex min-h-[44px] items-center gap-1.5 rounded-chip pr-2 text-body font-medium text-chain outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-chain focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              See the proof log <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
            </Link>
          </Reveal>
        </section>

        {/* 5 — the numbers band: no visible heading, the numbers ARE the headline */}
        <section aria-labelledby="numbers-h" className="border-b border-hairline">
          <h2 id="numbers-h" className="sr-only">World Cup 2026 in numbers</h2>
          <Reveal>
            <dl className="mx-auto grid w-full max-w-[1040px] grid-cols-2 gap-x-6 gap-y-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:py-24">
              {(
                [
                  { value: <NumberTicker value={104} className="text-[clamp(2.5rem,1.6rem+2.4vw,3.5rem)] font-bold leading-none text-hi" />, label: "Fixtures, group stage to final" },
                  { value: <NumberTicker value={48} className="text-[clamp(2.5rem,1.6rem+2.4vw,3.5rem)] font-bold leading-none text-hi" />, label: "Teams, every one a market" },
                  { value: <NumberTicker value={1000} className="text-[clamp(2.5rem,1.6rem+2.4vw,3.5rem)] font-bold leading-none text-hi" />, label: "Free credits, every match" },
                  { value: <span className="num text-[clamp(2.5rem,1.6rem+2.4vw,3.5rem)] font-bold leading-none tracking-[-0.02em] text-hi">Jul 19</span>, label: "The final, MetLife Stadium" },
                ] as const
              ).map((t, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <dd className="order-first">{t.value}</dd>
                  <dt className="text-label uppercase tracking-[0.12em] text-lo">{t.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* 6 — close: same funnel, identical labels */}
        <section aria-labelledby="close-h">
          <Reveal className="mx-auto w-full max-w-[1040px] px-4 py-24 text-center sm:px-6 lg:py-32">
            <h2 id="close-h" className="mx-auto max-w-[18ch] font-display text-[clamp(1.9rem,1rem+2.6vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-hi">
              The whistle is the opening bell.
            </h2>
            <div className="mt-8 flex justify-center">
              <CtaPair center />
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
