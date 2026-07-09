import type { ReactNode } from "react";
import { Ticker } from "./Ticker";
import { Header } from "./Header";
import { CompetitionBar } from "./CompetitionBar";
import { LeftRail } from "./LeftRail";
import { RightRail } from "./RightRail";
import { CenterColumn } from "./CenterColumn";
import { Footer } from "./Footer";
import { SESSION } from "../../lib/fixtures";

interface HomeShellProps {
  children?: ReactNode; // the grouped match list (center)
}

/** The Home page frame: ticker · header · 3-column body (rails quiet, center hero) · footer. */
export function HomeShell({ children }: HomeShellProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <Ticker />
      <Header user={SESSION} />
      <CompetitionBar />
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-start gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className="hidden xl:block">
          <LeftRail />
        </div>
        <div className="min-w-0">
          <CenterColumn>{children}</CenterColumn>
        </div>
        <div className="hidden xl:block">
          <RightRail />
        </div>
      </main>
      <Footer />
    </div>
  );
}
