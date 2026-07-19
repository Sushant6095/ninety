# Handoff — Goal-replay scroll scrub (landing)

The Apple / `iron-man-jet` effect: pin a full-bleed `<canvas>`, preload ~90 JPG frames, paint
`frame = round(scrollProgress × N)`. Ours is driven by **GSAP ScrollTrigger** (our primary lib), not the
reference's hand-rolled scroll math — pin + scrub + resize-refresh for free, and law-compliant.

## What's already built (this session, drop-in, no live-tree collision)
- `apps/web/src/features/landing/GoalReplayScroll.tsx` — the component. GSAP ScrollTrigger pin+scrub,
  DPR cover-fit canvas, `createImageBitmap` decode with a concurrency pool, `prefers-reduced-motion`
  fallback (static final frame, no pin), tokens only (0 raw hex), loader gates paint (no blank canvas).
- `scripts/ui/extract-goal-frames.sh` — ffmpeg slicer → `apps/web/public/frames/goal/goal_0001.jpg …`

## ⚠ Legal gate (pick the asset accordingly)
Real broadcast footage + a named player (an actual **Messi** goal) is FIFA/broadcaster + likeness owned.
Ninety is a play-money "legal armor" product — **don't ship real match footage or a real, named player on
the public landing.** Use an original stylised/rotoscoped goal, a licensed/CC-0 clip, or an anonymous
silhouetted striker. The scrub is identical either way; only provenance differs. Log it in `PROVENANCE.md`.

## 3 steps on the Mac (terminal session — owns prod build + verify)
1. **Frames** (set `frameCount` to the count it prints):
   ```
   chmod +x scripts/ui/extract-goal-frames.sh
   scripts/ui/extract-goal-frames.sh <clip.mp4> 90 1600 3
   ```
2. **Wire into the landing** — import lazily so the ~90-frame decode never blocks FCP (match the
   FlowFieldLazy/WorldGlobeLazy pattern), and place it as its own section in the long landing:
   ```tsx
   const GoalReplayScroll = dynamic(
     () => import("./GoalReplayScroll").then((m) => m.GoalReplayScroll),
     { ssr: false },
   );
   // …in the landing composition, below the hero / near THE LOOP:
   <GoalReplayScroll frameCount={90} headline="Every goal moves the market." />
   ```
3. **Pre-flight + verify (law):**
   - `ui-craft` router → it dispatches to **gsap-skills**; `context7` the ScrollTrigger `pin`/`scrub`/
     `end`/`invalidateOnRefresh` API before trusting it.
   - Prod build, not dev: `pnpm --filter web build && pnpm --filter web start` → `:3000`.
   - `node scripts/ui/screenshot.mjs` at lg+xl **with a scroll** into the section — this is MOTION, so a
     single still won't prove it: capture 3–4 frames across the scrub and LOOK (goal must actually advance,
     canvas must not be blank/duplicated). Assert `canvas.width !== 300` (blank-River guard).
   - design-cop verdict → `design/verdicts/`. Add a `PROVENANCE.md` row (source clip + licence + skill).

## Enhancement (later)
Sync a live `PriceChip` to `scrollProgress` so the number ticks up as the goal goes in — the literal
"price = probability" story, on the landing. Keep it landing-only; never on `/terminal` or the board.
