---
target: North Star (src/app/north-star/page.tsx)
total_score: 26
p0_count: 1
p1_count: 1
timestamp: 2026-07-10T07-50-19Z
slug: src-app-north-star-page-tsx
---
# Critique — North Star (`apps/web/src/app/north-star/page.tsx`)

Method: dual-agent (A: a6a9a20036160bde4 · B: a13d1762288f3e8d0). Live browser overlay unavailable (Playwright chrome profile locked); rendered markup scanned via curl SSR HTML instead.

**Headline finding:** what ships at `/north-star` is a 4-section product-vision **landing page** (hero + static River preview, 3 pillars, 3 surface cards, stat bar). Its own reference `design/screens/northstar.png` is a dense **match-detail / terminal board** (pitch lineup, featured-players radar, highest-rated list, Booth timeline, match leaderboard, trade panel). The brief's "player stats + AI booth timeline" describes the PNG, not the code. Root CLAUDE.md: "Every page must visually match its reference." This one shares tokens with the reference and almost nothing else.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Ticker + pulse read "live," but the hero River is static (const SPARK, no liveValue) — the centerpiece doesn't move. |
| 2 | Match system / real world | 3 | Good domain voice undercut by "odds" and by LMSR jargon aimed at a first-timer. |
| 3 | User control & freedom | 3 | Exits fine; ScreenSwitcher is `hidden sm:inline-flex`, so mobile loses surface nav. |
| 4 | Consistency & standards | 3 | Token consistency excellent; three CTAs ("Enter the exchange"/"Browse matches"/"The App") all → home. |
| 5 | Error prevention | 3 | Largely N/A (no inputs). |
| 6 | Recognition rather than recall | 3 | Visible/labeled, but assumes recall of LMSR/TxLINE/permissionless. |
| 7 | Flexibility & efficiency | 3 | "Open the terminal" is the first CTA, but a marketing page sits between the user and live data. |
| 8 | Aesthetic & minimalist | 2 | The same 3 claims (markets/booth/settle) restated 4× — hero, pillars, surfaces, stat bar. |
| 9 | Error recovery | 2 | No error affordances; neutral for a static page. |
| 10 | Help & documentation | 2 | `routes.howItWorks` exists but is not linked from a surface meant to stay first-timer-legible. |
| **Total** | | **26/40** | **Acceptable — high craft floor, low composition ceiling; templated and repetitive** |

## Anti-Patterns Verdict

**LLM:** The design *system* is anti-slop; the *page composition* is close to textbook template. Two stacked uniform 3-up card grids — PILLARS (icon-in-rounded-box → h2 → body) then SURFACES (heading → text → cta) — are the exact "generic SaaS dashboard of identical icon-heading-text card grids" DESIGN.md and PRODUCT.md ban, and the three value props are already stated in the hero paragraph (pure restatement, ×4 counting the stat bar). Hero is the standard headline+CTA-left / screenshot-right shape; the stat trust-strip closes ten thousand landing pages. **Vocabulary law broken:** the lead pillar title is literally "Markets, not odds" and its body says "consensus **odds** become live LMSR markets" — the hook-banned word "odds" surfaced as a section heading.

**Deterministic:** detector exit 2. Source: **6 findings, all `design-system-font-size` (advisory)** — 15/10/9/16/10/12px. Grep law-tells **clean** (0 gradients/glass/gradient-text/side-stripes/raw-hex; all numbers mono, price "61.4 ▲2.4" one-decimal). Rendered adds an `em-dash-overuse` WARNING — and unlike the other surfaces this one is **partly real**: 7 em-dashes trace to actual body copy in NorthStarScreen. Colors `#000/#fff/rgba` are framework-CSS FPs. Runtime risk: **none** (the only `.map()` calls iterate module-level literal arrays). **Note: the detector did not catch the two biggest findings** — the banned word "odds" (a vocab/copy law) and the reference divergence — both are human-only catches.

**Visual overlays:** none available (browser profile locked); evidence via curl'd SSR HTML.

## Overall Impression
The craft floor is high (tokens, mono numbers, the River component), but the page is built in the one skeleton PRODUCT.md forbids: hero → tri-card → tri-card → stat strip, restating three claims four times, with the load-bearing "play-money, can't-lose-real-cash" reassurance demoted to 11px footer legalese. And it doesn't match its own reference. Biggest opportunity: decide what `/north-star` *is* (vision surface vs. the match-detail board the PNG shows) before any cosmetic pass.

