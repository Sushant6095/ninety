# Roadmap

What is verified today, what is next, and what was deliberately cut. Honest by policy — the repo's own audit trail ([`docs/BUILD-LOG.md`](docs/BUILD-LOG.md), [`docs/adr/`](docs/adr/)) is the source of truth.

## Shipped and verified

- **The data spine** — TxLINE integration live on devnet (subscribe → activate → snapshot against a real fixture), typed wrappers for every endpoint, captured payloads in `docs/txline-samples/`, SSE latency ≈ 0.7–1.2 s.
- **The backend loop** — ingest → bus → cortex (Shin de-vig + hazard) → single-writer engine (durable journal, 7×7 lifecycle reducer, LMSR fills with burned fee) → REST + WS. 257 automated tests across the workspace.
- **On-chain leaderboard claims** — Merkle root posting + receipt-PDA-guarded claims from a PDA-owned vault, 5/5 Anchor tests, deployed to devnet.
- **The settlement design** — permissionless, one-shot, proof-verified, **fail-closed on purpose** pending a finality gate (ADR-036/037; see the README's settlement story).
- **The full product surface** — landing (live hero River + halt choreography), board, Terminal with depth tabs, 104-match bracket, competition tables, proofs log, Moments, portfolio, leaderboard, onboarding — tokens-only design system, axe-clean across all 15 routes, every component's provenance logged.
- **AI Booth** — one two-role LLM call per swing, vocabulary-filtered, with a deterministic fallback narrator.

## Next

| Priority | Item | Where it lands |
| :--- | :--- | :--- |
| P0 | **Settlement finality gate** — settle via scores roots + an on-chain finality bind, or txoracle's resolution-root path (question filed with TxODDS). Flip `SETTLEMENT_LIVE`. | `programs/omnipitch_core` |
| P0 | **Wire the web to the live API** — replace `lib/fixtures.ts` imports with `lib/api.ts` (`/markets`, `/leaderboard`) + the WS bridge (ADR-042). | `apps/web` |
| P1 | **Order submission surface** — `POST /orders` on top of the already-tested engine order path; wire the Terminal ticket. | `apps/api`, `apps/web` |
| P1 | **Boot the settlement saga + Moments renderer** from `worker-jobs/main.ts` (both coded and tested). | `apps/worker-jobs` |
| P2 | WS `since` backfill from resume buffers (today: live fan-out + seq gap detection). | `apps/api/src/ws` |
| P2 | Frontend unit tests (today: screenshot + design-review loop and an axe sweep stand in). | `apps/web` |
| P2 | Remaining motion plans 004–008 (tooltip system, press vocabulary, halt-banner CSS sweep, missed beats). | [`plans/`](plans/) |
| P3 | Kafka bus driver (interface is ready; Redis Streams is the right size today). | `packages/bus` |

## Deliberately cut (v1)

- **On-chain Moment cNFTs** — `mint_moment` is a no-op; Moments ship as server-rendered PNGs (ADR-032/041). Revisit post-hackathon.
- **WebGL/shader hero** — the landing hero carries a live price; ambient WebGL never renders on a live-price surface (ADR-053/056).
- **Light mode** — dark terminal only for v1.
- **The `@omnipitch/*` → `@ninety/*` rename** — namespace churn with no user value (ADR-044).
