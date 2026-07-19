"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { LayoutGrid, GitFork, Wallet, ShieldCheck, RotateCcw, Ticket, type LucideIcon } from "lucide-react";
import { Dock, DockIcon } from "../../components/vendor/magicui/dock";
import { routes } from "../../lib/routes";

// Dock → MatchColumn signals. Window events keep the dock decoupled from the trade column's state
// (same document, one listener each · no store, no context plumbing for two one-shot actions).
export const DOCK_TRADE_EVENT = "ninety:terminal-trade";
export const DOCK_REPLAY_EVENT = "ninety:terminal-replay";

const LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Board", href: routes.board, icon: LayoutGrid },
  { label: "Bracket", href: routes.bracket, icon: GitFork },
  { label: "Account", href: routes.account, icon: Wallet },
  { label: "Proofs", href: routes.proofs, icon: ShieldCheck },
];

const ACTIONS: { label: string; event: string; icon: LucideIcon }[] = [
  { label: "Replay the halt", event: DOCK_REPLAY_EVENT, icon: RotateCcw },
  { label: "Open trade ticket", event: DOCK_TRADE_EVENT, icon: Ticket },
];

// Fills the whole 44px disc · the disc IS the hit target.
const ITEM =
  "flex h-full w-full items-center justify-center rounded-full text-lo outline-none transition-colors duration-200 hover:bg-hairline/40 hover:text-hi focus-visible:ring-2 focus-visible:ring-up active:scale-[0.97]";

/** Bottom dock for /terminal · tools + nav (magicui Dock, re-skinned). Magnification stays ≤1.15×
 *  and dies entirely under prefers-reduced-motion; the active route gets a hi underline dot.
 *  `featured` (the AUS-EGY money-shot) gates the "Replay the halt" tool: only that market runs the halt
 *  choreography, so a non-featured match must not advertise a halt it has no way to replay. */
export function TerminalDock({ featured = true }: { featured?: boolean }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const actions = featured ? ACTIONS : ACTIONS.filter((a) => a.event !== DOCK_REPLAY_EVENT);
  const dispatch = (event: string): void => {
    window.dispatchEvent(new Event(event));
  };

  // Hide the dock while the live-trade fold is in view; reveal it once the reader scrolls into secondary
  // content. A fixed bottom dock over a dense terminal was floating ON TOP of the live price cells / River —
  // a solid overlay on live prices is a trading-surface defect, and every target the dock offers (nav, Replay
  // the halt, the trade ticket) is already visible on the fold. This trades nothing away: the dock is a
  // quick-return-to-nav affordance that only matters once you've scrolled past the trade panel. Intersection
  // Observer on a top sentinel (no scroll listener); it starts hidden and reveals on scroll.
  const [past, setPast] = useState(false);
  useEffect(() => {
    const sentinel = document.getElementById("terminal-fold-sentinel");
    if (!sentinel) return;
    // Expand the root's top by ~90% of a viewport: the top sentinel keeps "intersecting" until the reader has
    // scrolled roughly one screen past the fold, so the dock stays hidden across the whole live-trade view.
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { rootMargin: "90% 0px 0px 0px" });
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Terminal tools"
      aria-hidden={!past}
      className={`pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 transition-opacity duration-200 motion-reduce:transition-none ${past ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Dock className="elev pointer-events-auto" disableMagnification={!!reduce}>
        {LINKS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <DockIcon key={href}>
              <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={ITEM}>
                <Icon size={18} aria-hidden />
                {active && <span aria-hidden className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-hi" />}
              </Link>
            </DockIcon>
          );
        })}
        <span aria-hidden className="mx-0.5 h-6 w-px self-center bg-hairline" />
        {actions.map(({ label, event, icon: Icon }) => (
          <DockIcon key={event}>
            <button type="button" aria-label={label} onClick={() => dispatch(event)} className={ITEM}>
              <Icon size={18} aria-hidden />
            </button>
          </DockIcon>
        ))}
      </Dock>
    </nav>
  );
}
