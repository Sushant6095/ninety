"use client";
import dynamic from "next/dynamic";

// ADR-053 discipline: the dither's canvas + error-diffusion pass stays out of the initial chunk.
const DitheredLogo = dynamic(
  () => import("../../components/vendor/componentry/dithered-logo").then((m) => m.DitheredLogo),
  { ssr: false, loading: () => null },
);

// The River-9 mark (components/ui/Logomark.tsx paths, verbatim) as a data URI the dither can sample.
// The white strokes here are a LUMINANCE MASK input only — this SVG is never rendered; the drawn
// dots take currentColor, so the visible ink is the text token set on the wrapper (tokens law holds).
const MARK_SVG = encodeURIComponent(
  // width/height are explicit so naturalWidth/Height resolve for the sampler in every browser
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="none">' +
    '<circle cx="41" cy="39" r="22" stroke="white" stroke-width="12"/>' +
    '<path d="M63 39 L63 72" stroke="white" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M63 72 L88 54" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>",
);
const MARK_SRC = `data:image/svg+xml;charset=utf-8,${MARK_SVG}`;

/** The dithered River-9 (componentry.dev dither, re-skinned) — a quiet landing accent, not chrome.
 *  pointer-events-none keeps it permanently static (the vendor motion is pointer-driven, so no
 *  pointer = no animation = reduced-motion-safe by construction); aria-hidden keeps it out of the
 *  tree. The clean SVG Logomark stays the header mark and favicon — dither doesn't read at 16px. */
export function DitheredMark({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      <DitheredLogo
        imageSrc={MARK_SRC}
        className="h-full w-full text-lo"
        invert={false}
        scale={0.85}
        blur={2.5}
      />
    </div>
  );
}
