import type { Metadata } from "next";
import Navbar from "src/components/templates/notio/navbar";
import Hero from "src/components/templates/notio/call-to-action/hero";
import Beam from "src/components/templates/notio/beam";
import Features from "src/components/templates/notio/features/features";
import Stats from "src/components/templates/notio/stats";
import Footer from "src/components/templates/notio/footer";
import { CrowdBand } from "src/features/landing/CrowdBand";

export const metadata: Metadata = {
  title: "Ninety — every match is a market for ninety minutes",
  description:
    "A free-to-play live football exchange for World Cup 2026. Prices move with the game, the Booth explains the swings, Solana proves the result. Play money — no deposits, no cash payouts, ever.",
};

// The landing — notio's structure (styleui.dev, pulled via `shadcn add`) wearing Ninety's skin. The board
// lives at /board. Dropped from the notio pull: LogoCloud + Team + Testimonial (placeholder brand /
// external CDN avatars) and Pricing (a "$/mo" tier collides with the play-money invariant — ADR-068).
export default function Page() {
  return (
    <div className="relative flex flex-col gap-8 overflow-hidden p-3 md:p-2">
      <Navbar />
      {/* one <main> landmark so every section sits inside a landmark (axe region + landmark-one-main) */}
      <main>
        <Hero />
        <Beam>
          <Features />
        </Beam>
        <Stats />
      </main>
      {/* the crowd (skiper39, re-skinned) rides the footer's bottom edge — the terrace under the CTA */}
      <div className="relative">
        <Footer />
        <CrowdBand className="absolute inset-x-0 bottom-0 z-0 h-40 opacity-40" />
      </div>
    </div>
  );
}
