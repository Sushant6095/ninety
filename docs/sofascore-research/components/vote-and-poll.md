# Component — Vote / Poll Widget ("Who will win?")

A crowdsourced prediction widget on featured matches. **This is the component Ninety most directly
replaces** — it captures the same "I have an opinion on the outcome" energy, but as a *poll*, not a
*market*.

## Anatomy
```
        Who will win?
        Cast your vote!                                    🏆
 [  🇫🇷 France  ]  [    X    ]  [  🇪🇸 Spain  ]
```
Three options (home / draw / away) as large tappable buttons with crests. After voting, buttons
convert to **result bars** showing the percentage split of all votes (a horizontal stacked/paired
bar), and your pick is marked.

## Variants
- **Pre-vote:** three CTA buttons.
- **Post-vote / results:** percentage bars per option, your choice highlighted, total votes shown.
- **Closed** (match started/ended): read-only final split.

## States
- **Unvoted:** interactive buttons, subtle hover lift.
- **Submitting:** brief optimistic transition to the results view.
- **Voted:** results with your pick flagged; usually one vote per user.
- **Closed:** static.

## Interaction
Tap an option → records vote (optimistic) → animates to results. Low-friction, one-tap, no login gate
for the poll (identity-light engagement).

## Motion
Button → bar transition ~200–300ms (bars grow from 0 to their %). A satisfying, single, purposeful
animation — the *reward* for participating.

## Spacing / surface
Sits inside a **card** (often the dark spotlight surface for featured matches), clearly separated
from the dense lists — engagement content earns card treatment.

## Accessibility
Options are labeled buttons (`"Vote France to win"`); results announced as percentages; keyboard
operable; not color-only (percentages are text).

## When to use
Lightweight, non-committal crowd sentiment on a binary/ternary outcome. Drives engagement + a data
point (the crowd's implied probability).

## When NOT to use
When the interaction should carry *stakes* or *state* beyond a vote. A poll can't express
conviction magnitude, can't be exited, and has no P&L.

## Ninety translation (the core product insight)
SofaScore's poll answers "who do you think wins?" with a tap and shows the crowd %.
**Ninety answers the same question with a price.** The three vote buttons become **buy/sell on the
outcome markets** (France / Draw / Spain), the crowd-% bar becomes the **live implied probability
from the order book**, and "one vote" becomes a **position you can size, add to, and exit**. Same
instinct, real conviction: the poll's percentage *is* our price — but ours moves, trades, and pays
(in play-money credits). Keep the one-tap low friction of the vote for the *first* trade.
