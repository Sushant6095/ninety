# BLUEPRINT — Ninety frontend rebuild, demo-ready

**Track:** Consumer & Fan Experiences · **Deadline:** Jul 19 · **Scope:** desktop web (lg 1024 + xl 1440) ONLY.
Mobile (sm/md) is out — zero iterations on it.

Part-1 artifact for THE REBUILD. Governs every subsequent part. Grounded in a verified current-state scan of
`apps/web` (2026-07-13). **Effort is rationed to the demo script (`docs/demo/SCRIPT-5min.md`), not to route
count. The video is the artifact; the site is the evidence.**

---

## 0. Reality reconciliation (spec premise → verified state)

Spec *intent* stands; several *premises* were stale. Blueprint follows intent, corrected to reality.

| # | Spec said | Verified in repo | What actually changes |
|---|---|---|---|
| 1 | Zero animations | framer-motion live in `home`, `terminal`, `moments`, `how`. Halt choreography absent. | Build the **halt money-shot** (Tier 0). MotionScore measures the deploy; the choreography genuinely doesn't exist yet. |
| 2 | next/image everywhere; raw `<img>` for flags+avatars | 0 `next/image`; raw `<img>` in **only** `Flag.tsx` + `Avatar.tsx` | Fix **2 files** + `next.config` remotePatterns. Everything inherits. |
| 3 | 3 scroll anims miss `will-change` | `will-change` nowhere; 1 scroll (`Reveal.tsx`) + 2 mount transforms (`TradePanel`, `BracketA`) | Add `will-change:transform` to those animating elements. |
| 4 | Depth tabs missing (Lineups/Stats/H2H/Events) | Market/Stats/Lineups/H2H/Positions **exist** in `features/terminal`; only **Events** missing | Add **Events** tab (native SVG incident timeline) + polish existing. |
| 5 | Booth buried in one grey line | Booth = default active **"Market" tab** (prominent). The grey line is home `NewsStrip`. | Reframed — see §Booth. The work is the *arrival beat*, not placement. |
| 6 | `features/match` backs `/match/[id]` | `features/match` empty stub; `/match/[id]` → `TerminalScreen` | Work in `features/terminal`, not `features/match`. |

True & unchanged: hooks use relative paths (all 7), axe-core is an unused devDep, lightweight-charts is the
single chart instance (`MomentumRiver.tsx`, ADR-045), the six Ninety-specific pieces all exist.

---

## 1. Demo tiers (rationed to the video)

If `/terminal` and `/` are not genuinely beautiful, no amount of Tier-2 breadth saves the submission.

### TIER 0 — THE HALT SEQUENCE  (not a route · unlimited iterations · BUILD FIRST)
The cold open of the video (~2:10 in the script). One GSAP timeline (`src/lib/gsap.ts`), reduced-motion honoured:

> goal fires → **River flashes** → amber **HALT sweep** across the chart → prices **freeze** under a
> "MARKET HALTED · repricing" band → new price **lands** with a hard tick-flash → **spread decays** over 60s →
> **[beat] → THE BOOTH SPEAKS** (final beat).

Amber `--halt` is halt-only — this is its moment. Nothing else in Part 6 proceeds until this is beautiful.
**Deliverable at Gate A: screenshots + a short screen recording of the motion.**

### TIER 1 — FULL LOOP, UNLIMITED ITERATIONS  (the only two surfaces the video dwells on)
- **`/terminal`** — the halt lives here, plus the Booth (persistent under the River) and the depth tabs.
- **`/`** — the board.

### TIER 2 — ONE STRONG PASS  (montage, ~5s each)
- **`/moments`** — kill the flat grid, give it a hero. Most fan-native surface we have.
- **`/bracket`** — real 104-match WC26 structure, GSAP round reveal.

### TIER 3 — DON'T EMBARRASS  (never on camera; must not look broken if a judge clicks)
`/competition` · `/portfolio` · `/leaderboard` · `/how-it-works` · `/proofs` · `/profile` · `/history` ·
`/settings` · `/onboarding` · `/replay`
- **Exception — `/how-it-works`:** gets the ONE quarantined ambient shader (ADR-053) in its hero, and must
  render the proof-flow correctly. **The sponsor reads this page even if the video skips it.**
- **Retire from nav:** `/bracket-a`, `/bracket-b` (the A/B experiment). `/bracket` is the real one.

### CROSS-CUTTING (every tier, regardless — Gate E)
`next/image` (0 uses today → layout shift on every flag) · `will-change` fix · `axe-core` pass.

---

## 2. Booth — one component, one behaviour, two mounts

Not hidden — **static**. Fix the timing, not the placement. Do NOT build two Booth surfaces or enrich the tab
as a separate task. If the arrival works, the tab is already good enough.

1. **THE ARRIVAL** *(the real work — lives in TIER 0, inside the halt timeline).* The Booth line is the final
   beat: it **types/slides in** with a live speaking indicator, quoting the real move
   (e.g. *"Ashour's counter — Egypt 31 → 55"*). It must feel like it *reacted*, not like it was already there.
   GSAP, ~200–300ms entry, `prefers-reduced-motion` honoured.
2. **MOUNT A — `/terminal`.** Keep the Market tab as default (already right). But the live line must also be
   **persistently visible OUTSIDE the tab, under the River**, so it lands in frame during the halt even if the
   user is on another tab. A tab that must be clicked can't be part of a timed sequence.
