# design-cop verdict — credibility fixes (2026-07-16)

Branch `feat/credibility-fixes`. Two credibility bugs fixed: (1) `/match/[id]` rendered the SAME AUS-EGY
match for every id; (2) `/proofs` shipped fabricated Solscan sigs. Judge: **design-cop** agent, against the
ui-craft rubric, on `design/screens/impl/{match-featured,match-live,match-pre,proofs}.{lg,xl}.png`.
axe-core: **0 violations** on all four target routes (`/match/wc26-aus-egy`, `/match/wc26-bra-kor`,
`/match/wc26-eng-sui`, `/proofs`) at 1280×800.

## Scores (design-cop)

| Surface | Verdict |
|---|---|
| match-featured (`/match/wc26-aus-egy`) | CONCERN — premium & unchanged at xl; a **pre-existing** lg TradePanel collision (see below) |
| match-live (`/match/wc26-bra-kor`, PlainMatchColumn) | **PASS** — real, distinct, non-featured live match; zero AUS-EGY bleed; working trade panel |
| match-pre (`/match/wc26-eng-sui`) | **PASS** — honest pre-match identity, real crests/squad faces |
| proofs (reframed) | **PASS** — strongest surface; honest fail-closed narrative, violet on-chain token discipline, no dead links |

## Rubric: token-pure, copy-clean

- No raw hex in touched components (palette lives in `styles/tokens.css`); up=green / down=pink / amber halt-only /
  violet on-chain-only, all respected.
- `grep -i "bet|stake|odds|wager|gamble"` across `apps/web/src` = **zero**. Play-money framing throughout.
- The three `/match` routes are axe-clean; `/proofs` was axe-clean after giving the inline ADR links a persistent
  underline (fixed the one `link-in-text-block` finding).

## Gap dispositions

1. **HIGH (design-cop) — featured lg TradePanel collision — NOT FIXED, out of scope.** The featured
   `FeaturedMatchColumn` body + `TradePanel` are **byte-unchanged** by this fix (the function was only renamed and
   the SETTLED_RESULT sig emptied). The collision therefore pre-exists on `/terminal` at the ~1280 breakpoint today.
   The task's hard requirement is that the AUS-EGY money-shot render EXACTLY as today; fixing this would change it.
   Flagged for a separate pass (TradePanel.tsx:136 — `flex-wrap` the cost grid / button).
2. **MEDIUM — TerminalDock floats over content in full-page screenshots.** Capture artifact (`fixed bottom-3`),
   not a product defect. No change.
3. **MEDIUM — PROVENANCE completeness — FIXED.** Added rows for PlainMatchColumn, PlainMatchTabs, SquadPitch, and
   the ProofBadge honest-pending state (`design/PROVENANCE.md`, "Credibility fixes" section). All are compositions
   of existing Ninety pieces — no new third-party primitive pulled.
4. **LOW — pre-match "– 0.0 today" delta — NON-ISSUE.** That is the Delta component's intended neutral flat glyph
   (`Delta.tsx`: `|value|<0.05` → gray en-dash), not a negative-zero bug. Correct flat-market rendering.
5. **LOW — PlainMatchTabs defaults to Lineups; plain river reads calm.** Accepted (honest, tabbed, below the fold).

## Fix correctness (verified live via DOM read-out-loud + screenshots)

- `/match/wc26-aus-egy` → Australia 0–1 Egypt, 74', Lumen Field, REPLAY THE HALT, GOAL 74' 31→55 cliff, Next Goal,
  6 depth tabs, attack-momentum + latest-events rails — money-shot intact.
- `/match/wc26-bra-kor` → Brazil 2–0 South Korea, 55', BRA WIN% river, BRA 86.7 / DRAW 9.6 / KOR 3.7, working
  derived-LMSR trade panel, real BRA+KOR squad faces. No AUS-EGY data.
- `/match/wc26-eng-sui` → England vs Switzerland (PRE, "vs"), ENG 52.0 / DRAW 26.0 / SUI 22.0 read-only, Kicks off.
- `/match/<unknown>` → Next `notFound()` 404 UI ("This page could not be found"), NO fallback to AUS-EGY.
- `/proofs` → fail-closed narrative (validate_stat_v2 forge finding, ADR-036/037), per-row "Proof pending" violet
  chips, zero Solscan `<a>` hrefs.

**Net: 3 PASS + 1 CONCERN (pre-existing, out-of-scope). The credibility fixes themselves are sound.**
