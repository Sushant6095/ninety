# Architecture

Ninety is a small event-driven exchange: one data spine (TxLINE), one bus, one single-writer engine, one trust layer (Solana). Every decision is recorded — 57+ ADRs in [`docs/adr/`](docs/adr/) — and a handful of laws hold the shape. Deeper documents: [`docs/architecture/overview.md`](docs/architecture/overview.md) and [`docs/architecture/target-topology.md`](docs/architecture/target-topology.md).

## The laws

1. **All inter-service traffic flows through `packages/bus`.** Events only — no service ever calls another directly. Two named intra-service exceptions that are storage, not communication: the engine journal and the WS resume buffers.
2. **The engine is the single writer of market state** (`apps/api/src/engine`). One serialized lane per market, `validate → journal (durable) → apply → emit`, a Redis lease guarantees one writer process, and nothing in `engine/` imports from `http/` or `ws/`.
3. **Only `packages/txline` calls TxLINE. Only `packages/chain` builds Solana transactions.**
4. **There is no admin result path.** The Anchor program settles only by verifying TxODDS's own cryptographic proof — and is deliberately fail-closed until the proof can be bound to finality (see [the settlement story](README.md#the-settlement-story)).
5. **Play-money is an invariant, not a setting.** No deposits, no withdrawals, no cash payouts — enforced down to a vocabulary filter on the AI Booth's output.

## System diagram

```
       TxLINE / TxODDS  (odds SSE · scores SSE · Merkle proofs)
              │
              ▼
      apps/worker-ingest          L1 — normalize to canonical envelopes
              │
              ▼
     ╔═══════════════════╗
     ║   packages/bus    ║        Redis Streams · two planes:
     ║  (the ONLY road)  ║        domain events + sys.* signals
     ╚═══════════════════╝
        │            ▲ │
        ▼            │ ▼
 apps/worker-cortex  │  apps/worker-jobs      L3 — Python pricing      L4 — AI Booth,
 (Shin de-vig →      │  (commentary.v1,           (fair, hazard,           EarlyWhistle;
  prices.marks)──────┘   EarlyWhistle)             b_hint)                 saga/moments coded
              │
              ▼
      apps/api/src/engine         L3 — single-writer LMSR market state
              │                        journal-then-ack · lifecycle reducer
              ▼
      apps/api  http/ + ws/       L5 — REST :4000 · uWS :4001 · projections
              │                        (Postgres = durable truth, Redis = hot)
              ▼
      apps/web  (Next.js)         L6 — the landing, board, Terminal
                                       renders frames; never computes prices

      apps/worker-jobs ──(settlement saga, ADR-035)──► packages/chain ──► Solana devnet
                                                                          programs/omnipitch_core
      Solana ──(Helius webhook)──► apps/api /webhooks/helius ──► bus     (fail-closed settle ·
                                                                          leaderboard claims LIVE)
```

## Layer map

| Layer | Folder | Talks to | Status |
| :--- | :--- | :--- | :--- |
| L6 Frontend | `apps/web` | api REST + WS only; never DB, never chain writes | Full design system; renders baked fixture data, live wiring next |
| L5 Edge | `apps/api/src/http`, `src/ws` | Redis, Postgres, bus | REST + WS gateway live |
| L3 Engine | `apps/api/src/engine` | bus in, journal, bus out | Journal, 7×7 lifecycle reducer, LMSR fills — tested |
| L3 Pricing | `apps/worker-cortex` (Python) | bus | fair = 0.2·model + 0.8·Shin-devig; hazard drives LMSR b(t) |
| L1 Ingest | `apps/worker-ingest` | TxLINE (via txline) → bus | Replay service booted by default; live SSE ingest verified on devnet |
| L4 Jobs | `apps/worker-jobs` | bus, chain | Booth + EarlyWhistle booted; settlement saga + Moments coded/tested, not yet in `main.ts` |
| L0 Chain | `programs/omnipitch_core` | txoracle (CPI) | Deployed to devnet; claims live, settle fail-closed |
| Contracts | `packages/schema · bus · txline · chain · config` | — | The four seams every service shares |

## Repository tree

```
ninety/
├── apps/
│   ├── web/              Next.js 15 frontend — landing, board, Terminal, bracket, proofs
│   ├── api/              Fastify REST + uWS gateway + the single-writer engine + projections
│   ├── worker-ingest/    TxLINE SSE → normalizer → bus; archived-fixture replay service
│   ├── worker-cortex/    Python pricing: Shin de-vig marks + hazard liquidity
│   └── worker-jobs/      AI Booth, EarlyWhistle cards; settlement saga + Moments (coded)
├── packages/
│   ├── schema/           zod event contracts — Envelope, topics, SysEvent (the wire truth)
│   ├── bus/              the ONLY transport — Redis Streams driver (+ Kafka stub)
│   ├── txline/           the ONLY TxLINE caller — typed wrappers, mock, proof extraction
│   ├── chain/            the ONLY Solana tx builder — settle/claim/root builders, Helius parsing
│   └── config/           shared strict tsconfig
├── programs/
│   └── omnipitch_core/   Anchor program — markets, proof-gated settle, leaderboard claims
├── infra/                docker-compose, Fly (4 processes), free-tier map, grafana
├── docs/                 57+ ADRs, TxLINE map + captured samples, submission, demo script
├── design/               tokens, screen references, provenance ledger, review verdicts
├── plans/                self-contained implementation plans (motion audit)
└── scripts/              replay, UI screenshot/axe harnesses
```

## Data-flow contract (the five lines that never bend)

1. Every input becomes a canonical envelope (`packages/schema`) on the bus — events only.
2. The frontend reads cold data over REST and hot data over WS; it renders, it never computes prices.
3. Postgres is durable truth (Prisma); Redis is hot state + bus + resume buffers. Cache derives from events, never the reverse.
4. The engine is the only writer of market state; journal-then-ack; crash recovery replays the journal and quarantines a market that will not recover.
5. Solana holds only what needs trust — the market registry, proof-verified results, leaderboard roots, point claims. The backend forwards proofs; the program verifies them.

## The live loop (the product, in one trace)

```
TxLINE S3 goal tick ─► ingest ─► match.events.v1 ─► engine: HALT (no fills on stale prices)
TxLINE O3 odds tick ─► ingest ─► odds.raw.v1 ─► cortex: Shin de-vig ─► prices.marks.v1
                                            └► engine: re-anchor mark, reopen on 3× decaying spread
prices + events ─► worker-jobs: one two-role LLM call ─► commentary.v1 (vocabulary-filtered)
web (WS): price tick-flash · halt choreography · Booth line          [ADR-005, 022, 038, 039]
```

At full time the settlement saga (ADR-035, idempotent, resumable) fetches the TxODDS Merkle proof and submits `settle_market` — which today **reverts on purpose** (`SETTLEMENT_LIVE = false`) until the proof can be bound on-chain to the *finalised* record. The full reasoning: [README → the settlement story](README.md#the-settlement-story), ADR-036/037.

## Design system (frontend)

Dark terminal, tokens-only color (`design/tokens.css` → Tailwind), IBM Plex Mono for every number, Archivo display / Inter UI, motion tokens in `apps/web/src/design/motion.ts` shared by CSS, Framer Motion, and GSAP (one custom ease). The signature element is the **Momentum River**; amber is reserved for halts, violet for on-chain surfaces. Laws in [`CLAUDE.md`](CLAUDE.md) and [`docs/NINETY-DESIGN-LAWS.md`](docs/NINETY-DESIGN-LAWS.md); every component's origin is logged in [`design/PROVENANCE.md`](design/PROVENANCE.md).
