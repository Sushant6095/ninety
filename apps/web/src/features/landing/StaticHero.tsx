// Static landing hero (ADR-078) — replaces the scroll-scrub frame cinema (GoalReplayScroll). Backdrop is a
// GENERATED, anonymous token night-stadium scene (public/hero-stadium.svg): no photograph, no person, no club or
// brand mark, no external source, no licence question. It is a vector, so it is crisp at any resolution and a few
// KB — served as a CSS `cover` background rather than next/image, because there is no raster to optimise or blur
// (the SVG paints instantly, so FCP improves versus decoding 96 JPG frames). Colours live in the ASSET; this
// component's chrome (scrim, text) is tokens-only. Landing-only; never a live-price surface.
export function StaticHero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-hairline bg-bg" aria-label="World Cup 2026 — every match is a market">
      {/* Ken-Burns: transform-only, ≤1.04 scale, compositor-cheap, OFF under prefers-reduced-motion (design law). */}
      <style>{`@keyframes ninetyHeroKB{from{transform:scale(1)}to{transform:scale(1.04)}}.ninety-hero-kb{animation:ninetyHeroKB 24s ease-in-out infinite alternate;will-change:transform}@media (prefers-reduced-motion:reduce){.ninety-hero-kb{animation:none;transform:none}}`}</style>
      <div aria-hidden className="ninety-hero-kb absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/hero-stadium.svg)" }} />

      {/* Legibility scrim — a --bg pool anchored bottom-LEFT (behind the thesis) that fades out toward the lit
          stadium on the right, so the floodlights + pitch read while the copy clears AA. Contrast comes from the
          token: text-hi sits on a --bg patch, which is dark-on-light in the light theme and light-on-dark in the
          dark theme — legible in BOTH without eyeballing a fixed colour. A faint bottom band grounds the frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(92% 86% at 24% 98%, color-mix(in srgb, var(--bg) 90%, transparent) 0%, color-mix(in srgb, var(--bg) 34%, transparent) 42%, transparent 64%), linear-gradient(to bottom, transparent 62%, color-mix(in srgb, var(--bg) 34%, transparent) 100%)",
        }}
      />

      {/* 16:9 full-bleed band; eyebrow + thesis kept exactly, anchored bottom-left over the lit pitch. */}
      <div className="relative mx-auto flex aspect-[16/9] max-h-[86vh] min-h-[420px] w-full max-w-[1600px] flex-col justify-end px-5 pb-12 sm:px-8 lg:pb-16">
        <span className="num text-label uppercase tracking-caps text-hi">World Cup 2026</span>
        <h2 className="mt-4 max-w-[20ch] font-display font-bold leading-[0.98] tracking-tight text-hi" style={{ fontSize: "var(--text-section)" }}>
          Every match is a market for ninety minutes.
        </h2>
      </div>
    </section>
  );
}
