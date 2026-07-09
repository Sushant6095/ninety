# ADR 043 Home reference locked — design/screens/home.png = the Ninety Home (from the App mockup); subtract-then-elevate build order (Phase 4 frontend, STEP 0)

Status: accepted 2026-07-09. Context: STEP 0 of the frontend Home slice — lock the design-cop target before building any component. BRAND: the product is **Ninety** (renamed from the old "OMNIPITCH"; see ADR-044). The wordmark and all copy are Ninety.

Decision:
- **Reference = the App-mockup Home, rebranded to Ninety**, from the Lock Kit design export, rendered to
  `design/screens/home.png` (1440×960) with the wordmark/footer swapped OMNIPITCH→Ninety. It sits on our exact tokens (dark `--bg`, green
  `--up`, pink `--down`, amber `--halt`, **violet `--chain`**, Archivo/Inter/IBM Plex Mono), with the play-money
  footer and zero Sofascore branding. Sofascore informed only the STRUCTURE (grouped competitions, sparse rows,
  depth-in-tabs) — never the look or colour.
- **Hero (subtract-then-elevate):** the CENTER match list is the one hero (favourites + competition groups, each row
  = star · minute · flags · teams · score · mini-river · HOME/DRAW/AWAY price cells in mono). The left rail (my
  matches / WC stages / followed teams / SETTLEMENT–SOLANA) and right rail (Featured / Top traders / Starting soon /
  Moment of the day) are intentionally QUIET secondary. Chain surfaces (violet) are the SETTLEMENT–SOLANA panel +
  the ticker "settled · proof verified" — read-only, never decorative.

Build order (queue) — backend-ready first, blocked deferred:
1. Shell (frame, header: wordmark · credits · rank · nav, dark bg, fonts).
2. MatchCard (static realistic props; all states) — the most reused piece, perfected alone.
3. Mini-river (lightweight-charts, `series.update()`).
4. Match list (MatchCards grouped by competition).
5. Wire to data — `GET /markets` + `m:{match}:prices`, leaderboard rail from `GET /leaderboard` + `lb:global`.
   Live where possible; else the `docs/api-samples/` fixtures (BLOCKED B2), logged "needs live boot".
6. Live states (loading skeleton / empty / error).
7. Leaderboard page (backend-ready; buildable in full).
8. Route map + click-wiring; stub every target page so no click is dead.

Deferred (BLOCKED.md): the Featured "Trade this match" ACTION + the Match view + Trade sheet — ADR-042 (`amm.q`
null until the engine q-emit). The CTA links to `/match/:id` (stub route) so the link is live; the trade action waits.

Consequences: the loop now has an exact, on-brand target. Reference is adjustable — a design change re-renders this
PNG. VERIFY: `design/screens/home.png` present, renders header→footer on our tokens, no Sofascore branding. Cross-refs:
ADR-040/041 (moments PNG-only — the Moment-of-the-day rail links there), ADR-042 (the trade block), the `ui-craft`
skill + `design/SCREEN-DATA-MAP.md` (the data wiring), `.claude/context/BLOCKED.md` (B1/B2/B3).
