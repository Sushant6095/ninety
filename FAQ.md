# FAQ

**Is this gambling?**
No. Ninety is play-money by construction: you get free credits, they have no cash value, and there is no deposit, withdrawal, or payout path anywhere in the system — that's a design invariant, not a toggle. Product copy never uses gambling vocabulary; the constraint is enforced in code, down to a filter on the AI Booth's output (ADR-039). You trade a live probability the way you'd argue with a friend about the match — for rank, not money.

**Why is on-chain settlement disabled?**
Because we can prove the sanctioned settlement path is forgeable, and we won't ship that. TxODDS's `validate_stat_v2` proves a stat is Merkle-anchored in *some* batch of the fixture — not that it's the *final* score. A genuine mid-match proof could settle a wrong result. So `settle_market` is fail-closed (`SETTLEMENT_LIVE = false`) until a trustless finality gate exists, and the question is filed with the vendor. Every other on-chain defense is implemented and tested. Full story: [README → the settlement story](README.md#the-settlement-story), ADR-036/037.

**Can I run it without a TxLINE token?**
Yes. `packages/txline` ships a deterministic mock that serves real captured payloads (`docs/txline-samples/`), and `./scripts/replay.sh` replays an archived, finished WC26 fixture end-to-end through the real ingest → bus → pricing → engine pipeline. A token is only needed for the live feed.

**Why does the frontend render fixture data instead of the live API?**
Honesty over demo-magic. The full backend loop is real and tested, and the full frontend is real and designed — the wire between them (`lib/api.ts` → `/markets` + WS) is the top of the [roadmap](ROADMAP.md). The README states exactly what is wired and what isn't; judges punish overclaiming, not honesty.

**Where do the prices come from?**
TxLINE consensus odds (SSE) → Shin de-vig in the Python cortex → a fair mark (`0.2·model + 0.8·consensus`) + a hazard signal that drives LMSR liquidity `b(t)`. A goal halts the market, re-anchors it to the fresh mark, and reopens on a 3× spread that decays — the first traders back in pay for the uncertainty (ADR-005, ADR-022).

**What's actually on Solana?**
Only what needs trust: the market registry, the (fail-closed) proof-verified settle, matchday leaderboard Merkle roots, and receipt-guarded point claims from a PDA vault — live on devnet with 5/5 Anchor tests. Access to the data feed itself is authorized by an on-chain Token-2022 `subscribe` transaction. Nothing else — trading stays off-chain by design.

**Do I need a wallet?**
No. Sign up with email and a custodial keypair is provisioned invisibly (no seed phrase, no extension); you can export the key or connect Phantom/Backpack if you want self-custody (ADR-006/033).

**Why "Ninety"? And why do packages say `@omnipitch/*`?**
Every match is a market for ninety minutes — that's the product in one line. `omnipitch` was the working name; the package namespace predates the rename and renaming it would churn every import for zero user value (ADR-044). It's a namespace, not the brand.

**Why Redis Streams and not Kafka?**
Right-sized. The bus is one typed interface with two drivers; Redis Streams (consumer groups, reclaim, at-least-once) carries the current load on a free tier. The Kafka driver slot exists (`BUS_DRIVER=kafka`, a stub today) so the flip is an ADR, not a rewrite (ADR-007/020).

**Why is there a full changelog of design decisions?**
Chat is not memory. Every architectural, product, and design call gets an ADR in [`docs/adr/`](docs/adr/) before the code — 57 and counting. If you want to know *why* anything is the way it is, the answer is written down.

**How was this built?**
In the open, AI-natively, in about a week — with the process (agents, hooks, review loops, provenance ledger) committed to the repo. See [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) and [CHANGELOG.md](CHANGELOG.md).
