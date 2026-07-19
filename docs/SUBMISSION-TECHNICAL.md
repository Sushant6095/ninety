# Ninety — Technical Submission (TxODDS World Cup Hackathon)

**Track:** Consumer & Fan Experiences · **Play-money throughout** — no deposits, no cash payouts, ever.
**Live:** [omnipitch.fly.dev](https://omnipitch.fly.dev) (API + Swagger at `/docs`) · web on Vercel.

## a) Core idea (three sentences)
Ninety is a live football exchange for the World Cup where **price is probability**: every outcome trades
from 0 to 100, so buying a team below its true chance is your edge. It turns a passive scores app into a
market a fan can actually play — the drama of a real exchange with none of the money and none of the
licensing. Prices come from **TxLINE's signed feed**, and every settlement is verified **on-chain on Solana**,
so a fan never has to trust us.

## b) TxLINE endpoints used
Typed wrappers live in `packages/txline` (schemas zod-validated against live captures, `docs/txline-samples/`).

| Wrapper | Endpoint | Use in Ninety |
|---|---|---|
| **F1** fixtures snapshot | `GET /api/fixtures/snapshot` | the tournament slate; drives which markets exist (WC = CompetitionId 72) |
| **S1** scores snapshot | `GET /api/scores/snapshot/{fixtureId}` | authoritative score; gap-recovery re-sync |
| **S2** scores updates | `GET /api/scores/updates/{ed}/{hr}/{iv}` | the `game_finalised` record used at settlement |
| **S3** scores stream | `GET /api/scores/stream` (SSE) | live in-play score → goal events → the halt |
| **S4** stat-validation | scores snapshot stat leaves | the Merkle stat leaf a settlement proof binds |
| **O1** odds snapshot | `GET /api/odds/snapshot/{fixtureId}` | **prices the market** — pre-match prime + gap-recovery |
| **O2** odds updates | odds update buckets | missed-tick recovery on the odds lane |
| **O3** odds stream | `GET /api/odds/stream` (SSE) | live in-play odds → cortex re-price → the tape moves |

**On-chain activation flow** (devnet, free WC tier): guest JWT (`POST /auth/guest/start`) → on-chain
`subscribe(SERVICE_LEVEL, weeks)` on the txoracle program (`6pW64gN1…`) → sign `"{txSig}::{jwt}"` (leagues
empty) → `POST /api/token/activate` → apiToken. Data requests send **both** `Authorization: Bearer {jwt}` and
`X-Api-Token: {apiToken}`. The pipeline that carries a real tick to a repriced market:
`O1/O3 → normalizer → bus (odds.raw) → cortex (de-vig → Dixon-Coles → 1X2) → engine (LMSR) → GET /markets`.
**Verified live 2026-07-19:** the WC Final (Spain v Argentina, fixtureId 18257739) is priced from the real
feed — cortex-synthesised H/D/A published under `market_id === matchId === fixtureId`.

## c) Monetization
**B2B, clean, legal top-of-funnel.** A licensed operator cannot legally build a play-money front door in most
app stores or jurisdictions — Ninety can, so we license the exchange UX + the TxLINE-priced, on-chain-proven
market engine to operators as their acquisition and engagement layer, and the aggregate play-money
prediction track record (who is right, on what, how early) is a data asset we sell back. Consumer-side,
premium tiers unlock depth (more competitions/leagues, deeper books, historical replay, private leagues),
while the core World Cup experience stays free to keep the funnel wide.

## d) TxLINE feedback
**Liked.** The free World Cup tier let us build and prove the whole live path with zero spend — only devnet
SOL for fees. One normalised schema across competitions meant the ingest/normalizer didn't special-case per
league. And devnet activation was clean once the network law (same host for JWT + activation + tx) was clear.

**Friction 1 — no 1X2 on the free feed.** The free bundle carries Over/Under totals + Asian-handicap books
but no match-result (1X2) book, so we recover it: Shin de-vig each 2-outcome book, invert to a Poisson/
Skellam goals model, apply **Dixon-Coles** low-score dependence, and read off H/D/A. It works, but a native
1X2 (even delayed) would remove a whole modeling layer for consumer products. Also: the line ships as
`marketParameters:"line=0.5"`, not a bare number — an easy parse trap (it silently dropped every book for us
until we stripped the `line=` prefix).

**Friction 2 — a devnet `txSig` activates exactly ONCE.** A client that re-activates on a 401 dies
permanently ("already used"), and it needlessly requires the wallet on every refresh. The correct path — and
it's easy to miss — is to renew ONLY the guest JWT (`POST /auth/guest/start`, no signature) and retry with the
SAME apiToken. We refactored our client to renew-JWT-first so production never needs the private key.

**Friction 3 — the settlement proof does not bind match FINALITY on-chain.** The sanctioned path selects the
finalised score record off-chain by sequence number, but on-chain the validator only proves a stat leaf is in
the Merkle root — it never sees whether that record was the *final* one. A caller can pick a mid-match
sequence and produce a proof that verifies identically; finality is asserted, not proven. Two independent
adversarial audits found it, so we **hard-gated settlement off inside the program** rather than ship a
forgeable result path, and are raising it with TxODDS.
