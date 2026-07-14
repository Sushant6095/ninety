# ADR 055 WC26 flags baked local — no runtime flag CDN

Status: accepted 2026-07-14 (commit c2a6c94, `merge/live-integration`). Cross-ref: ADR-051 (flags are worldcup26 "sits still" territory; same principle applied — no third-party runtime dependency), ADR-048 (standalone deploy).

Context: `Flag.tsx` fetched flagcdn.com PNGs at runtime with `loading="lazy"`. A slow/unreachable CDN rendered every crest as a grey disc; an incomplete FIFA→ISO map rendered 12 of 48 teams as 2-letter initials; the screenshot harness hung on flag-CDN network stabilization. Demo day (Jul 19) cannot depend on a third-party CDN.

Decision:
- `apps/web/scripts/bake-flags.mjs` downloads w80+w160 PNGs for every code in `FIFA_TO_ISO` (parsed from `src/lib/flags.ts` — the single source of truth) into `apps/web/public/flags/`, committed to the repo (118 PNGs, 59 slugs). `flagUrl()` now returns local `/flags/w{N}/{iso}.png`.
- `iso2()` throws in dev on an unmapped FIFA code, so map coverage can never regress silently. `Flag.tsx`: `priority` for crests >28px, no lazy loading. flagcdn removed from `next.config.mjs` `remotePatterns` — reintroducing a runtime flag host is a bug.

Consequences: crests render deterministically offline; the screenshot harness no longer waits on third-party network; an unmapped team fails loudly in dev instead of degrading to initials. Repo carries the PNGs. Re-run the bake script only when `FIFA_TO_ISO` grows.
