# ADR-079 — Lazy keypairSigner: devnet ingest boots token-only, never seeks id.json

**Status:** Accepted · **Date:** 2026-07-18 · **Follows:** ADR-059 (live-mode auth wiring, automation-never-spends),
ADR-072 (Fly deploy secret list). **Scope:** `apps/worker-ingest/src/liveAuth.ts` only — no engine, no on-chain path.

## Context
The deployed `worker-ingest` machine on Fly crash-looped to its 10-restart limit (verified in logs, 2026-07-17
17:40–17:42): `worker-ingest.replay.ready` fired, then `main()` unconditionally built the live client
(`main.ts:35 signer: keypairSigner(cluster)`) and `keypairSigner` read `~/.config/solana/id.json` **eagerly at
construction** → `ENOENT` (no wallet on the box). The wallet is intentionally NOT on Fly (ADR-059: the deployed
worker holds pre-obtained TxLINE tokens and must never carry signing key material it could spend with).

The key observation: `TxLineClient` (`packages/txline/client.ts:116-123`) sets `this.session` from `initialAuth`
at construction and `authenticate()` returns that session without ever calling `subscribe`/`signer.sign` while it
is unexpired. So the client is *designed* to boot token-only — the signer's job is only to re-sign on a session
refresh. The crash was purely that the signer read the keyfile before the client got the chance to decide it did
not need it. `devnetFreshSubscriber()` and `initialAuthFromEnv()` were already lazy (they touch disk/env only inside
their methods); `keypairSigner` was the sole eager reader.

## Decision
**`keypairSigner(cluster)` is now lazy.** The keypair file is read (and the ed25519 key derived) on the first
`sign()` / `publicKey` access, memoized thereafter — not at construction. With `initialAuth` present (persisted
tokens), the client reuses the session and never calls `sign()`, so `id.json` is never sought and a token-only
devnet boot succeeds without the wallet. When a refresh IS needed (token expiry) and no keypair is reachable,
`sign()` throws exactly as before — the failure moves from boot-time to first-use, it is not swallowed. Signing
behaviour with a real key is byte-for-byte unchanged.

This makes the runbook's stated intent — "ingest boots, reuses the TxLINE session, does not seek id.json" —
achievable on Fly with tokens alone. It does NOT put key material on the box and does NOT let the worker spend SOL
(ADR-059 holds: `devnetFreshSubscriber` still only runs when a fresh handshake is genuinely required).

## What this does and does not change
- **Does:** removes the only eager `id.json` read at ingest boot; a future deploy with real `TXLINE_DEVNET_JWT` +
  `TXLINE_DEVNET_API_TOKEN` + `TXLINE_NETWORK=devnet` will boot LIVE devnet ingest token-only.
- **Does not:** change the currently deployed image (v3, eager signer) — the fix ships on the next `fly deploy`.
  Today `TXLINE_NETWORK` is unset, so `main()` skips the live block entirely and ingest runs clean **replay-only**
  (verified: 2026-07-18 07:51 boot reaches `replay.ready`, no ENOENT, machine `started`).

## Verification
Runnable self-check (`scratchpad/lazy-signer-check.mts`, passed): (1) constructing `keypairSigner("devnet")` with no
`TXLINE_DEVNET_KEYPAIR_PATH` and a dead `HOME` does not throw; (2) `sign()` then throws lazily; (3) with a real
ephemeral ed25519 key on disk, `sign()` returns a base64 64-byte signature. On Fly: ingest machine `805091b6615058`
restarted → `state: started`, logs show `worker-ingest.replay.ready` with no subsequent `id.json` error.

## Deferred
- **Enabling live devnet ingest** = real token values (the runbook's `…` were placeholders, never set) minted from
  the funded local wallet, set as Fly secrets alongside `TXLINE_NETWORK=devnet`, then a redeploy to ship this lazy
  signer. Low value right now — devnet WC fixtures are pre-match, so the live feed is empty; replay-only is the
  correct baseline for the demo.
