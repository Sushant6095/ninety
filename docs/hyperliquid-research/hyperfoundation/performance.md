# hyperfoundation.org — Performance

Observations + rebuild guidance. (Deep runtime profiling wasn't run; notes are from the rendered
stack + asset profile.)

## What's heavy here
1. **Scroll-linked animation** (pinned hero morph + diagram scrub) — runs work every scroll frame.
   Risk: jank if it touches layout or does heavy JS per frame.
2. **Blob/gradient background** with blur — GPU-bound; blur is expensive on large surfaces.
3. **Teodor display font** — a non-system serif; blocks the hero's first meaningful paint if not
   handled with `font-display: swap` + preload.
4. **SVG diagram** — many grouped nodes + animated arrows; cheap vs canvas but still a lot of DOM.
5. **Live stats fetch** + count-up.
6. **Wallet SDKs** (Privy + WalletConnect) — sizeable JS; should be **lazy-loaded on CTA intent**,
   not on initial paint.

## Good patterns to copy
- **Chakra tokens** → consistent, tree-shakeable styling; no ad-hoc CSS.
- **Animate only transform/opacity/filter/stroke** — keeps motion on the compositor.
- **Scroll-scrubbed** animation (rAF, progress-driven) instead of long autoplay timelines.
- Named **z-index scale** avoids stacking bugs.

## Rebuild recommendations (for Ninety's landing)
- **SSR/SSG the whole landing** (it's static marketing) → instant first paint, great SEO. Only the
  stats band needs data (SSR with revalidate, or fetch-on-idle).
- **Preload one Teodor weight**; `font-display: swap`; size-adjust to minimize CLS on the hero.
- **Lazy-load wallet SDKs** on CTA hover/click (dynamic import) — they should never be in the
  landing's critical bundle.
- **Lazy-mount the diagram + blob animation** below the fold; pause when offscreen
  (IntersectionObserver); **fully disable under `prefers-reduced-motion`** and on low-power/mobile.
- **Throttle scroll work to rAF**; never do layout reads/writes in the scroll handler (batch).
- **Preload only the hero image/gradient**; defer everything below.
- Budget targets (our web rules): landing JS < 150kb gz, CSS < 30kb, LCP < 2.5s, CLS < 0.1, INP <
  200ms. The wallet SDKs are the main threat to the JS budget → keep them out of the critical path.

## Accessibility-perf intersection
- The pinned scroll + per-letter reveal must not trap keyboard/reduced-motion users — provide a
  static, fully-readable fallback that also happens to be the *fast* path.
