# FRONTEND AUTORUN LOG

What shipped, in order. Read this + BLOCKED.md + git log to see the state.
Format: `TASK — GREEN/SKIPPED — <commit> — one line`.

- **BRAND FIX — GREEN — <step0 commit> — product is "Ninety" (renamed from OMNIPITCH). design/screens/home.png rebranded; ADR-044 canonical. Internal @omnipitch/* namespace left as-is (import churn, non-user-facing).**
- **STEP 0 · LOCK REFERENCE — GREEN — 8272cbc — design/screens/home.png locked = the Ninety Home (App mockup, our tokens, Sofascore = structure only). ADR-043.**
- **FIX · Tailwind wiring — GREEN — <chunk1 commit> — Tailwind was never compiling (no postcss.config → @tailwind directives raw). Added apps/web/postcss.config.js. CSS now compiles (15KB utilities). Real blocker found + fixed.**
- **CHUNK 3 · FEATURED + MINI-RIVER — GREEN — <c3 commit> — FeaturedPanel (right-rail hero: live match, big score, MomentumRiver, HOME/DRAW/AWAY, Trade CTA → /match/:id) + MomentumRiver (lightweight-charts, lazy-imported, area+goal-glyph, resolveColor so no hex). Renders live in browser. Whole Home now at parity with design/screens/home.png.**
- **CHUNKS 2+4 · MATCHCARD + LIST — GREEN — <c2 commit> — MatchCard (star/minute/flags/teams/score/spark/H-D-A price cells, hover+focus+active, whole-row → /match/:id) + Sparkline (inline SVG, ADR-045) + PriceChip + MatchList (grouped by competition: Favourites, R16 · View bracket). Center hero at parity with reference. next build green. Removed the premature MatchListSkeleton (returns in chunk 5).**
- **CHUNK 1 · HOME SHELL — GREEN — 9037a4e — Ticker + Header (Ninety wordmark/credits/rank/nav, active underline) + LeftRail (my matches/stages/followed/Settlement–Solana violet) + RightRail (top traders/starting soon/Moment violet) + CenterColumn (date+filter chrome) + Footer. Fonts (Archivo/Inter/Plex Mono via <link>). Renders 4/4 breakpoints, matches reference chrome. Center match list = chunk 4; Featured = chunk 3. Every click → a real route (all stub pages exist).**
