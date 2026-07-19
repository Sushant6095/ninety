# Terminal prompt — rebuild the top ticker on REAL data (yesterday · live · tomorrow)

Paste the fenced block into the Mac Claude Code session. It closes the missing data route first, then
rebuilds the ticker's information design. Read the notes under it before you run it — there are two real
conflicts with our own law that you should decide on, not discover mid-build.

---

```
Rebuild the top ticker (`features/board/Ticker.tsx` + wherever it mounts on /board and /terminal) so it runs
on REAL football data and reads like a broadcast strap, not a mono terminal dump. Reference behaviour:
grouped day segments — yesterday's results · anything live now · tomorrow's fixtures — each match a chip with
kickoff time, both team names, both flags, and score/minute when relevant.

STEP 0 — READ FIRST
- LOOK AT THE REFERENCE IMAGES with the Read tool (you can read images — do not work from prose alone):
  docs/handoff/refs/ref-ticker.png (the target strap) and ref-ours-ticker.png (our current mono bar).
  Then read docs/handoff/refs/README.md for the measured spec — bar height, chip padding/radius, the
  semibold-white vs muted-grey label pairing, flag size, and the mono-only-for-numbers rule. ADR-049
  governs: the reference is INTENT, not a pixel target. Match structure and rhythm; never copy their hex.
- CLAUDE.md (Design law, Two-source law ADR-051, Verification law). ADR-051 matters here: TxLINE owns what
  MOVES during a match; baked worldcup26 owns what SITS STILL. We are adding football-data.org as a source
  for FIXTURE SCHEDULE + FINAL RESULTS (still data). That is a new architectural call → write an ADR for it
  BEFORE coding (docs/adr/), covering: which source wins per field, and that a live in-play minute/score must
  still come from TxLINE when live ingest is on (today it's replay-only, so the ticker's live segment reads
  from the replay/fixture store, NOT football-data — never mix two live sources on one row).
- Invoke the ui-craft router first; context7 anything you haven't verified this session.

STEP 1 — the missing data route (this does not exist yet; the ticker is impossible without it)
Add to apps/api/src/http/routes/richdata.ts, same shape/error contract as the existing /rich/* routes:

  GET /rich/fixtures/:competition?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
    → football-data.org  /competitions/{competition}/matches?dateFrom=&dateTo=

  Cache TTL: 60s if the window includes today (results move), 10min otherwise. Football-Data.org free tier is
  10 req/MINUTE — the 3-day window is ONE call, so cache it as one key and slice client-side. Do not fan out
  three calls. Keep the existing honest degradation: 503 {needs} unkeyed, 429 budget, 502 upstream, never fake.

  VERIFY THE ENDPOINT BEFORE BUILDING UI — free-tier coverage is not guaranteed:
    curl -s -H "X-Auth-Token: $FOOTBALL_DATA_TOKEN" \
      "https://api.football-data.org/v4/competitions/2000/matches?dateFrom=2026-07-17&dateTo=2026-07-19" | head -c 600
  If that 403s or returns empty, STOP and report — the whole feature depends on it and we fall back to the
  baked worldcup26 fixture skeleton for schedule + TxLINE/replay for scores.

STEP 2 — the ticker UI (this is the part that fixes the "generic" look)
The current bar reads generic because EVERYTHING is monospace and every chip is identical weight. Fix the
typography hierarchy first — it is 80% of the win:
  - Team names: the UI sans (Apple system font, ADR-077), semibold. NOT mono.
  - ONLY numbers stay mono + tabular-nums: kickoff time, minute, score, price. (Design law: prices 1 decimal.)
  - Day/stage label ("Yesterday" · "LIVE" · "Tomorrow" · "Final · 20 Jul") in text-lo, small, letter-spaced —
    it separates the groups the way the reference does.
Structure per chip: [time|minute] [flag] TeamA – TeamB [flag] [score] [price], inside a surface chip with a
hairline border and --radius-chip, generous horizontal padding. Flags = baked local PNGs from
apps/web/public/flags (ADR-055 — never a runtime flag CDN), ~20px, rounded, with alt text.
States: LIVE = minute in --up + the existing 180ms tick-flash preserved on price change; FT = "FT" in
text-lo; upcoming = kickoff time only, no score. HALTED = --halt, halts only.
Motion: marquee ONLY when content overflows; pause on hover; prefers-reduced-motion → static scrollable strip.
Empty/loading: skeleton chips, and an honest empty state — never invent matches.

STEP 3 — SPARSITY IS THE REAL DESIGN CONSTRAINT (do not skip)
It is 2026-07-18. The tournament ends 2026-07-19. A yesterday/live/tomorrow window is only ~2-4 real matches,
NOT the 8 the current fixture ticker shows. Design the bar to look intentional at 2 items — center the group
rather than stretching chips, and widen the window to the last 3 days of results if it reads too empty.
Verify at BOTH 2 chips and 8 chips.

STEP 4 — VERIFY (Verification law; motion + real data, so a static claim is not proof)
- pnpm --filter web build && pnpm --filter web start (:3000). Not dev.
- node scripts/ui/screenshot.mjs at lg+xl, ticker in frame.
- READ-OUT-LOUD every chip: the minute, score, kickoff time, day label and price must agree with each other
  and with the source. A chip that says LIVE 86' next to a fixture dated tomorrow is a ship-blocker.
- Confirm no raw hex in the component (tokens only) and no runtime flag CDN.
- design-cop verdict → design/verdicts/. PROVENANCE.md row. Write the ADR from Step 0.
```

---

## Two conflicts to decide before running (notes for Sushant, not the prompt)

**1. The reference's rainbow gradient is not legal on this surface.** That blurred multi-hue backdrop is
team-colour derived, and our law says two things about it: colours come only from `tokens.css` (raw hex in a
component is a bug), and the animated gradient is **landing-hero-only** (ADR-058) precisely because a GPU
gradient on a live-price surface contends with the 150ms tick path. The ticker sits on `/board` and
`/terminal`. Options: (a) keep the bar token-dark and win on typography + flags + density — safest, still a
huge upgrade; (b) a **static, non-animated** per-chip tint derived from baked team colours, low alpha, added
to `tokens.css` — closer to the reference, needs an ADR amendment; (c) full animated gradient — I'd not do
this on a tick surface. Default in the prompt is (a) + hooks for (b).

**2. Where "live" comes from.** With TxLINE ingest replay-only, football-data.org is the only real source of
live scores — but ADR-051 reserves moving data for TxLINE. Mixing both on one row is how you get a chip that
disagrees with the terminal below it (exactly the contradiction class your read-out-loud test hunts). The
prompt's rule: schedule + finished results from football-data, in-play minute/score from TxLINE/replay only.

**3. API-Football's WC26 coverage is still unproven** — the only successful call was a 2017 QPR–Fulham
fixture. This ticker leans on football-data.org, which I've now confirmed *does* carry WC26. Keep it that way.
