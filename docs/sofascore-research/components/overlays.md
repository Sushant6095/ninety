# Component — Overlays & Feedback (Modal · Drawer · Bottom Sheet · Toast · Skeleton)

The transient layers. SofaScore's declared z-index contract (see
[`../design-system.md`](../design-system.md)) governs all of them, so overlays never fight for
stacking.

## Modal / Dialog
- **z:** backdrop `108` → modal `109` → modal-sticky `110`. Backdrop = `overlay-darken2 rgba(0,0,0,.5)`.
- **Use:** focused tasks/confirmations, occasional promos. Not overused — most "detail" is a tab or
  popover, not a modal.
- **Motion:** backdrop fade + modal scale/slide-in ~200–300ms (entry); faster exit (~200ms) —
  asymmetric (entry > exit).
- **A11y:** focus trap, Esc to close, `role="dialog"` + `aria-modal`, focus returns to trigger,
  background inert.

## Drawer / Side panel
- Slides from an edge (filters, menus). z at the fixed/modal tier depending on modality.
- **Motion:** slide ~250–300ms in, ~200ms out; backdrop for modal drawers.

## Bottom sheet (mobile)
- The mobile-native pattern for options/detail on small screens (`bottom-navigation 106` /
  `mobile-menu 105` tier). Grabber handle, slides up, dismiss by swipe-down or backdrop tap.
- **Motion:** spring-free slide within the duration scale; drag-to-dismiss follows the finger.
- **A11y:** focus trap while open, labeled, Esc/backdrop/swipe to close.

## Toast / notification
- Toastify-based (tokens present: `--toastify-*`), top/bottom-right, `z 9999`-class alert tier
  (`alert 111`). Types: success/info/warning/error with matching status colors + progress bar.
- **Motion:** slide+fade in; **auto-dismiss ~5s** with a visible progress bar; manual close.
- **Use:** confirmations, live alerts (goal!). Non-blocking.
- **A11y:** polite/assertive live region by severity; dismissible; not the only channel for critical
  info.

## Skeleton / loading
- **Grey placeholder blocks matching the final layout's rhythm** (row skeletons for lists, block
  skeletons for charts/cards). Appear within ~300ms of an action.
- **Motion:** subtle shimmer; cross-fade to real content ~300ms.
- **Why it feels premium:** skeletons reserve exact dimensions → **no layout shift** (protects CLS)
  and the page feels "already there," just filling in.

## Shared principles
- **Declared z-index** — every layer has a named slot; no `9999` guessing (except the intentional
  MUI `1500` escape hatch).
- **Asymmetric timing** — entry is more expressive/slower than exit.
- **Least-interruptive tool for the job** — inline popover/tab > drawer > modal; toast for
  non-blocking feedback. Modals are rare.

## Ninety translation
- **Confirm trades** with an inline confirm or a lightweight sheet, not a heavy modal, to keep flow
  fast — but *do* confirm irreversible/large actions.
- **Toasts for fills, halts, market open/close** (live alerts) with the right severity + live
  region; auto-dismiss non-critical, persist errors until acted on.
- **Skeletons everywhere data loads** (book, tape, chart, positions) sized to the final layout — a
  live exchange must never jump. Reserve dimensions; cross-fade in.
- **One z-index contract** (adopt SofaScore's 97–111 shape) so the market header, tab bar, book
  popovers, sheets, and toasts stack predictably.
