# THE REBUILD — Ninety frontend, demo-ready

**Track:** Consumer & Fan Experiences · **Deadline:** Jul 19 · **Scope:** desktop web (lg + xl) ONLY. Mobile is out — do not spend one iteration on sm/md.

Read the whole file. Parts run in order. **Do not skip to Part 5.**

---

## STATE OF PLAY — verified in the repo. Do not re-litigate any of this.

**Done. Leave it alone:**
- recharts **gone** · GSAP **legal + installed** (ADR-052, wrapper at `src/lib/gsap.ts`) · design-reference lock **lifted** (ADR-049) · one `AppShell` (ADR-050) · WC26 data **baked** (ADR-051) · deployed at **ninety-nu.vercel.app** · MotionScore **overall S**.

**Broken. This run fixes it:**
1. **MotionScore detected ZERO animations.** The S grade is cheap — nothing on the site moves. The halt money-shot does not exist.
2. **`next/image`: 0 uses.** Raw `<img>` for flags/avatars → layout shift on every load. The cheapest-looking thing on the site.
3. **3 scroll animations missing `will-change`** → graded **C**. MotionScore hands you a "Copy fix."
4. **`axe-core` installed, never run** — while design-cop repeatedly fails you on focus rings and contrast.
5. **Hooks use relative paths** → they silently fail from any non-root cwd. Your entire law-enforcement layer is a coin flip.
6. **784 skills installed** → no selection signal, so the agent selects none and hand-rolls.

**⚠️ Standing ruling — 3D/shader quarantine.** `three`, `@react-three/fiber`, `@shadergradient` are in deps (ADR-053), but `ui-craft §7` bans WebGL near the tape (*"GPU contention breaks the 150ms tick-to-pixel path"*) and the design law says **no gradients**. MotionScore already grades texture memory **B (256MB)** with 7 overlap-promoted layers — before anything 3D renders.
**Ruling: ONE ambient shader, lazy-loaded, on `/how-it-works` and the landing hero ONLY. It never renders on `/`, `/terminal`, or any surface carrying a live price.** Break this and you jank your own demo.

---

## PART 1 — BLUEPRINT FIRST (10 minutes, non-negotiable)

Before a single component: run **`superpowers:brainstorming` → blueprint**. Produce `design/BLUEPRINT.md` —
a screen-by-screen plan: for each route, the ONE hero, what demotes, which router row each component takes,
and what "demo-ready" means for it. A fast rebuild without a plan is just fast slop.

## PART 2 — FIX THE MECHANICS (nothing else sticks otherwise)

1. **Hook paths.** In `.claude/settings.json`, replace every `bash .claude/hooks/X.sh` with
   `bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/X.sh`. All seven. Verify each fires.
2. **Prune skills.** `mv` everything out of `~/.claude/skills/` into `~/.claude/skills-disabled/` EXCEPT the
   working set below. Delete nothing. Report what you kept.
   `ui-craft` · `component-picker` · `momentum-river` · `dataviz` · `page-load-animations` ·
   **emilkowalski/skills** · **greensock/gsap-skills** (gsap-core · scrolltrigger · timeline · react) ·
   **tasteskill** (`tasteskill.dev`) · `design-taste-frontend` · `superpowers:brainstorming` ·
   `txline-integration` · `anchor-settlement`
3. **Verify every MCP responds** — shadcn · magicui · 21st.dev · OriginKit · context7 · Claude-in-Chrome.
   List the tools each exposes. If one is dead, **say so** — do not silently fall back to hand-rolling.
   *(Known: shadcn returned 0 results for "bracket". 21st.dev/magic errored once on a schema fault. Log the
   search, not the absence.)*

---

## PART 3 — THE ROUTER · §0 of `ui-craft`

Paste this at the TOP of `.claude/skills/ui-craft/SKILL.md`. `ui-craft` is the most reliably-triggered skill,
so it becomes the dispatcher. **You do not decide which tool to use. You look it up. One row, one tool.**

