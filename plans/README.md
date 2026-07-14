# Animation plans — apps/web motion audit (2026-07-14, commit 4c0975f)

Produced by the `improve-animations` survey (4 parallel category audits, findings vetted at file:line).
Each plan is self-contained — an executor needs zero context beyond the plan file.

| # | Plan | Severity | Category | Status |
|---|------|----------|----------|--------|
| 001 | [Retrigger the live price flash on every tick](001-live-flash-retrigger.md) | HIGH | Interruptibility | DONE |
| 002 | [Fix the global reduced-motion rule](002-reduced-motion-global-rule.md) | HIGH | Accessibility | DONE |
| 003 | [Route Tailwind duration/ease through the motion tokens](003-tailwind-motion-token-plumbing.md) | HIGH | Cohesion & tokens | DONE |
| 004 | [Tokenize the stray motion literals](004-tokenize-stray-literals.md) | MEDIUM | Cohesion & tokens | TODO |
| 005 | [Tooltip system: shared provider, skip-delay, origin](005-tooltip-system.md) | MEDIUM | Easing / Physicality | DONE |
| 006 | [One press vocabulary: active states, hover gating](006-press-feedback-pass.md) | MEDIUM | Physicality / A11y / Perf | DONE |
| 007 | [Halt banner: CSS sweep, animated exit, eq-bar cleanup](007-halt-banner-polish.md) | MEDIUM | Performance / Interruptibility | TODO |
| 008 | [The missed beats: score flash, settle reveal, tab fade, onboarding](008-missed-beats.md) | MEDIUM | Missed opportunities | TODO |

## Recommended execution order

1. **002** (reduced-motion rule) — safety net everything else leans on; pure CSS, zero risk.
2. **001** (flash retrigger) — the signature feedback on the hot tape; independent.
3. **003** (Tailwind token plumbing) — unlocks `var(--ease-out)`/`var(--duration)` used by 005 and 008.
4. **005**, **006**, **007** — independent of each other; any order.
5. **004** (literal consolidation) — cosmetic, anytime.
6. **008** (missed beats) — last: it composes vocabulary the earlier plans touch (`flash-up` from 001/002, vars from 003).

Dependencies: 005 and 008 reference `var(--ease-out)` from 003 (both carry a literal fallback if 003 hasn't run).
007 must NOT touch `useHaltSequence.ts` (fixed directly at 4c0975f: sweep crossing, autoplay race, spring token).

## Recorded, deliberately NOT planned

- `useHaltSequence.ts` `pulse: 0.04` / `decay: 1.0` — off-token literals with `ponytail:` ceiling comments; settled.
- `CommandMenu` has zero open/close animation — CORRECT (keyboard-frequency, the Raycast rule). Never add one.
- `accDown/accUp` height keyframes — the documented Radix accordion pattern on a cold page; revisit only if rapid-toggle jump is visible in the FAQ (see plan 003 for the literal cleanup that DOES apply).
- `NumberTicker` recounts from 0 if `value` changes mid-flight — harmless today (once-per-view landing stats).
- `Reveal` has no stagger prop; four stacked board sections can fire together at wide viewports — LOW, batched into a future polish pass if the board feels "all at once" on 1440px+.
- TradeSheet: symmetric enter/exit + a grab-handle with no drag gesture — flagged; a drag-to-dismiss (velocity > ~0.11 px/ms) is product work, not a motion patch.
