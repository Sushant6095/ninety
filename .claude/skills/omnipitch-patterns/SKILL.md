---
name: omnipitch-patterns
description: Team workflow conventions for this repo — commit format, the ADR-before-code rule, prompt/GREEN logging, monorepo layout, colocated tests, and the bus/engine/txline/chain isolation laws. Use when committing, opening an ADR, deciding where a file goes, or wiring cross-service code. Extracted from git history (last 200 commits, 46 ADRs).
---

# omnipitch-patterns — how this team ships

Auto-derived from git. Domain *how-to* lives in the sibling skills
(ui-craft, anchor-settlement, momentum-river, txline-integration,
proof-flow-viz). This skill owns the *process*.

## Commit conventions

Format: `type(scope): summary (ADR-NN, prompt N)`

- **Types** (by frequency): `feat` · `fix` · `docs` · `chore` · `test` · `spike`
- **Scopes**: `web` · `chain` · `txline` · `intel` · `api` · `bus` ·
  `schema` · `ingest` · `auth` · `settlement` · `programs` · `adr`
- Almost every `feat`/`fix` names the ADR it implements, and often the
  prompt number: `feat(chain): settle_market on-chain proof gate … (ADR-036, prompt 19)`.
- Review-fix commits name the reviewer: `fix(api): apply quote/portfolio review findings (quant + typescript reviewers)`.
- Progress is logged as its own `docs` commit: `docs: log PROMPT 24 GREEN (8d8c7f2)`.
  Status vocabulary: **GREEN** (done) · **CUT** (dropped for v1) · **BLOCKED**.

## ADR-before-code (the core ritual)

`docs/adr/` holds 46 sequential ADRs (`ADR-NNN-kebab-title.md`). New
architectural, product, or design decision → **write the ADR first**, then
code it, then reference its number in the commit. `docs/adr/inbox.md` is the
staging area. Use the `/adr` command and the `adr-scribe` agent — chat is not
memory.

## Monorepo layout (pnpm + turbo)

```
apps/
  api            single writer of market state (engine + http + ws)
  web            Next.js frontend (see ui-craft skill)
  worker-cortex  pricing (see quant-reviewer)
  worker-ingest  TxLINE stream → normalize → bus
  worker-jobs    settlement saga, moments, booth, cards
packages/
  bus            ALL inter-service comms flow here (domain + sys planes)
  chain          ONLY caller that builds Solana txs
  txline         ONLY caller of TxLINE
  schema         typed event contracts (AnyEvent union, topics, envelope)
  config
programs/omnipitch_core   Anchor/Rust — on-chain proof verification
```

Organize by feature/domain, not file type. New file → put it in the app or
package that owns that concern; if it crosses services, it goes through
`packages/bus`.

## Testing

Colocated `*.test.ts` next to source (`apps/api/src/engine/amm.test.ts`,
`packages/bus/src/redis.test.ts`). Rust/Anchor tests run via `anchor test`.
`pnpm test` for the TS suite. `test-fixer` agent for the red→green loop.

## Architecture laws (violations are bugs — from CLAUDE.md, enforced by structure)

- Inter-service communication flows through `packages/bus` only. Two named
  intra-service exceptions (storage, not comms): the engine journal and WS
  resume buffers.
- `apps/api/src/engine` is the single writer of market state. It must not
  import from `http/` or `ws/`. Journal-then-ack.
- Only `packages/txline` calls TxLINE. Only `packages/chain` builds Solana txs.
- The Anchor program verifies TxLINE proofs on-chain — there is NO admin
  result path. Do not add one.
- Play-money invariant: no deposits, no cash payouts, ever.

## Working memory

`.claude/context/NOW.md` is the highest-churn file in the repo (35 edits) —
keep it current; it's the human-discipline handoff file. Session decisions end
with `/adr`.

## Agents & commands (delegate proactively)

Agents: `engine-guardian` · `proof-auditor` · `design-cop` · `quant-reviewer`
· `test-fixer` · `adr-scribe`.
Commands: `/adr` · `/ship` · `/screen` · `/spike-proof` · `/replay` · `/trace`
· `/feature` · `/design-review`.
