"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Star, Bell } from "lucide-react";
import { CreditPill } from "../../components/ui/CreditPill";
import { Avatar } from "../../components/ui/Avatar";
import { routes } from "../../lib/routes";
import type { SessionUser } from "../../lib/types";

const SUBNAV: { label: string; href: string; count?: number; home?: boolean }[] = [
  { label: "Trending", href: routes.moments },
  { label: "WC26", href: routes.home, count: 80, home: true },
  { label: "Live", href: routes.home, count: 4 },
  { label: "Today", href: routes.home, count: 12 },
  { label: "Portfolio", href: routes.portfolio },
  { label: "Leaders", href: routes.leaders },
  { label: "Moments", href: routes.moments },
  { label: "Proofs", href: routes.proofs, count: 88 },
];

/** The Terminal chrome: wordmark + TERMINAL badge · search · balance/rank/actions, then a dense sub-nav row with
 *  the live feed/proof status on the right. */
export function TerminalHeader({ user }: { user: SessionUser }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 bg-bg">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link href={routes.home} aria-label="Ninety — home" className="group inline-flex shrink-0 items-center gap-2">
          <span className="font-display text-[19px] font-extrabold leading-none tracking-[-0.03em] text-hi transition-opacity duration-200 group-hover:opacity-80">Ninety</span>
          <span className="num rounded-[5px] bg-surface px-1.5 py-[3px] text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-lo ring-1 ring-inset ring-hairline">Terminal</span>
        </Link>

        <label className="group relative hidden min-w-0 flex-1 md:block">
          <span className="sr-only">Search matches, markets, traders, proofs</span>
          <Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lo" aria-hidden />
          <input
            type="text"
            placeholder="Search matches, markets, traders, proofs"
            className="h-9 w-full rounded-chip bg-surface pl-9 pr-10 text-[13px] text-hi placeholder:text-lo ring-1 ring-inset ring-hairline transition-shadow duration-200 focus:shadow-[0_0_0_2px_var(--up)] focus:outline-none"
          />
          <kbd className="num pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-bg px-1.5 py-0.5 text-[10px] text-lo ring-1 ring-inset ring-hairline">⌘K</kbd>
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
          <CreditPill credits={user.credits} />
          <Link href={routes.portfolio} aria-label={`Rank ${user.rank}`} className="hidden items-center gap-1.5 rounded-chip bg-surface px-2.5 py-1.5 text-[12px] ring-1 ring-inset ring-hairline transition-colors duration-200 hover:ring-up/40 lg:inline-flex">
            <span className="text-lo">RANK</span>
            <span className="num font-medium text-hi">#{user.rank}</span>
            <span className="num inline-flex items-center gap-0.5 text-up">▲{user.rankDelta}</span>
          </Link>
          <button aria-label="Favourites" className="grid h-10 w-10 place-items-center rounded-full text-lo transition-colors duration-200 hover:bg-surface hover:text-hi"><Star size={17} strokeWidth={2} aria-hidden /></button>
          <button aria-label="Alerts" className="grid h-10 w-10 place-items-center rounded-full text-lo transition-colors duration-200 hover:bg-surface hover:text-hi"><Bell size={17} strokeWidth={2} aria-hidden /></button>
          <Link href={routes.settings} aria-label="Account" className="rounded-full ring-1 ring-inset ring-hairline transition-shadow duration-200 hover:ring-up/40"><Avatar handle={user.handle} size={36} /></Link>
        </div>
      </div>

      <div className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SUBNAV.map((t) => {
            const active = t.home && path.startsWith(routes.terminal);
            return (
              <Link key={t.label} href={t.href} className={`group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[12px] font-medium transition-colors duration-200 ${active ? "text-hi" : "text-lo hover:text-hi"}`}>
                {t.label}
                {t.count != null && <span className={`num rounded-full px-1.5 text-[10px] font-semibold tabular-nums ring-1 ring-inset ${active ? "bg-up/15 text-up ring-up/25" : "bg-surface text-lo ring-hairline"}`}>{t.count}</span>}
                {active && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-up" />}
              </Link>
            );
          })}
          <div className="num ml-auto flex shrink-0 items-center gap-3 pl-4 pr-1 text-[10px] tracking-wide text-lo">
            <span>FEED <span className="text-hi">42 ms</span></span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-chain shadow-[0_0_5px_var(--chain)]" /><span className="text-chain">DEVNET</span></span>
            <span className="hidden sm:inline">SLOT <span className="text-hi">297,441,208</span></span>
          </div>
        </div>
      </div>
    </header>
  );
}
