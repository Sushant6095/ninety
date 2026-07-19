# design-cop verdict — landing `/` — "make it feel like football" pass

Date: 2026-07-17 · Branch: `merge/live-integration`
Shots LOOKED at: `landing-after.{lg,xl}.png`, `landing-before.lg.png`, `landing-crestwall.png`, `landing-loop.png` (transient excluded per brief).
Reference: **none exists** — `design/screens/*land*` returns zero files. Judged against the BEFORE + ADR-049 intent.

> Written by the parent agent, verbatim from the design-cop subagent (it runs read-only: Read/Grep/Glob).
> Verdict below is round 1. **Round-2 disposition (what was fixed) is appended at the bottom.**

## VERDICT (round 1): **BLOCK** — narrow, and the craft is not what blocks it.

The visual work passes and genuinely beats the before. The block is **line 12**: `CrestWall`, the headline component of this pass, has **no row in `design/PROVENANCE.md`**. Line 12 FAIL ⇒ not a PASS. Two edits clear it.

| # | Line | Verdict |
|---|---|---|
| 1 | HIERARCHY | **PASS** — one hero (notio + live HeroRiver 60.5); crest wall correctly subordinate (340px col, `md:opacity-80`, 30px crests vs `text-stat`) |
| 2 | TOKENS | **PASS** — grep of `features/landing` for `bg-[#`/`text-[#`/hex/`p-[` → **zero**. Floodlight is `color-mix(…var(--up) 12%…)` (CrestWall.tsx:28). All prices one decimal |
| 3 | RESTRAINT | **PASS** |
| 4 | BLEND | **PASS** — LoopStage mounts the real spine: crest → score → River → H/D/A → Trade |
| 5 | MOTION | **PASS** — GSAP via `lib/gsap.ts`, offsets from `design/motion.ts`, explicit reduced-motion branch (useHaltSequence.ts:78-93), transform/opacity only, will-change released on complete |
| 6 | STATES | **PASS** |
| 7 | A11Y | **PASS** (note below) |
| 8 | COPY | **PASS** — `bet\|stake\|odds\|wager\|gamble` → only "between"/`justify-between`. Zero banned vocab |
| 9 | CONSISTENCY | **PASS** — one shell, one rhythm, one card treatment |
| 10 | ELEVATION | **PASS** — beats the before |
| 11 | FEELING | **PASS** |
| 12 | PROVENANCE | **FAIL** |

**Claims 3 and 4 verified in code — both were real bugs, both fixed at the source.** The reprice now derives both ends from the fixture (`homePre = market.spark[0]` 41.0, `homePost = market.mark.H*100` 61.4, `scorePre = scorePost.home - 1`, FeaturedPanel.tsx:48-51). The wash now rides `AT.freeze`, the same beat `halt()` fires, and clears at `AT.resume` on `D.freeze` not `D.decay` — the ~670ms contradiction is gone.

**A11Y note (not a fail — crests are non-interactive):** `title={t.name}` on a non-focusable span is hover-only info; keyboard/touch never get it, and `TeamCrest` alt is `"CAN crest"` (code, not name), so a screen reader hears 48 three-letter codes.

**FEELING — the one thing that creates delight:** the wall of 48 real crests. It's the only element a fan scans for *their* country. The globe never had that hook.

## GAP LIST — by severity

1. **[BLOCKER · 12] `CrestWall` has no PROVENANCE row.** Not one of the six hand-build-cleared pieces, so hand-rolling requires a **logged search incl. misses**.
2. **[HIGH · read-out-loud] The page denies being a terminal, then sells "the terminal" nine times.** `LandingLong.tsx:53` "This isn't a terminal — it's football, priced live." vs **"Open the terminal"** ×9 across navbar/hero/footer, and `FootballExperience.tsx:12` "in one calm terminal." Two elements disagree ⇒ not done.
3. **[HIGH · anti-slop] Two h2s run the identical formula.** `LandingLong.tsx:53` and `FootballExperience.tsx:55` ("This isn't a stats page. It's the match, priced live.") — same construction, same ending, ~2 screens apart.
4. **[MED] The floodlight does not land.** `--up` at **12%** under `blur-2xl` on #0B0D10 is imperceptible. The one warmth device does no work.
5. **[MED · anti-slop] The crest wall is the flattest possible arrangement of the warmest asset.** A uniform 6x8 grid at equal opacity = sticker sheet. The A→L sort claim is unearned — **nothing in the render communicates grouping**. Proposal: 12 group clusters of 4 with a hairline gutter.
6. **[MED · dead classes] `h-[62%] w-[62%]` is inert.** TeamCrest applies `style={{width:size,height:size}}` — **inline style wins**. Crest is fixed 30px, never 62%.
7. **[MED · layout] Dead canyon in the tournament section.** `lg:grid-cols-[1fr_340px]` gives the `dl` ~800px it doesn't need — "104" and "48" sit ~590px apart.
8. **[LOW · dead code] `LandingPage.tsx` still holds both things this pass "removed"** — `<HyperText>` (:66) and `<WorldGlobeLazy/>` (:174). Nothing imports it.
9. **[LOW · staleness] Two PROVENANCE rows describe a page that no longer exists** (`:38` WorldGlobe, `:81` scramble headline).
10. **[LOW · SSOT] The signature number is a hand-pinned literal.** `PriceScrub.tsx` hardcodes `61.4`. **The 60.5-vs-61.4 delta reads as honest** — 61.4 is where the goal landed, 60.5 is drift after, and hero/LoopStage share one store so they can't disagree. But the day `market.mark.H` changes, the page's biggest number silently lies.

