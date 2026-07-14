# 008 — The missed beats: score flash, settle reveal, tab fade, onboarding delight

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: MEDIUM (additive — missed opportunities, not defects)
- **Category**: Missed opportunities
- **Estimated scope**: 4 files, ~40 lines

## Problem

Four state changes teleport where the product's own motion vocabulary already has the right tool:

1. **The score never flashes.** `features/terminal/MatchHeader.tsx:46` renders `{score.home}<span>–</span>{score.away}` as plain text. At the halt's `land()` beat every price cell tick-flashes, but the goal's own digit — the highest-signal number on screen — swaps silently.
2. **Settlement teleports.** `features/terminal/MatchStates.tsx:90-107` (`SettledPanel`) renders `<ProofBadge sig={result.settleSig} label="Settled on-chain" />` fully static. `design/motion.ts` literally reserves the beat: `slow: 250 /** Slow, deliberate reveal (ProofBadge on settle…) */`. The app's whole trust thesis lands with zero ceremony.
3. **Depth tabs teleport.** `features/terminal/MatchTabs.tsx:22,37-41`: `Tabs.Content` swaps instantly; the active underline is `after:opacity-0 → data-[state=active]:after:opacity-100` under `transition-colors` (which does not transition the pseudo-element's opacity) — the bar pops.
4. **Onboarding claim has no delight.** `features/onboarding/OnboardingPage.tsx:87-113`: the claimed state (Check + CTA) mounts with zero motion and the big `1,000` is static — the one rare, first-time celebration where delight is allowed.

## Target

1. Score digits reuse the LivePrice flash vocabulary: render each digit in a span keyed by its value with the existing `.flash-up` class, e.g. `<span key={`h-${score.home}`} className="flash-up">{score.home}</span>` (same for away). A remount restarts the 180ms tint. Zero new CSS. (Note: `flash-up` tints green; a conceded goal is still information — green is the house "changed" tint on the tape; use `flash-up` for both sides.)
2. `SettledPanel`: wrap the panel body in the existing `Reveal` component (`components/ui/Reveal.tsx`) — it already does opacity 0→1, y 12→0 at `m.slow` on the ninety curve with reduced-motion and mount-safety handled. One import, one wrapper.
3. MatchTabs: (a) on each `Tabs.Content`, add the tokenized fade — wrap content in a div with `data-[state=active]:animate-none` is NOT available; instead add to the Content className: `data-[state=inactive]:hidden` is Radix default; the cheap correct tool is CSS — add a `tab-fade` helper to globals.css:
   ```css
   .tab-fade[data-state="active"] { animation: tabIn 150ms cubic-bezier(0.16, 1, 0.3, 1); }
   @keyframes tabIn { from { opacity: 0; } to { opacity: 1; } }
   ```
   and add `tab-fade` to each `Tabs.Content` className. (Opacity-only: comprehension-safe under reduced motion via plan 002's global rule.) (b) On the trigger underline, change `transition-colors` to `transition-[color,background-color,opacity]` and move the opacity classes onto the `after:` pseudo so `after:transition-opacity after:duration-200` applies — concretely: add `after:transition-opacity` beside the existing `after:` classes.
4. OnboardingPage claimed block: wrap in `Reveal`; replace the static `1,000` figure with the existing `NumberTicker` (`components/ui/NumberTicker.tsx`, `value={1000}`) — it counts up over `motion.count` (500ms) on first view, SSR/reduced-motion safe.

## Repo conventions to follow

- Reuse, never re-invent: `Reveal` (fade+rise, m.slow), `NumberTicker` (m.count), `.flash-up` (180ms tint) are the sanctioned vocabulary — this plan adds ONE tiny CSS helper (tab-fade) and otherwise only composes.
- If plan 003 has landed, write `var(--duration-fast) var(--ease-out)` in the tab-fade rule instead of literals.

## Steps

1. `MatchHeader.tsx:46`: keyed digit spans with `flash-up`.
2. `MatchStates.tsx` SettledPanel: import + wrap in `Reveal`.
3. `globals.css`: add `tabIn`/`.tab-fade`; `MatchTabs.tsx`: add `tab-fade` to Content, `after:transition-opacity` to the trigger underline.
4. `OnboardingPage.tsx`: `Reveal` around the claimed block; `NumberTicker` for the 1,000.

## Boundaries

- Do NOT animate the tab CONTENT with transforms — opacity only (the terminal stays crisp; motion.md: no entrance staggering on data).
- Do NOT touch the halt sequence, LivePrice, or the board list.
- The score flash must not fire on first mount (initial render has no previous value — a keyed span animates once on mount, which reads as a soft highlight on page load; if that looks noisy in the feel check, gate it: only add the `flash-up` class after the first render, mirroring `LivePrice`'s prev-ref pattern).

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0.
- **Feel check**: `/terminal` — replay the halt: at the land beat the score digit tints in the same breath as the cells. Settle a market (or view a settled one): the proof panel rises in over 250ms. Switch depth tabs rapidly: content crossfades at 150ms, underline fades instead of popping, nothing restarts from zero mid-switch. `/onboarding` — claim: the 1,000 counts up once, the claimed block rises in.
- **Done when**: all four beats animate with existing vocabulary and reduced-motion shows instant final states.
