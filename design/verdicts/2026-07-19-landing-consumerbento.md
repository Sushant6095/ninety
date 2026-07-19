# Ralph verdict — landing CONSUMERBENTO / "Play the match" (section 8, pass 11)

- **Date:** 2026-07-19 · Pass 11 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-bento-vs-sofa.png`

## THREE WAYS OURS WAS WORSE (before fixing)
1. **A SECOND scroll marquee (design-taste marquee-max-one).** The Telegram card auto-scrolled its four match
   cards via magicui `Marquee`. VelocityBand is already the page's one marquee. Two marquees reads as lazy filler.
2. **Five em-dashes in visible copy (9.G hard ban)** — the headline ("match cards — all free"), the Next Goal
   copy, the Moments copy, the Telegram copy, and one TG card line ("Reprice — ENG steady").
3. **The scrolling cards couldn't be read.** A marquee shows the four Booth calls one-at-a-time; the product's
   whole loop (goal → halt → reprice → settle) is only legible as a SET.

## FIX (remove the 2nd marquee; keep the bento)
Replaced the Telegram `Marquee` with a **static 2×2 grid** of the four real Booth one-liners (CAN–MAR goal →
BRA–KOR halt → ENG–SUI reprice → ARG–ENG settle) — now all readable at once, and the page holds exactly ONE
marquee (VelocityBand). Removed the `Marquee` import + edge-fades. Fixed all five em-dashes → punctuation
(headline "…match cards. All free."). Match-pairing en-dashes (CAN–MAR …) kept (house convention). DOM-verified
zero em-dashes rendered.

## SLOP TAXONOMY (after): S1–S10 all 0.
- **Marquee-max-one: satisfied** (only VelocityBand). **S8** the 4 cards are static (no decorative auto-scroll).
- **Bento rhythm:** 3 cells for 3 items (Next Goal + Moments half-width, Telegram full-width) — 2+1, no empty
  tiles, has rhythm (design-taste bento rules). The 4 mini match-cards give the Telegram cell real texture.
- S3 not an equal-card grid · S5 specific copy (real Booth calls) · S9 no collisions · S10 numbers (41→61.4, 52.0, minutes) reconcile with the featured market · 9.G cleared. Play-money copy only.

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · tokens only · reduced-motion (now fully static — no marquee to gate).
