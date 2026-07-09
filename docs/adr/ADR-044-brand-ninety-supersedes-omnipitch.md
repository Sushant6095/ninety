# ADR 044 Brand — the product is "Ninety"; OMNIPITCH is the old name (canonical, supersedes all prior brand mentions)

Status: accepted 2026-07-09. Context: the project was renamed **OMNIPITCH → Ninety**. Ninety is the CURRENT name; OMNIPITCH is the OLD name we moved away from. An earlier note ("ninety is omnipitch, use OMNIPITCH") had it backwards — this ADR is the authority and supersedes it.

Decision:
- **User-facing brand = "Ninety".** The header wordmark, every screen, all product copy, and `design/screens/*`
  references read **Ninety**. Zero "OMNIPITCH" in anything a user sees. `design/screens/home.png` was rebranded.
- **Internal package namespace `@omnipitch/*` is left AS-IS.** Renaming it to `@ninety/*` would rewrite every import
  path across the monorepo (api, packages, programs, workers) and break the build — a large, risky, non-user-facing
  refactor with no product value right now. It stays `@omnipitch/*` (a namespace, not the brand). Logged as a
  deferred backend follow-up, NOT part of the frontend run.
- **Historical ADRs / program id / Anchor declare_id / backend code comments** keep "OMNIPITCH" where changing them
  is churn-only or breaks tooling; new frontend code + copy uses Ninety.

Consequences: the frontend is built Ninety-branded from here. If a token/mockup/comment still says OMNIPITCH it is
stale and the wordmark/copy wins = Ninety. VERIFY: `design/screens/home.png` shows "Ninety"; no "OMNIPITCH" in
`apps/web` user-facing strings. Cross-ref: ADR-043 (the Home reference), the `ui-craft` skill (copy law).
