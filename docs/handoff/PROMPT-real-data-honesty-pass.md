# Prompt — REAL-DATA + HONESTY PASS (pre-recording). Single pass, then redeploy.

Paste the block below. This is the last change before the demo is recorded.

---

```
Make every value on the deployed UI either REAL or HONESTLY LABELLED. No fabricated numbers, no invented
people, no claim of "live" over a replay. One pass, then redeploy and re-verify.

═══════════════════════════════════════════════════════════
STEP 0 — THE CONSTRAINT (read before you plan)
═══════════════════════════════════════════════════════════
Prices CANNOT be made real today. Our price path is TxLINE odds → cortex 1X2 synthesis, and live TxLINE
ingest is OFF (B1: needs the wallet keypair + real tokens + redeploy). football-data.org carries NO odds.
So do NOT invent a price source and do NOT pretend. The rule for this pass:
  • Anything that CAN be real → make it real, now.
  • Anything that CANNOT → label it precisely, or delete it. Never leave it looking live.

═══════════════════════════════════════════════════════════
STEP 1 — MAKE IT REAL (use the live APIs; they are verified working)
═══════════════════════════════════════════════════════════
1a. MATCH DATA → football-data.org (competition 2000, WC26). Real fixtures, real dates, real scores, real
    status, real stages. Verified live on the deployed API. Replace fixture-invented matches with the real
    tournament record. Where the real tournament has no in-play match (it is 2026-07-18; only the 3rd-place
    match and the Final remain), the terminal shows a REPLAY of a real recorded match — see Step 2.
1b. STANDINGS / SCORERS / SQUADS / PLAYERS / TEAMS → already real via /rich/*. Confirm every page reads
    them and none falls back to a literal.
1c. SOLANA SLOT → make it genuinely live. Query the devnet RPC (`getSlot`) and render the real current
    slot, cached ~10s. A real on-chain number strengthens the Solana story; a fabricated one destroys it.
    If the RPC call fails, render "—", never a number.
1d. FEED / TICK LATENCY → render the REAL measured value (actual ms since last tick received) or remove
    the readout entirely. "FEED 42 ms" hardcoded while nothing is connected is fabrication.
1e. TRADER COUNT / LEADERBOARD / MOMENTS → read from OUR Postgres. If the table is empty, show an honest
    empty state ("No trades yet — be the first"), NOT an invented population. Delete "3,412 traders in this
    market" unless it is a real COUNT(*) query.
1f. AVATARS → remove every `i.pravatar.cc` URL. It is a third-party runtime CDN serving photos of people
    who do not exist, presented as our traders. Replace with initials-in-a-circle using team/token colours
    (no network dependency, ADR-055 spirit). Invented handles (@pitchwizard, @hexfan, @atlasfox,
    @deltahedge, @kdb_flow) either become real seeded demo accounts that actually exist in the DB with real
    trade history, or the leaderboard shows its empty state.

═══════════════════════════════════════════════════════════
STEP 2 — RELABEL: "LIVE" BECOMES "REPLAY" WHERE IT IS A REPLAY
═══════════════════════════════════════════════════════════
This single change makes the terminal honest without gutting the demo.
2a. The demo tape is a REPLAY of a real recorded match, not a live feed. Every "LIVE" badge, pill, dot and
    label on a replayed market becomes "REPLAY" (or "PREVIEW"), in --halt or --text-lo — never the live
    green. Add a small, always-visible marker on the market panel itself, not just the page-top banner:
    a top banner is easy to miss on camera; a badge on the River is not.
2b. FOOTER — currently reads "Live data from TxLINE". That is false while ingest is off. Change to:
    "TxLINE-priced · replay tape · live ingest enabled for the global track".
2c. Market state chip: if the tape is a replay, the PRE/LIVE/HALTED/SETTLED rail must say so.
2d. Any copy anywhere claiming live prices, live feed, or live settlement gets the same treatment.
    Grep the whole app for "live" and audit each hit: is it true right now? If not, fix the string.
2e. Keep the PROTOTYPE banner, but sharpen it to name what IS real:
    "Prototype — real WC26 data (fixtures, results, standings, squads) + real on-chain verification.
     Market tape is a replay; live TxLINE ingest lands for the global track."

═══════════════════════════════════════════════════════════
STEP 3 — SWEEP FOR ANYTHING ELSE FABRICATED
═══════════════════════════════════════════════════════════
Grep every component for inline data arrays, magic numbers and placeholder strings. For each number
rendered anywhere in the app, name its source: football-data | our Postgres | Solana RPC | baked WC26 |
replay tape. Anything with no source is deleted or replaced with an honest empty state. Pay attention to:
percentages, counts, latencies, "traders", follower counts, ratings, and any figure ending in a suspiciously
round number. Write the audit table into docs/REAL-DATA-AUDIT.md so the claim is checkable.

═══════════════════════════════════════════════════════════
STEP 4 — VERIFY, THEN DEPLOY
═══════════════════════════════════════════════════════════
- Clean production build: rm -rf .next, then ONE build, no dev server touching it (this is what caused the
  "40-50% broken" CSS desync — do not repeat it).
- Screenshot /terminal, /board, /match/[id], /leaderboard at lg+xl in both themes and LOOK.
- READ-OUT-LOUD each: no screen may say LIVE over a replay, and no number may lack a source.
- Confirm the fake SLOT telemetry is actually gone from the DEPLOYED page (it was reported removed but is
  still rendering on ninety-nu.vercel.app — the previous deploy did not land).
- Then deploy to Vercel and RE-CHECK THE LIVE URL, not just localhost. Fetch the deployed /terminal and
  grep the response for: pravatar, "3,412", "Live data from TxLINE", and the old SLOT value. All must be
  absent. A deploy you did not verify on the public URL is not a deploy.
- Append the pass to docs/ralph-ui-ledger.md; design-cop verdict to design/verdicts/.

═══════════════════════════════════════════════════════════
BLOCKER (do not attempt; owner-only)
═══════════════════════════════════════════════════════════
B1 live TxLINE ingest stays off. Do not fake around it. When the owner enables it (keypair + tokens +
redeploy with the lazy signer from ADR-079), the REPLAY labels flip back to LIVE and this pass is what makes
that flip a one-line config change instead of a scramble.
```

---

## Note for Sushant

The honest version of your demo is also the stronger one. After this pass you can say, truthfully:

> "Real World Cup data — fixtures, results, standings, squads — from a live API. Real on-chain verification
> on Solana, with a real devnet slot on screen. A real single-writer LMSR engine. The market tape you're
> watching is a replay of a recorded match, clearly marked, because live ingest needs a wallet credential we
> chose not to fake — the same reason we fail-closed settlement rather than ship something forgeable."

That is a better story than "everything is live," because it is the one that survives a judge poking at it.
The fail-closed settlement finding and the replay labelling come from the same instinct, and naming that
instinct out loud is the most memorable thing in your pitch.
