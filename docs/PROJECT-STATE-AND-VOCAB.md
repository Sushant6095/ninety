# Ninety — Project State + Frontend Vocabulary (knowledge transfer)

_Synthesized from the full build. Use the vocabulary sections to write precise small-block FE prompts._

---

## 1. POINTER CHART — DONE vs REMAINING (priority)

### ✅ DONE — Backend (strongest part, ~95%)
- LMSR engine (single-writer, journal-then-ack, tested) · bus (Redis Streams) · schema (zod/AnyEvent)
- TxLINE client (live-verified devnet, 8 wrappers) · cortex pricing (Shin de-vig, hazard)
- Workers: ingest · cortex · jobs (settlement saga) · Anchor program (BUILT) · auth · Booth
- EarlyWhistle Telegram bot (mostly built, ADR-023) · ~257 tests green

### ✅ DONE — Frontend (surfaces exist)
- Landing (notio-based) · board · terminal · moments · competition · leaderboard · portfolio
- how-it-works · bracket · River-9 logo · single AppShell · halt sequence · component pass (magicui etc.)
- Baked: 118 flags · TheSportsDB crests/jerseys/player faces · stadium images

### ✅ DONE — Process/law
- CLAUDE.md (verification law · execution law · the ONE router → proven skills) · design-cop verdicts
- PROVENANCE gate · hooks · India submission (done)

### 🔴 REMAINING — by priority

**P0 — visible bugs / embarrassing (fix first)**
- [ ] Scramble heading gibberish ("Goal. kfci. mgqcfie.") — text-scramble makes headings unreadable
- [ ] 3D dribbler = grey capsules in an empty void → needs rigged GLTF model (human provides)
- [ ] Empty black voids on landing → fill with imagery/video
- [ ] Verify on PRODUCTION build, not dev

**P1 — backend construction (no credentials)**
- [ ] `POST /orders` (the trade path — currently `export {}`) → engine → fills → ledger
- [ ] `moments.ts` (empty stub) · games API · events/actions API · search API
- [ ] Rich data layer (cached free APIs: TheSportsDB/API-Football/Football-Data)
- [ ] API-contract alignment (endpoint shapes = frontend fixture shapes) — `docs/API-CONTRACT.md`
- [ ] Outcome-space synthesis: derive H/D/A from feed's O/U + Asian handicap (revive dixon_coles, quant-review)

**P2 — deploy (needs YOUR accounts/keys)**
- [ ] Supabase (Postgres) · Redis Cloud (30MB) · Fly (api + 4 workers)
- [ ] Deploy Anchor program to devnet (`anchor deploy` — NOT deployed, AccountNotFound)
- [ ] TxLINE live ingest (TXLINE_NETWORK + funded wallet)
- [ ] Wire frontend → live API (behind NEXT_PUBLIC_USE_FIXTURES)

**P3 — Solana as core**
- [ ] Real ProofBadge reads (@solana/web3.js) · wallet auth · leaderboard roots · moments cNFTs
- [ ] SETTLEMENT_LIVE stays FALSE (the forge — until TxODDS confirms finality)

**P4 — richness**
- [ ] Imagery/video pass (rights-free: Pexels/Coverr/Unsplash) · 3D dribbler (rigged model)
- [ ] Depth tabs (lineups pitch/stats/h2h/events) · Next Goal game · Telegram landing highlight

---

## 2. FEATURES YOU MAY HAVE FORGOTTEN
- **The settlement forge finding (ADR-036/037)** — your STRONGEST story: you broke your own settlement,
  proved it forgeable, and hard-gated it off. Lead your submission with this.
- **The two-source rule (ADR-051)** — TxLINE owns what MOVES; worldcup26/baked owns what SITS STILL.
- **The Booth** — AI commentary on every price swing (built, tested).
- **Moments** — biggest-swing cards, mintable as cNFTs.
- **VOID/refund on abandoned matches** — 19 TxLINE phase codes → trustless refund, no admin path.
- **Action events** — shot/free_kick/var/substitution → the events timeline (sponsor-native, free).
- **Mainnet SL12 = real-time free** vs devnet SL1 — for live match data.
- **/account = forecasting track record** — the "who predicts football best" credential (play-money angle).
- **Next Goal game** — free one-tap, resolves on a real goal.
- **GitBook docs** (sushi-2.gitbook.io/ninety-docs) — lead with the TxLINE endpoint map.

---

## 3. FRONTEND MAP — every page, section, component (the WORDS)

### Routes (pages)
`/` landing · `/board` (or `/matches`) · `/terminal` · `/match/[id]` · `/competition` · `/bracket` ·
`/portfolio` · `/account` · `/leaderboard` · `/moments` · `/moments/[id]` · `/proofs` · `/how-it-works` ·
`/profile/[handle]` · `/history` · `/settings` · `/onboarding` · `/replay/[id]` · `/play` (games) · `/docs`

### Landing sections (top → bottom)
`hero` · `the loop` (goal→halt→reprice) · `3D football scene` · `price is probability` (count-up number) ·
`velocity chapter break` · `the football experience` · `proof / on-chain` · `the booth` ·
`the tournament` (globe + stats) · `pricing` (free) · `games/moments/telegram bento` · `close CTA`

