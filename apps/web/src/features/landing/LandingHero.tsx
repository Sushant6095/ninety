"use client";
import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "../../lib/gsap";
import { motion as m } from "../../design/motion";
import { Wordmark } from "../../components/ui/Wordmark";
import { routes } from "../../lib/routes";
import { CtaPair, PlayMoneyLine } from "./Ctas";
import { HeroRiver } from "./HeroRiver";

const HEADLINE = "Every match is a market for ninety minutes.".split(" ");

// Entrance storyboard (all values from design/motion.ts; reduced motion → every state, no travel):
//   t=100ms   headline words rise in — heroWord 400ms each, heroStagger 45ms cascade
//   t=300ms   the River tape draws on left→right — clip-path reveal over riverDraw 1400ms
//   t=~860ms  sub + CTAs + play-money rise in — heroWord 400ms
const TIMING = { lead: 0.1, river: 0.3 } as const;

/** Landing hero — the arrival. Left: one thesis line (GSAP word reveal) and the two CTAs. Right: the
 *  signature Momentum River as a LIVE tape (HeroRiver), drawing itself on load and owning the half —
 *  not a hairline motif. The shader slot (ADR-053) stays empty for good now: this hero carries a live
 *  price, and WebGL never renders on a surface with a live price. */
export function LandingHero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const word = m.heroWord / 1000;
      const stagger = m.heroStagger / 1000;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-word]", { y: 14, opacity: 0, duration: word, stagger, delay: TIMING.lead });
        gsap.from("[data-hero-after]", { opacity: 0, y: 10, duration: word, delay: TIMING.lead + word + stagger * 2 });
        gsap.fromTo(
          "[data-hero-river]",
          { clipPath: "inset(0 100% 0 0)", opacity: 0.4 },
          { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: m.riverDraw / 1000, delay: TIMING.river, ease: "ninety" },
        );
      });
    },
    { scope },
  );

  return (
    <section ref={scope} aria-labelledby="hero-h" className="relative border-b border-hairline">
      {/* minimal landing chrome: wordmark + the two exits. The board carries the full terminal header. */}
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-5 sm:px-6">
        <Wordmark tag="WC26" />
        <nav aria-label="Landing" className="flex items-center gap-2">
          <Link
            href={routes.howItWorks}
            className="inline-flex min-h-[44px] items-center rounded-chip px-3 text-body font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-2 focus-visible:ring-up/60 active:opacity-70"
          >
            How it works
          </Link>
          <Link
            href={routes.onboarding}
            className="inline-flex h-11 items-center rounded-chip bg-up px-4 text-body font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:opacity-80"
          >
            Get 1,000 credits
          </Link>
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:gap-16">
        <div>
          <h1 id="hero-h" className="max-w-[15ch] font-display text-hero font-bold text-hi [text-wrap:balance]">
            <span className="sr-only">Every match is a market for ninety minutes.</span>
            <span aria-hidden>
              {HEADLINE.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                  <span data-hero-word className="inline-block">{w}&nbsp;</span>
                </span>
              ))}
            </span>
          </h1>
          <div data-hero-after>
            <p className="mt-6 max-w-[54ch] text-strong leading-relaxed text-lo">
              Prices move with the game. The Booth explains every swing. Solana proves the result.
            </p>
            <div className="mt-8">
              <CtaPair />
            </div>
            <PlayMoneyLine className="mt-6" />
          </div>
        </div>
        <HeroRiver />
      </div>
    </section>
  );
}
