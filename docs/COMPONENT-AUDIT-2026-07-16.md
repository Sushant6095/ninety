# COMPONENT-PROVENANCE AUDIT — 2026-07-16 (read-only, evidence-based)

Did we actually use every component the user handed over? Each verdict below is triple-checked:
**(a)** a `PROVENANCE.md` row, **(b)** actual imports (`grep apps/web/src`, vendor files excluded), and
**(c)** the dep/file present. Verdict = **SHIPPED** (file that renders it named) · **DEAD** (file/dep
exists, 0 imports) · **NEVER-INSTALLED** · **CANNOT-VERIFY**. Zero code changed for this audit.

Vendored source lives in `apps/web/src/components/vendor/{magicui,godui,skiper}/`; SVAR is an npm dep.
Non-token hex across all vendor files = **0** (`grep -niE '#[0-9a-f]{3,8}' vendor/` minus `var(--…)`/currentColor)
→ **everything installed is re-skinned to tokens.** Live spot-check (deploy, full-scroll, pageerror
listener): landing 14 canvases / 7 svg, /how-it-works 0 canvas / 53 svg, /board 4 canvas / 20 svg,
/play renders — **zero page errors** on any surface.

---

## MagicUI (15 handed over)

| # | Component | Verdict | Renders in / evidence | Re-skin | License |
|---|---|---|---|---|---|
| marquee | **SHIPPED** | `home/Ticker.tsx`, `landing/VelocityBand.tsx` | ✓ tokens | MIT |
| terminal | **SHIPPED** | `terminal/BoothTimeline.tsx` (not the trading Terminal — disambiguated) | ✓ | MIT |
| bento-grid | **SHIPPED** | `home/{TradersWeek,PowerRankings,GroupStandings,NewsStrip,BentoBoard,TopMovers}` | ✓ | MIT |
| dock | **SHIPPED** | `terminal/TerminalDock.tsx` | ✓ | MIT |
| avatar-circles | **SHIPPED** | `home/TradersWeek`, `terminal/TradersStrip` | ✓ | MIT |
| magic-card | **SHIPPED** | `home/{LeftRail,TopMovers,RightRail}` | ✓ | MIT |
| confetti | **SHIPPED** | `games/Verdict.tsx` (dep `canvas-confetti`) | ✓ | ISC |
| number-ticker | **SHIPPED** | `components/ui/NumberTicker.tsx` (2 importers) | ✓ | MIT |
| hyper-text | **SHIPPED** | `landing/LandingPage.tsx` | ✓ | MIT |
| scroll-based-velocity | **SHIPPED** | `landing/LandingPage.tsx` (exports `ScrollVelocityContainer/Row` — my first grep used the wrong name) | ✓ | MIT |
| highlighter | **SHIPPED** | `landing/Ctas.tsx` + proof h2 (dep `rough-notation`) | ✓ | MIT |
| dotted-map | **SHIPPED** | `how/sections/Coverage.tsx` (dep `svg-dotted-map`) | ✓ | MIT |
| backlight | **SHIPPED** | `landing/LandingHero.tsx` | ✓ | MIT |
| **video-text** | **DEAD** | `vendor/magicui/video-text.tsx` exists, **0 importers** | n/a | MIT |
| **animated-theme-toggler** | **NEVER-INSTALLED** | no file, 0 imports (a `theme-toggl` line exists in PROVENANCE for a pull that never landed) | — | — |

MagicUI: **13 shipped · 1 dead · 1 never-installed.**

## Skiper (3)

| # | Component | Verdict | Renders in | Re-skin | License |
|---|---|---|---|---|---|
| skiper19 | **SHIPPED** | `landing/PricePath.tsx` | ✓ | ⚠ **UNDECLARED** |
| skiper39 | **SHIPPED** | `landing/CrowdBand.tsx` (crowd terrace) | ✓ | ⚠ **UNDECLARED** |
| skiper52 | **SHIPPED** | landing pillars (hover-expand) | ✓ | ⚠ **UNDECLARED** + **law tension** (animates `flex-grow`/layout — flagged in PROVENANCE) |

⚠ **skiper-ui.com declares NO license** on site or a findable repo (PROVENANCE line 57 flags it). Three
shipped components depend on undeclared-license source on a public repo. **This is the one licensing
liability** — it was flagged before and is still unresolved.

## SVAR (2)

| # | Component | Verdict | Renders in | License |
|---|---|---|---|---|
| @svar-ui/react-core | **SHIPPED** | `games/RoundFilter.tsx` | MIT |
| @svar-ui/react-filter | **SHIPPED** | `games/RoundFilter.tsx` | MIT |

Both are real npm deps (`package.json`) and imported. SVAR: **2 shipped.**

## godui.design (10)