### Terminal components
`screener rail` · `score header` · `Momentum River (BigRiver)` · `market status panel` ·
`price cells (H/D/A)` · `trade panel` (buy/sell · size slider · Max · submit) · `portfolio card` ·
`open positions` · `leaderboard` · `today's movers` · `depth tabs` (Lineups·Stats·H2H·Events) ·
`the Booth` · `attack momentum` · `latest events` · `command palette (⌘K)`

### Board components
`ticker` · `header/nav` · `left rail` (my matches · WC stages · followed teams · settlement–Solana) ·
`match card` · `match list` (grouped by competition) · `featured panel` · `mini-river (sparkline)` ·
`right rail` (top traders · starting soon · moment of the day) · `biggest movers` · `footer`

---

## 4. UI / DESIGN VOCABULARY (words to ADD / REMOVE / TUNE)

### Tokens & palette (never raw hex)
`--bg #0B0D10` · `--surface #14171C` · `--hairline #232A33` · `--up #2BD97C` (green) ·
`--down #FF3D81` (pink) · `--halt #FFB020` (amber, halts only) · `--chain #9D6BFF` (violet, on-chain only) ·
`--text-hi #F5F7FA` · `--text-lo #97A0AF`

### Type
`Archivo` (display/hero) · `Inter` (UI) · `IBM Plex Mono` (numbers, tabular-nums, prices one decimal)

### Motion / effects vocab
`tick-flash` (180ms on price change) · `halt sweep` (amber) · `count-up / number ticker` ·
`Ken-Burns` · `parallax` · `scroll reveal` · `ScrollTrigger` · `pin` · `stagger` · `crossfade` ·
`draw-on` · `marquee` · `bento` · `spotlight card` · `border-beam` · `animated-beam` · `text-scramble`
(⚠ NOT on headings — makes them unreadable) · `shimmer` · `confetti` (game wins only)

### Layout / structure vocab
`hero` · `hierarchy` (one hero per screen) · `restraint` · `subtract-then-elevate` · `spacing scale` ·
`density` · `void` (bad — empty space to fill) · `scrim` (dark overlay for legible copy) · `mix-blend` ·
`gradient` (landing hero only, ADR-058) · `glassmorphism` (banned) · `full-bleed`

### States / a11y vocab
`hover` · `focus-visible` · `active` · `disabled` · `loading/skeleton` · `empty state` · `error state` ·
`prefers-reduced-motion` · `44px hit target` · `contrast` · `aria-live`

### Quality/process vocab
`token-only` · `re-skin` · `provenance row` · `design-cop verdict` · `read-out-loud test` ·
`MotionScore` · `FCP` · `local production build` · `lazy / IO-gated` · `canvas guard (width≠300)`

### Copy law (LEGAL — never break)
Say: `price · trade · credits · shares · points`. NEVER: `bet · stake · odds · wager · gamble`.
`play-money · no deposits · no payouts, ever`.

---

## 5. TOMORROW — TG BOT · APIs · BLOCKCHAIN (the parts you don't know)

### Telegram bot
- EarlyWhistle is MOSTLY BUILT (ADR-023, apps/worker-jobs): renderCard, sparkline buffer, send
  scheduler, per-match state machine, settled-card with Solscan proof + Moment photo.
- REMAINING: wire the stubbed Redis-backed readers (fixture/leaderboard/moment) + the getUpdates loop
  in main.ts · connect a real bot token · deploy worker-jobs · add a landing highlight section.
- HUMAN GATE: create the bot via @BotFather → TELEGRAM_BOT_TOKEN in .env (never chat/commit).
- Copy law applies in the bot (booth-filter enforces it).

### APIs (build order)
1. Align contract to frontend shapes (`docs/API-CONTRACT.md`) — FIRST.
2. `POST /orders` (trade) → engine.applyOrder → fills → ledger → WS. + `GET /orders`.
3. `moments.ts` · `/games/picks` · `/matches/:id/events` · `/search`.
4. Rich data layer: cached (Redis TTL) proxy over TheSportsDB + API-Football + Football-Data.
   Two-source law: STILL data only; live scores/prices stay TxLINE.
- HUMAN GATE: data-API free keys in .env.

### Blockchain
- Program is BUILT, NOT DEPLOYED (AccountNotFound) → `anchor deploy` to devnet (you have 1.99 SOL).
- Then: @solana/web3.js in web · real ProofBadge reads → working Solscan links · wallet identity auth ·
  leaderboard roots on-chain · moments cNFTs.
- SETTLEMENT_LIVE stays FALSE (the forge, ADR-036/037) until TxODDS confirms finality binding.
- Skills to use: solana-dev-skill (deploy) · quicknode/solana-finance-skill (chain reads).
- DO NOT install solana-agent-kit (real-money DeFi agent — violates play-money).

---

_The whole page is a market for ninety minutes. Priced by TxLINE. Settled on Solana. Play-money, forever._