| I am building… | Route to | Never |
|---|---|---|
| **Generic primitive** — dialog, tabs, tooltip, popover, accordion, hovercard, scroll-area, form | **radix-ui / shadcn MCP** — *already installed, already in 7 files.* Re-skin to tokens. | Hand-rolling. Re-fetching what you have. |
| **Animated candy** — tickers, number-rolls, marquees, shimmer, bento, reveals | **magicui MCP** (Framer-based, drops straight in) | Hand-rolling a number ticker |
| **Finished product surface** — nav, hero, pricing-grade layout | **21st.dev MCP** — **RATE-LIMITED: max 2 pulls/day.** Surgical only, for what shadcn + magicui cannot give. | Over-pulling and burning the quota |
| **Layout accents** | **OriginKit MCP** — *use, but it skews WebGL demo-ware.* Any WebGL piece falls under the 3D quarantine. | Putting an OriginKit shader near the tape |
| **Interaction feel** — hover, press, focus, "why does this feel cheap" | **emilkowalski skills** + **framer-motion** | Guessing at easing |
| **Choreographed sequence** — the halt, celebration, Moment reveal, River draw-on, scrollytelling | **greensock/gsap-skills** → GSAP timeline via `src/lib/gsap.ts` (ADR-052) | framer-motion for multi-step timelines |
| **UI state motion** — enter/exit, layout, tick-flash | **framer-motion** | GSAP for simple state |
| **Page choreography** | **`page-load-animations`** | Everything appearing at once |
| **Any chart** | **`dataviz` skill FIRST**, then **lightweight-charts** | Writing a chart blind. You've done it 3×. |
| **Any image** | **`next/image`**, always, explicit width/height | `<img>`. Zero exceptions. |
| **Taste / anti-slop check** | **tasteskill** + **design-taste-frontend** | Shipping something that reads AI-generated |
| **3D / shader** | `/how-it-works` + landing hero ONLY. Lazy. | Anywhere near a live price |
| **Football-product structure** — what goes where, which tabs, what a fan expects | **`docs/sofascore-research/`** (29 files, already done — see Part 4). Chrome MCP only to fill a gap it doesn't cover. | Taking their **colours** (they're light-mode). Re-scraping what's already researched. |
| **Ninety-specific** — MomentumRiver, MatchCard, PriceChip, trade ticket, ProofBadge, Booth | **Hand-build.** No registry has these — you invented them. | Wasting a search |
| **Library API question** | **context7 MCP** | Writing the API from memory |
| **A11y** | **axe-core** (installed!) + `a11y-architect` | Waiting for design-cop to catch it |
| **Assembling components** | **frontend-composer** agent | Hand-rolling primitives |
| **Every screen, last** | **design-cop** → **a11y-architect** → **MotionScore** | "Looks fine" |

---

## PART 4 — THE SOFASCORE REFERENCE — **`docs/sofascore-research/`**

**The research is already done. READ IT. Do not re-scrape the site.** 29 files:

```
architecture.md · navigation.md · motion.md · typography.md · spacing.md · colors.md · design-system.md
screens/     home · match · league · team · player · search · settings · responsive
components/  match-list-and-row · score-header · tabs · standings-table · incident-timeline
             data-viz · rating-badge · filters-and-chips · vote-and-poll · search
_reference-shots/  sofa-home-initial · sofa-home-top · sofa-match-top
```

**Read `README.md` first, then — before any screen — the matching `screens/*.md` and every `components/*.md`
it depends on.** Cite the file you used in that component's PROVENANCE row.

Highest-value files for this rebuild:
- **`components/match-list-and-row.md`** → the board. This is our densest, most-scanned surface.
- **`components/tabs.md` + `components/data-viz.md` + `components/incident-timeline.md`** → the depth tabs
  we still don't have (Lineups / Stats / H2H / Events).
- **`components/standings-table.md`** → `/competition`.
- **`navigation.md`** → why nothing in their product is more than ~2 interactions away. Our nav has drifted.
- **`motion.md`** → their whole product animates inside **50–500ms**, and their principle is *"motion is
  feedback and information, not entertainment."* That is exactly our motion law. Steal the discipline.
- **`components/vote-and-poll.md` + `rating-badge.md`** → cheap fan-engagement patterns for the consumer track.

### ⚠️ HARD LIMITS — these are law, and one of them is a trap

- **STRUCTURE ONLY. Never colour, never brand.** `colors.md` documents a product that is **light-mode by
  default, near-monochrome** (`#edf1f6` page, `#ffffff` cards, `#222226` ink). **Ninety is dark. Read that
  file to understand *how they spend colour on meaning* — never to take a value.** Any Sofascore hex landing
  in our code is a design-cop FAIL. Our tokens are the only palette.
- **Do not copy their markup, CSS, or assets.** Study the structure; rebuild it in Ninety tokens.
- **Never their betting furniture** — odds boards, bookmaker banners, ads. Anti-references, and they violate
  the play-money law. `settings.md` mentions an "odds format" preference: **we do not have one, ever.**
- The takeaway is *"a fan expects a tab bar here, with these five tabs, in this order"* — not their pixels.

