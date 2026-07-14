# hyperfoundation.org — Components

Reusable primitives on the landing page. Each with purpose / variants / states / spacing / motion /
a11y / composition / possible implementation / performance.

## 1. Floating pill nav
- **Purpose:** persistent top-of-funnel navigation + primary CTA.
- **Variants:** desktop (full links) · mobile (logo + menu + CTA).
- **States:** link hover (subtle color/opacity shift), CTA hover (mint darken), focus ring.
- **Spacing:** pad 8/8/8/16, 56px tall, radius 37 (pill). Links gapped ~`space-8` (32).
- **Motion:** hover 150–200ms color; enters with the hero.
- **A11y:** `<nav>` landmark, real links/button, visible focus, logo has accessible name.
- **Impl:** static top bar inside the pinned hero; single mint `Button` for CTA.
- **Perf:** trivial; SSR-friendly, no data.

## 2. Primary CTA button (mint pill)
- **Purpose:** the one loud action ("Start Trading" / "Launch App").
- **Variants:** **filled mint** (primary) · **outline** ("Start Building" — transparent, mint/white
  border). Pill radius, generous horizontal padding.
- **States:** default · hover (fill darken / outline fills) · active · focus-visible ring · (loading
  when it triggers wallet connect).
- **Spacing:** ~`space-3` vertical, `space-6+` horizontal; text Inter ~16.
- **Motion:** 150ms color/scale on hover; press feedback.
- **A11y:** real `<button>`/`<a>`, label, focus ring, hit area ≥44px.
- **Impl:** two variants of one Button; mint = `brand-200`.
- **Perf:** negligible.

## 3. Serif display headline
- **Purpose:** the thesis statement; the page's emotional peak.
- **Spec:** **Teodor serif, ~90px, weight 400, line-height 1.0**, centered, `whiteAlpha-900` on
  dark (hero) or `brand-800` on light (section headlines like "Community first.").
- **Motion:** hero headline participates in the pinned reveal; section headlines fade/rise on enter.
- **A11y:** real `<h1>`/`<h2>`; serif is display-only (body stays Inter for legibility).
- **Impl:** load Teodor via `@font-face` (display swap); reserve space to avoid CLS.
- **Perf:** preload the one Teodor weight used; it's the only non-system display font.

## 4. Feature block (icon + label + copy)
- **Purpose:** the 4 flagship-exchange value props (Low fees · 40x leverage · Transparent · Seamless).
- **Variants:** icon-topped, in a row/grid of 4 (wraps to 2×2 then 1-col on mobile).
- **States:** static; subtle hover lift/glow possible.
- **Spacing:** even columns within the 1200 grid, `space-6/8` gaps.
- **Motion:** staggered fade-in on scroll enter (~40–80ms stagger).
- **A11y:** heading + paragraph per block; icons decorative (`aria-hidden`).
- **Impl:** a simple responsive grid of Card-less blocks (flat, no borders).

## 5. Interactive architecture diagram ("The Stack") — signature component
- **Purpose:** explain HyperCore ↔ HyperEVM (one unified state) + HyperBFT, visually.
- **Structure:** a large **SVG** with labeled `<g>` blocks — vaults, perps, oracles, spot,
  governance, bridges, auctions — plus connective **arrows** (arrowTopLeft/BottomLeft/TopRight/
  BottomRight) and text labels (textTopLeft/…), all animated.
- **Variants/states:** blocks/arrows reveal progressively as the section is scrolled (scrubbed);
  likely hover/focus highlight per block.
- **Motion:** scroll-scrubbed draw-on of arrows + block fades; the conceptual "assembly" of the
  stack as you scroll.
- **A11y:** provide a text alternative / description of the architecture (SVG diagrams need it);
  keyboard focusable blocks if interactive.
- **Impl:** inline SVG with grouped elements; animate stroke-dashoffset (arrows) + opacity/transform
  (blocks) driven by scroll progress. **This is the analog of Ninety's Momentum River** as the one
  place heavy custom viz lives.
- **Perf:** SVG (crisp, light); animate transform/opacity/stroke only; guard with reduced-motion.

## 6. Live stats band (metric tiles)
- **Purpose:** proof via real numbers — Block time 0.07s · Users 2,261,901 · Max TPS 200,000 · Daily
  volume $9.1B.
- **Variants:** 4 tiles in a row (value + label).
- **States:** numbers likely **count-up on enter**; may be live-fetched.
- **Spec:** value in large **mono** (tabular) type; label small Inter, muted.
- **Motion:** count-up animation on first view (~800–1200ms ease-out).
- **A11y:** value + label association; if live, polite updates; number readable without animation.
- **Impl:** fetch stats (or SSR + revalidate); animate on `IntersectionObserver`.
- **Perf:** tiny payload; hydrate the count-up only.

## 7. Animated word/letter reveal
- **Purpose:** "the premier **DECENTRALISED** exchange" — the word animates letter-by-letter
  (doubled characters in the DOM = a per-letter reveal/scramble effect).
- **Motion:** staggered per-glyph opacity/transform (SplitText-style), ~30–60ms per letter.
- **A11y:** the full word must remain in the accessible name (don't let per-letter spans break it).
- **Impl:** split text into spans, stagger; keep an sr-only full-word copy.

## 8. Blob / gradient background
- **Purpose:** the hero atmosphere — soft organic 3D forms in brand greens with a mint glow.
- **Motion:** slow drift + morph tied to scroll (the logo mark morphs bowtie→blob).
- **Impl:** SVG/Canvas blobs + CSS blur + radial gradients; morph via path interpolation or a
  Lottie/SVG-morph driven by scroll progress. Keep on GPU (transform/opacity/filter).
- **Perf:** the most expensive visual — throttle, pause offscreen, respect reduced-motion.

## 9. Footer
- **Purpose:** legal + social exits. Quiet, single-row, low contrast (`whiteAlpha` text on dark).
- **Composition:** © + legal links + social icon row.

## Composition summary
`Nav(pill + CTA)` floats over `Hero(blob bg + serif headline + dual CTA, pinned)` →
`FeatureRow(4 blocks)` → `StackDiagram(SVG, scrubbed)` → `StatsBand(4 mono tiles)` →
`Community(serif + HYPE)` → `ClosingCTA(dual pill)` → `Footer`. One accent (mint), one display face
(Teodor), one signature viz (the diagram).