## What's Working
1. **Number & token discipline is impeccable** — zero raw hex; every number mono/tabular/one-decimal; the River resolves hex via `resolveColor("up")` for the canvas.
2. **The MomentumRiver component is well-engineered** — build-once + live-append via refs, lazy off-SSR with graceful catch, bounded buffer, deliberate empty tail; correctly the only bold element.
3. **A11y baseline is real** — reduced-motion respected in Ticker + LiveMarkets, aria-hidden on decorative chart/icons, aria-current on the active tab, 40/44px targets, direction shown with ▲ + sign (not color alone).

## Priority Issues
- **[P0] Reference divergence — `/north-star` ships nothing like `northstar.png`.** The reference is a dense match-detail/terminal board; the build is a vision landing page. Reconcile the reference-of-record before any polish — if North Star is a vision surface, give it a vision reference and move the match-page board to the Terminal's reference; if it's the match page, this screen needs a rebuild. **→ /impeccable audit (then shape if it becomes the match-detail)**
- **[P1] "odds" in headline copy violates the vocabulary law.** Pillar title "Markets, not odds" + body "consensus odds become live LMSR markets" surface a hook-banned word as a heading, on the surface a compliance-sensitive newcomer scans first. Also fix the garbled "Play money, ever." *Fix:* "Markets, not a book" / "A price, not a margin"; body "Consensus prices become live LMSR markets." **→ /impeccable clarify**
- **[P2] Two stacked uniform 3-up card grids = the banned SaaS template + restatement.** Pillars then Surfaces are interchangeable-weight grids, and the three props are already in the hero. *Fix:* fold the props into the hero; make the remaining grid editorial/asymmetric (bento, differing weights) so it reads intentional. **→ /impeccable layout (or distill)**
- **[P3] First-timer legibility & reassurance gap.** Jargon-dense (LMSR, TxLINE, permissionless, one-shot, devnet) with no how-it-works link; the play-money invariant buried in 11px footer text. *Fix:* plain-language "Free to play — credits never cash out, no deposits, no payouts" near the hero; link howItWorks; gloss or drop the jargon. **→ /impeccable onboard (or clarify)**
- **[P3] Static hero River + duplicate entry CTAs.** The signature live element is frozen (const SPARK, no liveValue) on the page built to sell it; three differently-labeled CTAs all point at home. *Fix:* drive the hero River with the live sim feed (as the Ticker already does); dedupe to one "Browse matches" + one "Open the terminal." **→ /impeccable animate (+ distill)**

## Persona Red Flags
- **Jordan (first-timer):** hits LMSR / TxLINE / permissionless / devnet with no explainer; reassurance is 11px footer legalese; "odds" in the first pillar title reads as the sportsbook the product swears it isn't; three "start" buttons secretly go to the same place.
- **Alex (power user):** forced through a marketing page with no live, actionable data (hero River is a static SPARK; no prices to trade) — pure friction before the terminal.
- **Sam (a11y):** well-served on ARIA/reduced-motion/direction, but (inferred) the time-axis `text-lo/60` at ~3:1 breaks AA, and the hero/header CTAs declare only hover — no explicit focus-visible ring (global focus rule unverified this run).
- **Dana (compliance-anxious fan):** first heading she reads is "Markets, not odds"; crypto-hype words ("permissionless," "trustlessly," "Solana settles") are elevated into pillars while the one legally load-bearing invariant is demoted to fine print.

## Minor Observations
- "Play money, ever." (L15) is a garbled fragment.
- Hero River `goalIndex={5}` marks a goal in the line color, not halt-amber (design law: goal = halt = amber).
- "Solana devnet" on a sell surface reads "beta/unfinished" to a newcomer.
- Redundant "The Terminal" (hero CTA + a surface card with overlapping copy).
- Both grids use `gap-3` cards, making pillar and surface cards visually interchangeable.

## Questions to Consider
1. Is "North Star" a product *surface*, or a pitch-deck slide wearing the app's tokens? If a user can't do anything here they can't do one click away, does it earn a route?
2. The reference `northstar.png` is a dense match page; the build is a landing page. Which one *is* the North Star — and if it's the landing page, why is the match page the file named `northstar.png`?
3. Your one bold element is the River — and on this page it's frozen. If the signature *live* element doesn't move on the surface built to sell the product, what is the North Star pointing at?
