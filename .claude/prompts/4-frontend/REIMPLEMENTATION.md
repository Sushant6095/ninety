# PROMPT — Ninety frontend reimplementation · the tool router, the gate, the work

**Track:** Consumer & Fan Experiences · **Deadline:** Jul 19 · **Scope:** desktop web only (lg + xl). Mobile is OUT — do not spend an iteration on sm/md.

Read this whole file before touching a component. Parts run in order. **Do not skip to Part 4.**

---

## STATE OF PLAY (verified in the repo today — do not re-litigate)

**Already fixed. Leave it alone:**
- recharts: **gone** (0 imports). lightweight-charts is the only chart lib.
- GSAP: **legal and installed** (ADR-052) — `gsap`, `@gsap/react`, wrapper at `apps/web/src/lib/gsap.ts`.
- The design-reference lock: **lifted** (ADR-049 — the reference is INTENT, not a pixel target).
- One shell: **done** (ADR-050, `AppShell` in 6 files).
- WC26 context data: **baked** (ADR-051 — `src/data/wc26/*.json`, TxLINE still owns everything that moves).
- Deployed: **ninety-nu.vercel.app**. MotionScore: **overall S**.

**Still broken. This run fixes them:**
1. **`next/image`: 0 uses.** Raw `<img>` for flags/avatars → layout shift on every load. Most visibly cheap thing on the site.
2. **`axe-core`: installed, never run** — while design-cop keeps failing focus rings and contrast.
3. **3 scroll animations missing `will-change`** — MotionScore grades them **C**. It hands you a "Copy fix." Take it.
4. **Zero real animation on the board.** MotionScore literally detected **0 animations** — the S grade is cheap, because nothing moves. The halt money-shot does not exist.
5. **Hooks use relative paths** (`bash .claude/hooks/*.sh`) → they silently fail from any non-root cwd. Your entire law-enforcement layer is running on a coin flip.
6. **784 skills installed** → the agent cannot select, so it selects nothing.

**⚠️ NEW RISK — ADR-053 (WebGL/3D) contradicts two standing laws.** `three`, `@react-three/fiber`, `@shadergradient/react`, `camera-controls` are now in `apps/web` deps. But:
- `ui-craft §7`: *"Spline / WebGL / any 3D is FORBIDDEN in the app — GPU contention breaks the 150ms tick-to-pixel path, and it reads as demo-ware."*
- `CLAUDE.md` design law: *"No gradients."* `@shadergradient` is, definitionally, a gradient.
- MotionScore already grades texture memory **B (256MB)** with **7 overlap-promoted layers**, before any 3D renders.
**Ruling for this run (record it in an ADR): 3D/shader is QUARANTINED to `/how-it-works` and the landing hero — routes with no live tape. It NEVER renders on `/`, `/terminal`, or any surface carrying a price. Lazy-loaded, never in the shared bundle. If it ships anywhere near the tape, it will jank the demo and cost you the S.**

---

## PART 1 — FIX THE MECHANICS (do this first; nothing else sticks otherwise)

1. **Hook paths.** In `.claude/settings.json`, replace every `bash .claude/hooks/X.sh` with
   `bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/X.sh`. All seven. Verify each fires.
