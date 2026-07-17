import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "../../components/templates/notio/navbar";
import Hero from "../../components/templates/notio/call-to-action/hero";
import Footer from "../../components/templates/notio/footer";
import { LandingScroll } from "./LandingScroll";
import { LoopStage, LoopLegend } from "./LoopStage";
import { PriceVoid } from "./PriceVoid";
import { PriceScrub } from "./PriceScrub";
import { VelocityBand } from "./VelocityBand";
import { FlowFieldLazy } from "./FlowFieldLazy";
import { CrestWall } from "./CrestWall";
import { BoothQuotes } from "./BoothQuotes";
import { FreeCredits } from "./FreeCredits";
import { CrowdBand } from "./CrowdBand";
import { FootballExperience } from "./FootballExperience";
import { ConsumerBento } from "./ConsumerBento";
import { DribbleSceneLazy } from "./DribbleSceneLazy";
import { NumberTicker } from "../../components/ui/NumberTicker";
import { Highlighter } from "../../components/vendor/magicui/highlighter";

// The long landing (ADR-069): the kept notio hero, then the full football-first scroll story below it.
// Structure = the user's 9-section spec (3D dropped this run). Everything below the hero is REUSE of
// already-built, MotionScore-tuned pieces + two new consumer sections; the scroll spine is LandingScroll
// (GSAP ScrollTrigger, once-in-view, matchMedia + reduced-motion). Cut vs the old LandingPage: the
// skiper52 pillars (animated flex-grow = layout thrash) and the duplicate close (the notio footer IS
// the "opening bell" close). Heavy canvas pieces stay lazy / lg-only.

const PROOF_STEPS = [
  { n: "01", title: "TxLINE signs the feed", copy: "Every goal, halt and final whistle arrives as a signed message. The data carries its own evidence." },
  { n: "02", title: "The program verifies", copy: "The Solana program checks that signature before any market settles. There is no admin override, by design." },
  { n: "03", title: "Settlement is public", copy: "Every settled market leaves a proof on devnet that anyone can open. No trust required, ever." },
] as const;

