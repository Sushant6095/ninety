# OMNIPITCH frontend UI system — setup report

Status as of 2026-07-09. This documents the AI-native frontend system installed for `apps/web`,
how the build loop runs, and what's now in place. Backend is untouched.

## TL;DR
The UI build system is **installed, verified, and now has its reference target.** The ui-craft
loop (build → screenshot → design-cop → fix → repeat until rubric-green) is wired, the token/motion
source of truth is typed, an anti-slop CI gate is configured, and the **north-star design (the
OMNIPITCH UI Lock Kit) is now in the repo** at `design/screens/lock-kit/`. Next artifact: cut
per-screen reference crops from the North Star so `/screen` can converge on real targets.

## What was installed (commits 80f0612, 6d3d42d)

| Piece | Path | Role |
|---|---|---|
| **ui-craft skill** | `.claude/skills/ui-craft/SKILL.md` | The authoritative UI law — every apps/web change runs under it. |
| **proof-flow-viz skill** | `.claude/skills/proof-flow-viz/SKILL.md` | The one sanctioned React Flow use (how-it-works trust graph). |
| **design-cop agent** | `.claude/agents/design-cop.md` | The loop's judge — a 9-line PASS/FAIL rubric, upgraded from the old 5-point checker. |
| **/screen command** | `.claude/commands/screen.md` | Build/refine a screen; `--plan` and `--repair` flags; SCREEN-DATA-MAP wired. |
| **/design-review command** | `.claude/commands/design-review.md` | Score a screen without building. |
| **UI-loop standard** | `.claude/prompts/4-frontend/00-UI-LOOP-STANDARD.md` | The 7 rules pasted beneath every screen prompt. |
| **Screen→data map** | `design/SCREEN-DATA-MAP.md` | All 16 screens → REST (cold) / WS (hot) / chain surface. |
| **Tokens (typed)** | `apps/web/src/design/tokens.ts` | Single typed authority; maps names→CSS vars (hex stays only in `tokens.css`) + a canvas resolver. |
| **Motion (typed)** | `apps/web/src/design/motion.ts` | Timing/easing source of truth (180ms flash · 150–250ms ease-out · spring). |
| **Screenshot harness** | `scripts/ui/screenshot.mjs` | Playwright, sm/md/lg/xl → `design/screens/impl/` (gitignored). |
| **Impeccable gate** | `impeccable.config.mjs` + `ci.yml` | CI anti-slop gate; OMNIPITCH whitelist + 13 hard-fail rules; report-only until tuned. |
| **Lock Kit references** | `design/screens/lock-kit/` | ← NEW. The north-star designs + blend captures (see its README). |

## The design laws (from ui-craft)
- **Subtract, then elevate.** One hero per screen; everything else quiet or tabbed. The failure
  mode is the kitchen sink (prices + lineups + stats + referee at equal weight = stats site).
- **The blend.** Discovery = Sofascore; match-view spine = Polymarket (outcome→probability→chart→trade);
  match-view feel = Hyperliquid (dark/calm/fast, chart dominant); all football depth (lineups /
  stats / H2H / managers / referee / media) = Sofascore **inside tabs**.
- **The Momentum River is the hero** — ≥45% viewport on LIVE, lightweight-charts, `series.update()`
  only, event glyphs, amber halt overlay. Never a corner sparkline.
- **Tokens only** (no arbitrary Tailwind); **library law** (Next/React/TS + Tailwind + shadcn +
  lightweight-charts + Framer Motion + Lucide + Sonner; React Flow only on how-it-works; no 3D, no
  second chart/anim lib, no MUI/Chakra/Ant); **copy law** (sentence case, plain verbs, never
  bet/stake/odds/wager/gamble — say price/trade/credits).
- Palette semantics: **amber = halts only**, **violet = on-chain only**. Numbers IBM Plex Mono,
  tabular, prices one decimal.

## The loop
1. Build ONE component/state — tokens only, typed, wired to replay data per the data map.
2. `node scripts/ui/screenshot.mjs <route> <name>` → sm/md/lg/xl.
3. Run the **design-cop** agent vs the matching `design/screens/` crop.
4. Fix each numbered gap; repeat to all-PASS at 4 breakpoints, or 6 iterations then escalate.
5. `/adr` any decision → update `NOW.md` → `/ship`. **Done = design-cop rubric-green, not "looks fine."**

## Reconciliation notes (honest)
- **`tokens.ts` does not restate hex.** The design-law hook forbids raw hex in code; hex lives once
  in `tokens.css`. `tokens.ts` is the typed authority mapping names→`var(--…)` + a `resolveColor()`
  for the lightweight-charts canvas. One palette copy, hook-satisfied.
- **design-cop.md and screen.md already existed** and were upgraded (not clobbered) to the fuller spec.
- **playwright + impeccable are staged as devDependencies but NOT installed** (network deferred);
  CI runs `npx impeccable`. The Impeccable config shape should be confirmed on the first report-only run.

## Current status → next
- ✅ System installed + verified (files non-zero, frontmatter present, tokens/motion typecheck, no
  hex in the skill, full lint/test/build green).
- ✅ **North-star reference landed** — `design/screens/lock-kit/` (3 OMNIPITCH mockups + 19 blend captures).
- ▶ **Next artifact:** cut per-screen reference crops from `Omnipitch North Star (standalone).html`,
  named to `SCREEN-DATA-MAP` rows, starting with **match-LIVE** (the hero screen). Then run
  `/screen match-live` and let the loop converge.
