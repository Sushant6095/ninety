# Screen — Settings / Preferences

> Reached via the header ⚙ icon. Documented from the header affordance + typical structure; specific
> option labels marked (~) where not independently re-verified.

## Purpose & primary goal
Tune the product to the user. Goal: **set locale, odds format, theme, and notification/favourite
preferences** without leaving the app.

## Likely contents (~)
- **Region / language** (SofaScore is deeply localized).
- **Time zone & date format** (critical for a global fixtures product).
- **Odds format** (decimal / fractional / American) — reflects the opt-in odds layer.
- **Theme** — the token system supports light + a dark/inverted surface (`surface-t`), so a theme
  switch is plausible; light is the default.
- **Favourites management** (teams/leagues followed → drives the Favourites tab and ticker).
- **Notifications** (goal alerts, match start) — app-centric.
- Account (sign in / profile).

## Interaction model
Grouped preference list; each setting is an inline control (toggle, segmented control, or dropdown)
that applies immediately (no "Save" round-trip for most). Changes persist to the account/local
storage and re-render affected surfaces (e.g. odds toggle appears/disappears).

## States
Signed-out: a subset (locale, theme, odds format, local favourites) still works via local storage;
account-bound settings prompt sign-in.

## Component inventory
Preference rows (label + control), section headers, toggles, segmented controls, dropdowns,
sign-in CTA. All the standard control primitives — see
[`../components/filters-and-chips.md`](../components/filters-and-chips.md) and
[`../components/tabs.md`](../components/tabs.md).

## Premium signals
- **Immediate application** — flip odds format and every odds cell updates at once; no save button.
- Deep localization surfaced as first-class settings (region, tz, format) signals a global,
  serious product.

## Lesson for Ninety
Ninety's settings should mirror this restraint: **inline controls that apply instantly**, a tight
group list, no modal save dances. Relevant options for us: theme (dark default), number/locale
format, time zone (match kickoffs), notification prefs (halts, fills, market open), and
watchlist/favourites management. Keep it a *preferences list*, not a sprawling account console.
