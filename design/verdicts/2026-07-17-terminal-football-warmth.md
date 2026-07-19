# design-cop verdict — TERMINAL (`/terminal`) · football-warmth pass

- **Date:** 2026-07-17 · Branch: `merge/live-integration`
- **Surface:** `/terminal` — the live trading money-shot (AUS 0–1 EGY, 74', resting post-goal frame with the halt choreography)
- **Shots:** `terminal-after.{xl,lg}.png` vs `terminal-before.lg.png` — LOCAL PRODUCTION build, settled 7s after the scroll-through (halt at rest).

> Persisted by the parent agent, verbatim from the design-cop subagent (read-only tools). Round 1 = PASS-WITH-NOTES; round 2 (after fixes) = clean PASS.

## FINAL VERDICT: **PASS** (round 2, re-judged by looking at both fresh shots)

Both round-1 blockers closed at root and confirmed in-render. All 12 rubric lines clear; remaining items are notes-only.

## What changed this pass (three fixes on the strongest, already-dense trading surface)
1. **TradePanel metrics cramp — FIXED.** The Cost/Avg-px/Max-payout `dl` shared one `flex items-end` row with a `shrink-0` Buy button whose long label ate the row at lg's narrow trade column — the three columns collapsed to 0px and overlapped. Stacked them: full-width metrics above, full-width action button below. Measured 65/65/65px, no overlap.
2. **PriceCells label/badge collision — FIXED (in two steps).** (a) HOME clipped to "HOM…" because "HOME · AUS" lived under one `truncate`; base label now `shrink-0`. (b) The AWAY cell then still mashed because its base label AND the "60 SH" badge are both un-shrinkable in a ~66px cell (they overlapped even absolutely-positioned — measured). The "60 SH" text chip became a small up-token **held-marker dot** in the corner (aria-label="60 shares held"); the exact count already lives in YOUR POSITION directly below. Measured at lg + xl: dot present, no overlap with label or price, labels full.
3. **TerminalDock occlusion of live prices — FIXED at root.** The fixed floating dock floated over the live AWAY price cell / River at the fold (worse than the redundant Booth strip; `pb-20` end-clearance already existed so that wasn't the fix). The dock is now GATED to hide while the live-trade fold is in view and reveal once the reader scrolls into secondary content (IntersectionObserver on a top sentinel, rootMargin 90% top — no scroll listener; opacity + pointer-events toggle, motion-reduce safe). Every target the dock offers (nav, Replay the halt, the trade ticket) is already visible on the fold, so nothing is lost. Measured: opacity 0 / not-over-prices at the fold; opacity 1 after 1400px scroll.

Also carried the shared-timeline wash fix here: zero LIVE-over-HALT frames (the "Market {status}" header badge is bound to the same store status that gates the wash). The terminal's OWN BigRiver cliff correctly keeps "GOAL 74' ASHOUR" — Ashour genuinely scores at the live minute; only the shared FeaturedPanel glyph (board/landing) dropped its minute.

## design-cop round-2 re-checks (verified by LOOKING, not by claim)
- **GAP 1 — FIXED, confirmed.** Both fresh shots: dock ABSENT at the fold. xl trade column (size slider, `2,450 cr free`, COST/AVG PX/MAX PAYOUT, Buy button) fully unobstructed; lg Booth line renders complete with the `▲24` chip, no dock over it.
- **GAP 2 — FIXED, confirmed.** xl AWAY cell = clean `AWAY · EGY / 55.2 / ▲24.2 today` with a green held-dot top-right, no "60 SH" text, no overlap; lg HOME/DRAW full labels, zero garble (the old `AU0A5H` mash is gone).

## Read-out-loud — tight, ZERO contradictions
`xl @ 55.2`: ticker · left-rail · river legend · AWAY cell · Buy `@ 55.2` · Next goal · Movers all = 55.2. 60 sh × 55.2 = 3,312 cr; (55.2−41.0)×60 = +852 = OPEN POSITIONS `+852 @41.0` (+34.6%). `lg @ 55.5`: all mirrors 55.5; 60×55.5 = 3,330, +870 = OPEN POSITIONS `+870`. Price moved 55.2↔55.5 across captures — live. Score 0–1, 74', `ASHOUR ← HAFEZ`, and the `31 → 55` arc agree across cliff/Booth/AI-call/mover/your-41.0-entry. MARKET LIVE at rest, no amber wash.

## Rubric (all 12 clear)
1 HIERARCHY PASS (cleaner — dock no longer dilutes the river hero) · 2 TOKENS PASS (terminal dir grepped clean of hex; prices one decimal) · 3 RESTRAINT PASS · 4 BLEND PASS (Polymarket spine + Hyperliquid calm) · 5 MOTION PASS · 6 STATES PASS · 7 A11Y PASS · 8 COPY PASS (no bet/stake/odds/wager) · 9 CONSISTENCY PASS · 10 ELEVATION PASS (beats reference: goal cliff + Booth AI call + crest tiles) · 11 FEELING PASS (delight = the river goal cliff repricing 31→55 live) · 12 PROVENANCE PASS.

## Notes-only (none blocking)
- **Gap 3** (duplicate THE BOOTH masthead + lead line): DRY nicety; collapse the top strip to a compact "latest" pointer when convenient. NOT actioned this pass.
- **Gap 4** (Attack Momentum outside a tab): defensible as ambient discovery-rail context, adds warmth, off the trade spine. NOT actioned.
- **Gap 5** (itemized PROVENANCE rows for PriceCells/TradePanel/YourPosition + the dock fold-gate): **CLOSED** — rows added to `design/PROVENANCE.md`.
- **Gap 6** (broadcast-fanart on `/match/[id]` for teams whose `stadium.jpg` is a broadcast press photo, e.g. Canada): **ESCALATED** as a data-curation follow-up. /terminal is clean (AUS = flag). Same class as the fixtures↔wc26 divergence.
- **Gap 7** (`60 SH` vs `60 sh` casing): effectively moot — the cell dropped its text badge; a trivial casing drift persists only between YOUR POSITION and OPEN POSITIONS. Cosmetic, optional.
- **Micro:** the three displayed legs sum to 99.9 not 100.0 — inherent independent-1-decimal rounding; forcing a normalize-to-100 is worse than honest per-leg rounding. Left as-is.

### Verified after round-2 (fresh build)
Rivers sized (blank-guard PASS), EGY price moves live (54.8 → 54.5 → 54.1), dock hidden at fold, zero page errors, zero HTTP ≥ 400, MARKET LIVE at rest.

**Bottom line: clean PASS.** Both former blockers fixed at root and verified in-render; read-out-loud airtight; feels like football; tokens/play-money/reduced-motion clean; one hero = the river, now unobstructed.