export function LandingLong() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* 1 — nav (kept) · 2 — hero (kept: notio shell + live HeroRiver, the 10/10) */}
      <Navbar />
      <main>
        <Hero />

        <LandingScroll>
          {/* 2b — THE 3D FOOTBALL MOMENT (ADR-070): a stylized dribbler weaves, scores, and the
              price ticks up — landing-only (ADR-058), lazy (next/dynamic ssr:false), IO-gated. The
              canvas slot is NOT opacity-gated (only the copy cascades) and has a fixed height (no CLS). */}
          <section aria-labelledby="scene-h" className="border-b border-hairline">
            <div data-arrive className="mx-auto w-full max-w-[1180px] px-4 pt-16 sm:px-6 lg:pt-24">
              <p data-arrive-item className="text-label font-semibold uppercase tracking-caps text-lo">
                Football, priced live
              </p>
              {/* Denies nothing: the old line was "This isn't a terminal", on a page whose nav, hero and footer
                  say "Open the terminal" nine times — the product's own flagship surface, disowned above the
                  fold. It also ran the identical formula to FootballExperience's "This isn't a stats page. It's
                  the match, priced live." two screens down. Say what the scene shows instead. */}
              <h2 data-arrive-item id="scene-h" className="mt-4 max-w-[24ch] font-display text-section font-bold text-hi">
                The game moves. The price moves with it.
              </h2>
              <p data-arrive-item className="mt-5 max-w-[52ch] text-strong leading-relaxed text-lo">
                A run, a shot, a goal — and the price moves before the crowd comes down. Watch the
                market read the game.
              </p>
            </div>
            <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-10 sm:px-6 lg:pb-24">
              <div className="elev relative h-[380px] overflow-hidden rounded-card border border-hairline/70 bg-bg sm:h-[440px] lg:h-[520px]">
                <DribbleSceneLazy className="h-full w-full" />
              </div>
            </div>
          </section>

          {/* 3 — THE LOOP: the product tells its own story. LoopStage mounts in view and plays the
              real useHaltSequence timeline (goal → halt → reprice → Booth → settle) in front of you. */}
          <section aria-labelledby="loop-h" className="border-b border-hairline">
            <div
              data-arrive
              className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_minmax(380px,440px)] lg:items-center lg:gap-16 lg:py-24"
            >
              <div>
                {/* Plain type, by design: a scramble on the heading fights the one thing the section is asking
                    you to read (the panel landing a real goal beside it), and garbles the words for the ~700ms
                    a visitor spends deciding to look. The motion belongs to the market, not the h2. */}
                <h2 data-arrive-item id="loop-h" className="max-w-[14ch] font-display text-section font-bold text-hi">
                  Goal. Halt. Reprice.
                </h2>
                <p data-arrive-item className="mt-5 max-w-[48ch] text-strong leading-relaxed text-lo">
                  A goal freezes the market for a beat: the halt. Prices land at the new reality, the Booth
                  explains the move in plain words, and the result settles on-chain. Watch it happen, live,
                  on a real market:
                </p>
                <div data-arrive-item>
                  <LoopLegend />
                </div>
              </div>
              <div data-arrive-item>
                <LoopStage />
              </div>
            </div>
          </section>

          {/* 4 — PRICE IS PROBABILITY: one giant number does the explaining, the void orbiting behind it */}
          <section aria-labelledby="price-h" className="relative border-b border-hairline">
            <PriceVoid className="hidden lg:block" />
            <div data-arrive className="relative z-10 mx-auto w-full max-w-[1180px] px-4 py-16 text-center sm:px-6 lg:py-24">
              <h2 data-arrive-item id="price-h" className="text-label font-semibold uppercase tracking-caps text-lo">
                Price is probability
              </h2>
              <p data-arrive-item className="mt-6">
                <PriceScrub className="text-number font-bold text-hi" />
              </p>
              <p data-arrive-item className="mx-auto mt-6 max-w-[52ch] text-strong leading-relaxed text-lo">
                A price of 61.4 means the market gives that side a 61.4% chance of winning. When the
                goal goes in, the probability moves first, and you can trade it every minute of the match.
              </p>
            </div>
          </section>

          {/* chapter break — the loop's verbs riding the scroll (magicui scroll-based-velocity) */}
          <VelocityBand />

          {/* 5 — THE FOOTBALL EXPERIENCE: the consumer-track journey, end to end */}
          <FootballExperience />

          {/* 6 — PROOF / ON-CHAIN: the one violet surface, signed data streaming behind it */}
          <section aria-labelledby="proof-h" className="relative border-b border-hairline bg-surface/60">
            <FlowFieldLazy className="hidden lg:block" />
            <div data-arrive className="relative z-10 mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:py-24">
              <p data-arrive-item className="inline-flex items-center gap-1.5 text-label font-semibold uppercase tracking-caps text-chain">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-chain shadow-[0_0_5px_var(--chain)]" />
                On-chain
              </p>
              <h2 data-arrive-item id="proof-h" className="mt-4 max-w-[22ch] font-display text-section font-bold text-hi">
                Nobody is trusted.{" "}
                <Highlighter token="chain" action="underline" strokeWidth={2} padding={4}>
                  Everything is proven.
                </Highlighter>
              </h2>
              <div className="mt-10 grid gap-8 sm:grid-cols-3">
                {PROOF_STEPS.map((s) => (
                  <div data-arrive-item key={s.n}>
                    <p className="num text-label font-semibold tracking-caps text-lo">{s.n}</p>
                    <h3 className="mt-2 text-strong font-semibold text-hi">{s.title}</h3>
                    <p className="mt-2 text-body leading-relaxed text-lo">{s.copy}</p>
                  </div>
                ))}
              </div>
              <div data-arrive-item>
                <Link
                  href="/proofs"
                  className="mt-8 inline-flex min-h-[44px] items-center gap-1.5 rounded-chip pr-2 text-body font-medium text-chain outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-chain focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:opacity-70"
                >
                  See the proof log <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                </Link>
              </div>
            </div>
          </section>

          {/* the Booth's own lines from the featured market — the voice that explains every swing */}
          <BoothQuotes />

          {/* 7 — THE WHOLE TOURNAMENT: the numbers ARE the headline; the wall of 48 real crests makes
              "every one a market" literal (it replaced a dotted globe — see CrestWall). */}
          <section aria-labelledby="numbers-h" className="border-b border-hairline">
            <h2 id="numbers-h" className="sr-only">World Cup 2026 in numbers</h2>
            {/* The stats column was 1fr (~800px) for four short numbers, leaving "104" and "48" stranded ~590px
                apart with a canyon between them and the visual. Cap it and give the recovered width to the wall,
                which now needs it to show the group structure. */}
            <div data-arrive className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-16 lg:py-20">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-10">
                {(
                  [
                    { value: <NumberTicker value={104} className="text-stat font-bold text-hi" />, label: "Fixtures, group stage to final" },
                    { value: <NumberTicker value={48} className="text-stat font-bold text-hi" />, label: "Teams, every one a market" },
                    { value: <NumberTicker value={1000} className="text-stat font-bold text-hi" />, label: "Free credits, every match" },
                    { value: <span className="num text-stat font-bold tracking-tight text-hi">Jul 19</span>, label: "The final, MetLife Stadium" },
                  ] as const
                ).map((t, i) => (
                  <div data-arrive-item key={i} className="flex flex-col gap-2">
                    <dd className="order-first">{t.value}</dd>
                    <dt className="text-label uppercase tracking-label text-lo">{t.label}</dt>
                  </div>
                ))}
              </dl>
              {/* shows at every breakpoint — the globe was lg-only, so phones got no visual at all here */}
              <div data-arrive-item className="mx-auto w-full max-w-[460px]">
                <CrestWall />
              </div>
            </div>
          </section>

          {/* the play-money "pricing" slot, inverted: one card, one price, free */}
          <FreeCredits />

          {/* 8 — GAMES + MOMENTS + TELEGRAM: the consumer features as a bento */}
          <ConsumerBento />
        </LandingScroll>
      </main>

      {/* 9 — close (kept): notio "opening bell" footer, crowd terrace on its bottom edge */}
      <div className="relative">
        <Footer />
        <CrowdBand className="absolute inset-x-0 bottom-0 z-0 h-40 opacity-40" />
      </div>
    </div>
  );
}
