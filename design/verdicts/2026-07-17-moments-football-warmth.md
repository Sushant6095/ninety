# design-cop verdict — MOMENTS (`/moments` + `/moments/[id]`) · football-warmth pass

- **Date:** 2026-07-17 · Branch: `merge/live-integration`
- **Surface:** the Moments gallery + moment detail/share card ("the emotional one")
- **Shots:** `moments-after.lg.png`, `moment-detail.lg.png` vs `moments-before.lg.png` (an empty "No moments yet" void)

> Persisted by the parent agent, verbatim-in-substance from the design-cop subagent (read-only tools). Round 1 = BLOCK (3 on-chain-honesty contradictions); round 2 (after fixes) = PASS.

## FINAL VERDICT: **PASS** (round 2)

The biggest before/after of the pass: a dead "No moments yet" void → a dense, hierarchy-clean, genuinely football-warm gallery. All round-1 blockers closed at root, verified in code and in the fresh shot.

## What changed this pass
1. **ROOT FIX — the gallery was an empty void.** `getMomentList`/`getMomentDetail` respected `USE_FIXTURES` and hit the empty live `/moments` API, while the board is PINNED to fixtures (`getBoardMarkets`). The Moments gallery was the ONE surface not pinned. Both are now pinned to the `MOMENTS` fixtures (live paths preserved as `getMomentListLive`/`getMomentDetailLive` for CONNECT Phase 2). Real baked fixtures, not fabricated live data; each keeps honest `mintSig: null`.
2. **SSOT for Moment-of-the-day.** Pinning surfaced a contradiction: the gallery hero (max swing = Croatia +33) vs the board's HARDCODED "The 38th minute · David · minted by @hexfan". The board's RightRail Moment-of-the-day now DERIVES from the same `MOMENTS` max-swing selection the gallery uses (the same fix "Starting soon" already got), with honest "captured by" (mintless), not "minted by". Verified: board == gallery, both "Croatia's late winner".
3. **Honest mint state everywhere:** gallery cards "MINTLESS", detail "MINTLESS — NOT ON-CHAIN" (no fake Solscan), board "captured by".

## Round-1 BLOCK → round-2 fixes (all verified in code + shot)
- **GAP A (fake on-chain subtitle):** "…and PROVED on-chain" over an all-MINTLESS set → "…and PROVABLE on-chain" (capability, not asserted state). The same fake-mint class this pass killed on the board, caught surviving in the gallery header.
- **GAP B (chain token as rarity decor on mintless):** `RARITY_STYLE.Legendary` was `text-chain ring-chain/50` — violet (on-chain-ONLY) on a mintless moment, with a self-refuting comment. Now `bg-up/15 text-up ring-up/60`; the ladder climbs in up-green (Common→Rare→Epic outline→Legendary filled). Verified: LEGENDARY chip renders green, `text-chain` gone. Chain violet reserved for genuine `mintSig != null`.
- **GAP C (Legendary filter empty under a Legendary hero):** the hero was excluded from `rest`, and Croatia was the only Legendary, so its own filter showed "No legendary moments yet". Now the hero shows only in the "All" view; a rarity tab renders a pure grid over ALL moments of that rarity. Verified: Legendary tab shows Croatia's card.
- **GAP 4 (invisible card focus):** MomentCard now `focus-visible:ring-2 ring-inset ring-up/50` (matching the hero).
- **GAP 5 (tab pills <44px):** now `inline-flex min-h-11 items-center` + `focus-visible:ring-up/60`.
- **GAP 6 (criterion-12 PROVENANCE FAIL):** six ledger rows added (MomentCard, MomentHero, MomentDetail, EquityCurve, Avatar, AppShell) with real registry searches logged honestly (21st "collectible moment share card" → decorative stat cards only → hand-build; magicui "avatar" → only avatar-circles; EquityCurve as the ADR-045 data-viz micro-primitive). Noted `PROVENANCE.md` landing holo card is a DIFFERENT file.

## Rubric (all 12 PASS)
HIERARCHY · TOKENS (chain misuse gone) · RESTRAINT · BLEND · MOTION · STATES · A11Y (card + tab focus rings, ≥44px) · COPY (no bet/stake/odds/wager; "provable" honest) · CONSISTENCY · ELEVATION (beats the void decisively) · FEELING (the LEGENDARY Moment-of-the-day hero with the self-drawing swing curve + the collectible rarity ladder) · PROVENANCE.

## Player-faces decision — AFFIRMED by design-cop (kept crests-only)
Not adding player faces is correct on three grounds: (1) can't verify the correct scorer from a ~10-player squad sample — a wrong face is the identity-slop the brief rejects (same standard as the broadcast fanart); (2) ADR-051 two-source law — "who scored" MOVES during a match → TxLINE-owned; baking a guessed face onto a mintless fixture fabricates live data the surface doesn't have; (3) coverage — 4 of 6 titles name no player. The surface reaches warmth via real crests, dramatic swing curves, the collectible rarity ladder, real match narratives, and owner avatars. If a verified scorer→face mapping ever arrives via TxLINE, add it only to titled moments.

## LOW notes (notes-only, NOT blocking)
- **7:** MomentHero motion literals (1.1s / ease `[0.16,1,0.3,1]`) should trace to `design/motion.ts`.
- **8:** swing delta uses `signedCR` (credits formatter) → "+33" beside "45.0 → 78.0" (drops the decimal). Math right, cosmetic.
- **9:** MomentDetail hand-assembles TerminalHeader+Footer vs the gallery's AppShell — hygiene, visually identical.
- **10:** mintless wording drift ("MINTLESS" vs "MINTLESS — NOT ON-CHAIN") — both honest.
- **11 (elevation, not a gap):** annotate the goal minute on the hero curve; scale card-curve amplitude to the real swing (`EquityCurve` currently normalizes each segment to its own min/max, so +8 and +33 draw equally dramatic). Take when next touching the curve.

### Verified (fresh build)
Board Moment-of-day == gallery hero (both "Croatia's late winner"), 6 moments render, detail pages 200 (no 404), zero page errors, zero HTTP ≥ 400.

**Bottom line: PASS.** Zero read-out-loud contradictions, honest mint state everywhere, tokens/play-money/reduced-motion clean, a11y ring + hit-target met, provenance complete — and it beats the empty-void reference decisively while feeling genuinely like football.
