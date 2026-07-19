# design-cop verdict — landing SCROLL-SCRUB showpiece (pass 1: mechanism)

- **Date:** 2026-07-18 · Branch: `merge/live-integration`
- **Scope:** the frame-scrub MECHANISM only (not football, not price-sync — later passes, by design).
- **Impl:** `apps/web/src/features/landing/GoalReplayScroll.tsx` + `GoalReplayScrollLazy.tsx`, wired into `LandingLong` (section 3b, after THE LOOP). 96 JPG frames @1600px, 5.5MB, `/frames/cine`.

> Persisted by the parent agent, from the design-cop subagent (read-only). Round-1 = PASS-WITH-NOTES; round-2 (after fixes) closes the three actionable notes.

## MECHANISM verdict: **PASS-WITH-NOTES → notes closed = PASS**

The scrub itself is production-grade: buttery (GSAP `scrub` + `ease:"none"` + DPR-capped canvas + off-main-thread `createImageBitmap` pool), single-hero, landing-scoped (imported ONLY in `LandingLong` — never `/terminal`, board, or a live-price surface), reduced-motion-safe (explicit branch: decode last frame, no pin/scrub), and free of the blank / duplicate / jank failure modes. Verified in motion: canvas 1440×900 (`width!==300` guard PASS), SEQ advances 004→034→064→093 with distinct poses (real advance, no frozen tail), loader gates paint then reveals, zero page errors. Read-out-loud clean: REPLAY · "Scroll the tape." · SEQ NNN / 96 · no gambling vocab, no false live/price claim.

## Round-1 notes → round-2 disposition
- **[FAIL · line 2] `text-[11px]` off-scale (4 spots)** → **FIXED.** All swapped to `text-label` + `tracking-caps` (tokens). Grep of the component for `text-[` / `tracking-[` / hex → clean.
- **[FAIL · line 7] Top-label contrast** (green 11px eyebrow/SEQ over the raw frame, no top scrim — fails AA in light) → **FIXED.** Added a top scrim (var(--bg) linear gradient, symmetric to the bottom vignette) and rendered eyebrow + SEQ in `text-hi` (measured: near-white #F5F7FA in dark, near-black #0B0D10 in light — AA in both), keeping green on the dot + progress hairline. Verified in the dark capture (crisp legibility).
- **[FAIL · line 12] Missing PROVENANCE rows** → **already present** (design-cop grepped BEFORE the write landed): two rows added — the `GoalReplayScroll` component (hand-build, GSAP ScrollTrigger, `Searched: registries n/a`) and the `/frames/cine` Kling asset (source + ADR-078 + swap-before-ship note).
- **[NOTE · line 5] Verify dark theme** → **DONE.** Re-captured in dark (`scrub-dark.png`) + light (`scrub-light.png`); both hold, labels theme-adaptive.
- **[LOW · line 6] resize refresh** → left as-is (GSAP handles resize internally; design-cop concurred).

## ⚠ LEGAL FLAG (hard gate on PUBLIC ship — NOT on the mechanism)
The pass-1 source is a Kling AI-generated clip depicting an **Iron Man / RDJ-style figure — Marvel IP + a real-person likeness**. It is a MECHANISM PLACEHOLDER and **must be swapped for an original / licensed / anonymous (ideally football) asset before any public deploy.** The scrub mechanism is asset-agnostic (pure re-bake). Recorded in `design/PROVENANCE.md` + ADR-078. Owner is aware (pass-2 plan).

## Rubric (12 lines)
1 HIERARCHY PASS (one full-bleed hero) · 2 TOKENS PASS (after the text-label fix) · 3 RESTRAINT PASS (landing showpiece, ADR-058) · 4 BLEND PASS · 5 MOTION PASS (GSAP pin+scrub, no layout-prop animation, PRM branch) · 6 STATES PASS (loading/empty/error handled) · 7 A11Y PASS (after the top scrim + text-hi fix; reduced-motion honored) · 8 COPY PASS (play-money-safe) · 9 CONSISTENCY PASS (one shell, one theme) · 10 ELEVATION PASS (beats a static hero — you operate a cinematic reveal) · 11 FEELING PASS (you scrub the tape; the SEQ counter makes it tactile) · 12 PROVENANCE PASS (rows present).

**Bottom line: the mechanism is a full PASS.** All three actionable notes closed and verified in both themes. The only outstanding item is the pass-2 asset swap (public-ship gate, documented) — not a mechanism defect.
