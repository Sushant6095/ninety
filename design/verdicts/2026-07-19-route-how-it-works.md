# Ralph verdict — /how-it-works (route pass 10, pass 22) — THE TRUST EXPLAINER

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-how-it-works-vs-sofa.png`

## What it is
The in-app visual explainer. 10 sections, BRAND register (breathes more than the terminal): hero (calm rising
win-probability arc behind the headline) · the loop (pinned five-beat sticky-scroll) · **the proof flow** (godui
agent-flow graph + step-by-step timeline — the signature, React Flow sanctioned ONLY here) · TxLINE data backbone ·
open source · seven-layer architecture · WC26 coverage (dotted map) · six-step user guide · FAQ · footer.

## THREE WAYS OURS WAS WORSE (from the composite / read-out-loud)
1. **22 visible em-dashes (9.G)** across 9 section files — hero, the-loop lede+beat, proof panels+lede+badge,
   TxLINE cards+lede, open-source title+card, architecture lede, user-guide steps, FAQ answers, coverage lede.
   Fixed with correct punctuation, not a blanket middot: **prose → period/comma** ("proves the result, trustlessly";
   "no admin can change it." ; "each outcome (Home, Draw, Away) gets…"), **labels → house middot** ("Proof pending ·
   fail-closed", "Full time · winners paid", "Play money · no deposits"). DOM re-check after prod rebuild: **0**.
2. **Proof-flow graph node clipped its label** — the violet on-chain node rendered `txoracle.validateStat`
   (overflowed the fixed-width node box, "V2" lost) while the timeline + panel both say `validateStatV2`. Renamed the
   node → **`validateStatV2`**: it now fits with padding AND reconciles the read-out-loud (graph = timeline = panel).
   aria-label updated to match.
3. The Sofascore anchor has no explainer surface; comparison is cross-kind. Ours is a purpose-built trust walkthrough
   — the density anchor only governs craft (type scale, spacing rhythm, hairlines), which holds.

## READ-OUT-LOUD — RECONCILES + no fourth-wall.
- No "judges" / hackathon / "for the demo" copy anywhere (prior loop's judges→everyone fix holds; DOM `judge` = false).
  FAQ heading is "The questions everyone asks first."
- Proof flow is internally consistent: node `validateStatV2` ↔ timeline "Verified on-chain · validateStatV2" ↔ panel
  "verifies that proof on-chain via validateStatV2". The one live-state signal is honest: settle tx = **"Proof pending
  · fail-closed"** (ADR-036/037) — no fabricated Solscan sig, matching /proofs. Green step-checks are the pipeline
  bullets (teaching the mechanism); the pending chip is the truthful current on-chain reality.
- Numbers reconcile: "winning shares pay 100 credits" (graph, timeline, panel, user-guide, FAQ all agree); "104
  matches / 16 host cities / 3 countries" (coverage) ↔ WC26 skeleton; nav "Proofs 88" unchanged.
- Play-money armor intact: footer "free-to-play game, credits are play money and have no cash value"; FAQ "no deposits
  and no cash payouts, ever". Banned vocab (bet/stake/odds/wager/gamble): **0**.

## MECHANICAL CHECKS
- Em-dash (visible): **0** (was 22). Banned vocab: **0.** Fourth-wall/"judge" copy: **0.** Sibling-section
  overlaps (S9, getBoundingClientRect): **0** across all 10 sections. On-chain violet scoped to the validateStatV2
  node + Verified-on-chain step + step-6 (settlement) only.

## SLOP TAXONOMY: S1–S10 all 0.
S1 crescendo (hero arc → loop → proof flow → coverage map → CTA). S2 rhythm not uniform (BRAND air, Section
component enforces one eyebrow+display+lede cadence). S3 the 3-up "What proves/checks/settled" is a genuine
explanatory triad tied to the graph, not marketing filler; user-guide is a numbered 6-step, not icon-cards. S4 one
focal per section. S6 real display scale. S7 left-aligned, not centered-everything. S8 motion clarifies (beat pin,
flow tracing) not decorative. S9 clean. S10 numbers sourced + reconcile, no "live" over non-live.

## GATES
Clean prod build ✓ (rebuilt twice: em-dash sweep, then node fix) · dark ✓ · tokens only · proof-flow graph renders
full (node no longer clips) · fail-closed honesty intact (no dead Solscan href) · React Flow / agent-flow scoped to
this page only.
