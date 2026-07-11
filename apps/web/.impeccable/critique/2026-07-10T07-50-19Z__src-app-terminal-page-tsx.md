---
target: Terminal (src/app/terminal/page.tsx)
total_score: 25
p0_count: 1
p1_count: 1
timestamp: 2026-07-10T07-50-19Z
slug: src-app-terminal-page-tsx
---
# Critique — Terminal (`apps/web/src/app/terminal/page.tsx`)

Method: dual-agent (A: ae4edb010fc86e424 · B: aede8b51674bdba86). Live browser overlay unavailable (Playwright chrome profile locked); rendered markup scanned via curl SSR HTML instead.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Rich live status, but SLOT/FEED/"traders in" are static theater that misrepresents liveness. |
| 2 | Match system / real world | 3 | Voice compliant; LMSR·B=1200·spreadMult jargon unexplained (defensible for the pro persona). |
| 3 | User control & freedom | 3 | Trade is a reversible preview; no explicit cancel for a locked quote; size is slider-only. |
| 4 | Consistency & standards | 3 | Tokens consistent; no `<h1>`; River seeds from static spark but ticks from a separate array. |
| 5 | Error prevention | 2 | TradePanel lets you Sell an outcome you don't hold, no guard; no confirm on the climax action. |
| 6 | Recognition rather than recall | 3 | Armed outcome echoed in Buy button + held-shares badge; selection ring itself subtle. |
| 7 | Flexibility & efficiency | 2 | ⌘K shown but no handler; no buy/sell hotkeys; size can't be typed. |
| 8 | Aesthetic & minimalist | 2 | Core One-River-thesis violation — three competing charts + portal furniture. |
| 9 | Error recovery | 2 | No error/empty/halt/failed-quote states; `"HALTED"` is a defined-but-unrendered status. |
| 10 | Help & documentation | 2 | No tooltips on dense metrics; the honest "no credits moved (ADR-026)" disclosure is the bright spot. |
| **Total** | | **25/40** | **Acceptable — sound trade core, compromised by portal clutter, missing edge states, thin power-user affordances** |

## Anti-Patterns Verdict

**LLM:** The trade module earns familiarity (mono tabular numbers, real LMSR quote math, Buy button echoing the armed outcome). But the surface violates the project's single load-bearing law — **The One River Rule** — at the structural level: around the sanctioned BigRiver it stacks **three more charts** that spend green/pink boldness (AttackMomentum bars, FeaturedPlayers radar, PortfolioCard sparkline) plus a Sofascore apparatus (CompetitionsRail, HighestRated, LatestEvents, TournamentLeaderboard, TodaysMovers) — ~15 panels on one `elev` tone. It reads as the banned "cluttered live-scores portal." **Semantic-color law is broken repeatedly:** green=Egypt/pink=Australia (identity, AttackMomentum), home/away in the radar, hot-rating green (HighestRated), green scorer line (MatchHeader), green "OPEN"/active-tab badges. And the **frozen chain status** (static SLOT 297,441,208, FEED 42 ms, DEVNET) reads as a broken feed to a crypto-native on sight.

**Deterministic:** detector exit 2. Source: **75 findings, all `design-system-font-size` (advisory)** — off-ramp sizes 8/9/10/12/15/17/26/40px across the panels (8/9px micro-type is the legibility risk). Grep law-tells **clean** (0 gradients/glass/gradient-text/side-stripes/raw-hex; all numbers mono). Rendered adds em-dash warning (FP: section labels + data copy), numbered-markers (FP: kickoff times `02:30`…), colors (FP: framework CSS). **Key gap: the semantic-color misuse A found is invisible to the detector** — it uses legal tokens (`text-up`, `bg-up`), just for the wrong *meaning*; only human review catches a meaning-level law break. Runtime: one latent unguarded path (BigRiver `latest` → LiveMarkets `.toFixed`) that is **inert under current fixtures**; the likely source of prior console noise is Recharts `ResponsiveContainer`s mounting at 0×0 inside `hidden xl:*` rails. The prior "lightweight-charts API" suspicion is **refuted** (v4.2.3 installed, `addAreaSeries` present).

**Visual overlays:** none available (browser profile locked); evidence via curl'd SSR HTML.

## Overall Impression
A real trading core wrapped in a match-day portal it was told not to become. The quote loop, number discipline, and honest play-money disclosure are genuinely good. But the design's one non-negotiable — spend boldness only on the River — is broken by three sibling charts and semantic-color drift, and the surface has no error/empty/halt states. Biggest opportunity: subtract the competing charts (tab the match context) and reclaim green/pink for price direction only.