2. **Prune skills.** `mv` everything out of `~/.claude/skills/` into `~/.claude/skills-disabled/` EXCEPT:
   `ui-craft` · `component-picker` · `momentum-river` · `dataviz` · **one** taste/craft skill (prefer the
   emilkowalski set — he wrote Sonner and Vaul, which you already ship; he is the best in the world at
   *interaction feel*, which is exactly what's missing) · `txline-integration` · `anchor-settlement`.
   Delete nothing. Report what you kept.
3. **Verify the MCPs respond.** OriginKit, shadcn, context7, Motion. List the tools each exposes. If one
   is dead, say so — do not silently fall back to hand-rolling. (For the record: shadcn's registry
   returned **0 results for "bracket"**, and 21st.dev/magic **errored on a schema fault**. Those are
   facts, not excuses — but they mean you must log the search, not the absence.)

---

## PART 2 — THE ROUTER (§0 of ui-craft — the answer to "which tool, when")

Put this table at the TOP of `.claude/skills/ui-craft/SKILL.md`. ui-craft is the most-reliably-triggered
skill, so it becomes the dispatcher. **You do not decide which tool to use. You look it up.**

| I am building… | Route to | Never |
|---|---|---|
| **Generic primitive** — dialog, tabs, tooltip, popover, accordion, hovercard, scroll-area | **radix-ui** — *already installed, already in 7 files.* Re-skin to tokens. | Don't re-fetch it from a registry. You have it. |
| **Command palette** | **cmdk** (installed) | Hand-rolling a ⌘K |
| **Toasts** | **sonner** (installed) | Anything else |
| **Icons** | **lucide-react** (installed) | SVG by hand |
| **Styled layout pattern** — bracket, group tables, hero, empty states, cards | **OriginKit MCP → 21st.dev → shadcn.** Search all three, **log every search including the misses.** Copy in, re-skin to tokens. | Hand-rolling before you've searched |
| **Interaction feel** — hover, press, focus, "why does this feel cheap" | **emilkowalski skill** + **framer-motion** | Guessing at easing |
| **Choreographed sequence** — the halt, goal celebration, Moment reveal, River draw-on | **GSAP timeline** via `src/lib/gsap.ts` (ADR-052) | framer-motion for multi-step timelines |
| **UI state motion** — enter/exit, layout, tick-flash | **framer-motion** | GSAP for simple state |
| **Any chart** | **`dataviz` skill FIRST**, then **lightweight-charts** | Writing a chart blind. You did this 3×. |
| **Any image** | **`next/image`**, always, with explicit width/height | `<img>`. Zero exceptions. |
| **3D / shader** | **ONLY** `/how-it-works` + landing hero. Lazy. | Anywhere near a live price |
| **Ninety-specific** — MomentumRiver, MatchCard, PriceChip, trade ticket, ProofBadge, Booth | **Hand-build.** No registry has these — you invented them. | Wasting a search |
| **Any library API question** | **context7 MCP** | Writing the API from memory |
| **A11y** | **axe-core** (installed!) + `a11y-architect` | Waiting for design-cop to catch it |
| **Component work, generally** | **frontend-composer** agent — its own description says it MUST be used instead of hand-rolling primitives | Ignoring it, as before |
| **Every screen, last** | **design-cop** → then re-run **score.motion.dev** | "Looks fine" |

**One row, one tool. If nothing matches a row, it's Ninety-specific — hand-build it and say why.**

---

## PART 3 — THE GATE (why this run will differ from the last four)

Instructions get dropped under context pressure. Gates don't. So:

**`design/PROVENANCE.md`** — appended per component, no exceptions:

```
| Component | Row taken | Tool called | Searched (incl. misses) | Re-skinned | Shot |
|---|---|---|---|---|---|
| BracketTree | styled pattern | mcp__originkit__* | originkit:2 hits · shadcn:0 · 21st:err | tokens ✓ | impl/bracket.lg.png |
```

- **A component with no PROVENANCE row is NOT DONE.** Not "done but undocumented." Not done.
- Add **design-cop criterion 12 — PROVENANCE**: every non-Ninety-specific component in the diff has a row
  naming the row taken and the tool called. Missing → **FAIL**.
- `hand-rolled` is legal ONLY for the six Ninety pieces, and only with the searches logged.

---

## PART 4 — THE WORK (priority order — this is what a judge sees)

### 4.1 · THE HALT MONEY-SHOT — build this first, it is the demo
MotionScore detected **zero animations**. You built the most dramatic mechanic in this hackathon — goal →
market halts → reprices → spread decays — and it currently renders as a number quietly changing.

GSAP timeline (`lib/gsap.ts`), on the Terminal and the Featured panel:
`goal fires → River flashes → amber HALT sweeps the chart → prices visibly freeze with a "MARKET HALTED · repricing" band → the new price lands with a hard tick-flash → the spread decays over 60s.`
Amber `--halt` is halt-only — this is its moment. `prefers-reduced-motion` honoured. **This is the cold open of the demo video. Record it.**

### 4.2 · `next/image` everywhere — 1 hour, kills the cheap look
Every flag, crest, avatar. Explicit dimensions → no layout shift. Configure `next.config.mjs` remote
patterns for flagcdn. This is the single highest visual-quality-per-hour fix available.

### 4.3 · `will-change` fix — 10 minutes, protects the S
Three scroll-triggered `transform` animations are grading **C** on MotionScore. It gives you a "Copy fix."
Apply it. Then re-audit — because 4.1 is about to add real GPU load to a page already at **B** for texture memory.

### 4.4 · axe-core pass
Run it. Fix every focus-ring and contrast failure it finds. Stop letting design-cop discover these.

### 4.5 · /bracket + /competition — the registry surfaces
Real 104-match WC26 structure from `src/data/wc26` (knockout placeholder labels are already in the data).
Route: OriginKit → 21st.dev → shadcn for the layout; radix ScrollArea/HoverCard for chrome; GSAP to reveal
R32 → Final. This is also the foundation for Bracket Pick'em.

### 4.6 · Surface the Booth
Your most fan-native feature — built, tested, and buried in a grey line. Promote it: a live line that lands
with motion when a swing fires, quoting the real move. On the Terminal and the Featured panel.

---

## PART 5 — VERIFY (per surface, every time)
`node scripts/ui/screenshot.mjs <route> <name>` at lg+xl → **VIEW the shots** (this is the one loop that has
ever worked — your own audit says *"every real fix came from seeing the render, not from writing blind"*) →
**design-cop** (criteria 1–12) → fix each numbered gap → repeat until PASS.

**Then, once at the end: re-run score.motion.dev on the deploy.** The current grade is **S**. If the halt
sequence drops it below S, fix the animation — don't ship the regression. Report the before/after.

---

## GUARDRAILS (non-negotiable, no ADR overrides these)
- Tokens only in the OUTPUT. Zero raw hex, zero stock zinc. The token law applies to the re-skinned result,
  not to the moment of import.
- **Copy: price · trade · credits. NEVER bet / stake / odds / wager / gamble.** Not in code, not in a
  comment, not in a game.
- Play-money invariant: no deposits, no payouts, ever.
- No third-party iframes in the product.
- `prefers-reduced-motion` honoured on every animation, GSAP included.
- lightweight-charts is the only chart lib. The Momentum River stays the hero.
- Don't touch `apps/api`, `packages/`, or `programs/`.

**End with `/adr`.** Record: the 3D quarantine ruling, the router, and the provenance gate.
