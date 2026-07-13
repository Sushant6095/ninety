import type { ReactNode } from "react";
import { TerminalHeader } from "../../features/terminal/TerminalHeader";
import { Ticker } from "../../features/home/Ticker";
import { Footer } from "../../features/home/Footer";
import { SESSION } from "../../lib/fixtures";
import type { SessionUser } from "../../lib/types";

interface AppShellProps {
  children: ReactNode; // the page's <main> content
  ticker?: boolean; // the live price ticker strip — board / discovery surfaces only
  user?: SessionUser;
}

/**
 * The ONE Ninety app shell — a single header, footer, and frame for every route
 * (ADR-049 one-shell law). Pages provide only their `<main>`; the chrome lives here.
 * The onboarding flow is the deliberate exception (focused, no nav).
 */
export function AppShell({ children, ticker = false, user = SESSION }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      {ticker ? <Ticker /> : null}
      <TerminalHeader user={user} />
      {children}
      <Footer />
    </div>
  );
}
