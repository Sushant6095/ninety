// watermelon.sh "web3-dashboard" block (MIT) — STRUCTURE ONLY. The original's money guts (asset tables,
// swap/deposit/withdraw buttons, APY charts, wallet identity, recharts, shadcn sidebar/card/button and its
// stock oklch dashboard.css palette) are deleted; what survives is the LAYOUT idiom: a sticky section rail,
// a topbar row, a 4-up stat grid, and titled panels. Fully re-skinned to Ninety tokens — zero shadcn deps.
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** The dashboard frame: sticky nav rail on lg/xl, single column on mobile (rail collapses to a chip row). */
export function DashboardShell({ rail, children }: { rail: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1280px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      {rail}
      <div className="grid min-w-0 content-start gap-4">{children}</div>
    </div>
  );
}

export interface RailItem {
  label: string;
  href: string; // in-page anchor or route
  icon: LucideIcon;
  count?: number;
}

/** The sidebar idiom from the block — anchor nav instead of app nav (the app chrome is TerminalHeader). */
export function DashboardRail({ items, footer }: { items: RailItem[]; footer?: ReactNode }) {
  return (
    <aside aria-label="Account sections" className="min-w-0 lg:sticky lg:top-4 lg:self-start">
      <nav>
        <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {items.map((item) => (
            <li key={item.label} className="shrink-0">
              <a
                href={item.href}
                className="group flex min-h-11 items-center gap-3 whitespace-nowrap rounded-chip px-3 py-2 text-strong font-medium text-lo outline-none transition-colors duration-200 hover:bg-hairline/25 hover:text-hi focus-visible:bg-hairline/25 focus-visible:text-hi active:scale-[0.97]"
              >
                <item.icon className="h-4 w-4 shrink-0 text-lo transition-colors duration-200 group-hover:text-up" aria-hidden strokeWidth={2} />
                <span>{item.label}</span>
                {item.count != null && <span className="num ml-auto text-label tabular-nums text-lo">{item.count}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {footer && <div className="mt-4 hidden lg:block">{footer}</div>}
    </aside>
  );
}

/** The topbar idiom — title + meta left, actions right. (The original's search / deposit / withdraw / swap
 *  cluster is deleted: play money has no funding affordances.) */
export function DashboardTopbar({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-display font-bold tracking-tight text-hi">{title}</h1>
        {sub && <p className="mt-1 text-body text-lo">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</section>;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode; // already-formatted mono number
  detail?: ReactNode; // delta / sub-line
  chart?: ReactNode; // compact sparkline slot (the block's compactChart idiom)
}

/** The stat-card idiom — icon + label header, big number, delta-or-sparkline foot. Inset icon chip kept,
 *  re-cut to hairline ring on surface (the glossy lime inset shadow did not survive). */
export function StatCard({ icon: Icon, label, value, detail, chart }: StatCardProps) {
  return (
    <div className="elev flex min-h-28 flex-col rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-chip bg-bg ring-1 ring-inset ring-hairline">
          <Icon className="h-3.5 w-3.5 text-lo" aria-hidden strokeWidth={2} />
        </span>
        <span className="text-label font-medium uppercase tracking-tag text-lo">{label}</span>
      </div>
      <div className="num mt-3 font-display text-display font-bold tabular-nums text-hi">{value}</div>
      {chart ? <div className="mt-2">{chart}</div> : detail ? <div className="mt-2 text-caption text-lo">{detail}</div> : null}
    </div>
  );
}

interface PanelProps {
  id?: string;
  title: string;
  count?: number;
  action?: { label: string; href: string }; // the block's "View all →" corner affordance
  children: ReactNode;
  className?: string;
}

/** The titled-panel idiom (Card + CardHeader + "View all") on Ninety surfaces. */
export function Panel({ id, title, count, action, children, className = "" }: PanelProps) {
  return (
    <section id={id} className={`elev scroll-mt-20 overflow-hidden rounded-card border border-hairline bg-surface ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <h2 className="flex items-baseline gap-2 font-display text-heading font-semibold text-hi">
          {title}
          {count != null && <span className="num text-caption font-normal tabular-nums text-lo">{count}</span>}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="rounded-chip px-2 py-1.5 text-caption font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-1 focus-visible:ring-hairline active:scale-[0.97]"
          >
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