---

## Round-2 disposition (parent agent, same session, re-verified on a fresh local prod build)

| Gap | Action |
|---|---|
| 1 BLOCKER | **FIXED.** CrestWall row added to the long-landing table with a REAL logged search: magicui MISS (ships only background grid *patterns* + bento); shadcn n/a (no registries in components.json); 21st **4 HITS** (logo-cloud ×4 + pixel-logo-grid) **rejected with reason** — they model flat "trusted by" social proof, not a 12×4 draw where the grouping is the point. Hits logged honestly rather than claimed empty. |
| 2 HIGH | **FIXED.** h2 → "The game moves. The price moves with it." The page no longer disowns its own flagship surface. All 9 CTAs kept. |
| 3 HIGH | **FIXED** by the same edit — the twin "This isn't an X. It's Y, priced live." formula is gone; FootballExperience keeps its (uncontradicted) line. |
| 4 MED | **FIXED.** Floodlight 12% → **26%**, blur tightened (`-inset-4`, 55%/40% at 50% 8%). |
| 5 MED | **TAKEN** (design-cop's recommendation). Wall rebuilt as the ACTUAL DRAW: 12 groups × 4, hairline-ringed clusters + group letter. 12 groups × exactly 4 = 48 verified against teams.json. A fan can now find their group. |
| 6 MED | **FIXED.** Inert `h-[62%] w-[62%]` dropped; `size={26}` passed as the number TeamCrest actually applies. |
| 7 MED | **FIXED.** `lg:grid-cols-[1fr_340px]` → `lg:grid-cols-[minmax(0,460px)_1fr]`; wall `max-w-460px`. Canyon closed, width given to the grouping. |
| 8 LOW | **REPORTED, NOT ACTIONED.** `LandingPage.tsx` is genuinely unrouted (`app/page.tsx` → `LandingLong`), so neither leftover renders. Deleting it cascades into WorldGlobe*/hyper-text/LandingHero/Ctas — out of this surface's blast radius and the user's call. Flagged to the user. |
| 9 LOW | **FIXED.** Both stale rows (`:38` WorldGlobe, `:81` scramble) marked SUPERSEDED/REMOVED with reasons. |
| 10 LOW | **ACKNOWLEDGED, NOT ACTIONED.** design-cop itself judged the 60.5-vs-61.4 delta honest. Deriving `PriceScrub` from `FEATURED.mark.H*100` is a real SSOT improvement but touches the price surface; carried to the pass ADR as a follow-up. |

### Verified after round-2 (fresh `pnpm --filter web build` + `start`, settled AFTER scroll-through)
- Blank-River guard: **PASS** — 2 lightweight-charts instances, both with sized PANE canvases (438×300, 430×108). The 300×150 canvases are the hidden AXIS canvases, which legitimately sit at the default; the naive "every canvas ≠ 300" check over-triggers on them.
- Zero page errors, zero HTTP ≥ 400. 48/48 crests render, 0 broken.
- Halt read-out-loud in MOTION (sampled every 60ms): `Live/wash hidden 0–0 41.0` → `Halted/wash up` → `Halted/wash 1.00 1–0 61.4` → `Live/wash hidden 61.4`. Label now always leads the wash.

### Round-2 verdict: **PASS**
Both blocking edits landed, plus all four MED gaps. Remaining: gap 8 (dead file, user's call) and gap 10 (SSOT follow-up in the ADR).
