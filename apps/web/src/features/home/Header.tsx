"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "../../components/ui/Wordmark";
import { CreditPill } from "../../components/ui/CreditPill";
import { ScreenSwitcher } from "../../components/ui/ScreenSwitcher";
import { NAV, routes } from "../../lib/routes";
import type { SessionUser } from "../../lib/types";

interface HeaderProps {
  user: SessionUser;
}

export function Header({ user }: HeaderProps) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-bg">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Wordmark tag="WC26" />

        <ScreenSwitcher className="hidden xl:inline-flex" />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href) && (item.href !== "/" || path === "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center rounded-md px-3 py-3 text-[13px] font-medium leading-none transition-colors duration-200 hover:text-hi ${
                  active ? "text-hi" : "text-lo"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-up" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <label className="group relative hidden lg:block">
            <span className="sr-only">Search matches and traders</span>
            <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lo" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search matches, traders"
              className="h-9 w-[260px] rounded-chip bg-surface pl-9 pr-10 text-[13px] text-hi placeholder:text-lo ring-1 ring-inset ring-hairline transition-shadow duration-200 focus:outline-none focus:ring-hairline/0 focus:shadow-[0_0_0_2px_var(--up)]"
            />
            <kbd className="num pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-bg px-1.5 py-0.5 text-[10px] text-lo ring-1 ring-inset ring-hairline">⌘K</kbd>
          </label>

          <CreditPill credits={user.credits} />

          <Link
            href={routes.portfolio}
            aria-label={`Rank ${user.rank}, up ${user.rankDelta} — open portfolio`}
            className="hidden items-center gap-1.5 rounded-chip px-2.5 py-1.5 text-[12px] transition-colors duration-200 hover:bg-surface sm:inline-flex"
          >
            <span className="text-lo">RANK</span>
            <span className="num font-medium text-hi">#{user.rank}</span>
            <span className="num inline-flex items-center gap-0.5 text-up">▲{user.rankDelta}</span>
          </Link>

          <Link
            href={routes.settings}
            aria-label="Account"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-[12px] font-semibold text-hi ring-1 ring-inset ring-hairline transition-colors duration-200 hover:ring-up/40 active:bg-hairline/40"
          >
            {user.handle.replace(/^@/, "").slice(0, 2).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}
