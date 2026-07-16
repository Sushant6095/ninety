# Verification verdict — the 3D football moment (DribbleScene) · 2026-07-17 (LOCAL PRODUCTION, :3100)

Scope: ADR-070 — a stylized dribbler weaves past four defenders, beats the keeper, scores; the net ripples, the scene flashes green, the price chip ticks 41.0 → 61.4. Landing-only, section 2b of LandingLong. Method: prod build → :3100 → **6 motion frames captured across the loop and WATCHED** (motion, not a still) → playwright battery → axe.

**The WATCH (mandatory for motion) — PASS.**
- frame 0–2 (the run): the green dribbler carries the ball (feet glow, dribble bounce), cuts through the weave; passed defenders read as **beaten** (wrong-footed tilt, left behind); goal + net + keeper ahead; chip 41.0.
- frame 3 (the goal): **keeper horizontal, dove the wrong way; ball inside the far post; chip flipped to 61.4** (fires `.flash-up`, the token 180ms tick grammar). The dribble reads, the shot reads, the goal lands.
- frame 4–5: loop resets — defenders upright, chip back to 41.0. Chip telemetry across the run: `41.0 → 41.0 → 41.0 → 61.4 → 41.0` ✓.

**Guardrails:**
- **FCP 88 ms** (baseline 104 — the hero is untouched, the scene is below-fold, lazy, not opacity-gated). ✓
- **MotionScore (measured, not vibes): steady-state 0 long tasks in 12 s of the scene looping in view**; full-scroll pass **553 ms / 1 task ≈ the ADR-069 baseline (524 ms / 1)** — the single task is the same lazy-mount spike. The stylized path holds the budget; no Thrashing regression. (score.motion.dev letter-grade is an external paste-run — re-run manually to confirm.)
- **Bundle:** `/` First Load JS unchanged at 259 kB — three stays out of the initial chunk (`next/dynamic ssr:false`). ✓
- **3D landing-only (ADR-058):** `three` importers are exactly `features/landing/{DribbleScene,WorldGlobe,StickerPeel}` — nothing on /terminal or the board. ✓
- **DPR cap works** — scene canvas 1695px (container ×1.5), not device-native 2×. **axe 0**. tsc clean, build green (18 pages).
- **Reduced motion:** scene renders ONE static frame at the goal (story pre-run to s=5.9), no rAF loop.

**Craft notes (design-taste):** stylized-abstract was the right register — unlit token materials (up-green hero, hairline defenders, hi frame), the one green accent doing the work, no photoreal uncanny. The slow-mo shot + wrong-way keeper carry the drama. Honest constraint: Mixamo's rigged clips require an interactive Adobe login (headless download impossible), so the sanctioned stylized fallback IS the ship — and it measured cleaner than a rigged-character scene would.

Verdict: **SHIP** (verifier LOOK/WATCH-based). Follow-ups if wanted: a subtle crowd-noise-free "GOAL" caption pulse at the flash; a second camera angle on alternate loops.
