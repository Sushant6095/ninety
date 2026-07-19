# BLOCKERS — owner action needed (Ralph final loop)

Things the loop cannot resolve without the owner. Each surface is built around these with an honest
degraded state; none stops the loop. The owner clears these after the loop ends.

## B1 — Live in-play TxLINE ingest — ✅ ACTIVATED 2026-07-19 (partial close, ADR-084)
- **DONE:** feed proven real (Final Spain v Argentina, FixtureId 18257739, real 1X2 odds `Pct [30.58,48.92,20.50]`).
  Fly secrets set (`TXLINE_NETWORK=devnet`, `TXLINE_DEVNET_JWT`, `TXLINE_DEVNET_API_TOKEN`). Ingest boots LIVE
  keypair-free (`worker-ingest.live.ready · cluster devnet`). Client refresh is now renew-JWT-only so prod never
  needs the wallet on expiry (ADR-084). **No keypair on the Fly host — deliberately.**
- **Remaining (not owner-blocked, just time):** the only real fixture (the Final) is PRE-MATCH, so there is no
  in-play odds stream yet → `/markets` is still `[]`. Honest state = **"live feed connected · market pre-match."**
  It populates when the Final kicks off, OR when a follow-up primes the pre-match `odds/snapshot` into `odds.raw.v1`
  (fetch fixtures+odds snapshot on ingest boot). Only THEN do the FE labels flip PREVIEW/REPLAY → LIVE.
- **Owner note:** keep the `.env` devnet session fresh; if the JWT dies before the Final, the renew-JWT-only path
  (deployed via ADR-084) refreshes it with no wallet. Full re-activation (needs the wallet) is devnet-one-shot and
  should not be triggered.

## B2 — Demo dataset is fixture-seed, not captured replay (strategic decision)
- **What:** `/terminal` and `/board` (and the consumer surfaces — leaderboard, moments, portfolio,
  account, history, proofs, profile) render hand-authored fixture data (`apps/web/src/lib/fixtures.ts`,
  `terminal.ts`, `matchdepth.ts`, `moments.ts`, `portfolio.ts`, `proofs.ts`, `rankings.ts`). The
  captured TxLINE payloads in `docs/txline-samples/` are thin (pre-match USA–Belgium snapshots + a few
  odds/score updates, `odds-snapshot: []`) — there is **no captured 90-minute in-play tape with a goal
  and a halt**, so the demo's CAN–MAR halt sequence is modeled, not captured.
- **The tension:** the Ralph loop demands zero invented values; ADR-076 deliberately pinned fixtures
  back because honest-empty read-models looked contradictory for the demo; the backend read-models are
  genuinely empty (B1). These cannot all be satisfied at once while the feed is off.
- **What the loop DID within its authority (no settled decision re-opened):**
  1. Fixed all indefensible fabrications that masquerade as live infra or real people (fake Solana
     `SLOT`, fake `FEED ms` precision, "real photos + P&L" claim, duplicate/contradictory standings).
  2. Framed every modeled surface honestly as a **replay/preview**, never "live", per the loop's own
     "a replay of captured payloads is real, time-shifted — never say live over a replay" rule.
- **Needs (owner decision):** for the recorded demo, either (a) capture a real in-play TxLINE tape once
  B1 is cleared and drive the replay from it, or (b) keep the modeled preview and narrate it as a
  preview on camera. Recommendation: (b) for the hackathon demo, (a) for the July-19 Final monitor.

## B4 — Deployed `/search` endpoint returns 500 (backend, non-breaking on FE)
- **What:** `GET https://omnipitch.fly.dev/search?q=…` → 500 Internal Server Error.
- **Impact:** NONE on the demo — the ⌘K palette's entity results (teams/players/managers/venues) come from the
  baked roster index (ADR-081, client-side) and its live-match search catches the error and falls back to `MARKETS`.
  Verified: typing "brazil" surfaces the Brazil match + team correctly. Fix the endpoint to also power live match
  search, but it does not block anything.
- **Needs (owner):** debug the deployed `/search` route (likely a PG/Valkey query or missing index at runtime).

## B3 — No demo auth token wired (ADR-073 deferred)
- **Blocked:** live `/portfolio`, `/orders`, `/games` (auth-gated); the FE has only a fixture `SESSION`.
- **Needs (owner):** a pre-minted `NEXT_PUBLIC_DEMO_TOKEN` for the seeded demo user (local, gitignored).
- **Unblocks:** a real filled-order path in the trade ticket instead of the modeled fill.

