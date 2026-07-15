# ADR 059 Two networks on purpose — mainnet SL12 for live data, devnet for settlement

Status: accepted 2026-07-15 (`merge/live-integration`). Cross-ref: ADR-015/016 (TxLINE verified live on devnet), ADR-036/037 (settlement fail-closed), ADR-051 (two-source rule — this is its network-layer sibling).

## Context

The product needs REAL-TIME live data for in-play trading (Arg–Eng today). TxLINE's tiers split by network: **devnet serves SL1** (60s data delay by design — fine for dev/replay, useless for live trading) and **SL12 — true real-time — exists only on MAINNET** (devnet rejects it with `InvalidServiceLevelId`, verified ADR-015). The data itself is free at the WC26 tier; the on-chain `subscribe` transaction costs mainnet gas (fees + rent).

Meanwhile settlement is deliberately fail-closed on DEVNET (`SETTLEMENT_LIVE = false`, ADR-037) pending the vendor's finality answer. Nothing about the data tier changes that.

## Decision

**Run two TxLINE networks simultaneously, fully separated by config — and never mix them.**

| Concern | Network | Host | txoracle program | TxL mint |
| :--- | :--- | :--- | :--- | :--- |
| LIVE DATA (scores, goals→halt, StablePrice odds→marks, actions) | **mainnet-beta**, SL12, 4 weeks | `https://txline.txodds.com` | `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA` | `Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL` (Token-2022) |
| SETTLEMENT / PROOFS | **devnet** (unchanged) | `https://txline-dev.txodds.com` | `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J` | `4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG` |

- **Same-network law (docs):** RPC, program id, guest JWT, and activation must all be one network. A devnet subscribe cannot activate on mainnet. `assertOriginMatchesCluster` already throws on a mismatch; the IDL loader now also throws if a loaded IDL's `address` ≠ the network's program id.
- **The human signs mainnet.** The agent builds the subscribe transaction (`scripts/txline-mainnet-subscribe.mjs`); the OWNER runs it with their funded mainnet wallet (keypair path via env). Automation never spends mainnet SOL. The wallet exists ONLY to pay the subscribe gas — the play-money invariant is untouched (no real-money trades, no deposits, no payouts).
- **Settlement does not move.** `omnipitch_core` stays devnet, `SETTLEMENT_LIVE` stays false, `proof-auditor` posture unchanged. Live marks arriving from mainnet do not make results trustable — only the finality gate does (ADR-037).
- Ingest selects the live network via `TXLINE_NETWORK` (default `devnet` — dev/replay behavior unchanged); the mainnet apiToken lives in `.env` as `TXLINE_MAINNET_API_TOKEN` (never committed; repo is public).

## Also decided (sponsor-native data widening)

- **Action events** (shot OnTarget/OffTarget/Woodwork/Blocked · free_kick Offside/foul · VAR Goal/Penalty/RedCard/SecondYellow, Stands/Overturned · substitution · penalties Scored/Missed/Retake) become a first-class bus topic `match.actions.v1` feeding the Events timeline — TxLINE-native, zero external sources.
- **Game phases 15 Abandoned / 16 Cancelled / 19 Postponed map to market VOID** in the lifecycle reducer (ADR-024): committed credits refund automatically off the feed's own phase code — trustless void, no admin path (there is none, ADR-017).

## Consequences

- A mainnet id appearing in a devnet path (or vice versa) is a bug; the guards throw, not warn.
- The mainnet subscribe must be renewed every 4 weeks by the owner (a calendar concern, not code).
- If the vendor's finality gate lands, settlement graduating networks is a NEW ADR — this one only splits data from settlement.
