"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Star, Bell } from "lucide-react";
import { CommandMenu } from "../../components/ui/CommandMenu";
import { Tooltip } from "../../components/ui/Tooltip";
import { CreditPill } from "../../components/ui/CreditPill";
import { Avatar } from "../../components/ui/Avatar";
import { routes, DOCS_URL } from "../../lib/routes";
import type { SessionUser } from "../../lib/types";

// The single app-wide surface nav (App and Terminal are merged — no more surface toggle). Covers every
// destination the old App nav had, plus the Terminal's live-market filters and proof status.
// `external` items (Docs → GitBook) render as new-tab anchors with no active state.
const SUBNAV: { label: string; href: string; count?: number; home?: boolean; external?: boolean }[] = [
  { label: "Trending", href: routes.moments },
  { label: "WC26", href: routes.board, count: 80, home: true },
  { label: "Live", href: routes.board, count: 4 },
  { label: "Today", href: routes.board, count: 12 },
  { label: "Competition", href: routes.competition },
  { label: "Bracket", href: routes.bracket },
  { label: "Portfolio", href: routes.portfolio },
  { label: "Leaders", href: routes.leaders },
  { label: "Moments", href: routes.moments },
  { label: "History", href: routes.history },
  { label: "Proofs", href: routes.proofs, count: 88 },
  { label: "Docs", href: DOCS_URL, external: true },
];

/** The one Ninety chrome: wordmark + TERMINAL badge · search · balance/rank/actions, then a dense sub-nav row
 *  with the live feed/proof status on the right. Used on every screen — the board (/) and the desk alike. */
export function TerminalHeader({ user }: { user: SessionUser }) {
  const path = usePathname();
  const [cmdkOpen, setCmdkOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdkOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <header className="sticky top-0 z-30 bg-bg">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link href={routes.home} aria-label="Ninety — home" className="group inline-flex shrink-0 items-center gap-2">
          <span className="font-display text-heading font-extrabold leading-none tracking-tighter text-hi transition-opacity duration-200 group-hover:opacity-80">Ninety</span>
          <span className="num rounded-md bg-surface px-1 py-0.5 text-label font-semibold uppercase leading-none tracking-tag text-lo ring-1 ring-inset ring-hairline">{path === routes.board ? "WC26" : "Terminal"}</span>
        </Link>

        <button
          type="button"
          onClick={() => setCmdkOpen(true)}
          aria-label="Search matches, traders, pages"
          className="hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-chip bg-surface pl-3 pr-2 text-left outline-none ring-1 ring-inset ring-hairline transition-shadow duration-200 hover:ring-up/40 focus-visible:shadow-[0_0_0_2px_var(--up)] md:flex"
        >
          <Search size={16} strokeWidth={2} className="shrink-0 text-lo" aria-hidden />
          <span className="truncate text-body text-lo">Search matches, traders, pages…</span>
          <kbd className="num ml-auto shrink-0 rounded bg-bg px-1 py-0.5 text-label text-lo ring-1 ring-inset ring-hairline">⌘K</kbd>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2">
          <CreditPill credits={user.credits} />
          <Link href={routes.portfolio} aria-label={`Rank ${user.rank}`} className="hidden items-center gap-1 rounded-chip bg-surface px-2 py-1 text-caption ring-1 ring-inset ring-hairline transition-colors duration-200 hover:ring-up/40 lg:inline-flex">
            <span className="text-lo">RANK</span>
            <span className="num font-medium text-hi">#{user.rank}</span>
            <span className="num inline-flex items-center gap-0.5 text-up">▲{user.rankDelta}</span>
          </Link>
          <Tooltip content="Favourites">
            <button aria-label="Favourites" className="grid h-11 w-11 place-items-center rounded-full text-lo transition-colors duration-200 hover:bg-surface hover:text-hi active:bg-hairline/40"><Star size={17} strokeWidth={2} aria-hidden /></button>
          </Tooltip>
          <Tooltip content="Alerts">
            <button aria-label="Alerts" className="grid h-11 w-11 place-items-center rounded-full text-lo transition-colors duration-200 hover:bg-surface hover:text-hi active:bg-hairline/40"><Bell size={17} strokeWidth={2} aria-hidden /></button>
          </Tooltip>
          <Link href={routes.settings} aria-label="Account" className="rounded-full ring-1 ring-inset ring-hairline transition-shadow duration-200 hover:ring-up/40"><Avatar handle={user.handle} size={36} /></Link>
        </div>
      </div>

      <div className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SUBNAV.map((t) => {
            const cls = "group relative flex shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-caption font-medium transition-colors duration-200";
            if (t.external) {
              return (
                <a key={t.label} href={t.href} target="_blank" rel="noopener noreferrer" className={`${cls} text-lo hover:text-hi`}>
                  {t.label}
                </a>
              );
            }
            const active = t.home
              ? path === routes.board || path.startsWith(routes.terminal) || path.startsWith("/match")
              : t.href !== routes.board && path.startsWith(t.href);
            return (
              <Link key={t.label} href={t.href} className={`${cls} ${active ? "text-hi" : "text-lo hover:text-hi"}`}>
                {t.label}
                {t.count != null && <span className={`num rounded-full px-1 text-label font-semibold tabular-nums ring-1 ring-inset ${active ? "bg-hairline/50 text-hi ring-hairline" : "bg-surface text-lo ring-hairline"}`}>{t.count}</span>}
                {active && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-up" />}
              </Link>
            );
          })}
          <div className="num ml-auto flex shrink-0 items-center gap-3 pl-4 pr-1 text-label tracking-wide text-lo">
            <span>FEED <span className="text-hi">42 ms</span></span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-chain shadow-[0_0_5px_var(--chain)]" /><span className="text-chain">DEVNET</span></span>
            <span className="hidden sm:inline">SLOT <span className="text-hi">297,441,208</span></span>
          </div>
        </div>
      </div>
      </header>
      <CommandMenu open={cmdkOpen} onOpenChange={setCmdkOpen} />
    </>
  );
}
