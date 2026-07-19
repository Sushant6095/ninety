# Terminal prompt — implement the iron-man frame-scrub on the Ninety landing (pass 1)

Copy everything in the block below into the Mac Claude Code session. It's scoped to **just get the
scroll-scrubbed frame sequence working** (the "iron-man only" pass) using the AI-generated clip already in
the repo — no football, no price-sync yet. Those are later passes.

---

```
Implement a scroll-scrubbed frame-sequence hero on the Ninety LANDING (the iron-man / Apple-AirPods effect).
This is pass 1 — just get the mechanism buttery and verified. No price-sync, no football yet.

READ FIRST (don't skip — law + technique):
- CLAUDE.md (frontend pre-flight + Design law + Verification law). This OVERRIDES the skill's stack where
  they conflict. Key conflicts to honor OUR side of:
  • GSAP is our PRIMARY animation lib. Do NOT install Lenis or use raw window.scroll like the skill's
    reference code — drive the scrub with GSAP ScrollTrigger (pin + scrub), already set up in
    apps/web/src/lib/gsap.ts. If you want smooth-scroll, use GSAP ScrollSmoother (in-stack), NOT Lenis.
  • Colors via tokens only (styles/tokens.css) — zero raw hex. • prefers-reduced-motion honored.
  • The animated gradient / heavy canvas is LANDING-ONLY. Never add this to /terminal, the board, or any
    live-price surface (GPU contention breaks the 150ms tick path).
- The skill "3d-scroll-website" (in "3d-scroll-website-skill-pack 2/") — use it as the TECHNIQUE + perf
  guide: references/03-scroll-animation-deep-dive.md (frame math, cover-fit, DPR) and
  references/06-performance-optimization.md (RAF/direct-DOM/preload checklist). Follow its performance
  checklist, but implement via GSAP per our law above.
- Invoke the ui-craft router FIRST (it dispatches to gsap-skills); context7 the GSAP ScrollTrigger
  pin/scrub/end/invalidateOnRefresh API before trusting it.

ALREADY BUILT for you (reuse, don't rewrite):
- apps/web/src/features/landing/GoalReplayScroll.tsx — GSAP ScrollTrigger pin+scrub, DPR cover-fit canvas
  (with mobile 1.3x zoom), createImageBitmap decode + concurrency pool, loader that gates paint,
  prefers-reduced-motion fallback, tokens only. Props: frameCount, framePath, pinLengthVh, eyebrow,
  headline, sub.
- scripts/ui/extract-goal-frames.sh — ffmpeg slicer. Args: <input> [frames] [width] [quality] [name].

STEPS:
1) Frames from the provided AI clip (1920x1080, 24fps, 169 frames, ~7s — Kling-generated, so no
   broadcast/likeness issue):
     chmod +x scripts/ui/extract-goal-frames.sh
     scripts/ui/extract-goal-frames.sh "3d-scroll-website-skill-pack 2/kling_20260421_作品_Cinematic__4368_0.mp4" 96 1600 3 cine
   It prints the real COUNT and the exact framePath — use those in step 2. (Bump to ~120 frames if you
   want it silkier; keep the folder under ~20MB so the landing stays light.)

2) Wire it into the landing as its own section, lazily (match FlowFieldLazy/WorldGlobeLazy so the ~96-frame
   decode never blocks FCP):
     const GoalReplayScroll = dynamic(
       () => import("./GoalReplayScroll").then(m => m.GoalReplayScroll), { ssr: false });
   Place it below the hero (near THE LOOP) in the long-landing composition:
     <GoalReplayScroll
       frameCount={<COUNT from step 1>}
       framePath={(n) => `/frames/cine/cine_${String(n).padStart(4,"0")}.jpg`}
       eyebrow="REPLAY"
       headline="Scroll the tape."
       sub="A pre-rendered sequence, scrubbed frame-by-frame to your scroll — the landing showpiece."
     />

3) VERIFY (our Verification law + the skill's perf checklist — motion, so a single still does NOT prove it):
   - pnpm --filter web build  (production — catches SSR/hydration; next dev hides these)
   - pnpm --filter web start   (:3000)
   - node scripts/ui/screenshot.mjs at lg+xl, scrolling THROUGH the section — capture 3–4 frames across the
     scrub and LOOK: the image must actually advance and never blank/duplicate. Assert canvas.width !== 300
     (blank-River guard). Confirm the loader hits 100% then reveals.
   - Read-out-loud the overlay (eyebrow / headline / SEQ NNN / frameCount agree).
   - design-cop verdict → design/verdicts/. Add a design/PROVENANCE.md row: source = Kling AI clip (own),
     component GoalReplayScroll, technique = 3d-scroll-website skill + GSAP ScrollTrigger.

SCOPE GATE: if it's not smooth after this, tune pinLengthVh (scroll length) and frame count first — don't
add libraries. Report back with the 3–4 scrub screenshots before we do pass 2 (price-sync + a football clip).
```

---

## Notes for you (Sushant), not the prompt
- **Why not follow the skill's stack verbatim?** The skill scaffolds a *fresh* Next 16 + Lenis + Framer site.
  Ninety already exists and its CLAUDE.md makes **GSAP the law** — so we keep the skill's *technique + perf
  rules* but drive it with GSAP ScrollTrigger (and ScrollSmoother if we want Lenis-like smoothness), no new
  lib. Same effect, no law violation, no `law-guard` fail.
- **Legal:** the Kling clips are AI-generated → clean to ship. The moment we swap in real match footage or a
  named player (a real Messi goal), broadcast + likeness rights come back — use original/licensed/anonymous
  then.
- **Pass 2 (later):** sync a live `PriceChip` to scroll progress so the number ticks as the action peaks —
  the "price = probability" story told in one scroll — and/or swap the cine clip for a stylised goal render.
```
