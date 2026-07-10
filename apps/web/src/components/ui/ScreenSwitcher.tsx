"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "../../lib/routes";

const SCREENS: { label: string; href: string; match: (p: string) => boolean }[] = [
  { label: "App", href: routes.home, match: (p) => p === "/" || p.startsWith("/leaderboard") || p.startsWith("/portfolio") },
  { label: "Terminal", href: routes.terminal, match: (p) => p.startsWith("/terminal") || p.startsWith("/match") },
  { label: "North Star", href: routes.northStar, match: (p) => p.startsWith("/north-star") },
];

/** Links the three OMNIPITCH surfaces so they're always one click apart (App ↔ Terminal ↔ North Star). */
export function ScreenSwitcher({ className = "" }: { className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Surfaces" className={`inline-flex shrink-0 rounded-chip bg-surface p-0.5 ring-1 ring-inset ring-hairline ${className}`}>
      {SCREENS.map((s) => {
        const on = s.match(path);
        return (
          <Link
            key={s.label}
            href={s.href}
            aria-current={on ? "page" : undefined}
            className={`whitespace-nowrap rounded-chip px-2.5 py-1 text-[11px] font-medium transition-colors duration-200 ${on ? "bg-hairline/70 text-hi" : "text-lo hover:text-hi"}`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
