# 003 — Route Tailwind duration/ease through the motion tokens

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: HIGH (systemic — 101 call sites resolve through it)
- **Category**: Cohesion & tokens
- **Estimated scope**: 3 files (`tailwind.config.ts`, `styles/tokens.css`, `styles/globals.css`), ~20 lines

## Problem

`apps/web/tailwind.config.ts` extends colors/fonts/spacing/fontSize but NOT `transitionDuration`/`transitionTimingFunction`. The 101 usages of `duration-200` across src (e.g. `features/terminal/TerminalHeader.tsx:54-85`) are Tailwind's built-in 200ms that only *coincidentally* equals `motion.transition: 200` — retune the token and every utility silently diverges. Worse, every `transition-colors duration-200` runs on Tailwind's default weak curve, not the house `ninety` expo-out (`[0.16, 1, 0.3, 1]`).

Downstream symptom of the same gap: the token curve is hand-retyped as a CSS literal because no CSS var exists —

```css
/* apps/web/src/styles/globals.css:63-64 — current */
.acc-content[data-state="open"] { animation: accDown 200ms cubic-bezier(0.16, 1, 0.3, 1); }
.acc-content[data-state="closed"] { animation: accUp 200ms cubic-bezier(0.16, 1, 0.3, 1); }
```

## Target

One source of truth, three layers wired to it:

```css
/* apps/web/src/styles/tokens.css — ADD (motion tokens as CSS vars, values from design/motion.ts) */
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* the ninety curve — design/motion.ts easeOut */
  --duration-fast: 150ms;
  --duration: 200ms;
  --duration-slow: 250ms;
}
```

```ts
/* apps/web/tailwind.config.ts — ADD inside theme.extend */
transitionDuration: { fast: "var(--duration-fast)", DEFAULT: "var(--duration)", slow: "var(--duration-slow)" },
transitionTimingFunction: { DEFAULT: "var(--ease-out)" },
```

```css
/* apps/web/src/styles/globals.css:63-64 — target */
.acc-content[data-state="open"] { animation: accDown var(--duration) var(--ease-out); }
.acc-content[data-state="closed"] { animation: accUp var(--duration) var(--ease-out); }
```

With `transitionDuration.DEFAULT` mapped, `duration-200` classes keep working (Tailwind keeps numeric steps) but new code can write bare `duration` — do NOT mass-rename the 101 `duration-200` call sites in this plan; the win is that `transitionTimingFunction.DEFAULT` snaps every `transition-*` utility onto the ninety curve immediately, and the vars exist for CSS.

## Repo conventions to follow

- `tailwind.config.ts` already imports from `./src/design/tokens` (`space`) — mirror that pattern; comments in the config explain WHY (see its color-mix comment).
- `styles/tokens.css` currently holds colors + radii; motion vars join it as the CSS-side mirror of `design/motion.ts`. Add a comment: "mirrors design/motion.ts — change BOTH or neither."

## Steps

1. Add the four CSS vars to `apps/web/src/styles/tokens.css` under `:root` with the mirror comment.
2. Add `transitionDuration` and `transitionTimingFunction` to `theme.extend` in `apps/web/tailwind.config.ts` (values via `var(...)` as shown).
3. Replace the two literal `200ms cubic-bezier(0.16, 1, 0.3, 1)` occurrences in `apps/web/src/styles/globals.css:63-64` with `var(--duration) var(--ease-out)`.

## Boundaries

- Do NOT rename or touch any of the 101 `duration-200` component call sites.
- Do NOT change values — 150/200/250 and the curve must remain numerically identical to `design/motion.ts`.
- Do NOT add a Tailwind plugin or dependency.
- If tailwind.config.ts already has transitionDuration keys, STOP and report (drift).

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0; `pnpm --filter web build` (or `next build`) compiles Tailwind without warnings.
- **Feel check**: hover a subnav item on `/board` — the color transition should feel identical-or-crisper (it now runs the ninety curve). Open the `/how-it-works` FAQ — accordion timing unchanged.
- **Done when**: grep for `cubic-bezier` in `apps/web/src/styles/` returns only the tokens.css definition.
