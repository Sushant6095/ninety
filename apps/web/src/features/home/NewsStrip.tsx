import Link from "next/link";
import { Trophy, Sparkles, ShieldCheck, BarChart3, type LucideIcon } from "lucide-react";
import { NEWS } from "../../lib/fixtures";
import { routes } from "../../lib/routes";

const TAG: Record<string, { icon: LucideIcon; tint: string }> = {
  "WORLD CUP": { icon: Trophy, tint: "text-hi" },
  MOMENTS: { icon: Sparkles, tint: "text-chain" },
  SETTLEMENT: { icon: ShieldCheck, tint: "text-chain" },
  MARKETS: { icon: BarChart3, tint: "text-up" },
};

/** From the booth — the AI-narrated feed. Text cards (no random stock photos); tag + icon + time. */
export function NewsStrip() {
  return (
    <section className="border-t border-hairline px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-label font-semibold uppercase tracking-[0.1em] text-lo">From the booth</h3>
        <Link href={routes.moments} className="text-label text-lo transition-colors duration-200 hover:text-hi">All →</Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {NEWS.map((n) => {
          const t = TAG[n.tag] ?? { icon: BarChart3, tint: "text-lo" };
          const Icon = t.icon;
          return (
            <Link
              key={n.id}
              href={routes.moments}
              className="elev group flex items-start gap-3 rounded-card border border-hairline/70 bg-surface p-3 transition-colors duration-200 hover:border-hairline"
            >
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg ring-1 ring-inset ring-hairline ${t.tint}`}>
                <Icon size={16} strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className={`text-label font-semibold uppercase tracking-[0.1em] ${t.tint}`}>{n.tag}</span>
                  <span className="num text-label text-lo">{n.when}</span>
                </span>
                <span className="mt-1 block text-body font-medium leading-snug text-hi group-hover:text-white">{n.title}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
