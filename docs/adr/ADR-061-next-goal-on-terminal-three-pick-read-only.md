# ADR 061 Next Goal on /terminal — a three-pick, pure read-only consumer that resolves off the REAL halt goal

Status: accepted 2026-07-15 (`feat/terminal-games`). Cross-ref: ADR-060 (Next Goal on `/play` — the two-pick halftime game this reuses), ADR-050 (consumer layer — reads the ONE store, writes nothing), ADR-051/054/055 (two-source rule + the money-shot SSOT: the halt `land()` writes the score delta), ADR-052 (GSAP for the heavy win choreography), ADR-058 (terminal-craft shipped work — untouched: press vocabulary, the ONE TooltipProvider, screener rail, River autoSize, the never-animated ⌘K).

Context: the fleet task placed a "Next Goal" call BESIDE the trade panel on `/terminal` (Australia v Egypt). Unlike `/play` — which owns a feed harness (`matchSimHarness`) that fabricates a goal on `onLock` — `/terminal` is a LIVE surface with a real money-shot goal (`useHaltSequence` → `land()` → `repriceMatch` + `setScore` 0–0 → 0–1). The card must be a PURE READ-ONLY consumer: it resolves off the SAME store score delta the halt writes, and writes ZERO match state (never `apps/api`, the engine, or any store writer).

## Decisions

- **Reuse the ADR-060 game; adapt it to the terminal via props, don't fork it.** `NextGoal` gains `nobody`, `resolveWindowMs`, and a `prompt`. `/play` keeps its exact two-pick behaviour (defaults unchanged). `MatchColumn` renders `<NextGoal nobody resolveWindowMs={8000} onLock={NOOP} onReset={NOOP} />` — the callbacks are NO-OPS on the terminal (no harness): the game reads the real goal, it never schedules one.

- **Three picks (home · away · nobody), not two.** The card asks "Who scores next — Australia, Egypt, or nobody?". ADR-060 dropped a third pick for the `/play` snap game; the terminal is a standing live call where "nobody this window" deserves agency. Implemented additively in the PURE core: `resolvePick(pick, scored)` is a strict SUPERSET of the two-pick path — a `Side` pick with no goal is still `NO_CALL` (identical to `/play`), only `"N"` changes meaning: it WINS iff the window elapses with no goal, and any goal is a never-punishing LOSS. `detectGoal`/`resultFor` are unchanged, so `/play` is byte-for-byte identical. Copy law holds: pick · call · streak · points — never bet/stake/odds/wager.

- **Placement: BESIDE the trade panel (lg+), stacked below on mobile — and OUTSIDE `data-halt="dim"`.** The card is a right-hand `<aside>` in the center column so the halt can dim the trade area around it while the card's win burst stays full-brightness.

- **Resolution is READ-ONLY via a RAW store subscription, not React renders.** New export `subscribeMatch(matchId, cb)` fires the callback on EVERY store emit (per-writer), so the game observes the halt's synchronous `reset()`→`land()` score dip that React's `useSyncExternalStore` COALESCES to a single frame under reduced motion. While LOCKED the game re-arms its baseline on a score DROP (the Replay's `reset()` rewind) and resolves on the following rise (`land()`). This makes the terminal game resolve correctly in BOTH motion modes; `/play` never rewinds mid-round, so it is unaffected. Subscribing is a READ — it writes nothing.

- **Longer resolve window on the terminal (8s vs `/play`'s 2.2s).** The goal comes from the player driving the halt (not a sub-1.5s auto-harness), and a "nobody" call wins by the window elapsing — 8s gives room for both without dragging.

- **Celebration reused as-is (ADR-060 `Verdict` `WinBurst`): a one-shot ~600ms GSAP timeline (beams scaleY + glow, transform/opacity only, streak-tiered), reduced-motion-clamped.** New surface (a card, not the tape), so the heavy GSAP is wall-safe. A wrong pick is quiet/warm ("So close.", points kept, streak soft-reset). Added: a "nobody" win paints "Called it · no goal" (no scorer).

## Gap-fills shipped alongside (same branch)
- **Depth-tab fade (plans/008 §3):** a tokenized `.tab-fade` opacity keyframe (`var(--duration-fast) var(--ease-out)`, opacity-only, no transforms) on each `Tabs.Content`, and `after:transition-opacity` on the trigger underline. CSS only, zero new rAF.
- **Trade submit → fill → toast as ONE GSAP timeline:** on a confirmed fill, one one-shot timeline reveals the inline confirmation (transform/opacity) then fires the Sonner toast; reduced-motion clamps the travel. The `active:scale-[0.97]` press dip (ADR-058) is untouched.
- **A11y:** `StreakRail`'s pip container gets `role="img"` so its `aria-label` is valid (axe `aria-prohibited-attr` fix) — axe 0 on `/terminal`.

## Assessed, already-shipped (no change)
- **⌘K search** already returns and navigates real filtered results (matches/traders/pages via cmdk) and is animation-free — already shipped (ADR-058). Left as-is.
- **Live credits count-up:** the header `CreditPill` shows STATIC session credits (trade fills update `MatchColumn`-local `free`, not the header); there is no changing value to count up, and animating a static, always-visible balance every mount violates the frequency rule. Genuine live credits need an app-wide credit store wiring fills → header — out of scope. Logged, not filled.
- **Feed live-dot pulse:** SKIPPED. The FEED/DEVNET/SLOT cluster is fixture-backed (static "FEED 42ms", static slot). The 07-15 verdict HARD GATE #1 warns that asserting "live" over frozen prices is misleading — so no pulse.

## Consequences / VERIFY
`tsc --noEmit` clean; no new deps (`apps/web/package.json` unchanged). axe 0 on `/terminal`. Playwright-verified all four paths off the REAL replayed goal (no harness): pick Egypt → WON (+points, streak++, "GOAL · EGY"); pick Australia → LOST (quiet, streak reset, points kept); Nobody + goal → LOST; Nobody + no goal (window elapses) → WON ("Called it · no goal"). MotionScore before→after: Overall A 76→75; Desktop S→A; **Thrashing S→S** (no regression below the C floor); GPU A→A; steady-state tape rAF idle (~2/s), net-new continuous rAF ≈ 0. A blank-River / two-writer / engine-write / a second harness on `/terminal` is a bug.
