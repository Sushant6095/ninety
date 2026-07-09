import Link from "next/link";
import { routes } from "../../lib/routes";

interface CreditPillProps {
  credits: number; // play-money balance
}

const fmt = (n: number): string => n.toLocaleString("en-US");

/** Play-money balance chip → portfolio. Green dot + "CR" (credits, never $). */
export function CreditPill({ credits }: CreditPillProps) {
  return (
    <Link
      href={routes.portfolio}
      aria-label={`${fmt(credits)} credits — open portfolio`}
      className="group inline-flex items-center gap-2 rounded-chip bg-surface px-3 py-1.5 ring-1 ring-inset ring-hairline transition-colors duration-200 hover:ring-up/40 active:bg-hairline/40"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_6px_var(--up)]" />
      <span className="num text-[13px] font-medium text-hi">{fmt(credits)}</span>
      <span className="text-[11px] font-medium tracking-wide text-lo">CR</span>
    </Link>
  );
}