**Claude-in-Chrome** is only for filling a genuine gap in the research (a component the folder doesn't
cover). Read the folder first. If you open Chrome, say which file was missing and why.

---

## PART 5 — THE GATE (why this run differs from the last five)

Instructions get dropped under context pressure. Gates don't.

**`design/PROVENANCE.md`** — one row per component, no exceptions:

```
| Component | Router row | Tool called | Searched (incl. misses) | Sofascore ref | Re-skinned | Shot |
|---|---|---|---|---|---|---|
| BracketTree | styled pattern | mcp__21st__* | shadcn:0 · magicui:0 · 21st:2 hits | — | tokens ✓ | impl/bracket.lg.png |
| MatchRow | Ninety-specific | hand-build | shadcn:0 · magicui:0 | components/match-list-and-row.md | tokens ✓ | impl/home.lg.png |
```

- **No PROVENANCE row = NOT DONE.** Not "done but undocumented." Not done.
- Add **design-cop criterion 12 — PROVENANCE**: every non-Ninety component in the diff has a row naming the
  router row and the tool call. Missing → **FAIL**.
- `hand-rolled` is legal ONLY for the six Ninety pieces, and only with the searches logged.

---

## PART 6 — THE WORK (priority order — this is what a judge sees)

### 6.1 · THE HALT MONEY-SHOT — build this first. It IS the demo.
MotionScore found **zero animations**. You built the most dramatic mechanic in this hackathon and it renders
as a number quietly changing.

GSAP timeline (`gsap-skills` → `lib/gsap.ts`), on the Terminal + Featured panel:
`goal fires → River flashes → amber HALT sweeps the chart → prices visibly freeze under a "MARKET HALTED · repricing" band → the new price lands with a hard tick-flash → the spread decays over 60s.`
Amber `--halt` is halt-only — this is its moment. `prefers-reduced-motion` honoured.
**This is the cold open of the demo video. Record it.**

### 6.2 · `next/image` everywhere — 1 hour, biggest visual-quality-per-hour win
Every flag, crest, avatar. Explicit dimensions → zero layout shift. Configure remote patterns for flagcdn.

### 6.3 · `will-change` fix — 10 minutes, protects the S
Three scroll-triggered `transform` animations grade **C**. MotionScore gives you a "Copy fix." Take it —
6.1 is about to add real GPU load to a page already at **B** for texture memory.

### 6.4 · axe-core pass
Run it. Fix every focus-ring and contrast failure. Stop letting design-cop discover these.

### 6.5 · /bracket + /competition
Real 104-match WC26 structure from `src/data/wc26` (knockout placeholder labels are already in the data).
shadcn/magicui for chrome, 21st.dev only if they can't deliver, GSAP to reveal R32 → Final.

### 6.6 · Depth tabs + surface the Booth
Lineups (native SVG pitch — **no iframes**), Stats, H2H, Events. Build them straight off
`docs/sofascore-research/components/{tabs,data-viz,incident-timeline}.md` — that's what a fan expects, and
it's the release valve our own law demands for density. And promote the **Booth**: your most fan-native
feature, built and tested, currently buried in one grey line.

---

## PART 7 — THE LOOP (every screen, every time)

**frontend-composer** (assemble) → **css-studio** (live visual) → `node scripts/ui/screenshot.mjs <route> <name>`
at lg+xl → **VIEW the shots** → **design-cop** (criteria 1–12) → **a11y-architect** → fix each numbered gap →
repeat until PASS. **context7** on tap for any library API.

> Your own audit: *"every real fix came from seeing the render, not from writing blind."* That loop is the
> only thing that has ever moved the pixels. Everything else in this file exists to feed it.

**Once at the end: re-run `score.motion.dev` on the deploy.** Current grade **S**. If 6.1 drops it below S,
fix the animation — do not ship the regression. Report before/after.

---

## GUARDRAILS — no ADR overrides these
- Tokens only in the OUTPUT. Zero raw hex, zero stock zinc. The token law applies to the **re-skinned result**, not to the moment of import.
- **Copy: price · trade · credits. NEVER bet / stake / odds / wager / gamble.** Not in code, not in a comment, not in a game, not in a Sofascore note.
- Play-money invariant: no deposits, no payouts, ever.
- No third-party iframes in the product. No copied markup, CSS, or assets from any live site.
- `prefers-reduced-motion` honoured on every animation, GSAP included.
- lightweight-charts is the only chart lib. The Momentum River stays the hero.
- Don't touch `apps/api`, `packages/`, or `programs/`.

**End with `/adr`** — record the router, the provenance gate, and the 3D quarantine.
