# design-cop verdict — BOARD (`/board`) · football-warmth pass

- **Date:** 2026-07-17 · Branch: `merge/live-integration`
- **Surface:** `/board` (discovery board — NOT the match view; the River-≥45% rule is match-view-only, N/A here)
- **Shots judged:** `board-after.{xl,lg}.png`, `board-before.lg.png` — all from a LOCAL PRODUCTION build (`pnpm --filter web build` + `start` on :3000), settled 7s post-scroll.

> Written by the parent agent, verbatim from the design-cop subagent (read-only tools). Round-2 disposition appended.

## VERDICT (round 1): **PASS-WITH-NOTES**

All gating lines (1–9, 11, 12) PASS and line 10 is PASS (beats, not needs-work), so the screen PASSES. Three non-blocking notes; the top one is a genuine football-realism contradiction a sharp fan would catch, but it is pre-existing fixture canon orthogonal to this pass's fix.

## The fix — verified, not asserted
Before (`board-before.lg.png`): featured River cliff read `GOAL 74' · CAN` — asserting Canada scored at the live clock (74') — while the same board's Moment + Booth cards read "The 38th minute: David's goal repriced CAN…". Two elements disagreed on WHEN. After (xl + lg): cliff reads `GOAL · CAN`, no minute (`FeaturedPanel.tsx:127`). The `41 → 63` is NOT a contradiction: `fixtures.ts:62` reconciles it (`David at 38': 41 → 63, on to 61.4 at 74'`) — 63 is the goal-spike, 61.4 the settled 74' mark, ~60 live drift. A coherent price arc.

## Read-out-loud ledger (at rest) — ZERO DIRECT contradictions
Every CAN–MAR home price reads ONE store (SSOT): Featured HOME · Canada match-row H · Biggest-movers CAN–MAR all identical (≈61.2), `+20.2 = 61.2 − 41.0` open ✓. Movers cross-checked: FRA–SEN +17.2 up, NED–USA −16.1 pink/down (matches its descending spark), BRA–KOR +13.5 up ✓. MY MATCHES / center list / STARTING SOON agree on minutes+scores; ENG–SUI carries no score (upcoming, "in 23h 48m") ✓. Followed-teams LIVE badges each map to a genuinely live match ✓. Group A: CAN 7 / MAR 6 / CRO 3 / QAT 1 (fixture canon "Qatar out on 1 point") ✓. The "7.4"/"47.9" first ticker cell is a marquee mid-scroll clip of an H price, NOT a bug ✓.

## Rubric — line by line (design-cop)
1. HIERARCHY **PASS** — center live match list dominates; Featured a bounded rail hero; bento secondary; rails quiet. No co-equal heroes.
2. TOKENS **PASS** — grep `features/home` for hex → only `#142` (a rank, not a color). Numbers mono/tabular, prices one decimal. up/down/halt/chain correct.
3. RESTRAINT **PASS** — density is what a discovery board is for.
4. BLEND **PASS** — Sofascore density + Polymarket outcome→prob→spark→trade spine + Hyperliquid dark calm.
5. MOTION **PASS** — LivePrice 180ms flash; marquee reduced-motion → static; the one River sized (blank-guard PASS); prices measured moving.
6. STATES **PASS** — CTA hover/active/focus + honest halt label; ADR-071 honest degrade (no fabricated book).
7. A11Y **PASS** — focus ring, ≥44px target, text contrast clears AA, reduced-motion honored.
8. COPY **PASS** — grep `bet|stake|odds|wager|gamble` → zero. "Trade", "credits", "CR", "vol".
9. CONSISTENCY **PASS** — one shell/header/nav/scale via HomeShell.
10. ELEVATION **PASS (beats)** — real baked crests everywhere, SSOT live ripple, halt/goal choreography, booth feed, standings + rankings + movers. Richer than a stats portal.
11. FEELING **PASS** — the featured green goal-cliff on the live River, framed by real crests, booth reading like a real feed.
12. PROVENANCE **PASS** — every non-Ninety component in the diff has a ledger row (one latent Sparkline gap, note 2).

## Notes (design-cop, severity order — none blocking)
1. **[medium · fixture-canon, pre-existing] Bracket-impossible pairing.** Group A shows CAN 1st + MAR 2nd while the marquee match is CAN vs MAR in the R16 — same-group 1st/2nd can only meet in the final.
2. **[low · out-of-diff] Sparkline has no PROVENANCE row.** (`components/ui/Sparkline.tsx`, SVG not canvas.)
3. **[low · responsive] lg Power Rankings drops the team NAME** — crest-only at 1280 (the 1fr name column collapses to 0px).
4. **[low · opportunity] The cliff fix is a subtraction; could become an agreement** — `Goal 38' · CAN` would reinforce the Moment instead of merely avoiding the clash.

---

## Round-2 disposition (parent agent, re-verified on a fresh local prod build)

| Note | Action |
|---|---|
| 3 (lg name collapse) | **FIXED + MEASURED.** Confirmed the claim first (name width 0px @1280 vs 60px @1536). Tightened the row: `24px→18px` rank, `gap-3→gap-x-1.5`, crest `20→18`, delta `w-10→w-6`. Re-measured: names now **45/43/35px VISIBLE** @1280 (were 0). |
| 2 (Sparkline provenance) | **FIXED.** Added a `Sparkline` row to `design/PROVENANCE.md` — logged honestly as a Ninety data-viz micro-primitive whose registry-abstention is DESIGN LAW (ADR-045 bans a chart instance per row), not an unlogged omission. |
| 1 (bracket impossibility) | **ESCALATED, NOT symptom-patched — this is the specific blocker.** Investigating the root revealed it is far more systemic than a standings tweak: (a) `GROUP_STANDINGS` in `rankings.ts` is hand-authored and **disagrees with the canonical `data/wc26/teams.json` for every group** — teams.json actually places CAN∈B, MAR∈C (so CAN vs MAR in the R16 is LEGAL); the fabricated "Group A" of CAN/MAR/CRO/QAT is the ADR-051 two-source violation. (b) Checking all 8 live R16 fixtures against canonical groups, **FRA and SEN are BOTH in Group I** yet play each other in the R16 — a same-group pairing no standings edit can fix. (c) The fixtures (`fixtures.ts`) reference teams **not in the 48-team teams.json at all** (ITA, NGA, DEN, SRB, CMR, HUN, SVK, UKR). This is a whole-app **fixtures ↔ wc26 data divergence** requiring a dedicated fixture-integrity ADR that reconciles `fixtures.ts` + `rankings.ts` + `data/wc26`. A partial "reshuffle Group A" would leave FRA-SEN and the divergence intact — a symptom patch the loop forbids. **Owner: follow-up ADR before judging.** |
| 4 (richer glyph) | **SKIPPED.** Optional; the subtraction already removes the contradiction cleanly. |

### Verified after round-2 (fresh build)
- Zero page errors, zero HTTP ≥ 400. River sized (blank-River guard PASS). CAN prices MOVE (61.4 → 61.8 → 62.4 over 6s) — board is live. Cliff glyph `GOAL · CAN`. lg Power Rankings names visible.

### Round-2 verdict: **PASS** (rubric)
design-cop's rubric passed; 2 of 3 non-blocking notes closed; note 1 is a systemic fixtures↔wc26 divergence escalated with a precise root-cause finding (not a board-visual fix). The board clears the bar on every direct/verifiable item: PASS rubric · zero direct read-out-loud contradictions · feels like football (real crests, live River, booth feed) · Sofascore density · live-and-moving · tokens · play-money · reduced-motion · build green.
