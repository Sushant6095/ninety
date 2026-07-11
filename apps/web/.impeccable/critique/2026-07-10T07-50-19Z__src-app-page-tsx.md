---
target: Home (src/app/page.tsx)
total_score: 26
p0_count: 1
p1_count: 2
timestamp: 2026-07-10T07-50-19Z
slug: src-app-page-tsx
---
# Critique — Home (`apps/web/src/app/page.tsx`)

Method: dual-agent (A: a463c52192aec3bab · B: ab9497be5ecbc4bb8). Live browser overlay unavailable (Playwright chrome profile locked); rendered markup scanned via curl SSR HTML instead.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Live minutes, glow dots, latency, price flash strong; dead filter/date controls give zero feedback. |
| 2 | Match system / real world | 2 | Football language good; "H 61.4" price scale never glossed for a first-timer. |
| 3 | User control & freedom | 2 | Live/Today/Finished + R16/Quarters/Semis are false controls. |
| 4 | Consistency & standards | 3 | Excellent visual consistency; two nav systems with duplicate destinations, counts contradict data. |
| 5 | Error prevention | 3 | Little to err on; dead header search input is the liability. |
| 6 | Recognition rather than recall | 3 | Nav is icon+label; H/D/A, price scale, "CR" need prior knowledge. |
| 7 | Flexibility & efficiency | 3 | ⌘K hint, focus rings, whole-row links; filters inert. |
| 8 | Aesthetic & minimalist | 3 | Disciplined system, but 5 top bands + 4-card rails + 3 grid bands crowd the "quiet room." |
| 9 | Error recovery | 3 | Real empty state in MatchList; River degrades gracefully. |
| 10 | Help & documentation | 1 | None — on a surface explicitly meant for first-timers. |
| **Total** | | **26/40** | **Acceptable (upper) — strong system undercut by inert controls + zero first-timer scaffolding** |

## Anti-Patterns Verdict

**LLM:** Token discipline reads as a real, opinionated system — not a template. Two tells: (1) the identical 10px uppercase eyebrow kicker (`text-[10px] font-semibold uppercase tracking-[0.1em] text-lo`) on ~12 sections — the flagged "kicker on every section" slop; (2) three consecutive uniform card grids (TopMovers 4-up → TradersWeek 5-up → NewsStrip 2-up), each the same `elev rounded-card` box. Closest project anti-reference: the cluttered live-scores portal — five stacked bands (Ticker → Header → CompetitionBar → date → filter) precede the first match.

**Deterministic:** detector exit 2. Source: **43 findings, all `design-system-font-size` (advisory)** — off-ramp `text-[Npx]` at 9/10/12/17/18/22/24/34px, concentrated in FeaturedPanel, TopMovers, MatchCard, Header. This corroborates the "uniform micro-label" tell A saw. Grep law-tells **clean**: 0 gradients, 0 glass, 0 gradient-text, 0 side-stripes, 0 raw hex; every number verified mono/tabular. Rendered-HTML adds a lone `em-dash-overuse` WARNING (inflated by data en-dashes like `JPN–CRO` — treat as FP), `numbered-section-markers` (FP: live match-minute digits), and `#000/#fff/rgba` colors (FP: framework CSS, not components). **Detector caught nothing material A missed; A caught the behavioral defects (dead controls, count mismatches) the scan structurally cannot see.**

**Visual overlays:** none available — the browser profile was locked, so there is no user-visible overlay in a tab. Evidence came from the curl'd SSR HTML.

