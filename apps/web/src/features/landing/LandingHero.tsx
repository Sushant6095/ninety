"use client";
import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "../../lib/gsap";
import { motion as m } from "../../design/motion";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { Wordmark } from "../../components/ui/Wordmark";
import { routes } from "../../lib/routes";
import { CtaPair, PlayMoneyLine } from "./Ctas";

// A calm rising win-probability arc with one goal step — the River motif, quiet behind the type
// (same discipline as /how-it-works: no gradient, tokens only, the stroke carries the read).
const RIVER = [30, 31, 31, 32, 30, 33, 34, 33, 35, 44, 52, 56, 55, 57, 58, 60, 61, 61, 63, 64];
const HEADLINE = "Every match is a market for ninety minutes.".split(" ");

/** Landing hero — the arrival. One thesis line (GSAP word reveal), the River drawing itself once
 *  (the sole signature motion, ADR-052), two CTAs, and the play-money promise. The shader slot
 *  (ADR-053) was deliberately left empty: MotionScore already grades texture memory at B, and the
 *  DoD cuts the shader before shipping an S-grade regression — the drawn River is the atmosphere. */
export function LandingHero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const word = m.heroWord / 1000;
      const stagger = m.heroStagger / 1000;
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-word]", { y: 14, opacity: 0, duration: word, stagger, delay: 0.1 });
        gsap.from("[data-hero-after]", { opacity: 0, y: 10, duration: word, delay: 0.1 + word + stagger * 2 });
        const line = scope.current?.querySelector("polyline");
        if (line) {
          const len = line.getTotalLength();
          gsap.fromTo(
            line,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: m.riverDraw / 1000, delay: 0.2, ease: "ninety" },
          );
        }
      });
    },
    { scope },
  );

  return (
    <section ref={scope} aria-labelledby="hero-h" className="relative overflow-hidden border-b border-hairline">
      {/* River motif — draws itself once on arrival */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.22]" aria-hidden>
        <EquityCurve values={RIVER} up height={320} />
      </div>

      {/* minimal landing chrome: wordmark + the two exits. The board carries the full terminal header. */}
      <header className="relative mx-auto flex w-full max-w-[1040px] items-center justify-between px-4 py-5 sm:px-6">
        <Wordmark tag="WC26" />
        <nav aria-label="Landing" className="flex items-center gap-2">
          <Link
            href={routes.howItWorks}
            className="inline-flex min-h-[44px] items-center rounded-chip px-3 text-body font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-2 focus-visible:ring-up/60"
          >
            How it works
          </Link>
          <Link
            href={routes.matches}
            className="inline-flex h-11 items-center rounded-chip bg-surface px-4 text-body font-medium text-hi ring-1 ring-inset ring-hairline outline-none transition-colors duration-200 hover:ring-up/40 focus-visible:ring-up/40 active:bg-hairline/40"
          >
            Open the board
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto w-full max-w-[1040px] px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
        <p className="text-label font-semibold uppercase tracking-[0.14em] text-up">Ninety · World Cup 2026</p>
        <h1 id="hero-h" className="mt-4 max-w-[15ch] font-display text-[clamp(2.75rem,1.4rem+5.6vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-hi">
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
    </section>
  );
}
