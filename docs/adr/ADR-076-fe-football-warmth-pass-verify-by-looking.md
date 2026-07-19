# ADR-076 — FE "feel like football" pass: surface-by-surface, verified by looking

**Status:** Accepted · **Date:** 2026-07-17 · **Follows:** ADR-069/070 (landing), ADR-051 (two-source rule),
ADR-058 (dynamism / gradient scope), ADR-045 (no chart-lib per row), ADR-062 (baked TheSportsDB media).
**Amends/Supersedes:** ADR-073 decision #3 (read-model surfaces went live) — see Decision 1.

## Context
A surface-by-surface FE pass to inject real World Cup football warmth (real baked crests/flags, real match
narratives) without slop, and to eliminate read-out-loud contradictions, across landing, board, terminal, moments,
and the remaining surfaces. Each surface was improved, then VERIFIED on a local production build
(`pnpm --filter web build && start`), screenshotted, LOOKED at, read-out-loud tested, and gated by a design-cop
verdict written to `design/verdicts/`. Two verification-harness bugs were found and fixed first because they made
every screenshot untrustworthy (see Decision 8).

## Decisions

1. **Leaderboard + Moments (list AND detail) are PINNED to fixtures in code, like board/terminal (ADR-073 #2),
   reversing ADR-073 #3's "read-model surfaces go live".** The live universe produces read-out-loud contradictions
   the demo cannot ship: live `/moments` is empty, so the gallery showed a cold "No moments yet" void while the board
   headlines a "Moment of the day"; live `/leaderboard` returns a single seeded QA account (@verify_user, negative
   P&L) on a SUCCESSFUL response (so the catch->LEADERS fallback never fires), contradicting the chrome "RANK #142"
   and the board's own "Top traders" rail (which already reads the LEADERS fixture). `getMomentList`/`getMomentDetail`/
   `getLeaderRows` now return fixtures unconditionally; the live paths are kept as `getMomentListLive`/
   `getMomentDetailLive`/`getLeaderRowsLive` for CONNECT Phase 2. Fixtures are real baked data (real teams/swings),
   each keeping honest `mintSig: null` -> the cards render "mintless"/"MINTLESS - NOT ON-CHAIN", never a fake mint.

2. **"Moment of the day" has ONE source of truth.** The board RightRail hardcoded "The 38th minute - David - minted
   by @hexfan"; once the gallery was populated its hero (biggest swing = Croatia's late winner) contradicted it.
   RightRail now DERIVES the moment-of-the-day from the same MOMENTS max-swing selection the gallery uses, with honest
   "captured by" (mintless), not "minted by". Same principle already applied to "Starting soon".

3. **The chain token (violet, #9D6BFF) is on-chain-ONLY; it is banned as decoration.** Removed from rarity/medal
   styling where it was decorating non-on-chain elements: the Moments Legendary rarity chip (`RARITY_STYLE`), and the
   rank-3 "bronze" medal on both the Leaderboard and the board's TradersWeek. Ladders now climb in non-reserved
   tokens: up-green -> bright white -> muted grey (rarity/medal), reserving violet for genuinely minted artifacts.

4. **A re-enacted goal glyph must not claim the live minute.** The shared FeaturedPanel (board + landing LoopStage)
   River cliff read "Goal 74' - CAN" (the live clock) while the board's Moment card read "The 38th minute" - two
   elements disagreeing on when Canada scored. The glyph is now "Goal - CAN" (marks WHERE the price stepped; the
   Moment owns WHEN). The terminal's own BigRiver glyph keeps its minute ("GOAL 74' ASHOUR") because there the goal
   genuinely lands at the live minute.

5. **The halt wash is bound to the halted state.** In the shared `useHaltSequence` timeline the amber HALT wash rode
   the spread's decay, so it was painted for ~1.6s while the header still read "Market LIVE" (the exact "MARKET OPEN
   over a HALTED chart" contradiction the law names). The wash now fades in at the freeze beat and clears with resume;
   measured 0 LIVE-over-painted-wash frames on the terminal.

6. **The featured reprice derives both ends from the fixture.** FeaturedPanel/LoopStage previously stepped the OPEN
   price by a constant (+17), landing 58 - BELOW the live 61.4 - so the leader's price fell as Canada scored, and 58
   contradicted every other 61.4 on the page. Both ends now come from the fixture (open `spark[0]` 41 -> mark 61.4;
   score 0-0 -> 1-0) via a new `preGoalFrame` store writer; the halt replays the goal the fixture actually encodes.

7. **Anti-slop asset discipline (ADR-051, ADR-062).** Football warmth leads with assets we already own and that are
   real + licensed + WC26-specific: a wall of all 48 real national crests replaced the cold dotted globe on the
   landing (arranged as the actual 12x4 draw). Rejected: (a) the per-team TheSportsDB "stadium" fanart (`strFanart1`)
   as atmosphere - at least one (Canada) is a BROADCAST press photo of identifiable players, which violates the
   rights-free rule and implies endorsement; (b) guessed player faces on moment cards - "who scored" moves during a
   match -> TxLINE-owned (ADR-051), and a face from a ~10-player squad sample cannot be verified as the correct scorer
   (identity slop). Crests/flags/curves carry the warmth instead.

8. **Verification-harness fixes (foundational).** `scripts/ui/screenshot.mjs` now SETTLES after the scroll-through,
   not before: IO-gated choreography (the landing LoopStage) only MOUNTS during the scroll and needs ~3.7s to reach
   its resting frame, so settling first captured a mid-choreography transient (a pre-goal 41.0 frame under copy
   reading 61.4). Also: kill stale dev servers before capturing (a 3h-old server on :3000 served a stale build with
   400ing chunks and a blank hero - a false "ship-blocker"). The standing rule: verify on a FRESH local production
   build.

9. **Fixture data-honesty fixes.** Account settled fills must reference genuinely-settled matches: a SETTLED
   "BRA v KOR +800 / 5 Jul" fill collided with BRA-KOR being LIVE (55') on the same page's watchlist (and 5 Jul is
   future vs the board's Jul 4) -> re-pointed to BRA-HAI (settled Jun 26, already in the proof log). Competition
   GroupTable is now `table-fixed` so a 33-char name ("Democratic Republic of the Congo") truncates instead of
   clipping Group K's stat columns; the per-group badge is "Top 2 + best 3rds" to match the subtitle and the board.

## Deferred (with reasons)
- **Systemic fixtures <-> worldcup26 data divergence** (needs its own ADR): `GROUP_STANDINGS` in `rankings.ts`
  disagrees with the canonical `teams.json` group memberships for every group; FRA and SEN are both in Group I yet
  play each other in the R16 (a same-group pairing no standings edit can fix); `fixtures.ts` references teams not in
  the 48-team `teams.json` (ITA, NGA, DEN, SRB, CMR, HUN, SVK, UKR). Reconciling requires touching fixtures.ts +
  rankings.ts + data/wc26 across the whole app; a partial patch would be a symptom fix.
- **Broadcast-photo fanart curation:** the per-team `stadium.jpg` set is inconsistent (some flags, some broadcast
  player photos). The terminal money-shot is clean (AUS = flag), but `/match/[id]` for a team whose fanart is a
  broadcast photo would scrim one at opacity-10. Needs a curation/gating pass across ~47 images.
- **LOW polish** per the verdicts: Group A "Sout..." double-truncation (RSA/KOR, disambiguated by code); Moments hero
  motion literals -> motion tokens; `signedCR` on the swing delta drops a decimal; proofs footer present-tense
  "PROOFS ON SOLANA DEVNET" vs all-pending.

## Verification
Each of the five surfaces was verified on a local production build (build + start + screenshot at lg/xl + LOOK +
read-out-loud + blank-River/canvas guard) and gated by a design-cop verdict in `design/verdicts/`
(2026-07-17-landing-football-warmth, -board-, -terminal-, -moments-, -surface5-consistency). Verdicts: landing PASS,
board PASS, terminal PASS, moments PASS, surface-5 PASS-WITH-NOTES. All builds green; live prices verified moving;
zero page errors / zero HTTP>=400 on each.
