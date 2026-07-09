# FRONTEND AUTORUN LOG

What shipped, in order. Read this + BLOCKED.md + git log to see the state.
Format: `TASK — GREEN/SKIPPED — <commit> — one line`.

- **BRAND FIX — GREEN — <step0 commit> — product is "Ninety" (renamed from OMNIPITCH). design/screens/home.png rebranded; ADR-044 canonical. Internal @omnipitch/* namespace left as-is (import churn, non-user-facing).**
- **STEP 0 · LOCK REFERENCE — GREEN — 8272cbc — design/screens/home.png locked = the Ninety Home (App mockup, our tokens, Sofascore = structure only). ADR-043.**
- **FIX · Tailwind wiring — GREEN — <chunk1 commit> — Tailwind was never compiling (no postcss.config → @tailwind directives raw). Added apps/web/postcss.config.js. CSS now compiles (15KB utilities). Real blocker found + fixed.**
- **CHUNK 1 · HOME SHELL — GREEN — <chunk1 commit> — Ticker + Header (Ninety wordmark/credits/rank/nav, active underline) + LeftRail (my matches/stages/followed/Settlement–Solana violet) + RightRail (top traders/starting soon/Moment violet) + CenterColumn (date+filter chrome) + Footer. Fonts (Archivo/Inter/Plex Mono via <link>). Renders 4/4 breakpoints, matches reference chrome. Center match list = chunk 4; Featured = chunk 3. Every click → a real route (all stub pages exist).**
