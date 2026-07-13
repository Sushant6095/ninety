# PROMPT — The World Cup context layer (make Ninety feel alive)

Web/desktop only (lg + xl). Mobile out of scope this run.

## WHY
Ninety looks like a trading terminal because it has terminal data and no football. Teams are 20px flag
circles, there are no crests, no stadiums, no group tables, no real bracket. TxLINE does not ship any of
that — it ships live scores, odds, and proofs. So we add a CONTEXT layer from a free, open-source WC26 API
and use it to make the product feel like a football product.

Source: https://github.com/rezarahiminia/worldcup2026 · Swagger: https://worldcup26.ir/api-docs/ · ISC license,
free, JWT bearer auth. Find the token/auth flow in the README + Swagger before writing any client code.

---

## ⛔ THE ONE HARD RULE — read it twice

**TxLINE owns everything that MOVES. worldcup26 owns everything that SITS STILL.**

| Owner | Data |
|---|---|
| **TxLINE (untouchable)** | live scores · goals · the halt trigger · odds/marks · prices · settlement proofs · match state |
| **worldcup26 (new)** | flags · crests · team names/metadata · stadiums · group standings · the 104-match bracket skeleton · fixture calendar |

The bounty requires TxLINE as the PRIMARY data source and explicitly disqualifies bolt-ons. If a live score
or a goal ever comes from worldcup26, the submission is dead. There is also a correctness reason: our markets
SETTLE against TxLINE proofs on-chain — pricing them off a different feed means a market could settle against
data it wasn't priced on.

If you are ever unsure which side a field falls on: **it moves during a match → TxLINE.**

---

## PART 1 — BAKE IT, DON'T CALL IT

worldcup26 is a hobby API on a single domain. It must NEVER be a runtime dependency — if it 404s during
judging, our site must not notice.

1. Write `apps/web/scripts/fetch-wc26.mjs`:
   - authenticate (per the README/Swagger), then fetch `/get/teams`, `/get/groups`, `/get/games`, `/get/stadiums`
   - download every flag/crest image to `apps/web/public/wc26/flags/{teamId}.{ext}` (optimise: webp, ~64px and
     ~256px variants)
   - emit typed, committed JSON to `apps/web/src/data/wc26/{teams,groups,games,stadiums}.json`
   - zod-validate the shapes on the way in; fail loudly on drift, never write a partial file
2. Commit the output. The build reads local JSON and local images. Zero network at runtime.
3. Add `pnpm wc26:refresh` to re-run it. Document it in the README.
4. Every image has a graceful fallback — a missing crest must never break a row or shift layout.

---

## PART 2 — WHERE IT LANDS (the surfaces that will actually feel different)

### 2.1 Identity — the biggest win per hour
Replace every 20px flag circle with real assets.
- **Match rows:** proper crest + team name. Give the row room to breathe.
- **Featured panel:** big crests, both sides, real team colours as subtle accents on the H/D/A cells.
- **Terminal header:** large crests, FIFA rank, group letter.
- Tokens still rule everything that isn't a photograph. No raw hex.

### 2.2 Stadium + occasion — free atmosphere
`/get/stadiums` gives name, city, country, capacity. Put it in the match header:
`MetLife Stadium · East Rutherford · 82,500` — and for the Final on Jul 19, say so. Costs an afternoon,
makes every match feel like an event instead of a row in a table.

### 2.3 Group standings — a real page
`/get/groups` returns all 12 groups with pts/gf/ga. Build `/competition` properly: 12 group tables, crests,
qualification lines. Fans browse this constantly and we have nothing.

### 2.4 The bracket — the real 104-match structure
`/get/games` gives every match with `type` (group/r32/r16/qf/sf/third/final) AND the knockout placeholder
labels (`"Winner Group A"`, `"Winner Match 73"`, `"Loser Match 101"`). Our `/bracket` route currently renders
fixtures. Rebuild it on the real structure: R32 (73–88) → R16 (89–96) → QF (97–100) → SF (101–102) →
3rd (103) → **Final (104), Jul 19, MetLife**.

This is also the foundation for the Bracket Pick'em game — build the bracket now so the game is cheap later.

### 2.5 Lineups — build the pitch, do NOT iframe one
Our design law says football depth lives in tabs, and the tabs are empty. Build a **native SVG pitch view**
in the Terminal's Lineups tab: formation array → 11 positioned nodes → shirt number, name, crest colours.
No third-party iframe, no "Powered by X" branding on our product, no widget that can 404 mid-demo.

⚠️ **worldcup26 has NO player/lineup data** — teams, groups, games, stadiums only. So:
- check TxLINE's payload depth FIRST (it may carry lineups; we have never looked)
- if not, API-Football free tier (100 req/day — CACHE MANDATORY, bake to `public/` like above)
- if neither, ship the pitch with formation + positions only, and skip player photos. Still worth it.

---

## PART 3 — GUARDRAILS
- Tokens only in the output. Zero raw hex, zero stock zinc.
- Play-money vocabulary always: price, trade, credits. Never bet/stake/odds/wager.
- No new libraries. lightweight-charts is the only chart lib; Framer Motion the only animation lib.
  recharts is BANNED and currently imported by `features/terminal/PortfolioCard.tsx` and
  `features/terminal/AttackMomentum.tsx` — rip it out while you're in there.
- No third-party iframes anywhere in the product.
- Attribute worldcup26 (ISC) in the README and in a small credits line.
- Don't touch `apps/api`, `packages/`, or `programs/`.

## PART 4 — LOOP
Per surface: build → `node scripts/ui/screenshot.mjs <route> <name>` at lg+xl → **VIEW the shots** →
run design-cop → fix each numbered gap → repeat until PASS. Never call a screen done off "looks fine."

Write **ADR-048** recording the two-source split and the reason (TxLINE = live/settlement, worldcup26 =
static context, baked at build time, never a runtime dependency).

End with /adr.