## Overall Impression
A genuinely credible dark exchange — alive, disciplined, on-brand — that undercuts itself two ways: controls that lie (filters/date/bracket that don't filter) and a total absence of first-timer scaffolding on the one surface PRODUCT.md says must stay legible to a mainstream newcomer. Biggest single opportunity: make the board the unmistakable hero and teach the newcomer what a price is, right there.

## What's Working
1. **Enforced design law** — zero raw hex in any component; the `elev`/`elev-hi` depth system, 180ms directional price flash, one-decimal mono tabular prices are lived, not asserted.
2. **The Momentum River is architecturally serious** — a single build-once lightweight-charts instance, bounded rolling buffer, lazy off-SSR, graceful fallback, reduced-motion aware; rows use a cheap inline-SVG Sparkline, so it's correctly the *only* chart-lib instance.
3. **Above-average a11y fundamentals** — descriptive aria-labels, aria-current, real focus-visible ring, reduced-motion early-returns, direction reinforced with sign+arrow (not color alone).

## Priority Issues
- **[P0] Dead filter/date + duplicate bracket controls.** CenterColumn holds date/filter state but MatchList is fed MARKETS directly, so Live/Today/Finished and the date pager only toggle their own styling; R16/Quarters/Semis all route to `/bracket`. Users learn the UI lies before their first trade. *Fix:* wire the state to filter the market array (and differentiate bracket tabs), or remove the controls until they work. **→ /impeccable harden**
- **[P1] No first-timer legibility/reassurance above the fold.** No explanation of the 0–100 price scale, H/D/A, "CR", or the play-money nature; the "credits are play money" line lives only in the footer. *Fix:* dismissible inline legend on the board + lift the play-money promise above the fold. **→ /impeccable onboard**
- **[P1] The signature River vanishes on mobile/tablet.** FeaturedPanel/MomentumRiver are `hidden xl:block`; row Sparkline is `hidden sm:block`. Below 1280px the whole "one bold element" thesis and emotional peak disappear — on the exact second-screen device fans use. *Fix:* promote a compact River strip into the mobile/tablet column. **→ /impeccable adapt**
- **[P2] Chrome overload + duplicate navigation.** Five stacked bands above the first match; `/bracket` reachable from 4 links, `/moments` from 3, `/leaderboard` from 2; the wayfinding decision runs past 4 options. *Fix:* fold date into the filter row, dedupe destinations, pick one spine. **→ /impeccable distill**
- **[P2] Flat hierarchy — the board doesn't win.** The uniform kicker + three uniform card grids flatten the primary board to the same volume as tertiary content; the detector's 43 off-ramp font sizes are the quantified symptom. *Fix:* vary section-header treatment so the board dominates; break the card-grid monotony; regularize the type ramp. **→ /impeccable layout (+ typeset)**

## Persona Red Flags
- **Jordan (first-timer):** PriceChip "H 61.4 / D 22.1 / A 16.5" has no key; filters don't respond; "RANK #142 ▲3" + P&L "+18,240" read as real-money trading; the only "am I safe?" answer is the footer.
- **Casey (mobile):** No River, no sparkline; four separate horizontal-scroll strips demand one-thumb panning; header nav/search/rank hidden below md/lg; MatchCard packs star+minute+2 flags+2 names+score+3×44px chips into one row (inferred cramped at 320–360px).
- **Riley (stress):** dead header search (no onChange, ⌘K no-op); count mismatches ("Live 3" vs 4 live markets; "Finished 8" vs 2 SETTLED; "WC26 12" hardcoded). Win: empty-board state handled.
- **Fan wanting skin-in-the-game, no gambling:** trading-serious framing correctly avoids the sportsbook look, but the reassuring "play-money, being right is the reward, no cashout" positioning appears nowhere but the footer; the CTA carries no safety microcopy.

## Minor Observations
- CenterColumn live-dot ternary is a no-op (`bg-up : bg-up`, dead code).
- MatchList hardcodes "R16" for every non-Favourites group, including "Finished today."
- Settled rows render "100.0 / 0.0 / 0.0" chips as if tradeable, with no SETTLED affordance.
- LivePrice timing comment (220ms) is stale vs the real 180ms flash.
- Multiple glowing green dots across Ticker/CreditPill/LeftRail/TopMovers/FeaturedPanel mildly dilute the "One River" attention concentration.
- No `<h1>` (Wordmark is a span); landmarks present, so a semantic/SEO nit.

## Questions to Consider
1. Should Home have a distinct first-visit mode that explains price/credits/play-money and collapses once the user is known — or is the board itself meant to be the teacher?
2. The whole thesis is "one bold element, the River." Why does it not exist on the phone — the exact device a fan second-screens on?
3. If the date/filter/bracket controls don't filter, do they read as a roadmap promise, or do they teach that controls here are decorative — poisoning trust in the ones that will work?
