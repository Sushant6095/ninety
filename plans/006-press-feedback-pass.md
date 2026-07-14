# 006 — One press vocabulary: active states, hover gating, transition-all

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: MEDIUM
- **Category**: Physicality & origin / Accessibility / Performance
- **Estimated scope**: 7 files, ~20 one-line edits

## Problem

Press feedback is inconsistent across the pressable tier, the most-pressed elements have none, one hover transform is ungated on touch, and one `transition-all` survives:

1. `features/terminal/PriceCells.tsx:32-38` — the H/D/A trade-selection buttons (the most-pressed elements in the terminal): `transition-colors duration-200`, NO `:active` feedback.
2. `features/terminal/TradePanel.tsx:93-107` — quick-amount chips + Max: colors only, no press; the sibling side-toggle at :65 already does `active:scale-[0.97]`.
3. `features/home/FeaturedPanel.tsx:117` and `features/terminal/TradePanel.tsx:121` — `active:scale-[0.99]`: below the perceptible band (0.95–0.98), reads as no feedback.
4. `features/onboarding/OnboardingPage.tsx:96` — CTA presses via `active:opacity-80` while the rest of the app presses via scale.
5. `features/onboarding/OnboardingPage.tsx:29` — `transition-all duration-200` on the step dots (house hard rule: never `transition-all`; every branch is `w-6` so only color changes).
6. `components/ui/MatchCard.tsx:40` — `transition-transform duration-200 group-hover:scale-110` on the favourite star: decorative transform on the most-hovered row in the app, ungated on touch (false hovers stick after tap-navigation). Purpose test fails — delete.
7. `apps/web/tailwind.config.ts` — no `future.hoverOnlyWhenSupported`, so every `hover:` compiles ungated.

## Target

One press vocabulary: `active:scale-[0.97]` with `transform` in the transition list, 0.97 everywhere (buttons/chips/CTAs). Concretely:

- PriceCells button className: `transition-colors` → `transition-[color,background-color,border-color,transform]` and append `active:scale-[0.97]` (only when not `inert` — append `${inert ? "" : "active:scale-[0.97]"}`).
- TradePanel chips/Max: append `active:scale-[0.97]`, transition includes transform.
- The two `active:scale-[0.99]` → `active:scale-[0.97]`.
- OnboardingPage CTA: `active:opacity-80` → `active:scale-[0.97]` (keep its hover as-is); step dots: `transition-all` → `transition-colors`.
- MatchCard star: delete `transition-transform duration-200 group-hover:scale-110` classes entirely (keep the star, keep its colors; the row's `hover:bg-hairline/20` remains the hover feedback).
- tailwind.config.ts: add `future: { hoverOnlyWhenSupported: true }` at the top level of the config object (gates ALL hover: variants behind `@media (hover:hover) and (pointer:fine)`).

## Repo conventions to follow

- Exemplar press: `features/terminal/TradePanel.tsx:65` (`active:scale-[0.97]`).
- Token classes only; no new CSS.

## Steps

1–7. One edit per Problem item, exactly as specified in Target.

## Boundaries

- Do NOT add press scale to full-width list rows or the FAQ accordion trigger (scale on a full-width row looks wrong; out of scope).
- Do NOT touch `CommandMenu` or `Tooltip`.
- `hoverOnlyWhenSupported` changes hover behavior app-wide on touch — that is the point; do not scope it per-component.
- If any excerpt doesn't match, skip THAT item and report it; apply the rest.

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0; `grep -rn "transition-all" apps/web/src` → no hits; `grep -rn "scale-\[0.99\]" apps/web/src` → no hits.
- **Feel check**: on `/terminal`, click-hold an H/D/A cell — it dips to 0.97 and springs back on release (160–200ms). In device-emulation (touch), tap a board row — the star must NOT scale.
- **Done when**: every pressable in the trade path (cells, chips, side toggle, submit, CTAs) dips at 0.97, and no `transition-all` remains.