## What's Working
1. **The quote engine is real, not faked** — `lib/lmsr.ts` faithfully ports the engine LMSR; TradePanel shows live Cost / Avg px / Max payout; the Buy button echoes the exact armed outcome and price.
2. **Number + direction discipline in the trade path** — every number mono/tabular/one-decimal; direction reinforced with ▲/▼ and +/− in PriceCells, OpenPositions, YourPosition (reads for color-blind users where it counts).
3. **Honest disclosure at the money moment** — the trade explicitly states no credits moved and fills aren't live yet; it refuses to fake a fill, reinforcing the play-money invariant.

## Priority Issues
- **[P0] The One River is drowned by three competing charts + portal furniture.** AttackMomentum, FeaturedPlayers, PortfolioCard each spend green/pink boldness beside the River; the Sofascore rails push it into the banned live-scores-portal quadrant. *Fix:* move match context (radar, ratings, attack, events) behind a "Match" tab; keep the trade surface to River + cells + panel + position; make the River the only bold data-viz. **→ /impeccable quieter (+ distill)**
- **[P1] Semantic-color law violated as identity/decoration.** green=team, hot-rating green, green scorer, green OPEN/active-tab. Retrains the user that green ≠ "up/buy," destroying the instant-read the system depends on. *Fix:* recolor identity/status to ink tones; reserve green/pink strictly for price direction. **→ /impeccable colorize (+ audit)**
- **[P2] Below 1280px both rails vanish; charts warn at 0×0.** `hidden xl:flex` drops portfolio, positions, leaderboard, competitions with no reflow; Recharts containers mount at 0×0 (inferred console noise). *Fix:* reflow rails into tabs/drawers; don't mount charts while hidden. **→ /impeccable adapt (+ layout)**
- **[P3] No error / edge / empty / halt states; unguarded assumptions.** Sell-without-position allowed; no null-guard on `amm.q` (the comment anticipates the ADR-046 pre-emit null-q, the guard is absent — inert on today's fixtures); `"HALTED"` never renders the amber halt a goal should trigger. *Fix:* guard sell-without-position, null-guard the AMM snapshot, add halt/loading/empty/failed-quote states. **→ /impeccable harden**
- **[P4] Anticlimactic confirmation, slider-only sizing, sub-legible micro-type.** Climax resolves to muted gray text; size is a range input only (no numeric entry/presets); 8–9px labels scattered (the detector's 75 font-size hits). *Fix:* a quiet-but-definite confirmation, numeric entry + preset chips (25/50/100/max), lift micro-labels to an 11px floor. **→ /impeccable clarify (+ polish / typeset)**

## Persona Red Flags
- **Alex (power user):** ⌘K `<kbd>` with no key handler (dead shortcut); size is `<input type=range>` only (can't type 250); no buy/sell hotkeys; no bulk/one-click size, no order history.
- **Sam (a11y):** MomentumRiver is `aria-hidden` with zero text alternative for the live away-win %; no `<h1>`; charts have no accessible table equivalent; `text-lo/50` axis labels at 9px ≈ 3.5:1 (below AA); OPEN/active-tab lean on color for state.
- **Riley (stress):** no empty states; no halt path though a goal occurred at 13'; unguarded sell-more-than-held → negative position; null-`amm.q` would throw if wired (masked by fixtures).
- **Crypto-native trader:** frozen SLOT next to "DEVNET" reads as a broken feed; no order book/depth (`spreadMult:1` reads "not a real market"); trade is preview-only; no position management.

## Minor Observations
- CompetitionsRail shows a live dot but static fixture prices — the left rail *looks* live and isn't (only the center column ticks).
- BigRiver floats H/D/A tags over a single-series chart that only plots away-win % (D and H tags map to no plotted line).
- Subnav duplication: WC26/Live/Today → home; Trending/Moments → moments; counts decorative.
- YourPosition value math reduces to `shares * markPct` (harmless no-op).
- Home Ticker + Footer (marketing chrome) reused above/below a pro trading surface.

## Questions to Consider
1. Is this a trading surface with football context, or a Sofascore match page with a trade widget bolted on — and which one is OMNIPITCH?
2. A Solana-native's trust dies at a frozen SLOT next to "DEVNET." Does fake liveness cost more trust than it buys — and should the climax button read "Preview" until the gateway ships?
3. Where is the order book? Does a "pro terminal" need depth/impact to earn the word "pro," or is the River meant to be the book?
