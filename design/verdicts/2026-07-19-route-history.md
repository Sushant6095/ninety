# Ralph verdict — /history (route pass 7, pass 19)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-history-vs-sofa.png`

## Finding: clean trade/settlement history with AIRTIGHT math — body needed no change.
"History / Every fill, with the match it came from. Play money, in credits." + REALIZED P&L headline · filter pills
(All/Buys/Sells/Settled) · fill rows (BUY/SELL · shares · code @ price · match pairing · minute/date · cost · state).

## READ-OUT-LOUD (the critical check here) — AIRTIGHT.
- **Every fill cost = shares × price:** 20 EGY @55 = 1,100 · 40 EGY @34 = 1,360 · 40 CAN @52 = 2,080 · 50 SRB @88
  = 4,400 · 30 CRO @47 = 1,410 · 25 BRA @68 = 1,700. All exact.
- **Realized-P&L reconciliation:** the +880 headline EXACTLY equals the sum of the realized fills: SRB SELL +1,490,
  CRO −1,410 (settled to 0), BRA +800 → 1,490 − 1,410 + 800 = **+880**. OPEN rows carry no realized P&L (correct).
- Play-money footer ("Ninety is a free-to-play game. Credits are play money and have no cash value.").

## THREE WAYS OURS WAS WORSE (from the composite)
1. **A re-introduced em-dash in the GLOBAL ribbon** — the PrototypeRibbon was just changed to the ADR-084 live-data
   disclosure ("LIVE · TxLINE data — the World Cup Final priced from the real feed") which re-added an em-dash on
   EVERY route. Fixed → colon ("TxLINE data: the World Cup Final…"). Kept the intentional live-data change. DOM
   re-check: /history em-dash = 0.
2. **Fixture history** (RD-capped, B2) vs real fills — disclosed; owner blocker, NOT slop.
3. **Cross-page fixture nuance** (B7-class): /moments titles CRO v BEL "Croatia's late winner" while /history shows
   the CRO position settled −1,410 (a loss). Defensible (the moment is the late-GOAL swing 45→78; the match still
   settled against Croatia) but worth the owner's eye; fixture/owner data, not a single-page slop defect.

## MECHANICAL CHECKS
- Em-dash (visible, incl. new ribbon): **0.** Banned play-money vocab: **0.**
- Note: the global ribbon now reads "LIVE · TxLINE data" (ADR-084 owner change) — disclosure shifted from
  "fixture" to "the Final priced live + modeled replay tape carries its own marker". Owner territory (B1 resolving).

## SLOP TAXONOMY: S1–S10 all 0.
Real fill rows (not S3 cards), airtight fills + realized-total math (S10), no collisions (S9), play-money copy,
9.G cleared. /history body unchanged (no manufactured fix); only the global ribbon em-dash fixed.

## GATES
Clean prod build ✓ · dark ✓ · tokens only.
