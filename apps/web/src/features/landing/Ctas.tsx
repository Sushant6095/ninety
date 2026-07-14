import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { routes } from "../../lib/routes";

/** The landing's ONE funnel, repeated verbatim (hero + close, per the hyperfoundation restraint law):
 *  a single filled CTA and a single outline CTA, identical labels everywhere they appear. */
export function CtaPair({ center = false }: { center?: boolean }) {
  return (
    <div role="group" aria-label="Get started" className={`flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      <Link
        href={routes.onboarding}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-chip bg-up px-5 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:opacity-80"
      >
        Get 1,000 credits <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
      </Link>
      <Link
        href={routes.matches}
        className="inline-flex h-11 items-center justify-center rounded-chip bg-surface px-5 text-strong font-medium text-hi ring-1 ring-inset ring-hairline outline-none transition-colors duration-200 hover:ring-up/40 focus-visible:ring-up/40 active:bg-hairline/40"
      >
        See tonight&#39;s matches
      </Link>
    </div>
  );
}

export function PlayMoneyLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-label uppercase tracking-[0.14em] text-lo ${className}`}>
      Play money · No deposits · No cash payouts, ever
    </p>
  );
}
