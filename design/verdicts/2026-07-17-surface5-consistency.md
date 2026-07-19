# design-cop verdict — SURFACE 5: CONSISTENCY PASS (leaderboard · account · competition · +board)

- **Date:** 2026-07-17 · Branch: `merge/live-integration`
- **Surfaces:** the remaining set — audited in parallel (leaderboard, account, play, competition, bracket, history, proofs, profile); real BLOCK/HIGH findings fixed.
- **Shots:** `s5-leaderboard-after.lg.png`, `s5-competition-after.lg.png`, `s5-account-after.lg.png` (LOCAL PRODUCTION build)

> Persisted by the parent agent, from the design-cop subagent (read-only). Round 1 = BLOCK (stale leaderboard render); round 2 (fresh shot) = PASS-WITH-NOTES.

## FINAL VERDICT: **PASS-WITH-NOTES**

The consistency sweep found real data-honesty bugs on the outlier surfaces; all fixed at root and verified. One LOW polish note remains (non-blocking).

## How the pass was run
A workflow fanned out 8 parallel audits (screenshot + look + read-out-loud + token/copy) across the remaining routes. Key structural finding: **only `MomentsGallery` used the empty-void `useLive` pattern** — the cold-void problem was Moments-specific; every other surface pins fixtures or degrades to them. The sweep then surfaced these outliers:

## Fixes (all verified in render or DOM)
1. **LEADERBOARD (BLOCK) — leaked QA data.** The page showed a SINGLE row (@verify_user, negative, 3-decimal P&L) from a successful-but-sparse live response (the `catch`→LEADERS fallback only fires on a thrown error), contradicting the chrome "RANK #142" and the board's own "Top traders" rail (which reads LEADERS). Root fix: `getLeaderRows()` PINNED to LEADERS (like `getBoardMarkets`/`getMomentList`); live path kept as `getLeaderRowsLive()`. Now 12 real traders (@pitchwizard +18,240 … @own_goal −640), no QA row, integer P&L, "#142" consistent as a top-12 view.
2. **LEADERBOARD + BOARD TradersWeek (TOKEN LAW) — chain-violet bronze medal.** Rank-3 used `bg-chain/15 text-chain` — chain is the on-chain-ONLY token, same misuse fixed on the Moments Legendary chip. Both ladders now climb in non-reserved tokens: up-green → bright-white → muted-grey (ringed, distinct from rank 4). Verified in the fresh render (rank-3 grey, ZERO chain-violet) and DOM.
3. **ACCOUNT (BLOCK) — live match claimed as settled.** The fills log had a SETTLED "BRA v KOR · +800 · 5 Jul", but BRA–KOR is LIVE (55') on the same page's watchlist, and "5 Jul" is future vs the board's Jul 4. Re-pointed to BRA–HAI (Brazil 4–0 Haiti, Group C, settled Jun 26 — already in the proof log). Verified: proof history shows "BRA v HAI 4–0" (settled/past); "BRA – KOR" survives only as the live watchlist entry — no collision.
4. **COMPETITION (HIGH + MED) — Group K overflow + badge understatement.** "Democratic Republic of the Congo" (33 chars) blew out the auto-layout table and clipped Group K's GF/GA/GD/PTS. Fix: `table-fixed` + column widths → the name truncates ("Dem… COD") and all 10 columns render, no overflow. And the per-group badge "Top 2 advance" understated the rule vs the subtitle ("top 2 + 8 best thirds") → now "TOP 2 + BEST 3RDS" (matches subtitle + the board's GroupStandings).

## "Not changed" calls — all upheld by design-cop
- The PROTOTYPE banner over LIVE badges (play/history/bracket) is DISCLOSED demo framing, not hidden fake-live.
- The play "EGY WIN %" sparkline is TREND-colored (pink only when the probability falls = correct semantics); auditor false positive.
- Account "GER v COL UPCOMING" moved mark (50→48.5, −30) is legitimate pre-kickoff market trading.
- Leaderboard/profile "no football texture" is inherent to trader-centric ranking surfaces (a P&L board isn't a team surface); not slop.
- Global footer "PROOFS ON SOLANA DEVNET" / "Live data from TxLINE" is infra/attribution alongside the honest PROTOTYPE banner; cross-cutting, out of scope.

## Rubric (both judged shots)
- **Leaderboard:** all 12 lines PASS (line 2 TOKENS cleared once the fresh shot proved the grey medal).
- **Competition:** all 12 lines PASS.
- Read-out-loud: zero text contradictions on either shot. Data honest: no leaked QA row, no live-over-settled fill, no fake mint, badge copy reconciled.

## LOW note (non-blocking)
- **Group A double-truncation:** South Africa (RSA) and South Korea (KOR) both truncate to "Sout…" in the fixed-width Team column; the 3-letter code disambiguates at lg, so it's readable. Polish only — raise later by promoting the code when the truncated name is non-unique.

**Bottom line: PASS-WITH-NOTES.** Two BLOCKs (leaked QA leaderboard, live-vs-settled account fill), one HIGH (competition overflow), and a token-law violation across two rank ladders — all fixed at root and verified in the render. One LOW polish note remains.
