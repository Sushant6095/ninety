# Verdict — MAGICUI + SKIPER + GODUI + SVAR component pass · 2026-07-15

Judged shots: design/screens/impl/pass-{landing,board,terminal,how,play}.xl.png (+ sm/md/lg siblings)
Reference is INTENT (ADR-049); rubric judged, not pixel-match. axe: 0 on all five routes (given).

## Scores

1. HIERARCHY — PASS. One hero per surface: landing = headline+live chart; board = fixtures list
   (featured panel clearly secondary); terminal = the River, nothing at equal weight; play = the
   game card. Measured caveat: the River is ~36% of the live viewport height, under the 45% spec —
   gap #8, not an equal-weight failure.
2. TOKENS — **FAIL.** Chain violet on non-on-chain surfaces, introduced this session on /how:
   `apps/web/src/features/how/sections/TxLineSection.tsx:26` (Consensus-prices & Live-scores card
   icons in bg-chain/10 text-chain), `:47` (endpoint chips O3/S3/S1/F1 — REST endpoints, only S4
   feeds the chain), `:55` (external docs link in text-chain). Violet = on-chain only; the same
   page's PipelineBeams/ProofFlow scope it correctly, so the page contradicts its own discipline.
   Otherwise clean: zero raw hex in components, prices one decimal everywhere (61.4 · 57.6 · 32.2),
   numbers mono/tabular on every shot.
3. RESTRAINT — PASS. Terminal keeps Stats/Lineups/H2H/Events/Positions behind tabs; board density
   is discovery-legal; landing carries no stats dump. Note: left-rail Attack Momentum duplicates
   the River's job (demotion candidate, gap #8).
4. BLEND — PASS. Terminal spine intact: outcome (AUS/EGY) → probability (32.2/12.5/55.3) → River →
   Buy/Sell ticket. Board = Sofascore density in discovery only. Landing = alive hero, calm below.
5. MOTION — **FAIL** on two self-flagged, ADR-unsanctioned items (no ADR in docs/adr covers them):
   (a) `vendor/skiper/skiper52.tsx:31` animates flex-grow (`transition-[flex-grow]
   hover:grow-[2.2]`) — layout-property animation, banned outright; (b)
   `vendor/magicui/marquee.tsx:54` 40s infinite loop ticker on /board — idle/infinite animation on
   a live-price surface; the only sanctioned exception is ambient WebGL backdrops. Everything else
   is disciplined: dock clamp ≤1.15 + m.spring, confetti PRM→none, flow-field IO-gated,
   velocity-band PRM bug fixed, timings via motion.ts / lib/gsap.ts.
6. STATES — PASS. focus-visible rings across new components (skiper52 focus-within, sticky-scroll
   tabIndex+ring, agent-flow ring, PlayScreen link); play shows empty states ("No rounds yet",
   "Pick a side", zeroed streak dots); terminal exposes PRE/LIVE/HALTED/SETTLED. Caveat: a
   feed-loss/error treatment was not visible in stills and not re-verified this pass.
7. A11Y — PASS. axe 0 on all five (caller-verified); reduced-motion handled per component
   (marquee→static row, skiper52→equal width, velocity crawl bug fixed, confetti→none); contrast
   fix logged (velocity band /30 measured 1.67:1 → text-lo/70); facepile wrapped in one 44px link.
   Nit: board favourite-stars look sub-44px.