| # | Component | Verdict | Renders in | Re-skin | License |
|---|---|---|---|---|---|
| sticky-scroll | **SHIPPED** | `how/sections/TheLoop.tsx` | ✓ | MIT |
| holographic-card | **SHIPPED** | `landing/MomentCard.tsx` | ✓ | MIT |
| agent-flow | **SHIPPED** | `how/sections/ProofFlow.tsx` (dep `@xyflow/react`) | ✓ | MIT |
| agent-timeline | **SHIPPED** | `how/sections/ProofFlow.tsx` | ✓ | MIT |
| notification-inbox | **SHIPPED** | `home/components/NotificationBell.tsx` → mounted in `TerminalHeader` | ✓ | MIT |
| animated-beam | **SHIPPED** | `how/sections/PipelineBeams.tsx` | ✓ | MIT |
| particle-dissolve | **SHIPPED** | `landing/PlayMoneyDissolve.tsx` | ✓ | MIT |
| flow-field | **SHIPPED** | `landing/FlowFieldLazy.tsx` | ✓ | MIT |
| **spin-viewer** | **NEVER-INSTALLED** | no `godui/spin-viewer` file, 0 imports (PROVENANCE has a stray `spin-viewer` mention) | — | — |
| **globe** | **NEVER-INSTALLED (as godui)** | no `godui/globe.tsx`. A **custom `landing/WorldGlobe.tsx`** (three.js) ships the globe instead — so a globe *feature* renders on the landing, but the godui pull was not used | ✓ (custom) | n/a |

godui: **8 shipped · 2 never-installed (1 replaced by custom).**

## Everything else

| Source | Component | Verdict | Evidence |
|---|---|---|---|
| Logo | **River-9 mark** | **SHIPPED** | `components/ui/Logomark.tsx` (3 importers) + `Wordmark.tsx` (4); ADR-064 |
| 21st.dev | the `~/Downloads/21st` folder | **CANNOT-VERIFY** | folder is **absent** now. But documented 21st pulls DID ship earlier: **CrowdCall** (Review Filter Bars → H2H tab) and **ScrollArea**. So 21st contributed; the specific folder can't be audited. |
| Watermelon | web3-dashboard (`/account`) | **NEVER-INSTALLED** | no `/account` route exists |
| dotmatrix | dotm-square-3 (loading) | **NEVER-INSTALLED** | `app/loading.tsx` uses `PageSkeleton`, not dotm; not a dep |
| componentry | dithered-logo | **NEVER-INSTALLED** | no file, 0 imports, not a dep |
| balloons-js | balloons-js | **NEVER-INSTALLED** | 0 imports, not a dep (confetti already covers the /play celebration) |
| styleui | notio.json (home base) | **NEVER-INSTALLED** | home (`/`) = `LandingPage`; notio never used as the base |

---

## The honest totals

**37 discrete items handed over** → **27 SHIPPED · 1 DEAD · 8 NEVER-INSTALLED · 1 CANNOT-VERIFY.**

- **Shipped (27):** MagicUI 13, Skiper 3, SVAR 2, godui 8, River-9 logo 1.
- **Dead (1):** MagicUI `video-text` (file present, 0 imports).
- **Never-installed (8):** MagicUI `animated-theme-toggler`; godui `spin-viewer` + `globe`; Watermelon `web3-dashboard`; dotmatrix `dotm-square-3`; componentry `dithered-logo`; `balloons-js`; styleui `notio`.
- **Cannot-verify (1):** the `~/Downloads/21st` folder (deleted) — though 21st pulls that shipped (CrowdCall, ScrollArea) are in the tree.

### Ignored — never touched (named plainly)
`animated-theme-toggler` · `spin-viewer` · godui `globe` (a custom WorldGlobe shipped instead) ·
Watermelon `web3-dashboard` / `/account` · dotmatrix `dotm-square-3` · componentry `dithered-logo` ·
`balloons-js` · styleui `notio`. Most are defensibly redundant or law-conflicting (see below); none
were "planned-and-pending" with evidence — they were simply not done.

### Shipped-but-no-PROVENANCE-row (the NumberTicker problem)
**None.** Every shipped component has a row — `WorldGlobe` (2), `StickerPeel` (1), `scroll-based-velocity`
(1), `TerminalDock` (1), and all godui/skiper entries (≥1 each). The gate held this time.

**Reverse issue (minor):** PROVENANCE carries lines for `animated-theme-toggler`, `spin-viewer`, and
`video-text` — components that never shipped or are dead. Those rows describe pulls that didn't land;
worth pruning so the ledger only lists what renders.

### Dead weight to remove
- `apps/web/src/components/vendor/magicui/video-text.tsx` — 0 imports; the only vendored file with zero use. Delete.
- **No dead npm deps found.** Every dependency traces to a used component (`@xyflow/react`→agent-flow, `camera-controls`→WorldGlobe, `svg-dotted-map`→dotted-map, `canvas-confetti`→confetti, `rough-notation`→highlighter, `@svar-ui/*`→RoundFilter, three/shadergradient/gsap/framer/lightweight-charts all live).

---

## Bottom line

### Still worth wiring
Honestly, **little.** Most never-installed items are redundant against what already ships:
`animated-theme-toggler` is moot (dark-only v1 per CLAUDE.md), `globe`/`dithered-logo`/`balloons-js`/`notio`
duplicate the custom WorldGlobe / River-9 logo / confetti / landing. The only two with a real product
rationale: **Watermelon `web3-dashboard`** *if* an `/account` surface is wanted (but `/portfolio`
overlaps), and nothing else. Recommendation: leave them un-pulled.

### Delete
- `video-text.tsx` (dead vendored file).
- Prune the PROVENANCE lines for `video-text` / `animated-theme-toggler` / `spin-viewer` (rows without a live component).

### The one liability to resolve
The **three shipped Skiper components (19/39/52) run on undeclared-license source** on a public repo.
Either get written license clarity from skiper-ui.com, or replace those three (price-path, crowd terrace,
pillars) with MIT-licensed equivalents before the repo is promoted.
