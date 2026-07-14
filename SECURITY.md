# Security

Ninety is a play-money system — no funds are ever at risk — but it is built as if they were. This document covers the security model, what is deliberately locked, and how to report an issue.

## Reporting a vulnerability

Open a [GitHub security advisory](https://github.com/Sushant6095/ninety/security/advisories/new) or a private report to the maintainer ([@Sushant6095](https://github.com/Sushant6095)). Please do not open public issues for exploitable findings. You can expect an acknowledgement within a few days; there is no bounty program.

## The trust model

**Nothing in the result path trusts an operator.**

- **No admin result path.** The Anchor program's `settle_market` is permissionless and one-shot. It settles only by CPI-verifying a TxODDS Merkle proof against TxODDS's own on-chain oracle. There is no instruction that lets any key decide a result — by law (ADR-017), not by configuration.
- **Fail-closed settlement, on purpose.** Two adversarial audit passes proved that the vendor's sanctioned proof path does not bind *finality* on-chain — a genuine mid-match proof could settle a wrong result (ADR-036/037). The handler's first statement is `require!(SETTLEMENT_LIVE)` with `SETTLEMENT_LIVE = false`: every settle reverts before any state write until a trustless finality gate exists. **We do not ship a settle we can prove is forgeable.**
- **On-chain defenses already in place:** market↔fixture binding, oracle-program pin, stat-identity pin (home/away goal keys), one-shot settle, receipt-PDA double-claim protection on leaderboard claims, authority-gated root posting, PDA-owned vault.

## Play-money invariant

No deposits, no withdrawals, no cash payouts — anywhere, ever. This is a design invariant enforced in code: credits have no cash value, no payment path exists, and product copy is vocabulary-filtered (no bet/stake/odds/wager) down to a regenerate-or-drop filter on AI Booth output (ADR-039).

## Application security posture

| Area | Posture |
| :--- | :--- |
| Secrets | Never hardcoded. `JWT_SECRET` / `EMBEDDED_WALLET_SECRET`: **production boot throws if unset** (dev uses labeled insecure fallbacks). KDF domain separation for wallet derivation. |
| Admin surface | `POST /admin/replay` only; constant-time token compare; **unset token rejects everything** (secure default). |
| Webhooks | `POST /webhooks/helius` is fail-closed on a shared secret; events are idempotent by transaction signature. |
| Custodial wallets | Embedded keypairs derived behind email auth (ADR-006/033); export endpoint lets users leave custody; power users connect their own wallet instead. |
| Input validation | zod at every boundary — bus envelopes, TxLINE payloads, HTTP bodies. Wrong-plane bus handlers are a compile error. |
| Chain surface | Only `packages/chain` constructs transactions; only `packages/txline` talks to TxLINE (repo laws, hook-enforced). |
| Engine integrity | Journal-then-ack, single-writer lease, monotonic gap detection, quarantine on failed recovery — no partial state writes. |
| Supply chain | pnpm lockfile, CI on every push/PR (`lint · build · test`), no runtime CDN dependencies in the frontend (assets baked at build time, ADR-055). |

## Known limitations (stated, not hidden)

- On-chain settlement is **gated off** pending the finality answer from the data vendor (see above) — this is the system working as designed, not an oversight.
- The devnet deployment uses devnet keys and free-tier infrastructure; no mainnet ids are configured (intentionally blank in `packages/txline/network.ts`).
- `apps/web` currently renders baked fixture data; the auth/trading surfaces documented in [API.md](API.md) note which routes are stubs.
