# Component — Score Header (Match Header)

The identity block at the top of every match page. Pins/condenses on scroll so the score is always
in view.

## Anatomy
```
        Competition · Round · (status chip)
 [home crest]        2  –  0        [away crest]
   Home team        FT / 78'        Away team
        (aggregate / penalties if relevant)
        [tabs: Details · Lineups · Statistics · Standings · H2H · Media]
```
- **Score:** 28px / 700, Sofascore Sans, tabular. The largest type on the page (and near the largest
  in the product). Centered between the two crests.
- **Status/minute:** under the score — `FT`, live minute in red `#cb1818`, `HT`, or kickoff time.
- **Crests:** large, flanking; team names below, linked.
- Optional: aggregate score, penalty shootout result, red-card indicators by a team.

## Variants
- **Pre-match** (kickoff time instead of score; "Starts in…").
- **Live** (red ticking minute + subtle pulse; score flashes on goals).
- **Finished** (`FT`/`AET`/`Pens`; final score).
- **Aggregate** (two-leg ties show agg + leg).

## States
- Score change → **flash** the changed side's score in a sentiment color, then settle (~180ms).
- Scroll → header **condenses and sticks** (crests shrink, tabs pin) so the score + tab bar remain.
- Loading → skeleton crests + placeholder score.

## Interaction
Crests/names → team pages. Tab bar switches the content below. A "follow/favourite" and share
affordance typically sit in the header.

## Motion
Score flash ~180ms; sticky condense on scroll (native sticky, no janky JS); tab underline slide
150ms. Live minute updates in place.

## Spacing
Generous relative to the dense lists — this is the *one* place the match page breathes, to give the
score focal weight. Symmetric left/right around the centered score.

## Accessibility
`<h1>`-level accessible name (`"Avaí 2–0 Náutico, full time"`). Live minute/score in a polite live
region. Tabs are a proper `tablist`/`tab`/`tabpanel` set with arrow-key navigation.

## When to use
The header of a single-match view. Exactly one per match page.

## When NOT to use
In lists (use the match row). Don't shrink it into a row primitive — its job is *focal weight*.

## Ninety translation
This is the **market header**: teams/crests + the **live price** as the hero (our 28px-equivalent,
possibly bolder since it's our signature), the **Momentum River** immediately beneath, status
(pre/live/halted/settled), and the tab bar (Trade · Book · Trades · Chart · Rules). It pins on
scroll so price + trade controls never leave view. Where SofaScore flashes a score, we flash a
**price** and drive the River.
