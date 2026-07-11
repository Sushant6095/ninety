"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Trophy, Layers, Medal, Crown, Sparkles, Users, type LucideIcon } from "lucide-react";
import { routes } from "../../lib/routes";

interface Tab {
  icon: LucideIcon;
  label: string;
  href: string;
  count?: number;
  home?: boolean; // marks the WC26 hub as active on "/"
}

// Sofascore's sport-tabs row, adapted to Ninety's single competition: the WC26 bracket + destinations. Icon +
// label + live count, horizontally scrollable — the dense secondary nav under the header.
const TABS: Tab[] = [
  { icon: Flame, label: "Trending", href: routes.moments },
  { icon: Trophy, label: "WC26", href: routes.home, count: 12, home: true },
  { icon: Layers, label: "Round of 16", href: routes.competition, count: 8 },
  { icon: Medal, label: "Quarters", href: routes.competition, count: 4 },
  { icon: Crown, label: "Semis", href: routes.competition, count: 2 },
  { icon: Sparkles, label: "Moments", href: routes.moments },
  { icon: Users, label: "Leaders", href: routes.leaders },
];

export function CompetitionBar() {
  const path = usePathname();

  return (
    <nav aria-label="Competition" className="border-b border-hairline bg-bg">
      <div className="mx-auto flex max-w-[1600px] items-stretch gap-1 overflow-x-auto px-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = t.home ? path === "/" : path.startsWith(t.href) && t.href !== "/";
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-caption font-medium transition-colors duration-200 ${
                active ? "text-hi" : "text-lo hover:text-hi"
              }`}
            >
              <Icon size={15} strokeWidth={2} className={active ? "text-up" : "text-lo group-hover:text-hi"} aria-hidden />
              {t.label}
              {t.count != null && (
                <span className={`num rounded-full px-1 text-label font-semibold tabular-nums ring-1 ring-inset ${active ? "bg-up/15 text-up ring-up/25" : "bg-surface text-lo ring-hairline"}`}>
                  {t.count}
                </span>
              )}
              {active && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-up" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
