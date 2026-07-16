"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { LayoutGrid, GitFork, Wallet, ShieldCheck, RotateCcw, Ticket, type LucideIcon } from "lucide-react";
import { Dock, DockIcon } from "../../components/vendor/magicui/dock";
import { routes } from "../../lib/routes";

// Dock → MatchColumn signals. Window events keep the dock decoupled from the trade column's state
// (same document, one listener each — no store, no context plumbing for two one-shot actions).
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

// Fills the whole 44px disc — the disc IS the hit target.
const ITEM =
  "flex h-full w-full items-center justify-center rounded-full text-lo outline-none transition-colors duration-200 hover:bg-hairline/40 hover:text-hi focus-visible:ring-2 focus-visible:ring-up active:scale-[0.97]";

/** Bottom dock for /terminal — tools + nav (magicui Dock, re-skinned). Magnification stays ≤1.15×
 *  and dies entirely under prefers-reduced-motion; the active route gets a hi underline dot. */
export function TerminalDock() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const dispatch = (event: string): void => {
    window.dispatchEvent(new Event(event));
  };

  return (
    <nav aria-label="Terminal tools" className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3">
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
        {ACTIONS.map(({ label, event, icon: Icon }) => (
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
