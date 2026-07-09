# BLOCKED — what to unblock (frontend run)

Each entry: what's blocked · why · the EXACT unblock. Skipped tasks are logged here, not retried.

## B1 · Match view + Trade sheet — BLOCKED (do not attempt)
- **Why:** ADR-042 — `GET /markets/:match` returns `amm.q` + `amm.spread_mult` = `null`; the LMSR shares-outstanding
  vector `q` lives only in the engine's journaled single-writer state and isn't exposed to any read store. The trade
  sheet's local pricing needs `q`.
- **Unblock:** a guarded engine-emit — the engine publishes a per-market amm snapshot `{status,q,b,spread}` → a read
  cache (like `markets-read`). Backend task, engine-guardian review. NOT frontend.
- **Queue effect:** the Home "Trade this match" / Featured CTA links to `/match/:id` (stub route, live link) but the
  trade action itself is deferred. Match view + trade sheet skipped until the q-emit lands.

## B2 · Live API HTTP + WS socket — ENV WALL (wire to fixtures, log, continue)
- **Why:** (a) `GET /markets`, `/markets/:match` read Postgres → need `DATABASE_URL` from `.env`, and the security
  hook (correctly) blocks handling `.env`, so the API can't be booted from here. (b) `uWebSockets.js` ships prebuilt
  binaries only for Node LTS 16/18/20; this env is Node 24, so the live socket can't bind.
- **Mitigation (no stall):** wire Home to the `docs/api-samples/` fixtures (real shapes, verified 5/5). Mark the wired
  screen "fixture-wired, needs live boot."
- **Unblock:** boot the API with its env on **Node 18/20** (`nvm use 18` → the app's dev command) so HTTP + the uWS
  socket are live; then re-point the Home data hooks from fixtures to the running origin.

## B4 · design-cop residual (not blocking; polish backlog)
- **Full type-scale conversion:** the `fontSize` scale is now wired in tailwind (base=13px, xs=11px, …), but
  components still use arbitrary `text-[13px]`/`w-[260px]`/`min-w-[44px]` etc. Mechanical swap to named classes
  across `apps/web/src/**` — do in the dead-code/polish sweep (task 11).
- **Loading/error states:** async surfaces (River, MatchList, leaders) need skeleton + error fallbacks — lands in
  chunk 6 (live states) alongside the API swap.
- **44px hit targets:** bumped the worst (arrows 36, avatar 40); full ≥44px everywhere fights the dense-terminal
  aesthetic — revisit with an explicit min-tap-target token if a mobile a11y pass demands it.

## B3 · Screenshot loop (scripts/ui/screenshot.mjs) — Playwright not installed
- **Why:** Playwright is staged in devDependencies but not installed (network install was deferred, not confirmed).
  The loop's screenshot step needs it + a running `next dev`.
- **Mitigation (no stall):** render component/route screenshots via **Chrome headless** (used to lock the reference)
  against the dev server; design-cop scores those shots vs `design/screens/home.png`.
- **Unblock:** `pnpm add -D playwright && npx playwright install chromium` (once network is confirmed OK).