8. COPY — PASS on-surface. Play-money framing everywhere ("free-to-play", "play money, no cash
   value", "Make your call", "Trade this match"); no bet/stake/odds/wager/gamble in visible copy.
   Two flagged items in the gap list: an "odds" code comment (law covers comments) and the visible
   third-party brand "TxODDS" on /how.
9. CONSISTENCY — **FAIL** (read-out-loud, within-screen):
   (a) /terminal: scoreboard "0–1" + "GOAL — Ashour 74'" + Booth "reprices Egypt 31→55", while
   TODAY'S MOVERS reads "EGY v AUS — goalless at 74' — pressing" beside the live 55.3 ▲24.3
   (static note, `apps/web/src/lib/terminal.ts:76`). Same screen, two states of the same match.
   (b) /play: header wordmark "HALFTIME" (`apps/web/src/app/play/PlayScreen.tsx:22`) directly above
   "● LIVE 74'" — reads as two clocks; the bare uppercase span is indistinguishable from a
   match-state chip. Shell consistency itself is fine: board/terminal share one shell, landing/how
   share the marketing shell, play is deliberately chromeless with "← Board". (Play 0–0 vs terminal
   0–1 at the same 74' is capture-time skew across routes, not an in-screen bug — noted only.)
10. ELEVATION — PASS (beats). The shots exceed the three reference PNGs (northstar/home/terminal):
    bento movers, notification inbox, Booth terminal chrome, dock, proof graph, dotted host map,
    holo Moment card — none of which the references have. Not merely matching.
11. FEELING — PASS. The delight, named per screen: landing — the holographic Ashour Moment card and
    the 61.4 particle constellation; board — "The 38th minute" Moment of the Day; terminal — the
    River's goal spike annotated "GOAL 74' ASHOUR · 31 → 55" with the Booth narrating like a
    commentator; play — confetti-on-correct-call streak; how — the beam pipeline with the single
    violet Solana hop. A non-trading fan gets a story, not a spreadsheet.
12. PROVENANCE — PASS. Every component in the diff has a row in design/PROVENANCE.md ("Shipped rows
    — component pass", lines 72–97): router row + exact tool call + searches incl. misses (rejected
    21st.dev Astryx facepile logged with quota spend); deliberate-skips table present; the two
    composition rows (CreditPill, TradersStrip) trace to already-pulled vendor sources with
    non-blank search cells; licenses logged incl. skiper's missing license, flagged honestly. No
    hand-rolls outside the six sanctioned pieces.

## Gaps (by severity)

1. /terminal read-out-loud: make mover notes state-derived — `apps/web/src/lib/terminal.ts:76`
   "goalless at 74' — pressing" must flip when the Ashour goal fires (e.g. "Ashour repriced it
   31→55"). Static story next to a live price is the exact class of bug the law names.
2. /play two clocks: rename/disambiguate the "Halftime" wordmark
   (`apps/web/src/app/play/PlayScreen.tsx:22`) — ADR-060 names this surface Next Goal; a bare
   uppercase HALFTIME over "LIVE 74'" reads as match state.
3. /how token law: strip chain violet from `TxLineSection.tsx:26,47,55` — keep violet ONLY on the
   S4 stat-validation row; PipelineBeams' Solana hop already does it right.
4. Motion law: `vendor/skiper/skiper52.tsx:31` flex-grow animation — rework (clip-path/transform
   reveal) or write the ADR amendment sanctioning this one landing row. Currently unsanctioned.
5. Motion law: `vendor/magicui/marquee.tsx` infinite ticker on /board — ADR a "live tape" exception
   (pause offscreen; PRM already handled) or move it to update-driven motion. Same ADR should
   absorb the three flagged gradient tensions (magic-card spotlight on /board, backlight, holo
   foil) — flagged in PROVENANCE but never ADR'd; /adr is law.
6. Legal armor: `apps/web/src/lib/matchdepth.ts:2` comment says "odds" — the law covers comments.
   One-word fix ("marks"/"prices").
7. /how visible copy: "TxLINE / TxODDS documentation" (`TxLineSection.tsx:56`) renders "ODDS"
   on-surface; the 18:50 gap-fix claimed removal. Suggest "TxLINE documentation" (URL unchanged).
8. /terminal hero share: River ≈36% of live viewport height vs the 45% spec — grow its min-height
   and demote the left-rail Attack Momentum (it re-tells the River's story) to a tab/collapse.
9. Tokens nit: arbitrary dimension utilities in vendor pulls (`sticky-scroll.tsx:71` h-[30rem],
   `skiper52.tsx:31` sm:h-[200px], `agent-flow.tsx:637` max-w-[15rem]) — hoist to component CSS
   vars.
10. Landing nit: the HALTED featured card shows an active green "Trade this match" CTA — label it
    "View market" while halted.

## Overall

**FAIL — lines 2 (tokens), 5 (motion), 9 (consistency).** Everything else, including elevation and
provenance, genuinely passes — this pass beats its references and the provenance ledger is the best
in the repo. The three failures are small, named, and fixable in one sitting: two one-file copy/state
fixes, one violet-scope cleanup, and one ADR (or rework) for the marquee/flex-grow/gradient tensions
that PROVENANCE already flagged but no ADR ever sanctioned. Re-shoot /terminal, /play, /how after.

---

## Remediation addendum — same day, verified on the LIVE deploy (ninety-nu.vercel.app)

- Gap 1 FIXED: `lib/terminal.ts` mover note → "Ashour repriced it 31 → 55" (seed 55.3/▲24.3); live
  shot `impl/fix-terminal.xl.png` shows the note beside 55.7 ▲24.7, agreeing with the 0–1 board,
  the Booth line, and the River annotation.
- Gap 2 FIXED: /play wordmark → "NEXT GOAL" (the ADR-060 surface name); `impl/fix-play.xl.png`.
- Gap 3 FIXED: TxLineSection violet scoped — neutral discs on prices/scores cards, chain kept ONLY
  on the proofs card and the S4 endpoint chip; docs link neutral; `impl/fix-how.xl.png`.
- Gaps 4+5 SANCTIONED: ADR-063 (marquee live-tape exception, skiper52 flex-grow one-row exception,
  the three token-mixed gradient essences) — constraints codified, gate outranks exception.
- Gap 6 FIXED: matchdepth.ts comment "odds" → "prices". Gap 7 FIXED: "TxLINE documentation", lede
  de-branded. Gap 10 FIXED: featured CTA reads "View market" while halted.
- MotionScore gate: the pass initially measured desktop Thrashing C→D (B 58) — PricePath (skiper19)
  CUT from the tree and the velocity band rewritten onto CSS marquee keyframes; live re-audit
  B 65/100, desktop Thrashing C (baseline), GPU A. Cut logged in ADR-063 + PROVENANCE.
- Deferred (pre-existing, not this pass): gap 8 (River 45% viewport share + Attack Momentum
  demotion — plans/009 territory), gap 9 vendor dimension nits.

**Post-remediation: lines 2, 5, 9 PASS. Overall: PASS.**
