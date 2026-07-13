# Contributing to Ninety

Thanks for your interest. Ninety is a play-money prediction exchange for live football, built for the TxODDS World Cup Hackathon. This guide gets you productive fast.

## Ground rules (non-negotiable)

These are enforced in code and in review — see [`CLAUDE.md`](CLAUDE.md) for the full set.

- **Play-money only.** No deposits, no withdrawals, no cash payouts, ever. Never use the words *bet / stake / odds / wager* in product copy — say *price*, *trade*, *credits*. ("odds" is fine only as a literal TxLINE endpoint name.)
- **All inter-service traffic goes through `packages/bus`.** No service calls another directly — events only.
- **The engine (`apps/api/src/engine`) is the single writer of market state.** It must not import from `http/` or `ws/`.
- **Only `packages/txline` may call TxLINE; only `packages/chain` may build Solana transactions.**
- **There is no admin result path.** The Anchor program verifies TxLINE proofs on-chain. Don't add one.
- **New architectural decision? Write an ADR** in [`docs/adr/`](docs/adr/) before coding it. Chat is not memory.

## Getting started

Requires **Node 18 or 20** (the WebSocket layer uses `uWebSockets.js`), **pnpm 9**, and Docker.

```bash
pnpm install
cp .env.example .env      # the mock runs without a token; fill TXLINE_TOKEN to hit the live feed
docker compose up -d      # postgres + redis
pnpm dev                  # web + api + workers
```

## Before you open a PR

```bash
pnpm lint
pnpm test          # 257 tests today — keep them green
pnpm build
```

For Anchor changes: `anchor test` in `programs/omnipitch_core` (localnet).

- Keep commits atomic and use [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`) with a scope (`api`, `web`, `bus`, `engine`, `txline`, `chain`, `anchor`, `design`).
- Add or update tests for behavior changes.
- If you changed an architectural decision, include the ADR.

## Where things live

The layer map and data-flow contract are in the [README](README.md#architecture). Each folder answers "which layer am I?" — start there, then read the relevant ADRs.

## Reporting issues

Open a GitHub issue with steps to reproduce, expected vs. actual behavior, and your Node/pnpm versions. For anything settlement- or proof-related, reference the relevant ADR.
