# CLAUDE.md — read me every session

## Design law (violations are bugs)
- Colors ONLY via CSS variables in `design/tokens.css` / `apps/web/src/styles/tokens.css`. Raw hex in a component = bug.
- Palette: bg #0B0D10 · surface #14171C · hairline #232A33 · up #2BD97C · down #FF3D81 · halt #FFB020 (halts only) · chain #9D6BFF (on-chain UI only) · text #F5F7FA / #97A0AF.
- ALL numbers: IBM Plex Mono, tabular-nums; prices one decimal (61.4); flash up/down color 180ms on change.
- Type: Archivo (display/hero numbers) · Inter (UI). Motion 150–250ms ease-out; respect prefers-reduced-motion.
- Animation libs (ADR-052): Framer Motion (micro-interactions) + GSAP (heavy choreography — River draw, scrollytelling, SplitText), imported from `apps/web/src/lib/gsap.ts`. Both obey the motion tokens; no third animation lib.
- Signature element: the Momentum River. All visual boldness lives there; everything else stays quiet.
- Copy voice: plain verbs, sentence case. NEVER the words bet / stake / odds / wager in product copy — say price, trade, credits.
- No gradients, no glassmorphism, no lorem ipsum, no light mode (v1). Real WC26 data in every mock.
- Every page must visually match its reference in `design/screens/*.png`.

## Architecture law
- ALL inter-service communication flows through packages/bus. Two planes: domain events (AnyEvent, existing topics) and system signals (SysEvent, sys.* topics). Raw Redis/Kafka access is forbidden outside packages/bus — with two named intra-service exceptions that are storage, not communication: the engine journal and WS resume buffers.
- `apps/api/src/engine` is the single writer of market state. It must not import from `http/` or `ws/`. Journal-then-ack.
- Only `packages/txline` may call TxLINE. Only `packages/chain` may build Solana txs.
- The Anchor program verifies TxLINE proofs on-chain (`proof.rs`). There is NO admin result path. Do not add one.
- Play-money invariant: no deposits, no cash payouts, ever. Do not build features that violate this.
- WC26 two-source rule (ADR-051): TxLINE owns everything that MOVES during a match — scores, goals, halts, marks/prices, match state, results, who advances. worldcup26 (baked snapshot in `apps/web/src/data/wc26`) owns only what SITS STILL — flags, team metadata, groups/standings, the 104-match bracket skeleton, stadiums, fixtures. Tie-breaker: if a field moves during a match → TxLINE. worldcup26.ir is never a runtime dependency; re-bake via `pnpm --filter web wc26:refresh`. Flags are baked local PNGs in `apps/web/public/flags/` (re-bake `node apps/web/scripts/bake-flags.mjs` only when `FIFA_TO_ISO` in `src/lib/flags.ts` grows) — no runtime flag CDN; flagcdn stays OUT of `next.config.mjs` remotePatterns (ADR-055).
- New decision? Write an ADR in `docs/adr/` before coding it.

## Commands
`pnpm dev` all · `pnpm --filter api dev` one app · `docker compose up -d` infra · `pnpm test` · `anchor test` in `programs/omnipitch_core`.

## AI-native ops (ADR-008)
Agents: engine-guardian · proof-auditor · design-cop · quant-reviewer · test-fixer · adr-scribe (delegate proactively).
Commands: /adr · /ship · /screen · /spike-proof · /replay · /trace.
Hooks enforce the laws above and trace every action to .claude/trace/. Every decision made in a session MUST end with /adr — chat is not memory.
Skills: .claude/skills/ auto-trigger on matching work (momentum-river · txline-integration · anchor-settlement · add more via _TEMPLATE or plugins). Extension rails: skills folder, /plugin marketplaces, `claude mcp add` (or .mcp.json), new agents/*.md, new commands/*.md. NOW.md is the only file needing human discipline — keep it current.
