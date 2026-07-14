import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EquityCurve } from "../../../components/ui/EquityCurve";
import { routes } from "../../../lib/routes";

// A calm rising win-probability arc — the River motif, quiet behind the headline (no gradient, tokens only).
const RIVER = [31, 31, 32, 30, 33, 40, 48, 55, 54, 56, 58, 60, 61, 63, 64, 66, 67, 68];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      {/* River motif */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.18]" aria-hidden>
        <EquityCurve values={RIVER} up height={280} />
      </div>
      <div className="relative mx-auto w-full max-w-[1040px] px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-label font-semibold uppercase tracking-caps text-up">Ninety · World Cup 2026</div>
        <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(2.25rem,1.2rem+4.5vw,4.25rem)] font-bold leading-[1.02] tracking-tight text-hi">
          Every match is a market for ninety minutes.
        </h1>
        <p className="mt-5 max-w-[54ch] text-strong leading-relaxed text-lo">
          A free-to-play live football exchange. Prices move with the game, the Booth explains the swings, and Solana proves the result — trustlessly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={routes.onboarding} className="inline-flex h-11 items-center justify-center gap-2 rounded-chip bg-up px-5 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80">
            Get 1,000 credits <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
          </Link>
          <Link href={routes.matches} className="inline-flex h-11 items-center justify-center rounded-chip bg-surface px-5 text-strong font-medium text-hi ring-1 ring-inset ring-hairline outline-none transition-colors duration-200 hover:ring-up/40 focus-visible:ring-up/40">
            See tonight&#39;s matches
          </Link>
        </div>
        <p className="mt-6 text-label uppercase tracking-wide text-lo">Play money · No deposits · No cash payouts, ever</p>
      </div>
    </section>
  );
}
