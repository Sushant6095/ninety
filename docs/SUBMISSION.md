# Submission doc (grows daily — required by hackathon)
## Core idea
## TxLINE endpoints used
All wrappers in `packages/txline/src/client.ts` return parsed zod schema types (schemas: `src/{scores,odds,fixtures}.ts`, statKeys: `src/statkeys.ts`). One real sample per endpoint in `docs/txline-samples/`.
- auth (A1–A3): `POST /auth/guest/start` → guest JWT · on-chain `txoracle.subscribe(12, weeks)` (devnet) · `POST /api/token/activate` → apiToken. Every data call sends BOTH headers (`Authorization: Bearer {jwt}` + `X-Api-Token: {apiToken}`). Tx built via `packages/chain` per law.
- fixtures schedule (F1): `GET /api/scores/schedule` → `fixtures()` · `fixtures-schedule.json` ⚠ path Day-0.
- scores snapshot (S1): `GET /api/scores/snapshot/{fixtureId}?asOf=` → `scoresSnapshot()` · `scores-snapshot.json`.
- scores updates (S2): `GET /api/scores/updates/{epochDay}/{hourOfDay}/{interval}` → `scoresUpdates()` · `scores-updates.json`.
- scores stream (S3, SSE): `GET /api/scores/stream` → `scoresStream()` · `scores-stream-event.json`.
- stat-validation (S4): `GET /api/scores/stat-validation?fixtureId&seq&statKey[&statKey2]` → `statValidation()` · `scores-stat-validation.json`.
- odds snapshot (O1): `GET /api/odds/snapshot/{fixtureId}?asOf=` → `oddsSnapshot()` · `odds-snapshot.json` ⚠ path Day-0.
- odds updates (O2): `GET /api/odds/updates/{epochDay}/{hourOfDay}/{interval}` → `oddsUpdates()` · `odds-updates.json` ⚠ path Day-0.
- odds stream (O3, StablePrice SSE): `GET /api/odds/stream` → `oddsStream()` · `odds-stream-event.json` ⚠ path Day-0.
- statKeys (K1): `src/statkeys.ts` — 1002 home goals · 1003 away goals (⚠ full table Day-0).
- historical (replay): S2/O2 5-min buckets feed the replayer.
## Business/technical highlights
## TxLINE API feedback (what we liked / friction)
## Links: deployed app · demo video · program on Solana Explorer
