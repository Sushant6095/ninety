# ADR-073 — CONNECT: read-model surfaces go live, board/terminal stay pinned to fixtures, client CORS proxy

**Status:** Accepted · **Date:** 2026-07-17 · **Follows:** ADR-072 (P1 backend + `lib/api.ts` client, the swap it left open),
ADR-071 (never a fabricated 33/33/33 book), ADR-051 (two-source rule), ADR-042 (home data layer / store seam), ADR-050 (AppShell contract).
· **Superseded (decision #3) by:** ADR-076 — leaderboard + moments were pinned back to fixtures (live read-model produced read-out-loud contradictions: empty moments void, QA-only leaderboard).

## Context
`apps/web` rendered entirely from baked fixtures; `lib/api.ts` (the typed live client ADR-072 built) had **0 importers**.
The goal was the CONNECT swap: wire the ~30 fixture surfaces to live data, gated by `NEXT_PUBLIC_USE_FIXTURES`, fixtures as
offline fallback. Reality found on a booted stack: the live universe is nearly empty — `GET /markets` returns **one** seeded
demo match (`18193785` USA v Belgium, O/U + AH, `mark: null` / unpriced); nothing populates PG Match/Market rows but
`prisma/seed-demo.ts`, and the H/D/A marks only become real once the cortex synthesis pipeline runs and publishes. So
"swap everything to live" would have replaced a full slate with an empty one on the flagship surfaces.

## Decisions

1. **A `lib/data` seam between fixture and live.** `lib/data/useLive.ts` (client hook: fixture under `USE_FIXTURES`,
   else fetch live and keep the fixture on error) + `lib/data/markets.ts` (`MarketView`→`MarketRow` mapper; `mark`
   passed through as `null` when unpriced — never a synthesized even book, ADR-071). This is the one place a surface
   chooses fixture vs live.

2. **BOARD + TERMINAL are pinned to fixtures in code** (`getBoardMarkets()` returns `MARKETS`), NOT flag-gated. Proven
   by screenshot + read-out-loud: the board is a **store-seeded composite** — every rail reads `matchLiveStore`, seeded
   at module import from fixture `MARKETS`. Wiring only the page prop left the center column live (empty universe → "no
   live matches") while the rails showed the full fixture slate: a self-contradicting board. A coherent live board needs
   BOTH a rewired store seam (seed + all rails + WS ticks) AND a populated universe. `getBoardMarketsLive()` is kept,
   ready, for when both land.

3. **Read-model surfaces go live now** (not store-entangled, coherent even when sparse): leaderboard (server component,
   honest "No traders ranked yet"), moments gallery + detail ("No moments yet" — nothing seeded), search command menu
   (debounced live `/search`). Fixtures remain the offline fallback under `NEXT_PUBLIC_USE_FIXTURES=1`. Empty live →
   empty state, never fabricated rows.

4. **Same-origin proxy for browser fetches** (`next.config.mjs` rewrite `/api/:path* → API origin`, env-driven) + a
   server/client base split in `lib/api.ts` (server components hit the API directly; the browser hits same-origin
   `/api`). The API sets **no CORS headers**, so client-component fetches `:3000`→`:4000` were blocked and silently fell
   back to fixtures — proven: moments showed fixtures until the proxy went in, then correctly flipped to the live empty
   state. Zero backend change.

## Deferred (with reasons)
- **Match events/actions timeline** — entangled with the pinned price surfaces (terminal / match River); wiring only the
  timeline risks the same live-vs-fixture contradiction. Waits on the store-seam decision.
- **Portfolio + games (Next-Goal picks)** — auth-gated, and the FE has no session/token infra (only fixture `SESSION`).
  Needs a demo-auth step (a pre-minted `NEXT_PUBLIC_DEMO_TOKEN` for the seeded demo user) first.
- **Full live board/terminal** — blocked on (a) rewiring the whole store seam and (b) populating the live universe
  (multi-match real WC26 fixtures ingested + cortex 1X2 marks). Backend/data work, out of this phase.
- **Nav session chip (RANK/CR)** — still fixture-backed; part of the deferred account/portfolio wiring.

## Consequences
- Production build green; `no-dead-code` hook clean (`lib/data` imports `lib/api`; all endpoint paths referenced; no stubs).
- Board stays coherent on fixtures (screenshot + read-out-loud); leaderboard + moments show live empty states on screen;
  the CORS-proxy fix is confirmed (moments flipped fixtures→live empty).
- `lib/api.ts` now has real importers, closing the ADR-072 dead-code flag for the wired surfaces; the pinned surfaces are
  deliberate, not un-swapped debt.
