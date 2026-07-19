import Link from "next/link";
import { ArrowRight, Target, Sparkles, Send } from "lucide-react";
import { BentoGrid, BentoCard } from "../../components/vendor/magicui/bento-grid";

// Section 8 — the consumer features as a bento: the free Next Goal game, ownable Moments, and the
// Telegram match cards. Teasers only (the live game runs in the terminal) so nothing here churns the
// GPU. magicui BentoGrid/BentoCard re-skinned to tokens; parent LandingScroll cascades it.
//
// The Telegram card was a scrolling Marquee — but VelocityBand is the page's ONE marquee (design-taste
// marquee-max-one), so this is a STATIC 2x2 grid of the four real Booth one-liners instead (no invented
// copy, same voice as the tape). Match pairings keep the app-wide en-dash convention (CAN–MAR).
const TG_CARDS = [
  { m: "CAN–MAR", line: "Goal! CAN to win 41 → 61.4", min: "74'" },
  { m: "BRA–KOR", line: "Halt. The market holds its breath", min: "55'" },
  { m: "ENG–SUI", line: "Reprice. ENG steady at 52.0", min: "KO" },
  { m: "ARG–ENG", line: "Settle. Proven on-chain", min: "FT" },
] as const;

export function ConsumerBento() {
  return (
    <section aria-labelledby="consumer-h" className="border-b border-hairline">
      <div data-arrive className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:py-24">
        <p data-arrive-item className="text-label font-semibold uppercase tracking-caps text-lo">
          Play the match
        </p>
        <h2
          data-arrive-item
          id="consumer-h"
          className="mt-4 max-w-[22ch] font-display text-section font-bold text-hi"
        >
          Games, Moments, and match cards. All free.
        </h2>

        <div data-arrive-item className="mt-10">
          <BentoGrid>
            {/* Next Goal — the free mini-game */}
            <BentoCard className="lg:col-span-3 lg:row-span-1">
              <div className="flex h-full flex-col justify-between gap-6 p-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-chip border border-hairline bg-bg/50 px-2.5 py-1 text-label font-semibold uppercase tracking-caps text-up">
                    <Target className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Free to play
                  </span>
                  <h3 className="mt-4 font-display text-heading font-bold text-hi">Next Goal</h3>
                  <p className="mt-2 max-w-[38ch] text-body leading-relaxed text-lo">
                    A sixty-second call on who scores next, right beside the trade panel. No credits
                    at risk, streaks that carry, and the tension of a live match.
                  </p>
                </div>
                <Link
                  href="/play"
                  className="inline-flex min-h-[44px] w-fit items-center gap-1.5 text-body font-medium text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-up/60"
                >
                  Play Next Goal <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                </Link>
              </div>
            </BentoCard>

            {/* Moments — ownable swings */}
            <BentoCard className="lg:col-span-3 lg:row-span-1">
              <div className="flex h-full flex-col justify-between gap-6 p-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-chip border border-hairline bg-bg/50 px-2.5 py-1 text-label font-semibold uppercase tracking-caps text-lo">
                    <Sparkles className="h-3.5 w-3.5 text-up" strokeWidth={2} aria-hidden />
                    Yours to keep
                  </span>
                  <h3 className="mt-4 font-display text-heading font-bold text-hi">Moments</h3>
                  <p className="mt-2 max-w-[38ch] text-body leading-relaxed text-lo">
                    The match&apos;s biggest price swings mint as Moments: the goal that moved the
                    market, the halt that froze it. Collect the game as it&apos;s played.
                  </p>
                </div>
                <Link
                  href="/moments"
                  className="inline-flex min-h-[44px] w-fit items-center gap-1.5 text-body font-medium text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-up/60"
                >
                  See Moments <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                </Link>
              </div>
            </BentoCard>

            {/* Telegram — match cards in your chat (full-width; a STATIC grid of the four real Booth calls) */}
            <BentoCard className="lg:col-span-6">
              <div className="flex flex-col gap-6 p-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-chip border border-hairline bg-bg/50 px-2.5 py-1 text-label font-semibold uppercase tracking-caps text-lo">
                    <Send className="h-3.5 w-3.5 text-up" strokeWidth={2} aria-hidden />
                    In your chat
                  </span>
                  <h3 className="mt-4 font-display text-heading font-bold text-hi">
                    Telegram match cards
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-body leading-relaxed text-lo">
                    Every swing arrives as a card in Telegram: the price, the move, and the
                    Booth&apos;s one-line call, so you never miss the minute that mattered.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {TG_CARDS.map((c) => (
                    <div
                      key={c.m}
                      className="flex items-center gap-3 rounded-card border border-hairline/70 bg-bg/60 px-4 py-3"
                    >
                      <span className="num text-label font-semibold tracking-caps text-lo">{c.m}</span>
                      <span className="min-w-0 flex-1 truncate text-body text-hi">{c.line}</span>
                      <span className="num text-label font-semibold text-up">{c.min}</span>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </BentoGrid>
        </div>
      </div>
    </section>
  );
}
