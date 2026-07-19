# ADR-078 — Landing scroll-scrub frame sequence (the "iron-man" showpiece), pass 1

**Status:** Accepted (pass 1 — mechanism only) · **Date:** 2026-07-18 · **Follows:** ADR-058 (landing-only dynamism / gradient scope), ADR-052/059 (GSAP is the primary animation lib).

## Context
Owner wants an Apple/"iron-man-jet" scroll-scrubbed frame sequence on the landing: pin a full-bleed canvas
and paint `frame = round(scrollProgress · N)` as the user scrolls. Pass 1 is the MECHANISM only — buttery +
verified. Football and price-sync are later passes. A `3d-scroll-website` skill pack shipped the technique +
perf guidance, but it scaffolds a fresh Next + **Lenis** + Framer site; our CLAUDE.md makes **GSAP the law**.

## Decisions
1. **Drive the scrub with GSAP ScrollTrigger, not Lenis / raw `window.scroll`.** We keep the skill's TECHNIQUE
   (frame math, cover-fit, DPR cap, decode-off-main-thread, preload/perf checklist) but implement via our
   primary lib: `pin: panel`, `scrub: true`, function `end: +=pinLengthVh·vh`, `invalidateOnRefresh`, and
   `ScrollTrigger.refresh()` after the async frame decode. No new animation dependency (no `law-guard` fail).
   If smooth-scroll is ever wanted, it's GSAP ScrollSmoother (in-stack), never Lenis.
2. **`GoalReplayScroll` (mechanism) + `GoalReplayScrollLazy` (ssr:false island).** Full-bleed `<canvas>`,
   DPR-capped ≤2, cover-fit (+1.3× mobile zoom), `createImageBitmap` decode with a bounded concurrency pool,
   a loader that GATES paint until the first frame decodes (never a blank canvas — Verification law), resize
   re-paints the last frame. Lazy + `ssr:false` (matches FlowFieldLazy/WorldGlobeLazy) so the ~96-frame decode
   never blocks FCP. Wired into `LandingLong` after THE LOOP.
3. **Landing-ONLY.** A full-screen canvas scrub contends with the 150ms tick path — it must never appear on
   `/terminal`, the board, or any live-price surface (ADR-058). Tokens only; `prefers-reduced-motion` decodes
   only the final frame and holds it as a still hero (no pin/scrub).
4. **Right-sized asset.** 96 JPG frames at 1600px, q3, ≈5.5MB total (under the ~20MB landing budget), sliced
   by `scripts/ui/extract-goal-frames.sh` (ffmpeg, even fps for uniform scrub speed).

## ⚠ Legal (pass-1 placeholder — must resolve before public ship)
The pass-1 source is a Kling AI-generated cinematic clip depicting an **IRON MAN / RDJ-style figure** — Marvel
IP + a real-person likeness, notwithstanding that it is AI-generated. It ships here **only as a mechanism
placeholder on the local build**. Before any public deploy it MUST be swapped for an ORIGINAL / LICENSED /
ANONYMOUS asset (an original stylised goal render, a CC-0/licensed clip, or an anonymous silhouetted striker),
per the extractor script's legal note. The scrub mechanism is identical whatever the source; only the asset's
provenance differs. Logged in `design/PROVENANCE.md`.

## Verification (pass 1)
Local production build (`build` + `start` on :3000). Scrubbed THROUGH the pinned section in a headless browser:
loader reveals (ready), canvas 1440×900 (blank-River guard `width!==300` PASS), SEQ readout advances
4→34→64→93 with the canvas centre pixel distinct at each (real advance, no blank/duplicate/frozen tail), zero
page errors. Overlay read-out-loud consistent (REPLAY · "Scroll the tape." · SEQ NNN / 96). design-cop verdict:
`design/verdicts/2026-07-18-landing-scroll-scrub-pass1.md`.

## Deferred (pass 2)
- Sync a `PriceChip` to scroll progress so the number ticks as the action peaks ("price = probability" in one scroll).
- Swap the placeholder clip for an original stylised football goal render (resolves the legal caveat).
- Minor: the overlay uses a couple of off-scale `text-[11px]` / inline `var(--text-section)` type values — move to the 6-step scale.
