# FINAL RALPH LOOP — run until Ninety is a 10/10 site. Do not stop.

This is the readiness-deciding loop. It outranks every other task. Paste the block into the terminal.

---

```
You are running the FINAL RALPH LOOP for Ninety. Your job is to take every surface to 10/10 and hold it
there. You do not stop, ask permission, or hand back control until the EXIT CONDITION below is met.
Deliberation is not a deliverable. Ship, look, score, fix, repeat.

═══════════════════════════════════════════════════════════════════════
PRIME DIRECTIVE
═══════════════════════════════════════════════════════════════════════
The owner opened the site and saw 40–50% of it broken, malfunctioning, or reading as AI slop. The terminal
is the worst of it. Treat that as the ground truth. Your standard is not "it renders" — it is: would a
first-time visitor call this the best football exchange they have ever seen?

Two references define 10/10 (ADR-049: reference = INTENT, never a pixel target, never their hex):
  • SOFASCORE  → information DENSITY, real crests/flags/photos, football texture, hierarchy that survives
                 a screen full of data.
  • HYPERLIQUID → CRAFT, calm, numeric precision, and GRAPH/CHART representation of live values.
Ninety must beat both by being the only one that is a live market.

═══════════════════════════════════════════════════════════════════════
THE 10/10 RUBRIC — score EVERY surface, 0–10 per axis, in the ledger
═══════════════════════════════════════════════════════════════════════
1. REAL DATA (weight ×2)  — every value on screen traces to a real source. Zero invented numbers.
2. NO SLOP                — no generic AI-template look: no filler copy, no decorative-only cards, no
                            centred-everything, no emoji bullets, no "Lorem"-grade text, no placeholder %.
3. DENSITY + HIERARCHY    — Sofascore-grade information per screen, with one clear focal point.
4. CRAFT + MOTION         — Hyperliquid-grade spacing, alignment, type scale, 150–250ms motion, tick-flash.
5. GRAPHS                 — live values are CHARTED, not just printed. River, sparklines, price paths,
                            form strips, distribution bars. A number with no visual is a missed 10.
6. CORRECTNESS            — zero overlaps, zero 404s, zero dead controls, zero contradictions, a11y clean.

A surface is DONE only at ≥9 on every axis AND 10 on REAL DATA and CORRECTNESS. Write the numbers down.
A score without a screenshot + named evidence is void.

═══════════════════════════════════════════════════════════════════════
STATE FILE — extend docs/ralph-ui-ledger.md (do NOT invent a new format)
═══════════════════════════════════════════════════════════════════════
Add a row for ALL 21 routes, each with the 6 axis scores + status:
  / · /terminal · /board · /match/[id] · /moments · /moments/[id] · /bracket · /competition · /portfolio
  · /leaderboard · /history · /how-it-works · /onboarding · /settings · /proofs · /play · /account
  · /profile/[handle] · /replay/[id] · /player/[id] · /team/[code]

PRIORITY ORDER (the owner records a demo on the terminal — it is worth more than the rest combined):
  1) /terminal   2) /match/[id]   3) /board   4) /player/[id] + /team/[code]   5) everything else
Landing `/` is already BEAT-OR-MATCH ✅ — re-verify it once, then leave it alone.

═══════════════════════════════════════════════════════════════════════
THE LOOP — one iteration
═══════════════════════════════════════════════════════════════════════
STEP 1 · BUILD REAL
  pnpm --filter web build && pnpm --filter web start   (:3000, PRODUCTION — never `next dev`, never a
  worktree; dev-green is not proof and has burned us twice).

STEP 2 · BE THE USER (this is the part that finds what tools miss)
  Walk the site as a first-time visitor with the keyboard and the mouse. Open every nav item, click every
  card, every tab, every button, every row. Write down EVERY moment you were confused, every dead control,
  every thing that looked unfinished. Rate the experience out of 10 and say why in one blunt sentence.
  Be harsh. "It works" is not the bar.

STEP 3 · MECHANICAL GATES (run all five every pass — these are not optional)
  G1 REAL-DATA AUDIT. For each surface, list every number/label on screen and its source: baked JSON |
     our API | TxLINE replay. Anything traceable to an invented literal, a placeholder, a rounded-looking
     guess, or a hardcoded array in a component = P0. Grep components for inline data arrays and magic
     numbers. Fabricated data is the SAME defect class as the fake Solscan links that nearly cost us the
     submission. Zero tolerance.
  G2 OVERLAP/COLLISION. In the screenshot pass, evaluate in-page: collect every visible element's
     getBoundingClientRect(), and flag sibling pairs whose rects intersect by >4px, plus any text whose
     rect exceeds its container. The owner reported components crossing each other — find them
     mechanically, at lg AND xl AND a narrow width, in BOTH themes.
  G3 TOKENS/SLOP. Zero raw hex, zero `neutral-`/`gray-`/`text-black`/`bg-white` classes, zero off-scale
     type values. Then run Impeccable (`impeccable` is already a devDependency, config at
     impeccable.config.mjs) and treat every finding as a real bug. On a token conflict, Ninety tokens win.
  G4 A11Y. node scripts/ui/axe.mjs on every route — 0 criticals. Keyboard reachable, visible focus,
     44px hit targets, prefers-reduced-motion honoured.
  G5 READ-OUT-LOUD. Enumerate every text element per screen and what it says. Any two that disagree
     (MARKET OPEN over a HALTED chart, two clocks, a team live in two matches, a minute that contradicts
     the fixture date) = P0. This has caught more real bugs than every tool combined.

STEP 4 · FIX, HIGHEST SEVERITY FIRST
  P0 = wrong/fake data, contradiction, overlap, dead control, 404, crash.
  P1 = slop, weak hierarchy, missing graph, motion/token breach.
  P2 = polish.
  COMPONENT SOURCING (owner's instruction + CLAUDE.md, reconciled):
    → PULL generic primitives AS-IS from the installed libraries and re-skin to tokens ONLY:
      shadcn → magicui → 21st.dev → godui → skiper. Tabs, dialogs, tables, scroll-areas, tickers,
      marquees, bento, cards, popovers, charts — do NOT hand-write these.
    → HAND-BUILD only the six Ninety-specific pieces, which by law cannot be pulled: the Momentum River,
      MatchCard, PriceChip, the trade ticket, ProofBadge, the Booth.
    → Every pull gets a design/PROVENANCE.md row (component · source · skill/tool). No row = not done.
  GRAPHS: wherever a live or historical number exists without a visual, add one from a library
  (lightweight-charts / Recharts / the magicui chart primitives) — price paths, sparklines, form strips,
  distribution bars, momentum. This is the Hyperliquid half of the bar.

STEP 5 · RE-VERIFY + SCORE
  Rebuild, re-screenshot at lg+xl in BOTH themes, LOOK at every image, re-run all five gates, re-score in
  the ledger with evidence. For canvas features assert canvas.width !== 300 (blank-River guard). For motion
  (halt, River, scroll-scrub) capture frames and WATCH them — a still cannot prove motion.
  Append one honest line to the ledger pass log. Write a design-cop verdict to design/verdicts/.

STEP 6 · LOOP. Go to STEP 1. Do not stop to report progress. Do not ask what to do next.

═══════════════════════════════════════════════════════════════════════
BLOCKERS — never let one stop the loop
═══════════════════════════════════════════════════════════════════════
If something needs the owner (an env var, a credential, a keypair, a paid tier, a decision):
  1. Append it to docs/BLOCKERS.md — what's blocked, the exact command/value needed, what it unblocks.
  2. Build everything around it, with an HONEST empty/degraded state (never a fake value).
  3. Keep looping. The owner fixes all blockers after the loop ends.

KNOWN BLOCKER, already true — read before you audit:
  Live in-play TxLINE ingest is OFF. It needs the Solana wallet keypair on the Fly machine + real
  TXLINE_DEVNET_JWT / TXLINE_DEVNET_API_TOKEN + a redeploy carrying the lazy signer (ADR-079). Also the
  devnet WC fixtures are pre-match, so the live feed may be empty even once enabled.
  → THEREFORE, the honest definition of "real data" for this loop:
     REAL = football-data.org live WC26 (standings, scorers, fixtures, results, squads — VERIFIED working
            on the deployed API), our own Postgres (markets, orders, moments, leaderboard), the baked WC26
            static set, and TxLINE REPLAY of genuinely captured payloads.
     FAKE = numbers invented by a developer or a model. These are what you delete.
  A recorded replay of real captured TxLINE payloads IS real data, time-shifted — and that is exactly how
  it must be described on camera. Never say "live" over a replay.

═══════════════════════════════════════════════════════════════════════
ANTI-SPIN (so the loop converges instead of orbiting)
═══════════════════════════════════════════════════════════════════════
- If a surface's score does not improve across TWO consecutive passes, change approach: swap the component
  source, delete the element rather than polishing it, or simplify the layout. Log WHY in the ledger.
- Prefer SUBTRACT-THEN-ELEVATE. Most slop is fixed by removing a card, not adding one.
- Never re-open a surface already marked DONE unless a gate regresses it. Progress must be monotonic.
- If you have looped 12 times with all remaining findings blocked on the owner, write the final report and
  stop — that is the only early exit.

═══════════════════════════════════════════════════════════════════════
EXIT CONDITION — all must hold on TWO consecutive passes
═══════════════════════════════════════════════════════════════════════
□ Every one of the 21 routes ≥9 on all six axes, with 10 on REAL DATA and CORRECTNESS
□ Zero P0 and zero P1 open
□ G1 real-data audit: zero invented values anywhere in the UI
□ G2: zero overlapping components at lg/xl/narrow, both themes
□ G3: zero raw hex / off-token classes; Impeccable reports zero findings
□ G4: axe 0 criticals on every route; reduced-motion honoured
□ G5: read-out-loud clean on every screen
□ Zero 404s and zero dead controls across the whole site
□ design-cop verdicts in design/verdicts/ for every surface, all SHIP
□ DEMO DRESS REHEARSAL passes (below)

FINAL GATE — DEMO DRESS REHEARSAL
Walk docs/demo/SCRIPT-5min.md and docs/demo/SHOT-LIST.md beat by beat on the production build, as if
recording. Every beat must work with real data on the first take: terminal loads, market prices, the River
moves, the halt sequence plays, a trade fills, the Booth explains it, a Moment mints, the proof link
resolves, the Telegram bot posts, search finds a player/team, their pages open. Any beat that stumbles is
a P0 — fix it and re-run the whole rehearsal from the top.

Then print: RALPH COMPLETE — <n> passes, all 21 surfaces 10/10, demo rehearsal green.
And list docs/BLOCKERS.md for the owner.
```

