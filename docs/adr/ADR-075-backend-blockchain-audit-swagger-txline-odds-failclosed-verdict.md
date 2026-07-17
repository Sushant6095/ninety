# ADR-075 — Backend + blockchain audit: Swagger/OpenAPI at `/docs`, TxLINE odds-nullable fix, fail-closed verdict

**Status:** Accepted · **Date:** 2026-07-17 · **Extends:** ADR-036/037 (settle fail-closed, `SETTLEMENT_LIVE` forge), ADR-017 (proof Plan A) ·
**Touches:** ADR-014 (TxLINE wire schemas in `packages/txline`), ADR-018 (ingest normalization), ADR-004 (one-process API).
Full findings + evidence: `docs/BACKEND-BLOCKCHAIN-AUDIT.md`.

## Context
A full backend+blockchain audit, verified by running (not by reading), of the API, engine, TxLINE wrappers, and the Anchor program.
Additive-only: the engine single-writer, journal-then-ack, the on-chain-proof result path, and play-money copy were NOT changed.

## Decisions / changes made
1. **OpenAPI/Swagger UI at `GET /docs`** on the API (:4000) via `@fastify/swagger@8` + `@fastify/swagger-ui@3`, registered in
   `server.ts` **before** the routes with a `bearerAuth` (JWT) security scheme. All **30 operations / 28 paths** carry a JSON
   `schema` (tags · params/querystring/body · responses). Kept additive-safe: responses `additionalProperties: true` (fast-json-stringify
   never strips bonus fields) and permissive request validation (ajv never rejects what the handler tolerates). Verified: 30/30 with
   response schema, 9 bearerAuth, 0 untagged, 30 shown == 30 registered; Try-it-out returns a real 200 fill for `POST /orders` with the
   demo token. Screens: `design/screens/impl/swagger-docs-*.png`.
2. **TxLINE bug fixed** (found in the audit): `packages/txline/src/odds.ts` had `OddsTick.MarketParameters` as `z.string().optional()`,
   but devnet O1 sends `null` → the zod parse threw and dropped **all** odds for a fixture. Changed to `z.string().nullable().optional()`
   (matches the sibling nullable fields). Not a forbidden path. Re-verified: txline build + tests pass; wrappers now parse real odds.
3. **getPortfolio DTO wrapper (prior) confirmed correct.** Part B found NO other API↔FE-contract drift — all 12 callers + the WS frame
   envelopes match.

## Audit verdict (evidence in the audit doc)
- On-chain proof verification is **logically sound for binding** (cannot settle an arbitrary outcome) but **incomplete for finality** —
  two CRITICAL-but-LATENT gaps, **G1** (finality / extra-time via `validateStatV2`) and **G2** (shootout reads as draw), both gated
  entirely by the compile-time `SETTLEMENT_LIVE = false`. **No admin/override result path exists** (grep-verified).
- **`SETTLEMENT_LIVE` stays FALSE** (the forge, ADR-036/037). Do NOT flip until G1 (validateStatV2/finality) + G2 + compute-budget wiring land.
- `anchor build` SUCCESS; claim/leaderboard path 7/7 on localnet; `settle_market` has **zero** test coverage (HIGH follow-up).
  Program NOT deployed to devnet (funding-blocked, ~0.18 SOL short).
- Verdict split: **CODE** ~95% backend / ~90% blockchain-shippable-scope (+ TxLINE synthesis verified); **DEPLOYED** 0%. Going live is
  gated on human items (Fly unlock, Supabase pooler+direct, Redis Cloud, ~1 SOL for anchor deploy, Telegram token, fixture pivot
  18241006→18257865) — not on more engineering.

## Consequences / follow-ups (each worth its own ADR later)
- `settle_market` test coverage (HIGH — currently zero).
- Lifecycle-effect projection to Postgres `Market.status` (stale status; carried from ADR-074).
- Finality / `validateStatV2` (G1) + shootout (G2) + compute-budget work — **land all three before any `SETTLEMENT_LIVE` flip.**

_No LAW/hook change: this ADR reinforces the existing `SETTLEMENT_LIVE=false` stance rather than altering it. `/docs` is additive infra._
