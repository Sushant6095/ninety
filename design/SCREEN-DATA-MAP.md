# SCREEN → DATA MAP

The authority for how every apps/web screen is fed. Screens render frames — they never poll and
never compute prices. Read your screen's row before building (referenced by the `ui-craft` skill,
the `/screen` command, and the UI-loop standard).

- **REST (cold)** = fetched once on load / navigation.
- **WS (hot)** = live channels the screen subscribes to; the tape updates via `series.update()` only.
- **Chain surface** = the only place on-chain UI (violet) appears; `—` means no chain surface.

| Screen | Primary reference | REST (cold) | WS (hot) | Chain surface |
|---|---|---|---|---|
| Home | Sofascore | `GET /markets` | `m:{match}:prices`, `lb:global` | — |
| Match — PRE | Polymarket | `GET /markets/:match` | `m:{match}:prices` | claim-credits |
| Match — LIVE | Hyperliquid | `GET /markets/:match` | `m:{match}:prices`, `:events`, `:booth` | — |
| Match — HALTED | Hyperliquid + amber | — | `m:{match}:events`, `:prices` | — |
| Match — SETTLED | Polymarket | `GET /markets/:match` | settled envelope | ProofBadge → Solscan |
| Trade sheet | Hyperliquid | `amm` from `GET /markets/:match` | `m:{match}:prices`, fill | — |
| Portfolio | Polymarket | `GET /me/portfolio`, `GET /me/positions` | `m:{match}:prices` | — |
| History | own | `GET /me/history` | — | — |
| Leaderboard | own | `GET /leaderboard` | `lb:global` | — |
| Profile | own | `GET /profile/:handle` | — | moment sigs |
| Moments — gallery | own | `GET /moments` | — | mint sig (violet) |
| Moment — detail | own | `GET /moments/:id` | — | ProofBadge → Solscan |
| Bracket | Sofascore-ish | `GET /markets?stage` | — | — |
| How-it-works | proof-flow-viz | — | replayed settled envelope | validateStatV2 node |
| Onboarding | own | `POST /auth/embedded/start` | — | wallet provisioned invisibly |
| Settings | own | `GET /auth/me`, `POST /auth/embedded/export` | — | wallet export |

> **Football depth** (lineups, stats, H2H, managers, referee, media) lives in **tabs INSIDE the
> match view**, fed by the extras on `GET /markets/:match`. It is NEVER on the primary surface —
> the market is the subject; football is context (see the `ui-craft` blend + restraint rules).
