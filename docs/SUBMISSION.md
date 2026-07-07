# Submission doc (grows daily — required by hackathon)
## Core idea
## TxLINE endpoints used
**Verified LIVE against txline-dev + devnet (ADR-015).** All wrappers in `packages/txline/src/client.ts` return parsed zod schema types (schemas: `src/{scores,odds,fixtures}.ts`); one real captured sample per endpoint in `docs/txline-samples/`. Subscribe tx built in `packages/chain` per law; live tx e.g. `2RMQS9tY…rZgYDPqqtX`.
- auth (A1–A3): `POST /auth/guest/start` → guest JWT · create Token-2022 ATA + on-chain `subscribe(service_level_id=1 on devnet, weeks)` · `POST /api/token/activate` `{txSig, walletSignature, leagues:[]}` → apiToken (bare string). Both headers on every data call.
- fixtures (F1): `GET /api/fixtures/snapshot` → `fixtures()` · `fixtures-snapshot.json`.
- scores snapshot (S1): `GET /api/scores/snapshot/{fixtureId}` → `scoresSnapshot()` · `scores-snapshot.json`.
- scores updates (S2): `GET /api/scores/updates/{epochDay}/{hourOfDay}/{interval}` → `scoresUpdates()` · `scores-updates.json`.
- scores stream (S3, SSE): `GET /api/scores/stream` → `scoresStream()` (event = one ScoreState).
- stat-validation (S4): `GET /api/scores/stat-validation?fixtureId&seq&statKey[&statKey2]` → `statValidation()` · `scores-stat-validation.json`.
- odds snapshot (O1): `GET /api/odds/snapshot/{fixtureId}` → `oddsSnapshot()` · `odds-snapshot.json` (empty until the fixture has odds).
- odds updates (O2): `GET /api/odds/updates/{epochDay}/{hourOfDay}/{interval}` → `oddsUpdates()` · `odds-updates.json`.
- odds stream (O3, StablePrice SSE): `GET /api/odds/stream` → `oddsStream()`.
- statKeys (K1): goals come from `Score.*.Total.Goals` (NOT the numeric Stats map). `src/statkeys.ts`; Stats-map table ⚠ Day-0.
- historical (replay): S2/O2 5-min buckets feed the replayer.

## TxLINE API feedback (what we liked / friction)
- Docs quickstart/worldcup examples were accurate and sufficient to integrate end-to-end. Friction: (1) `subscribe` requires the user's Token-2022 ATA to pre-exist (AccountNotInitialized otherwise) — a hint in the subscribe docs would help; (2) devnet only accepts SL1 while docs list SL1/SL12 as free — the SL12-is-mainnet distinction is easy to miss (`InvalidServiceLevelId`); (3) `/api/token/activate` returns a bare-string token (not JSON), unlike other endpoints.
## Business/technical highlights
## Links: deployed app · demo video · program on Solana Explorer
