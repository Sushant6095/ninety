# Verdict — /team/[code] team pages (ADR-083, Session D)

**Date:** 2026-07-18 · **Verified on:** local **production** build (`pnpm --filter web build` → `next start`), NOT dev,
NOT Vercel · **Breakpoints:** lg (1280) + xl (1536) · **Shots:** `design/screens/impl/tf2-*.lg.png`,
`final-*.lg.png` · **Method:** LOOK at the render + the read-out-loud test (Verification law).

## Cases shot (the required three + one extra)
1. **ESP — nation, still alive.** Full Next-match card (FIFA World Cup · FINAL vs Argentina, 19 Jul kickoff), populated
   Market view, full standings.
2. **CAN — nation, knocked out.** Next-match = honest empty state **"Tournament over for Canada."** — never a blank.
   Market view fires the **Market → reality** join: "David reprices Canada 41.0 → 63.0 (+22%) … final 0–3 L".
3. **Barcelona — club.** Baked local crest, Camp Nou, founded 1899, full La Liga table (20 rows, all columns incl. PTS
   94→29, UCL/relegation zones). Statistics/Players tabs correctly absent (0 finished matches, empty squad on tier).
4. **Man City — club with squad.** Players tab = real squad grouped GK/DEF/MID/FWD with ages; Standings tab correctly
   **hidden** (Premier League returned a not-started all-zero table).

## Read-out-loud — PASS on every shot
- **Standings agree with the matches list.** ESP Group H: P3 W2 D1 L0, 5:0, +5, **7** — matches the three group games
  (URU 1-0 W, KSA 4-0 W, CPV 0-0 D). CAN Group B: P3 W1 D1 L1, 8:3, +5, **4** — matches (QAT 6-0 W, BIH 1-1 D, SUI 1-2 L).
- **P/W/D/L sums to the group match count** (3), not the full match list (knockouts excluded from the group table). ✓
- **Previous match = top Finished row** (ESP: FRA 0–2 ESP SF · CAN: CAN 0–3 MAR R16). ✓
- **Form strip matches the last 5 results** (ESP W-W-W-W-W with URU/AUT/POR/BEL/FRA crests + scores; CAN D-W-L-W-L). ✓
- **Next match** honest: ESP shows the Final; CAN shows the empty state. ✓

## Design law
- Tokens only (no raw hex); mono+tabular ONLY on numbers/scores/prices; system font for text. ✓
- Play-money copy — "price / trade / credits", never bet/stake/odds/wager. Market view says "priced in credits". ✓
- Crests: nations = baked flags; clubs = baked local `/crests/{id}.png`; **zero runtime-CDN** asset urls in the JSON. ✓
- No fabrication: followers/values/media/per-match ratings ABSENT not faked; unmatched opponents → token disc, not a
  wrong crest; non-profiled squad players non-navigable (no 404s). ✓
- Light theme LIVE (ADR-077) — shots are light-mode, both themes token-driven. ✓

## Fixes applied during verification (each re-shot and confirmed)
1. Empty header right-half → single-column header.
2. Standings clipped PTS in the narrow rail → tabs moved full-width below; every column now visible.
3. 20× "?" placeholder discs on league rows → crest skipped for non-self club rows.
4. All-zero not-started league table → Standings tab guarded (mount only when games are played).

**Verdict: PASS.** 48 nations + 10 clubs prerender as SSG; every board/search/match link resolves to a real,
fully-populated team page. Nations are fully self-consistent; club season-split is a labelled free-tier artifact
(ADR-083), not a defect.
