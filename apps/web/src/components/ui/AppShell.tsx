import type { ReactNode } from "react";
import { TerminalHeader } from "../../features/terminal/TerminalHeader";
import { Ticker } from "../../features/home/Ticker";
import { Footer } from "../../features/home/Footer";

interface AppShellProps {
  children: ReactNode; // the page's <main> content
  ticker?: boolean; // the live price ticker strip — board / discovery surfaces only
}

/**
 * The ONE Ninety app shell — a single header, footer, and frame for every route
 * (ADR-049 one-shell law). Pages provide only their `<main>`; the chrome lives here.
 * The onboarding flow is the deliberate exception (focused, no nav).
 * TerminalHeader reads the signed-in identity from useSession() itself — no user prop is threaded through.
 * The notification bell (godui inbox, re-skinned) sits in TerminalHeader's alerts slot.
 */
export function AppShell({ children, ticker = false }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      {ticker ? <Ticker /> : null}
      <TerminalHeader />
      {children}
      <Footer />
    </div>
  );
}
