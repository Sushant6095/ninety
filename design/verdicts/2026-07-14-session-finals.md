# Design-cop verdict — 2026-07-14 session finals (landing · board · terminal + depth tabs)

Judged: `design/screens/impl/{landing-final,board-final,terminal-final}.{lg,xl}.png` + `terminal-tab-{stats,lineups,h2h}.xl.png`
References: `design/screens/{home,terminal,northstar}.png` (intent, per ADR-049)

## Round 1 — full rubric

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Hierarchy | PASS | One hero per screen; River owns ~45–49% of the terminal fold; no equal-weight triples |
| 2 | Tokens | **FAIL** | Colors perfect (zero raw hex outside tokens.css) — but an un-tokenized tracking scale (`tracking-[0.08–0.2em]`, ~25 sites) + stray magic sizes |
| 3 | Restraint | PASS | All football depth behind MatchTabs; primary surface spine-only |
| 4 | Blend | PASS | Polymarket spine · Hyperliquid calm · Sofascore depth-in-tabs |
| 5 | Motion | PASS | All timings from design/motion.ts; transform/opacity only; reduced-motion enforced; infinite loops encode state |
| 6 | States | PASS | hover/active/disabled/focus universal; loading/empty/error present. Forward gap: no feed-degraded surface (must land with live wiring) |
| 7 | A11y | **FAIL** (terminal+board) | Focus/contrast/reduced-motion pass; secondary controls at ~24–32px hit height (9 files named) |
| 8 | Copy | PASS (judged screens) | price/trade/credits, sentence case. Advisory: /how FAQ rendered a banned word in denial |
| 9 | Consistency | PASS | One shell verbatim across board/terminal; CTA verbatim ×3 on landing. Nit: two KO-times phrasings |
| 10 | Elevation | PASS | All three screens beat their references (depth tabs, Booth call log, CrowdCall, movers coherence, power rankings) |
| 11 | Feeling | PASS | The Booth over the goal cliff; Moment of the day; the hero tape caught mid-halt |
| 12 | Provenance | PASS | Every non-Ninety row present incl. the rejected 21st.dev pull, no blank Searched cells |

**Round 1 overall: NO-SHIP** on two systemic drivers — the un-tokenized tracking scale (2) and sub-44px secondary hit targets (7).

## Fix pass (same session)

- `tracking` scale added to `src/design/tokens.ts` (micro 0.08 · tag 0.1 · label 0.12 · caps 0.14 · banner 0.16 · hero 0.2 · wide pinned 0.025 · tight −0.02 · tighter −0.03), mapped in `tailwind.config.ts`; every `tracking-[…em]` swept to named steps — grep returns zero arbitrary tracking in `apps/web/src`.
- Hit targets: real `min-h-11` on stacked rows (RightRail top traders, LeftRail ×3 lists, TournamentLeaderboard, TodaysMovers, CrowdCall); `.hit` utility (44px centered invisible strip, `globals.css`) on compact horizontal controls (TradePanel size chips + Max, MatchStates pills, BigRiver replay, MatchHeader favourite). `min-h-[32px]` → `min-h-8`.
- Gap 7 advisory: FAQ → "Is this real money?". The `/api/odds/stream` endpoint path is deliberately kept — it quotes the upstream API verbatim; renaming would misdocument the integration.
- Gap 8 nit: one KO-times string ("Kick-off times UTC") on board + terminal.

## Round 2 — focused re-verify (drivers only)

- Driver 1 (tracking): first re-check FAILED on four negative-tracking survivors (`-0.02/-0.03em`); `tight`/`tighter` steps added and swept — grep clean.
- Driver 2 (hit targets): PASS — all named sites verified, `.hit` CSS correct, re-shot stills show no rhythm/baseline regression.

## Final verdict

**SHIP** — Driver 1 PASS (zero arbitrary tracking values; scale + mapping + all four former survivors verified token-sourced; `theme.extend.letterSpacing` now consolidates Tailwind's `tight`/`tighter` onto the tokens, an imperceptible −0.025 → −0.02em shift). Driver 2 PASS (min-h-11 on every named stacked row, `.hit` correct at all four compact-control sites; re-shot stills show no rhythm or baseline regression).

## Carried follow-ups (logged, not blocking)

1. Feed-degraded state (stale/reconnecting, `lo` ink — never amber) must land with live wiring.
2. `.eq-bar` loop lifetime → bind to Booth-speaking state, pause offscreen.
3. `h-[346px]` LoopStage reservation → name it or derive from FeaturedPanel.
4. `left-[13px]/[16px]` flag offsets in portfolio/history → space-scale tokens.
5. /how TxLineSection: label endpoints by role, demote raw paths to mono captions.
6. Board movers cards: mini price-path sparkline with halt notches (elevation raise).
7. `text-[clamp(…)]` in how/sections/Hero.tsx → type token.
