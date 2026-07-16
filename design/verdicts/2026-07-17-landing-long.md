# Verification verdict — the long landing · 2026-07-17 (LOCAL PRODUCTION, :3100)

Scope: the 9-section long page below the kept notio hero (ADR-069) — 3D dropped this run. Method: `pnpm --filter web build` → `next start` :3100 → screenshot `/` lg+xl → **LOOKED at the full 13,934px page** → **WATCHED the halt** (5 clipped frames across the LoopStage choreography) → playwright battery (FCP, long-task, resting stats, canvas guard, SSOT check) → axe. Not judged in dev.

**Sections present, dense, no voids, headings white (SHIP):**
1. Hero (kept) — River renders, "Every match is a market for ninety minutes".
2. THE LOOP — `LoopStage` mounts on scroll and plays the real `useHaltSequence` (goal → HALTED amber → reprice), `HyperText` "Goal. Halt. Reprice.", legend.
3. PRICE IS PROBABILITY — the big **61.4** over the `PriceVoid` orbit.
4. VelocityBand chapter break (trade · settle · prove · price).
5. THE FOOTBALL EXPERIENCE (new) — the 5-step fan journey (watch → River → Next Goal → Moment → Telegram).
6. PROOF / ON-CHAIN — "Nobody is trusted. Everything is proven." (chain `Highlighter`), 3 steps, proof-log link.
7. THE BOOTH — commentary cards (now CAN–MAR, see below).
8. THE WHOLE TOURNAMENT — `NumberTicker` 104 / 48 / 1,000 + Jul 19 + the dotted `WorldGlobe`.
9. FreeCredits ("One price: free") → GAMES + MOMENTS + TELEGRAM bento (new) → "the opening bell" close.

**Read-out-loud — PASS after a fix.** The Booth quotes were hardcoded to **Australia–Egypt** while the hero/loop/price are **CAN-MAR** (`FEATURED = wc26-can-mar`); rewrote `BoothQuotes` to CAN–MAR so every surface reads one match. SSOT check: the hero converges to the loop (`1-0/61.4` → `2-0/57.4`) — the featured market *evolves* as the loop demonstrates a goal; not a simultaneous contradiction, and bounded (replay resets, not cumulative). Tournament stats rest on **104 / 48 / 1,000 / Jul 19**.

**Guardrails:**
- **FCP 104 ms** (« 1.8s target). Hero in server HTML, no opacity gate; only below-fold sections Reveal/lazy. ✓
- **MotionScore proxy: 1 long task, 524 ms, COUNT=1** — a one-time mount spike (lazy WebGL globe/void init), **no repeated long tasks during a full scroll** → no Thrashing regression. All 3D/heavy pieces lazy + IO-gated; this is the clean pre-3D baseline. (score.motion.dev is an external paste-run — recommend the user re-run it against :3100 to confirm the letter grade.)
- **Canvas guard** — visible canvas widths `[1004,1004,860,860,2304,2304,510,2304]`, none at the 300 blank default (River + globe + void all render). ✓
- **axe 0** on `/`; **tsc** clean; **build** green (18 pages, `/` 15 kB).
- **Halt watched** — frame at ~0.7s: `CAN 2–0 MAR · 74' · amber HALTED · GOAL 74'·CAN glyph · legend on HALT · HOME 58.0`. The halt lands and is legible. ✓

**Motion ceiling honored** — reused ~10 already-tuned components (LandingScroll GSAP reveals, LoopStage halt, PriceVoid, VelocityBand, FlowField, WorldGlobe, HyperText, Highlighter, NumberTicker, Marquee); the two new sections add restraint, not a rave. Dropped the skiper52 pillars (animated flex-grow = layout thrash) to keep the baseline clean.

**FLAGGED (pre-existing, not introduced here) — recommend a quant pass, out of scope for this composition run:** the LoopStage demo goal reprices CAN **down** (61.4→57.4) as Canada extends to 2-0 — direction reads backwards for a leader extending. It is `useHaltSequence`/`FeaturedPanel` (the terminal's shared halt engine, reused; shipped in the prior landing). Not rewired here to avoid touching the engine on a landing-composition task.

Verdict: **SHIP** (verifier LOOK-based; a design-cop-agent re-pass is available). One follow-up: the demo reprice direction above.
