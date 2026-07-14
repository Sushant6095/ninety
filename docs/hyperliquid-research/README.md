# Hyperliquid Ecosystem — UX / Frontend Reverse-Engineering

A product-reverse-engineering session across the Hyperliquid ecosystem, to understand **why these
products feel premium** and extract reusable engineering + design patterns for **Ninety** (our live
football trading exchange). Analyzed live July 2026 via an instrumented Chrome session.

**Not a scraper.** No source, HTML/CSS, or proprietary asset was copied. All tokens/measurements
were read from *rendered* computed styles; layouts from screenshots; structures from the live DOM.
Blueprints are **original semantic representations**, not scraped DOM.

## Priority
The user's stated model for **Ninety's first page** is `hyperfoundation.org` — it gets the deepest
treatment (full 8-file folder + annotated HTML blueprint + Figma spec). `trade` (our category) also
gets the full 8-file treatment. The other four get one comprehensive `overview.md` (all eight facets
in labeled sections) + a blueprint each.

## Contents
| Target | Folder | Blueprint | Depth |
|---|---|---|---|
| hyperfoundation.org (landing) | [`hyperfoundation/`](hyperfoundation/) | [`html/home.html`](html/home.html) | **Full** (8 files) |
| app.hyperliquid.xyz/trade (+testnet) | [`trade/`](trade/) | [`html/trade.html`](html/trade.html) | **Full** (8 files) |
| app.hyperliquid.xyz/leaderboard | [`leaderboard/`](leaderboard/overview.md) | [`html/leaderboard.html`](html/leaderboard.html) | Consolidated |
| hyperscreener.asxn.xyz/validators | [`validators/`](validators/overview.md) | [`html/validators.html`](html/validators.html) | Consolidated |
| GitBook docs | [`docs/`](docs/overview.md) | [`html/docs.html`](html/docs.html) | Consolidated |
| /announcements (testnet) | [`announcements/`](announcements/overview.md) | [`html/announcements.html`](html/announcements.html) | Consolidated |

Each full folder: `overview · navigation · components · motion · layout · responsive · interaction ·
performance · screenshots/`. Each `html/*.html`: annotated semantic blueprint + component tree +
implementation notes + Figma-level spec.

> **Screenshot note:** captures were made live via the Chrome extension for analysis, but this
> environment exposed no writable path to persist the image binaries (the Playwright fallback's
> profile was locked). Each `screenshots/README.md` catalogs the captured frames with precise visual
> descriptions + exact sampled colors/type, so the visuals are reconstructable alongside the
> blueprints. Re-run with a writable screenshot path to populate PNGs.

## The cross-cutting thesis — why the ecosystem feels premium
1. **One monochrome brand ramp, one spent accent.** Everything is a teal→green ramp (`#97FCE4` mint
   → `#02231E` green); the mint is spent only on the primary action + brand marks. Color elsewhere
   is *semantic* (up `#1FA67D` / down `#ED7088`), never decorative.
2. **Two font weights, tabular numerals everywhere.** The trade app had **436 tabular-num nodes**;
   hierarchy comes from size + weight-500 + color, not many weights. A custom face ("OurFont",
   "Teodor") is a quiet brand signature.
3. **Editorial restraint on the landing, CEX density in the app** — same brand, opposite densities,
   each right for its job.
4. **Motion = information (in the app) / one signature moment (on the landing).** The terminal only
   flashes values and never reflows; the landing spends its whole motion budget on a pinned,
   scroll-scrubbed morphing hero. Both within a 50–500ms scale, ease-out, no bounce.
5. **Named token contracts** (spacing, radii, z-index, durations) via Chakra on the marketing site;
   disciplined custom theming in the app. No magic numbers.
6. **Read-before-connect.** The app is fully readable pre-wallet; Connect (Privy + WalletConnect) is
   the only gated action.
7. **Depth-in-tabs / one persistent shell.** You stay in an entity/terminal and re-scope it via
   tabs, rather than navigating a deep tree.

## How this feeds Ninety
These patterns reinforce our existing laws in [`../NINETY-DESIGN-LAWS.md`](../NINETY-DESIGN-LAWS.md)
(from the SofaScore study) and add the **landing-page playbook** (serif thesis headline · monochrome
ramp · interactive architecture diagram · live-stats proof band · pinned signature hero) and the
**terminal playbook** (4-zone market page · virtualized book/tape · flash-don't-reflow · Privy-style
connect · Momentum River as our one loud surface). Our reference blend — Polymarket spine /
**Hyperliquid feel** / SofaScore depth-in-tabs — is now grounded in real observation.
