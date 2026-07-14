# 005 — Tooltip system: shared provider, skip-delay, origin-aware entrance

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: MEDIUM
- **Category**: Easing & duration / Physicality & origin
- **Estimated scope**: 3 files (`Tooltip.tsx`, `HoverCard.tsx`, `globals.css`), ~30 lines

## Problem

```tsx
/* apps/web/src/components/ui/Tooltip.tsx:9-13 — current */
<TP.Provider delayDuration={200}>
  <TP.Root>
    <TP.Trigger asChild>{children}</TP.Trigger>
    <TP.Portal>
      <TP.Content side={side} sideOffset={6} className="elev z-50 rounded-md border border-hairline bg-surface px-2.5 py-1 text-caption text-hi outline-none">
```

Two defects: (a) each Tooltip bundles its OWN Radix Provider, so Radix's skip-delay never applies across siblings — hovering the adjacent Favourites/Alerts buttons (`features/terminal/TerminalHeader.tsx:68-73`) re-waits the full 200ms every time. Emil's rule: after the first tooltip, adjacent ones should be instant. (b) The content pops in with no entrance and no transform-origin — a trigger-anchored element appearing from nowhere. `components/ui/HoverCard.tsx:13-17` has the same gap.

## Target

- ONE `TooltipProvider` at the app level: `<TP.Provider delayDuration={200} skipDelayDuration={300}>` wrapping children inside `app/layout.tsx`'s existing provider stack (client boundary permitting — if `layout.tsx` is a server component, export a tiny `"use client"` `TooltipProvider` wrapper component from `Tooltip.tsx` and mount it in the layout, following the same pattern as `MatchLiveProvider`).
- `Tooltip.tsx` drops its per-instance `<TP.Provider>` (keep `TP.Root` down).
- Entrance/exit on both Tooltip and HoverCard content via Radix data-state + CSS (interruptible transitions, not keyframes):

```css
/* apps/web/src/styles/globals.css — ADD */
/* Trigger-anchored surfaces scale from their trigger, never center (tooltips/hovercards; modals exempt). */
.pop-content {
  transform-origin: var(--radix-tooltip-content-transform-origin, var(--radix-hover-card-content-transform-origin));
  transition: transform 125ms var(--ease-out), opacity 125ms var(--ease-out);
}
.pop-content[data-state="closed"],
.pop-content[data-state="delayed-open"] { /* radix tooltip uses delayed-open on open — style the closed pose only */ }
.pop-content[data-state="closed"] { opacity: 0; transform: scale(0.97); }
```

(If plan 003 has not run yet, use the literal `cubic-bezier(0.16, 1, 0.3, 1)` in place of `var(--ease-out)` and leave a `/* TODO: var(--ease-out) after plan 003 */` comment.)

- Add `pop-content` to both `TP.Content` and `HC.Content` classNames. Values: scale 0.97 → 1, 125ms, ease-out — Emil's tooltip band (125–200ms), start above scale(0.9).

## Repo conventions to follow

- Radix primitives come from the `radix-ui` package (see Tooltip.tsx:3 `import { Tooltip as TP } from "radix-ui"`).
- Re-skin lives on className with token classes; CSS helpers live in `styles/globals.css` (see `.acc-content` at :61-64 for the data-state pattern).
- Provider-in-layout exemplar: `MatchLiveProvider` in `app/layout.tsx`.

## Steps

1. `Tooltip.tsx`: export the shared provider wrapper (or plain re-export of `TP.Provider` with props baked); remove the inline `<TP.Provider>` from the `Tooltip` component.
2. `app/layout.tsx`: mount the provider around children (inside `MatchLiveProvider`).
3. `globals.css`: add the `.pop-content` block per Target.
4. Add `pop-content` class to `Tooltip.tsx` `TP.Content` and `HoverCard.tsx` `HC.Content`.

## Boundaries

- Do NOT animate the ⌘K CommandMenu (`components/ui/CommandMenu.tsx`) — its instant open/close is CORRECT (keyboard-frequency action, the Raycast rule). Leave it alone.
- Do NOT add framer-motion to Tooltip/HoverCard — CSS transitions are the right tool (interruptible, off main thread).
- Radix Tooltip renders `data-state="delayed-open"|"instant-open"|"closed"` — style only the closed pose so both open paths transition identically.

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0.
- **Feel check**: on `/board`, hover the star (Favourites) icon → tooltip fades/scales in from the trigger side after 200ms; move directly to the bell (Alerts) → its tooltip appears INSTANTLY (skip-delay). In the Animations panel at 10%: content scales from the trigger edge, not from center.
- **Done when**: adjacent header tooltips open with no re-delay, and both Tooltip + HoverCard enter at scale .97→1/125ms.
