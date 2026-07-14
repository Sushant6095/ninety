# Changelog

Ninety has no version tags yet — it was built in one continuous sprint for the TxODDS World Cup Hackathon. This changelog groups the 128 commits (2026-07-07 → 2026-07-14) into the phases they actually happened in. Per-commit detail: `git log`, and every decision has an ADR in [`docs/adr/`](docs/adr/).

## 2026-07-14 — The polish sprint (47 commits)

- Landing page ships at `/` (the board moves to `/board`): live hero Momentum River tape, the halt choreography replaying on scroll, GSAP ScrollTrigger arrivals, hyperfoundation-informed structure (ADR-056).
- All 48 WC26 flags baked to local PNGs — the runtime flag CDN dependency is gone (ADR-055).
- The halt money-shot: one GSAP timeline (goal flash → amber sweep → freeze → price lands → the Booth speaks → spread decay), shared by the Terminal, the board, and the landing.
- `/terminal` depth tabs (lineups on a native SVG pitch, stats, H2H + crowd call, incident timeline), the 104-match bracket with round-reveal, `/proofs` settlement log, `/competition` group tables.
- Motion system hardened: tokenized durations/easings across CSS/Framer/GSAP, tick-flash re-fire fix, reduced-motion rule that keeps color feedback, a full motion audit with 8 self-contained fix plans (`plans/`).
- Accessibility: axe-core 0 violations across all 15 routes; design-review verdicts persisted (`design/reviews/`).
- Docs: forge-finding README front door, submission fields, demo deck + 5-minute script, verified build metrics.

## 2026-07-13 — Open-source + deploy (20 commits)

- MIT license, contributing guide, submission-grade README with the Ninety rebrand (ADR-047).
- `apps/web` becomes a standalone Vercel deploy (ADR-048); honest "prototype" ribbon.
- WC26 static context layer baked at build time — TxLINE owns what moves, worldcup26 owns what sits still (ADR-051).
- Internal session logs and build prompts dropped for the public repo.

## 2026-07-11 — The product surface (3 commits)

- The live exchange built out: board, Terminal, onboarding, Moments, bracket, how-it-works; repo tooling (agents, hooks, skills) committed.

## 2026-07-09/10 — The frontend system (19 commits)

- Ninety UI system bootstrapped: tokens, type scale, Impeccable anti-slop CI gate.
- Home board (ticker, MatchCards, featured panel + the first Momentum River), Terminal v1, North Star surface, leaderboard.
- Home data layer: `GET /markets`, `/leaderboard`, price cache, WS bridge (ADR-042).

## 2026-07-08 — The hard middle (22 commits)

- Order path: risk gate → LMSR fill → burned fee → ledger effects (ADR-026); read-model projections (ADR-027); halt/reopen hardening (ADR-028).
- On-chain: leaderboard Merkle claims with receipt-PDA + SPL vault, 5/5 Anchor tests (ADR-031); Moments cNFT deliberately cut (ADR-032); tx builders + Helius webhook feedback loop (ADR-034); the idempotent 7-step settlement saga (ADR-035).
- **The forge finding**: `settle_market` via txoracle CPI lands fail-closed after two adversarial audit passes prove finality isn't bound on-chain (ADR-036/037).
- The AI Booth: one two-role LLM call → filtered commentary (ADR-038/039); Moment swing cards as server-rendered SVGs (ADR-040/041).
- Hybrid auth: email+OTP embedded wallets / Phantom connect, HS256 JWT (ADR-033).

## 2026-07-07 — The spine in one day (17 commits)

- Typed event contracts (zod `Envelope`, `AnyEvent`) and the bus over Redis Streams with a driver-agnostic contract suite (ADR-007/012).
- The TxLINE client: full auth flow (guest JWT → on-chain subscribe → activate), typed wrappers for every endpoint, **verified live on devnet**.
- Settlement proof spike: `validate_stat` CPI proven live on devnet.
- worker-ingest (SSE → normalizer → bus, gap recovery, exactly-once goals), cortex pricing v1 (Shin de-vig + hazard), the engine's lifecycle state machine + durable journal (ADR-024/025), EarlyWhistle Telegram cards.
