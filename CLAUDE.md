# CLAUDE.md — read every session

## What we're building
Ninety — a live football exchange for the FIFA World Cup 2026. Track: Consumer & Fan Experiences.
Terminal-grade data with consumer-grade feel: **Sofascore density + Hyperliquid craft + a dynamic,
alive hyperfoundation-style landing.** Play-money, priced by TxLINE, settled trustlessly on Solana.
The landing should feel ALIVE. The trading surfaces should feel FAST and CALM. Both should feel
like one premium product — never a template, never a stats portal, never a SaaS dashboard.

## Execution law — #0, above all else. The prompt is the spec.
- If the user's prompt says implement X, **implement X.** Do not ask clarifying questions, do not
  re-open settled decisions, do not pitch alternatives instead of building. Make the sensible
  default call and ship. Deliberation is not a deliverable. The user's prompt is law.
- The ONLY things that stop you — and these are hard GATES, not questions, and the user set them
  himself: (1) a secret/key about to be committed to a public repo, (2) a play-money violation
  (bet/stake/odds/wager, deposits, payouts), (3) a change that breaks the single-writer or
  on-chain-proof architecture. Flag those in ONE line, then keep executing everything else.
- **Verifying your OWN output is not "questioning the prompt."** Execute without asking — then LOOK
  at what you shipped (the Verification law below still binds). Shipping blind is not "just doing it."

## Frontend pre-flight — MANDATORY before ANY change under apps/web. Do these IN ORDER.
1. Invoke **ui-craft** (the §0 router) + **ui-ux-pro-max** + **design-taste-frontend**. Skills do NOT
   fire on their own — you MUST call the Skill tool. Not invoking them is a law violation.
2. **context7** on every library API you touch this session (GSAP, ScrollTrigger, lightweight-charts,
   Framer, shadergradient, anime.js, React Flow). No API from memory. The blank-River bug came from
   exactly that.
3. Search **shadcn → magicui → 21st.dev → OriginKit** for every generic primitive BEFORE hand-building.
   Log the searches (incl. misses) in `design/PROVENANCE.md`.
4. For motion feel invoke **emil-design-eng** + **taste-skill**.
Skip any step → the change is NOT valid, revert it.

## Verification law — READ FIRST. Shipping-without-looking is our #1 failure.
- A screen is NOT done until you have screenshotted it and **LOOKED at the image**. "It renders",
  "tsc passes", "design-cop passed" are NOT proof. The render is the only proof.
- **THE READ-OUT-LOUD TEST (mandatory, every screen):** enumerate every text element and what it
  says. If any two disagree, it is NOT done. This has caught more real bugs than every tool combined
  (MARKET OPEN over a HALTED chart; three clocks at once; a team live in two matches).
- **Motion is not verifiable from a still.** For the River, the halt, the gradient, scroll reveals:
  capture the MOTION and watch it. A blank/collapsed canvas passes a static check and ships broken —
  this exact bug shipped on our own landing.
- **Verify on a LOCAL PRODUCTION build — NOT the Vercel preview, NOT `next dev`/localhost dev-mode, NOT a worktree.** Dev-green is not proof: `next dev` hides SSR/hydration bugs and serves unoptimized — the blank River and the pre-goal-transient screenshot bugs only surfaced in a real build. The standing FE verify:
  1. `pnpm --filter web build` (production — catches SSR, hydration, tree-shaking, the real bundle)
  2. `pnpm --filter web start` (serve the prod build on :3000)
  3. `node scripts/ui/screenshot.mjs` against :3000 at lg+xl, with the SETTLE wait for animations
  4. LOOK at the shots · read-out-loud test · design-cop verdict to `design/verdicts/`
  5. Canvas features: assert every lightweight-charts `canvas.width !== 300` (blank-River guard)
  6. `/proofs`: grep the built output for `solscan.io` hrefs — any that remain must be real 87-char sigs; zero dead links
  **Vercel is ONLY the final public URL a judge visits — verify locally first, deploy after it's green.**
- design-cop WRITES its verdict to `design/verdicts/`. A verdict that lives only in chat is
  unfalsifiable and does not count.

## Design law (violations are bugs)
- Colors ONLY via CSS variables in `tokens.css`. Raw hex in a component = bug.
- Palette: bg #0B0D10 · surface #14171C · hairline #232A33 · up #2BD97C · down #FF3D81 ·
  halt #FFB020 (halts only) · chain #9D6BFF (on-chain only) · text #F5F7FA / #97A0AF.
- ALL numbers: IBM Plex Mono, tabular-nums; prices one decimal (61.4). The up/down flash fires
  180ms on **every** tick and must **re-fire on rapid same-direction ticks** — a silent tape during
  a rally is a bug.
- Type: Archivo (display/hero) · Inter (UI). Motion 150–250ms ease-out via the motion tokens;
  `prefers-reduced-motion` honoured everywhere, GSAP included.
- **DYNAMISM (ADR-058): the landing hero MAY be bold and alive** — an animated shadergradient
  background, GSAP scroll choreography, big display type, the live River owning the hero, and the
  halt sequence playing on scroll are all SANCTIONED there. The animated gradient is **LEGAL on the
  landing hero.** It stays BANNED on `/terminal`, the board, and any surface carrying a live price
  (GPU contention breaks the 150ms tick path). No glassmorphism, no lorem, no light mode (v1).