3. **MOUNT B — `/` (home).** Replace the static `NewsStrip` "From the booth" with the **SAME** component, bound
   to the featured match. Quiet between events; alive on a swing.

Voice law: `booth-filter.ts` vocabulary. Never bet / stake / odds / wager / gamble.

---

## 3. Per-route notes (build-time reference)

Router-row shorthand (Part 3): `radix/shadcn` · `magicui` · `21st`(≤2/day) · `originkit` · `emil+framer` ·
`gsap` · `framer` · `page-load-animations` · `dataviz+lwc` · `next/image` · `hand`(Ninety-specific only).

- **`/terminal` (+`/match/[id]`)** — HERO: big Momentum River (`BigRiver`→`MomentumRiver.tsx`), ≥45%vh on LIVE.
  Demotes: `TradePanel` compact, `MatchTabs` below fold. Rows: River `dataviz+lwc`+`hand` · halt `gsap` ·
  Booth arrival `gsap`+`hand` · TradePanel feel `emil+framer` · tabs `radix/shadcn`. Add **Events** tab
  (`incident-timeline.md`, native SVG). Ref: `components/{tabs,data-viz,incident-timeline}.md`, `screens/match.md`.
- **`/` (home)** — HERO: live board (`CenterColumn`), mini-River per `MatchCard`. Demotes: rails, booth strip
  (→ becomes live Booth Mount B). Rows: flags/crests `next/image` · rows `hand` · Featured teaser `gsap`/`framer` ·
  `Reveal`+`will-change`. Ref: `components/match-list-and-row.md`, `navigation.md`, `screens/home.md`.
- **`/moments`** — HERO: `MomentHero` swing (has path-draw). Kill flat grid → give real hero + scannable grid.
  Rows: hero `framer` · cards `hand` · media `next/image`.
- **`/bracket`** — HERO: road-to-final tree (104-match from `src/data/wc26`). Rows: tree `hand`+`radix/shadcn` ·
  reveal `gsap` · crests `next/image`. 21st only if shadcn/magicui can't deliver (log misses).
- **Tier 3** — fix only: tokens (no raw hex), `next/image` on any avatar/crest, focus/contrast (axe). No new
  features. `/how-it-works` additionally: ambient shader (lazy, hero only) + ProofFlow renders (`proof-flow-viz`).

---

## 4. Mechanics fixed first (Part 2 — before any component)
1. Hook paths → `bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/X.sh` for all 7; verify one fires.
2. Prune `~/.claude/skills/` to the working set (mv rest → `~/.claude/skills-disabled/`, delete nothing, report kept).
3. Verify every MCP responds (shadcn · magicui · 21st · OriginKit · context7 · Chrome); list tools; name dead ones.
4. Paste the Part-3 router table as `§0` at top of `.claude/skills/ui-craft/SKILL.md`.
5. Create `design/PROVENANCE.md` gate + add design-cop **criterion 12 (PROVENANCE)**.

## 5. The provenance gate (Part 5)
`design/PROVENANCE.md` — one row per component: `Component | Router row | Tool called | Searched (incl. misses) |
Sofascore ref | Re-skinned | Shot`. **No row = not done.** `hand` legal only for the six Ninety pieces, searches logged.

---

## 6. Execution contract (approved cadence)

**PHASE 1 — autonomous, no stops: Parts 2 → 3 → 4 → 5.** Then **HARD STOP** and report with PROOF (not claims):
- the 7 hook paths fixed — **show one hook actually firing**;
- skills pruned — **list what was kept**;
- every MCP pinged — **list the tools each exposed, name any dead**;
- the router pasted into `ui-craft §0`;
- design-cop **criterion 12 (PROVENANCE) live — DEMONSTRATED** by running design-cop on an existing component
  with no PROVENANCE row: **it must FAIL.** If it passes, the gate is fake → fix before any Part 6.

Do NOT start Part 6 until the gate is proven and the user says go.

**PHASE 2 — Part 6, autonomous, check in at each gate. Show screenshots, not summaries.**
- **GATE A — Tier 0 halt sequence.** Don't move on until beautiful. Screenshots + short screen recording.
- **GATE B — `/terminal`** passes design-cop (1–12) + a11y-architect.
- **GATE C — `/`** (the board) passes.
- **GATE D — `/moments` + `/bracket`**, one strong pass each.
- **GATE E — cross-cutting:** next/image, will-change, axe-core. Re-run `score.motion.dev`; report before/after grade.

## 7. The loop (Part 7)
frontend-composer (assemble) → css-studio (live) → `node scripts/ui/screenshot.mjs <route> <name>` lg+xl →
VIEW shots → design-cop (1–12) → a11y-architect → fix each numbered gap → repeat to PASS. context7 for any API.

## 8. Guardrails (no ADR overrides these)
Tokens only in output (zero raw hex/zinc in the re-skinned result) · copy = price/trade/credits, NEVER
bet/stake/odds/wager/gamble · play-money invariant (no deposits/payouts) · no third-party iframes, no copied
markup/CSS/assets · `prefers-reduced-motion` on every animation incl. GSAP · lightweight-charts is the only chart
lib · Momentum River stays the hero · don't touch `apps/api`, `packages/`, `programs/`. End with `/adr`.
