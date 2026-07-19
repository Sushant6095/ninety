# Ralph verdict — landing PRICE IS PROBABILITY section (pass 4)

- **Date:** 2026-07-19 · Pass 4 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-price-before-after.png` (BEFORE occluded | AFTER legible | REF)

## THREE WAYS OURS WAS WORSE (named from the composite, before fixing)
1. **The number was occluded (S4/S9/S10).** PriceVoid is a black-hole accretion disk whose densest particle cluster sits dead-centre (cx,cy) — the exact position of the centered giant "61.4". The light-grey (`textLo`) particles bloomed a bright core that filled the gap around the decimal → the number read "61●4". The one number the whole section exists to show was partly unreadable.
2. **Copy over busy orbit.** The explanatory line sat directly over the orbit dots — muted `text-lo` on a busy field, low contrast.
3. **Two focal points.** The bright orbit core competed with the number for the eye instead of framing it.

## FIX (one token-derived focus veil)
Added a centred radial veil (`color-mix(--bg …)`, lg-only) between the canvas (z-0) and the content (z-10): it
darkens the centre band (46%×58% at 50% 44%) so the number + copy read cleanly, while the disk stays visible at
the edges. Reframes the metaphor correctly: the number IS the event horizon — everything collapses into it. No
new component, no content change.

## SLOP TAXONOMY (after): S1–S10 all 0.
- **S4/S9/S10 FIXED** — "61.4" reads cleanly (decimal legible), the number dominates, orbit is peripheral.
- S1 loud (giant number, page crescendo) · S6 display ≫ body · S7 centred is the sanctioned manifesto exception (one-number-does-the-explaining, the only centred hero-number on the page) · S8 orbit motion is thematically tied (probability collapsing to one number).

## OWNER-PROXY
One thing not seen elsewhere: a probability rendered as a giant number at the centre of a collapsing orbit, fully legible. Screenshot-worthy now.

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · tokens only (veil is color-mix of --bg) · reduced-motion (PriceVoid already renders one static frame under reduce; veil is static). Price-section copy has no em-dash.

## HANDOFF
Next section (5 FootballExperience) copy contains an EM-DASH ("match — and every beat…") — design-taste 9.G hard ban; fix on that pass.
