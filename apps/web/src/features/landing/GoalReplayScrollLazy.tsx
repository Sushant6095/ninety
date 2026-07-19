"use client";
import dynamic from "next/dynamic";

// Lazy island for the landing scroll-scrub showpiece (GoalReplayScroll) — matches FlowFieldLazy/WorldGlobeLazy
// so the ~96-frame decode never blocks FCP. ssr:false (canvas + createImageBitmap are client-only). The
// loading fallback reserves the pinned section's height so the chunk swap causes no CLS.
//
// Source (pass 1, ADR-078): a football clip (Video-495.mp4) baked to /frames/hero, letterbox-cropped (see
// PROVENANCE). ⚠ MECHANISM PLACEHOLDER — an edited anime reel depicting a NAMED-PLAYER LIKENESS (Messi /
// Argentina kit) with burned-in subtitles + hard cuts; must be swapped for an original / licensed / anonymous
// asset before any public ship. The scrub mechanism is identical whatever the source.
const GoalReplayScroll = dynamic(
  () => import("./GoalReplayScroll").then((m) => m.GoalReplayScroll),
  { ssr: false, loading: () => <div aria-hidden className="min-h-[100dvh] w-full bg-background" style={{ height: "100dvh" }} /> },
);

export function GoalReplayScrollLazy() {
  return (
    <GoalReplayScroll
      frameCount={96}
      framePath={(n) => `/frames/hero/hero_${String(n).padStart(4, "0")}.jpg`}
      pinLengthVh={220}
      eyebrow="World Cup 2026"
      headline="Every match is a market for ninety minutes"
      sub="Scroll to replay the goal that moved the market."
    />
  );
}
