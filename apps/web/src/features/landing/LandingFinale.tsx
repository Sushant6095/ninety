"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CtaPair } from "./Ctas";

// The landing's closing statement (ADR-085): a layered football parallax — night-sky floodlight glow → a far dim
// plane of crests → a nearer band of the 48 crests → a foreground pitch touchline → the NINETY wordmark.
// Technique from 21st.dev `mountain-vista-bg` (layered planes at different speeds), re-subjected to football with
// OUR local crest assets (public/teams/{id}/badge.png) — zero third-party CDN (ADR-055). The plan's stadium.jpg
// plane was dropped: those files are not stadiums (see the CRESTS note below). Motion is transform-only on
// duplicated tiles (see .pfin-track in globals.css), never background-position.
// Theme: every image layer sits under a `bg`-token scrim, so the scene tints toward the theme's background
// (dark in dark, light in light) and the wordmark's text-hi reads in BOTH — the section never flips theme.

// All 48 crests. The parallax depth comes from TWO crest planes at different speeds/sizes/opacity (near + far).
// NOTE (ADR-085): the plan suggested a `stadium.jpg` "skyline" plane, but those files are NOT stadium photos —
// they are a grab-bag of fan-crowd shots, squad photos, full country flags and a third-party "France WC2018"
// promo poster. Compositing those (even blurred) would ship off-theme, dubious-provenance art — exactly the
// borrowed-art STEP 0b forbids. So the far plane is a second, dimmer, slower band of OUR crests instead.
const CRESTS = Array.from({ length: 48 }, (_, i) => String(i + 1));
// Offset the far plane's ordering so the two crest bands never line up into an obvious duplicate column.
const FAR_CRESTS = [...CRESTS.slice(24), ...CRESTS.slice(0, 24)];

/** A seamless drifting row: TWO identical tile sets in one track; the track translates -50% (exactly one set)
 *  forever, so there is no visible seam. `seconds` sets the layer speed (far = long, near = short). */
function ParallaxRow({ children, seconds, reverse = false, className = "" }: { children: ReactNode; seconds: number; reverse?: boolean; className?: string }) {
  return (
    <div className={`pfin-track flex w-max ${className}`} style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? "reverse" : "normal" }}>
      <div className="flex shrink-0 items-center">{children}</div>
      <div className="flex shrink-0 items-center" aria-hidden>{children}</div>
    </div>
  );
}

const scrim = (pct: number) => `color-mix(in srgb, var(--bg) ${pct}%, transparent)`;
const grass = (pct: number) => `color-mix(in srgb, var(--up) ${pct}%, var(--bg))`;

export function LandingFinale() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  // Lazy-mount the heavy image layers only when the section nears the viewport (it lives at the very bottom of
  // a long page, so this keeps stadium/crest decode off FCP entirely). The wordmark + CTA render immediately.
  useEffect(() => {
    const el = ref.current;
    if (!el || active) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  return (
    <section
      ref={ref}
      aria-labelledby="finale-h"
      className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg"
    >
      {/* z0 — floodlight glow (token radials, static). The green is Ninety's, so the "floodlights" are ours. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 78% at 50% -10%, color-mix(in srgb, var(--up) 12%, transparent), transparent 60%), radial-gradient(90% 55% at 50% 108%, color-mix(in srgb, var(--up) 9%, transparent), transparent 55%)",
        }}
      />

      {active && (
        <>
          {/* z1 — FAR crest plane: big, dim, slow. A distant wall of crests high in the frame; reads as depth. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[15%] opacity-[0.14]">
            <ParallaxRow seconds={95}>
              {FAR_CRESTS.map((id, i) => (
                <span key={i} className="block shrink-0 px-6 sm:px-8">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local /public asset, no next/image needed for a decorative tiled backdrop */}
                  <img src={`/teams/${id}/badge.png`} width={80} height={80} loading="lazy" draggable={false} alt="" className="h-16 w-16 object-contain [filter:blur(1px)] sm:h-20 sm:w-20" />
                </span>
              ))}
            </ParallaxRow>
          </div>

          {/* z2 — NEAR crest band: normal size, medium speed, drifting behind the wordmark. Reversed vs the far
              plane so the two bands cross for parallax. This is the football equivalent of the moving bikes — ours. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[42%] opacity-40">
            <ParallaxRow seconds={54} reverse>
              {CRESTS.map((id, i) => (
                <span key={i} className="block shrink-0 px-4 sm:px-5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local /public asset */}
                  <img src={`/teams/${id}/badge.png`} width={52} height={52} loading="lazy" draggable={false} alt="" className="h-11 w-11 object-contain sm:h-14 sm:w-14" />
                </span>
              ))}
            </ParallaxRow>
          </div>
        </>
      )}

      {/* z3 — theme scrim: tint the whole scene toward the theme background so the wordmark reads in both modes
          (dark → darkens, light → lightens) and the finale stays on-theme with the rest of the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(to bottom, ${scrim(30)} 0%, ${scrim(66)} 48%, ${scrim(88)} 100%)` }}
      />
      {/* z5 — local halo behind the wordmark: pushes the letterform region to near-solid bg for guaranteed contrast. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[62%] w-[94%] max-w-[1100px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: `radial-gradient(ellipse at center, ${scrim(78)} 0%, ${scrim(40)} 45%, transparent 72%)` }}
      />

      {/* z10 — THE FINAL STATEMENT */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <h2
          id="finale-h"
          className="font-display font-black leading-[0.9] tracking-[-0.05em] text-hi"
          style={{ fontSize: "clamp(3.75rem, 20vw, 16rem)", textShadow: `0 2px 44px ${scrim(80)}` }}
        >
          NINETY
        </h2>
        <p className="mt-5 max-w-[42ch] text-strong leading-relaxed text-lo">
          Every World Cup match, priced live. Play money, proven on-chain.
        </p>
        <div className="mt-8">
          <CtaPair center />
        </div>
      </div>

      {/* z20 — foreground pitch: a grass ground plane rising into the wordmark base (depth), with a fast-drifting
          chalk touchline as the nearest parallax layer. Sits above the wordmark, below the CTA block (z10 content
          is centered well above this bottom band, so the CTA stays clear and readable). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[26%]"
        style={{ background: `linear-gradient(to top, ${grass(24)} 0%, color-mix(in srgb, var(--up) 8%, transparent) 55%, transparent 100%)` }}
      >
        {active && (
          <div className="absolute inset-x-0 top-[22%] opacity-25">
            <ParallaxRow seconds={30}>
              {Array.from({ length: 44 }).map((_, i) => (
                <span key={i} className="flex h-4 w-[clamp(56px,7vw,96px)] shrink-0 items-center">
                  <span className="block h-[2px] w-1/2 rounded-full bg-hi" />
                </span>
              ))}
            </ParallaxRow>
          </div>
        )}
      </div>
    </section>
  );
}
