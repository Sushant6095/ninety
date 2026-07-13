# Component — Controls (Button · Toggle · Dropdown · Tooltip)

The everyday interactive primitives. SofaScore keeps them quiet and consistent — the value is in
restraint and state completeness, not novelty.

## Button
- **Variants:** primary (solid brand `#374df5`, white text — e.g. "Sign in"), secondary/ghost
  (outline or subtle fill), icon-only (★ favourite, ⚡ live, ⚙ settings), text/link.
- **States (all present):** default · hover (darken toward `primary-variant #2c3ec4` / wash) ·
  active/pressed (further darken) · focus-visible (ring) · disabled (reduced opacity) · loading
  (spinner, label hold). Every clickable thing has hover+focus+active — no bare elements.
- **Motion:** 100–150ms color/scale feedback; no `transition: all`.
- **Radius:** pills for actions (`50%`/full), `sm–md` for rectangular.
- **A11y:** real `<button>`, labeled (icon buttons have `aria-label`), focus ring never removed.

## Toggle / Switch
- Track + knob; off (default) grey, on brand-filled. Used for Odds, settings.
- Knob slides ~150ms; `role="switch"` + `aria-checked`; labeled.

## Segmented control
See [`tabs.md`](tabs.md) — a bounded radio-style view switch (All/Home/Away). Track + moving pill.

## Dropdown / Select
- **Trigger:** a button showing the current value + caret (season, round, dimension selectors).
- **Menu:** popover (z-102) of options; selected marked; opens ~200ms.
- **States:** closed · open · option hover/active · selected · disabled.
- **A11y:** `role="listbox"`/`menu`, arrow-key nav, Esc closes, focus returns to trigger, typeahead.

## Tooltip
- Reveals exact values / explanations on hover/focus (chart points, stat abbreviations, the
  team-of-week info "ⓘ"). Small, dark, appears after a short delay, dismisses on leave.
- **A11y:** available on keyboard focus (not hover-only), `aria-describedby`, doesn't trap.

## Info popover / inline help
The "ⓘ" pattern (e.g. team-of-week explainer) opens a dismissible inline callout (with an ✕) rather
than a modal — help without interruption.

## Shared principles
- **State completeness** — default/hover/focus-visible/active/disabled on *everything* interactive.
- **Quiet feedback** — 100–150ms, color + subtle scale, never bounce, never `transition: all`.
- **Focus is always visible** — the ring is never suppressed.

## Ninety translation
Same discipline, higher stakes. Our **buy/sell buttons** are the primary action — give them the
boldest (but still ≤150ms, ease-out) press feedback, unmistakable up-green/down-pink identity, and
airtight disabled/loading states (market halted, insufficient credits, order pending). Every control
gets hover+focus-visible+active — a trading UI that drops focus states is a bug (matches our design
law).