---

## Notes for Sushant (not part of the prompt)

**The one conflict I had to resolve for you.** You asked for "no mocks, all real" *and* a live-TxLINE demo.
Live in-play TxLINE is credential-blocked right now (keypair + tokens + redeploy), and the devnet WC
fixtures are pre-match, so the feed may be empty even after you fix it. Rather than let that stall the loop,
the prompt defines *real* as: live football-data.org WC26 (which I verified genuinely works — real
standings, real scorers, Mbappé/Messi), our own Postgres, the baked static set, and **replay of genuinely
captured TxLINE payloads**. Invented numbers are what get deleted.

That distinction also protects you on camera: a replay of real captured payloads is real data, time-shifted.
Say that. Never say "live" over a replay — that's the one thing a sharp judge could catch, and it would
undo the credibility your fail-closed settlement story earns you.

**Why the loop can actually terminate.** "Run until 10/10" usually either declares victory instantly or
never stops. This one has a numeric rubric per surface, evidence required for every score, five mechanical
gates that can't be argued with, monotonic progress, an anti-spin rule, and a two-consecutive-clean-passes
exit. That's what makes it a loop rather than an orbit.

**One thing you should decide now, not during the loop:** the `public/teams/` 101MB tracked in git, and the
856KB / 285KB baked JSON that must not enter the initial bundle (see `docs/DATA-PLACEMENT.md`). The loop
will flag them, but the call is yours.
