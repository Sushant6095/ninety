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

## Frontend pre-flight — before ANY change under apps/web
- **Invoke `ui-craft` FIRST — it is the router.** Skills don't auto-fire; you must call it. It reads
  the task and its §0 table names the ONE **proven** skill to invoke for it (emil-design-eng for
  motion, apple-design for fluid feel, design-taste-frontend for landing taste, gsap-skills for
  scroll, review/improve/find-animation for motion work). Invoke that proven skill.
- **NEVER invoke our custom/project skills** — momentum-river, proof-flow-viz, component-picker,
  dataviz. They are unproven and mess things up. The River and proof-flow page are hand-built to
  their specs (docs), not via a skill.
- **context7** before any library API you haven't verified this session. No API from memory — that
  was the blank-River bug.
- Pull generic primitives from shadcn → magicui → 21st.dev; log each in `design/PROVENANCE.md`.

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
- Palette (DARK, default): bg #0B0D10 · surface #14171C · hairline #232A33 · up #2BD97C · down #FF3D81 ·
  halt #FFB020 (halts only) · chain #9D6BFF (on-chain only) · text #F5F7FA / #97A0AF.
  **LIGHT-theme values** (near-white bg/surface + contrast-tuned accents readable on white) live in the same
  `tokens.css` under `:root[data-theme="light"]` (ADR-077) — the ONLY sanctioned second home for raw hex.
- ALL numbers: IBM Plex Mono, tabular-nums; prices one decimal (61.4). The up/down flash fires
  180ms on **every** tick and must **re-fire on rapid same-direction ticks** — a silent tape during
  a rally is a bug.
- Type: **Apple system font (ADR-077)** — SF Pro / `-apple-system` for display + UI, SF Mono for numbers
  (numbers stay mono + tabular). No webfont fetch; genuine San Francisco on Apple. Motion 150–250ms ease-out
  via the motion tokens; `prefers-reduced-motion` honoured everywhere, GSAP included.
- **DYNAMISM (ADR-058): the landing hero MAY be bold and alive** — an animated shadergradient
  background, GSAP scroll choreography, big display type, the live River owning the hero, and the
  halt sequence playing on scroll are all SANCTIONED there. The animated gradient is **LEGAL on the
  landing hero.** It stays BANNED on `/terminal`, the board, and any surface carrying a live price
  (GPU contention breaks the 150ms tick path). No glassmorphism, no lorem.
- **THEME (ADR-077): light mode is LIVE.** A token-driven light/dark toggle (`ThemeToggle`, in both the app
  header and the landing nav); `<html data-theme>` + the `dark` class are set before paint by a no-flash
  script, default = OS `prefers-color-scheme`, persisted to `localStorage`. Every surface + canvas themes off
  the tokens, so both modes render from ONE component set. The animated gradient stays landing-hero-only in
  both themes.
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

## Tool law — the router dispatches to PROVEN skills
- **`ui-craft` is the router** (a dispatcher, not a craft skill). Invoke it first for any apps/web
  work. Its §0 table maps the task → the ONE **proven, published** skill to invoke. You invoke that
  proven skill. The proven skills carry the craft; this file carries the constraints; the router
  connects them.
- **Proven skills the router dispatches to:** emil-design-eng · review-animations · improve-animations
  · find-animation-opportunities · animation-vocabulary · apple-design · design-taste-frontend ·
  gsap-skills. Install any that are missing before the session (the router can't dispatch to a skill
  that doesn't exist — the a11y-architect ghost taught us that).
- **NEVER invoke our custom/project skills:** momentum-river, proof-flow-viz, component-picker,
  dataviz. Unproven, they mess things up. River + proof-flow page = hand-built to their specs (docs).
- **GSAP is the primary animation tool** (see Design law); Framer for micro-interactions. No third lib.
- Generic primitives (dialog, tabs, scroll-area, ticker, marquee, bento) → PULL from
  shadcn → magicui → 21st.dev, re-skin to tokens. Hand-build ONLY the Ninety-specific pieces:
  River, MatchCard, PriceChip, trade ticket, ProofBadge, Booth.
- Every component gets a `design/PROVENANCE.md` row (source · skill/tool). No row = not done.
- **`design-cop` is an AGENT, not a skill** — the verification gate (caught the blank River, the fake
  proofs, the contradictions). It stays. Retiring custom skills ≠ skipping verification.

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