- **Animation libs (ADR-052, amended ADR-059): GSAP IS THE PRIMARY. Use it as much as possible —
  it is law.** All choreography, scroll (ScrollTrigger), draws, pins, SplitText, and the full GSAP
  component/scroll kit go through `apps/web/src/lib/gsap.ts`. Framer Motion for micro-interactions.
  **anime.js is SANCTIONED for advanced components GSAP/Framer don't cover** (staggered SVG morphs,
  timeline-sequenced glyphs) — import via a shared `lib/anime.ts` wrapper. ⚠ `law-guard.sh` currently
  BLOCKS anime.js; it must be updated to allow the wrapper before the first import, or the build fails.
- **React Flow** stays scoped to the how-it-works / proof-flow page (proof-flow-viz skill) — never on
  a live-price surface. **OriginKit** components are sanctioned; any WebGL piece obeys the gradient
  rule (landing hero only). **Impeccable (impeccable.style) is the CI anti-slop gate** — treat its
  findings as real bugs; on a token conflict, Ninety tokens win (documented in `impeccable.config`).
- The **Momentum River** is the signature element and the hero of trading surfaces. It must ALWAYS
  actually render — a collapsed or blank canvas is a ship-blocker, not a detail.
- Copy: plain verbs, sentence case. **NEVER bet / stake / odds / wager / gamble** in product copy,
  code, comments, or game names — say price, trade, credits. This is legal armor, not style.
- The reference in `design/screens/*.png` is **INTENT, not a pixel target (ADR-049).** A screen
  SHOULD beat its reference. design-cop judges the RUBRIC, not pixel-match. "Drift from the PNG" is
  NOT a failure — a screen that merely matches is NOT passing.

## Tool law — skills do NOT auto-trigger. You MUST invoke them. Using them is LAW.
- Skills load only their one-line description into context. To USE one you call the Skill tool.
  Nothing fires on its own. Not invoking a mandated skill is a law violation, not a shortcut.
- **Every FE session:** ui-craft (§0 router) · **ui-ux-pro-max** · **design-taste-frontend** ·
  **emil-design-eng** (feel) · **taste-skill** (anti-slop). Charts → **dataviz** BEFORE the first
  line of chart code. Landing → **gsap-scrolltrigger** + **page-load-animations**.
  (taste-skill and ui-ux-pro-max must be installed — if missing, install before the session.)
- **GSAP everywhere it fits — it is the primary animation tool (see Design law).** The GSAP UI/scroll
  component kit is sanctioned across the whole frontend.
- Any library API you have not verified THIS session → **context7 FIRST**. Guessing an API from
  memory is how the blank-River bug happened. Non-negotiable.
- Generic primitives (dialog, tabs, scroll-area, tooltip, number ticker, marquee, bento, sheet) →
  PULL from **shadcn → magicui → 21st.dev → OriginKit** and re-skin to tokens. Hand-building a
  generic primitive is a DEFECT. Hand-build ONLY the Ninety-specific pieces: River, MatchCard,
  PriceChip, trade ticket, ProofBadge, Booth.
- Every pulled or hand-built component gets a row in `design/PROVENANCE.md` (source · tool call ·
  searches incl. misses). No row = not done.

## Architecture law
- All inter-service comms through `packages/bus` (two planes: AnyEvent domain events + SysEvent
  sys.* signals). Raw Redis/Kafka forbidden outside `packages/bus`, except the engine journal and
  WS resume buffers (storage, not communication).
- `apps/api/src/engine` is the single writer of market state; it must not import from `http/` or
  `ws/`; journal-then-ack.
- Only `packages/txline` calls TxLINE. Only `packages/chain` builds Solana txs.
- The Anchor program verifies TxLINE proofs on-chain (`proof.rs`). There is NO admin result path —
  do not add one.
- **Play-money invariant: no deposits, no cash payouts, ever.** Do not build features that violate it.
- **WC26 two-source rule (ADR-051):** TxLINE owns everything that MOVES during a match — scores,
  goals, halts, marks/prices, match state, results, who advances. `worldcup26` (baked in
  `apps/web/src/data/wc26`) owns only what SITS STILL — flags, team metadata, standings, the
  104-match skeleton, stadiums, fixtures. Tie-breaker: moves during a match → TxLINE. worldcup26.ir
  is never a runtime dependency. Flags are baked local PNGs in `apps/web/public/flags/` — no runtime
  flag CDN (ADR-055).
- New architectural decision → write an ADR in `docs/adr/` before coding it.

## Hooks, agents, ops
- Hooks in `.claude/hooks/` block law violations at PreToolUse and gate the session at Stop. **If a
  hook is missing or broken, the law still binds — obey it anyway.** Never rely on "the hook will
  catch it." (settings.json has been invalid before, silently disabling every hook.)
- Agents — invoke proactively: **engine-guardian** (engine changes) · **proof-auditor** (Anchor) ·
  **design-cop** (every screen) · **quant-reviewer** (pricing) · **frontend-composer** (assemble
  components) · **adr-scribe** (write the ADR). If you name an agent, it must actually exist in
  `.claude/agents/` — do not credit work to an agent that isn't there.
- Every session's decisions end with **/adr** — chat is not memory. Keep `NOW.md` current.

## Commands
`pnpm dev` (all) · `pnpm --filter api dev` (one) · `docker compose up -d` (infra) · `pnpm test` ·
`anchor test` in `programs/omnipitch_core` · `pnpm --filter web wc26:refresh` (re-bake static data).
