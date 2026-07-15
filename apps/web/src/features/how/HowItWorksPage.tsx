import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { SESSION } from "../../lib/fixtures";
import { Hero } from "./sections/Hero";
import { TheLoop } from "./sections/TheLoop";
import { ProofFlowLazy } from "./sections/ProofFlowLazy";
import { TxLineSection } from "./sections/TxLineSection";
import { OpenSource } from "./sections/OpenSource";
import { Architecture } from "./sections/Architecture";
import { Coverage } from "./sections/Coverage";
import { UserGuide } from "./sections/UserGuide";
import { Faq } from "./sections/Faq";

/** How Ninety works — the trust showcase. Nine sections: hero · the loop (sticky-scroll) · the proof flow
 *  (agent-flow + settlement timeline, lazy) · TxLINE (beam pipeline) · open source · architecture · coverage
 *  (dotted map) · how to trade · FAQ. BRAND register — it breathes more than the terminal. */
export function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader user={SESSION} />
      <main className="flex-1">
        <Hero />
        <TheLoop />
        <ProofFlowLazy />
        <TxLineSection />
        <OpenSource />
        <Architecture />
        <Coverage />
        <UserGuide />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
