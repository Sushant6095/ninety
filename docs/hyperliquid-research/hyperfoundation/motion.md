# hyperfoundation.org — Motion

Motion is **concentrated, not sprinkled**: a few high-craft scroll-driven moments carry the whole
premium feel. All within Chakra's duration/easing scale.

## Timing scale (Chakra `transition`)
```
ultra-fast 50 · faster 100 · fast 150 · normal 200 · slow 300 · slower 400 · ultra-slow 500ms
ease-out    cubic-bezier(0, 0, 0.2, 1)      ← default for reveals
ease-in-out cubic-bezier(0.4, 0, 0.2, 1)
ease-in     cubic-bezier(0.4, 0, 1, 1)
```
UI micro-interactions (hover, focus) live at 150–200ms; scroll reveals feel ~300–600ms; the hero
morph/scrub spans the pinned scroll range.

## The signature motions
1. **Pinned hero + morphing logo (scrollytelling).** The hero is pinned across a multi-viewport
   scroll range; scroll *progress* drives the mint logo mark morphing (bowtie ⇄ blob) and the
   background blobs drifting. Confirmed live: `document.body` scrolls, the hero stays put, the mark
   changes shape as you scroll. This is the "wow" moment and the reason scroll feels deliberate.
2. **Letter-by-letter word reveal** on "DECENTRALISED" — per-glyph stagger (~30–60ms) as the section
   enters.
3. **Diagram assembly** — the SVG stack draws its arrows (stroke-dashoffset) and fades in blocks as
   you scroll through it (scrubbed to progress), so the architecture "builds itself."
4. **Stat count-up** — the four metrics animate from 0 to value on first view (~1s ease-out).
5. **Section fade/rise on enter** — headlines and blocks translate up + fade as they cross into view
   (IntersectionObserver-style), ~300–500ms, staggered.

## Principles observed
- **Scroll = the timeline.** The best animations are *scrubbed* to scroll position (hero morph,
  diagram), so the user controls them — this feels responsive and expensive, never auto-playing at
  you.
- **Only transform / opacity / filter / stroke** animate (compositor-friendly). No layout-property
  animation.
- **Ease-out for reveals** (enter fast, settle) — matches Ninety's law.
- **Restraint:** most of the page is still; motion appears at 4–5 deliberate beats.

## Implementation notes
- No global GSAP/Lenis/Locomotive detected — the scroll-linked transforms are likely **Framer Motion
  `useScroll`/`useTransform`** (React) or a hand-rolled rAF scroll handler. The morph is likely an
  **SVG path interpolation / Lottie** keyed to scroll progress.
- **Pinning** = a tall spacer + a `position: sticky/fixed` hero whose child animation reads the
  progress `0→1`.
- **Guard everything with `prefers-reduced-motion`** — collapse the pin to a normal section, drop
  count-ups to final values, show the diagram fully drawn.

## For Ninety
- **Spend motion on one or two signatures** (for us: the **Momentum River** and the price flash),
  keep the rest of the landing still. A pinned "River draws itself as you scroll" hero is the direct
  analog of their pinned morphing logo — and it's sanctioned under ADR-052 (GSAP for heavy
  choreography).
- Scrub hero/diagram motion to scroll; use ease-out reveals elsewhere; honor reduced-motion.
