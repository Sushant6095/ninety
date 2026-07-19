"use client";
import dynamic from "next/dynamic";

// Same discipline as FlowFieldLazy / WorldGlobeLazy: the finale's image layers stay OUT of the initial chunk and
// off SSR. A token placeholder holds the full-height slot so there is no layout shift while it mounts client-side;
// the component then IO-gates its own stadium/crest decode (see LandingFinale) so it never costs FCP.
const LandingFinale = dynamic(() => import("./LandingFinale").then((m) => m.LandingFinale), {
  ssr: false,
  loading: () => <div aria-hidden className="min-h-[100dvh] bg-bg" />,
});

export function LandingFinaleLazy() {
  return <LandingFinale />;
}