## B5 — Hyperliquid visual reference is bare-DOM (cannot composite against it)
- **What:** `docs/hyperliquid-research/html/home.html` is 14 KB with ZERO linked CSS, ZERO `<style>`, ZERO
  inline styles, ZERO scripts — it renders as unstyled DOM. There is NO real Hyperliquid screenshot anywhere
  in `docs/`. The 2026-07-18 loop composited against this blank page and self-scored "BEAT-OR-MATCH" — that
  is the void this loop exists to close.
- **Impact:** The calibration anchor for the landing is therefore (a) the REAL Sofascore captures
  (`docs/sofascore-research/_reference-shots/*.png`, 1440×900), (b) the mechanical slop taxonomy S1–S10
  (owner-authored, not self-graded), and (c) the design-taste ban-list. Hyperliquid stays a WRITTEN standard
  (one-number-per-section, restraint, whitespace confidence, motion-as-information), not a visual composite.
- **Needs (owner):** a real Hyperliquid home/trade screenshot dropped into `docs/hyperliquid-research/` if a
  literal HL visual composite is required. Not blocking — the loop continues on the Sofascore + taxonomy anchor.

## B6 — Telegram bot credentials (EarlyWhistle live cards + inbound "AI Pundit" bot, ADR-085)
- **What:** the EarlyWhistle Telegram integration is COMPLETE and tested (86 worker-jobs tests green, incl. a
  rendered-transcript proof), but it can only go live with a real bot + channel. `main.ts` gates on
  `TELEGRAM_BOT_TOKEN && EARLYWHISTLE_CHANNEL` → a silent no-op until both exist (never crashes without them).
- **Impact:** no card can be posted/pinned to a real channel and the inbound `/matches /price /leaderboard`
  bot can't answer a judge. Until then, verification is the fake-client transcript (ADR-085 STEP 6).
- **Needs (owner, ~2 min):**
  1. Message **@BotFather** → `/newbot` → name it → copy the **BOT TOKEN**.
  2. Create a public channel or group; add the bot as an **ADMIN** (it must post + pin).
  3. Get the **channel id** (e.g. `@ninetylive`, or the numeric `-100…` id).
- **Unblocks:** the batched STEP-5 deploy (in ADR-085 — coordinate with the TxLINE go-live session, ONE
  `fly secrets set` + ONE redeploy) and the real-channel screenshot verification.

## B6 — Landing beat-1 cinema asset is a NAMED-PLAYER LIKENESS (must swap before any public ship)
- **What:** the frame sequence `apps/web/public/frames/hero/*.jpg` (now the FIRST thing on the landing, per the
  STEP-1 structural change) is an edited anime reel depicting Messi / Argentina #10 with adidas/AFA marks. This
  is exactly what CLAUDE.md's legal armor forbids on the public landing. The scrub MECHANISM + composition are
  asset-agnostic and are the design deliverable; the asset is not shippable as-is.
- **Impact:** design iteration + verdicts proceed on the mechanism; the placeholder image does NOT clear the
  legal gate. Do not deploy the landing publicly with these frames.
- **Needs (owner):** an ORIGINAL / LICENSED / ANONYMOUS football clip (ideally a single unbroken shot, no named
  player, no club marks, no burned-in subtitles), baked to `public/frames/hero/` at the same 96-frame contract.

## B6 (extended) — the WatchReel "film" uses the SAME named-player-likeness asset
The landing "The film" section (WatchReel) plays the same anime reel (Messi/Argentina #10) as the beat-1 cinema.
Same owner-swap requirement (original/licensed/anonymous) applies before any public ship.

## B6 (update, pass 8) — IconsGallery deleted; its named-player stills are now orphaned
Deleting the "The icons" section removed 7 real named-player broadcast stills (Bellingham/Zlatan/Haaland/
Zidane/Messi/Pelé with club+sponsor+federation marks) from the landing — the biggest likeness liability. The
files `apps/web/public/icons/*.jpg` remain on disk, now UNREFERENCED (served only if hit directly). Owner: delete
`apps/web/public/icons/` before any public deploy. Remaining on-page B6 assets: beat-1 cinema + WatchReel film
(one anime clip) — still owner-swap.

## B7 — cross-page background-position P&L differs (fixture money-shot artifact, not slop)
An open position's P&L differs BETWEEN match pages because each page money-shots ITS OWN selected match to the
goal moment while other matches read their ambient fixture mark. E.g. EGY v AUS shows +900 on /terminal (AUS-EGY
money-shot, Egypt 56) but −654 on /match/wc26-can-mar (AUS-EGY ambient, Egypt ~30). Each page is INTERNALLY
consistent (the left-rail AUS-EGY away price matches its position P&L on that page). Under a real live store both
pages would read the same AUS-EGY time and agree. Data-liveness artifact (B1/B2), NOT a slop/copy defect.
- **Needs (owner):** a single live store shared across match pages (clears when live ingest lands, B1).
