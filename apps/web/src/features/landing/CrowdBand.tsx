"use client";
import dynamic from "next/dynamic";

// The crowd (skiper39 CrowdCanvas, re-skinned) — a silhouette terrace along the close section's
// bottom edge: the football-crowd metaphor under "the whistle is the opening bell". Canvas
// discipline: next/dynamic ssr:false, gsap ticker + walks pause offscreen (IO in the vendor
// file), dpr ≤ 1.5, 90 peeps. Reduced motion → a static scattered crowd, drawn once.
const CrowdCanvas = dynamic(
  () => import("../../components/vendor/skiper/skiper39").then((m) => m.CrowdCanvas),
  { ssr: false, loading: () => null },
);

export function CrowdBand({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none relative overflow-hidden ${className}`}>
      <CrowdCanvas count={90} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
