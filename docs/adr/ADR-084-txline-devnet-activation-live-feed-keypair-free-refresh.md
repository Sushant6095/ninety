# ADR-084 — TxLINE devnet activation: live feed on, keypair-free JWT refresh in production

**Status:** Accepted · **Date:** 2026-07-19 · **Follows:** ADR-079 (lazy keypair signer), ADR-059 (live-mode auth wiring),
ADR-015 (TxLINE auth flow) · **Closes (partial):** BLOCKERS B1.

## Context
Live in-play TxLINE ingest had been OFF (B1) — `GET /markets` returned `[]` and the FE ran modeled fixtures. The
persisted devnet session (`TXLINE_DEVNET_JWT` + `TXLINE_DEVNET_API_TOKEN`, from a prior on-chain subscribe/activate)
existed in `.env` but was never pushed to Fly, and the worker had no `TXLINE_NETWORK`, so `apps/worker-ingest`
ran replay-only (`worker-ingest.replay.ready`).

## What was done (2026-07-19)
1. **Proved the feed is real (gate).** With the persisted session, `POST /auth/guest/start` → 200, and
   `GET /api/fixtures/snapshot` returned the **FINAL, Spain v Argentina (FixtureId 18257739)**, pre-match, with real
   TxLINE 1X2 de-margined stable prices (`Pct [30.58, 48.92, 20.50]` = Spain / Draw / Argentina — never 33/33/33).
   France v England (3rd place) was absent because it had already finished. Free WC tier, devnet, `leagues: []`.
2. **Set Fly secrets** (`fly secrets set -a omnipitch`): `TXLINE_NETWORK=devnet`, `TXLINE_DEVNET_JWT`,
   `TXLINE_DEVNET_API_TOKEN`. No keypair secret — deliberately (avoidable risk on a demo host; see §3).
3. **Verified the worker booted LIVE, keypair-free.** Logs: `{"evt":"worker-ingest.live.ready","cluster":"devnet"}`
   with NO keypair crash — confirming the deployed v4 image already carried ADR-079's lazy signer. On a token-only
   boot the `TxLineClient` reuses the pre-provisioned session and never touches the wallet.

## Decision — keypair-free refresh (the fix this ADR ships)
`packages/txline/src/client.ts` previously did a FULL re-handshake on 401 (`guestStart → subscribe → sign → activate`),
which (a) needs the wallet and (b) **double-activates on devnet** — a devnet `txSig` activates exactly ONCE, so
re-activation 403s ("already used"). That path is now last-resort only:
- On expiry/401, the client first calls `renewJwtOnly(apiToken)` — `POST /auth/guest/start` (NO wallet signature,
  NO on-chain tx) and reuses the SAME `apiToken`.
- Only if that STILL 401s (a dead apiToken, not just an expired JWT) does it fall back to the full on-chain handshake.

Consequence: **production never needs the private key** for routine JWT expiry — the keypair stays off the Fly host
entirely. Shipped via `fly deploy -c infra/fly/fly.toml`.

## Honest current state (labels follow data, never lead)
The only remaining real fixture is the FINAL, which has **not kicked off**, so there is no in-play odds stream — the
ingest opens `/api/odds/stream` and gap-recovery only snapshots fixtures already seen on the stream, so a quiet
pre-match fixture is not primed. Therefore `/markets` is still `[]` and the honest state is
**"live feed connected · devnet · market pre-match"** — a genuine live integration, not live in-play prices.
When the Final kicks off (or a follow-up primes the pre-match odds snapshot into `odds.raw.v1`), cortex prices it
(1X2 synthesis) and `/markets` populates — only THEN do the FE labels flip from PREVIEW/REPLAY to LIVE.

## Follow-ups (not blocking)
- Prime pre-match markets: on boot, fetch `fixtures/snapshot` + `odds/snapshot` per upcoming WC fixture and publish
  once, so a market opens with real pre-match odds before the in-play stream starts.
- Never commit `TXLINE_DEVNET_JWT` / `TXLINE_DEVNET_API_TOKEN` / any keypair. They live in `.env` (gitignored) and
  Fly secrets only.
