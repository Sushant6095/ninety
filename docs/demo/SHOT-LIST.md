# Demo shot-list — 5 min, press-record

Derived from [`docs/demo/script.md`](script.md). Total ~4:30 + 0:30 buffer. **Cold open is the market HALT** — no title card, no logo, open on the moment a goal freezes the board. Record during SF Jul 14–15.

Voice law: play-money only — say **price · trade · credits**, never bet/stake/odds/wager. "Odds" appears only as a literal TxLINE endpoint name, never in narration.

---

## Recording setup (do this once, then just press record)

**Terminal A — infra + services**
```bash
docker compose up -d          # postgres + redis
pnpm dev                      # web + api + workers (turbo)
# the mock feed runs without TXLINE_TOKEN; set it in .env to hit the live feed
```
Wait for `apps/web` on `http://localhost:3000` and `apps/api` up before filming.

**Terminal B — the replay driver (this is what fires goal→halt on cue)**
```bash
./scripts/replay.sh           # or the /replay <matchId> command
```
Replay walks a **finished** WC26 fixture's 5-min score/odds buckets (TxLINE S2/O2) at Nx through the ingest plane, so the goal→halt→reprice loop happens on demand without a live match. Rehearse once to learn exactly when the goal lands, then start recording ~5 s before it.

**Browser**
- Window **1440 wide**, dark only (there is no light mode in v1). Hide bookmarks bar. 100% zoom.
- Pre-open these tabs, in this order, so you never type a URL on camera:
  1. `localhost:3000/` — the board (home)
  2. `localhost:3000/terminal` — the Terminal (single-match trading)
  3. `localhost:3000/replay` — replay mode (the judges' screen)
  4. `localhost:3000/proofs` — settlement / proof state
  5. `localhost:3000/how-it-works` — the trust-path graph
  6. `localhost:3000/leaderboard` and `localhost:3000/moments`
  7. Solana Explorer (devnet), two tabs: program `6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj` and subscribe tx `2RMQS9tY…rZgYDPqqtX`
- The **Momentum River** is the hero visual — keep it in frame whenever you're on the Terminal.

**Reference screens** for framing/color parity: `design/screens/home.png`, `terminal.png`, `northstar.png`.

---

## Takes, in order

### 0 · COLD OPEN — the HALT (0:00–0:12)
- **Screen:** `/terminal`, mid-match, River flowing, three prices live.
- **Action:** let the replay-driven goal land. The board **HALTS** — prices freeze, the halt state (amber, `#FFB020`) hits, River marks the event.
- **Say:** "A goal just went in. Watch what the market does — it stops. Nobody gets filled on a stale price." Hold the frozen frame ~2 s. **Then** cut to title.

### 1 · Problem (0:12–0:32, ~20 s)
- **Screen:** `/` board, matches live with mini-rivers and chips.
- **Say:** the pitch in one line — live football moves faster than any market prices it; Ninety turns each match into a real-time play-money exchange where you trade a live probability with credits, never money. No deposits, no payouts, ever.

### 2 · The live loop — goal → halt → reprice → spread → Booth (0:32–2:02, ~90 s) — the core
- **Screen:** `/terminal` (or drive from `/replay` and cut to the Terminal).
- **Beats, in this order:**
  1. **Goal** — replay fires the TxLINE score event (S3); the engine detects it.
  2. **Halt** — trading pauses the instant the goal confirms (call back to the cold open).
  3. **Reprice** — the market re-anchors to the fresh consensus mark from the TxLINE odds stream, Shin de-vigged by the pricing worker.
  4. **Decaying spread** — it reopens on a 3× spread that decays to normal; the first traders in pay for the uncertainty.
  5. **AI Booth narrates** — the Booth caption turns the swing into plain language (filtered so nothing reads like gambling).
- **Action:** buy the side you think the crowd has wrong; show the LMSR maker's cost preview before confirm, then the fill. Mention a winning share is worth 100 credits and you can sell any time.
- **Say:** "Every beat here is driven by a real TxLINE feed, verified live on devnet."

### 3 · Settlement + the forge finding (2:02–2:47, ~45 s) — the differentiator
- **Screen:** `/proofs`, then `/how-it-works` (the trust-path graph), then the Solana Explorer program tab.
- **Say (honest framing — do NOT claim a live settle):** results are built to settle **on-chain, with no admin able to decide them** — the program settles only by verifying a TxODDS proof of the score. "While building it we adversarially reviewed it, and found the sponsor's own settle instruction doesn't bind finality on-chain — you could settle a wrong result with a genuine mid-match proof. So we **fail-closed on purpose** rather than ship something we can prove is forgeable, and filed it back to the sponsor." Point at the fail-closed state on `/proofs` and the trust path on `/how-it-works`.
- **What IS live on-chain (show if time):** the leaderboard-claim path — a Merkle root on-chain, `claim_points` proven against a receipt-PDA, 5/5 Anchor tests. Cut to the deployed program on Explorer.
- **Guardrail:** there is no live Solscan settle signature to show — settlement is fail-closed. Show the program + the subscribe tx, tell the forge story; never imply a match was settled on-chain today.

### 4 · Replay mode (2:47–3:17, ~30 s) — the judges' screen
- **Screen:** `/replay`.
- **Say:** any finished WC26 fixture replays end-to-end through the same ingest → bus → cortex → engine pipeline at Nx — this is how you reproduce the whole loop without waiting for a live kickoff, and how every beat you just saw was driven.

### 5 · Business (3:17–4:17, ~60 s)
- **Screen:** `/leaderboard`, `/moments`, then `northstar.png` (or `/how-it-works`) for the vision.
- **Say:** free-to-play, TV-native moments; play-money invariant enforced in code; TxLINE as the data spine; 81 commits / 51 ADRs / 257 tests in 7 days; AI-native ops (the forge finding was caught by a proof-auditor agent, not luck). Where it goes next: wire the frontend to the live API, flip settlement live once the sponsor confirms the finality path.

### 6 · Close (4:17–4:32, ~15 s)
- **Screen:** back to the `/terminal` River, flowing.
- **Say:** one line — "Ninety. The World Cup, priced live, settled by proof — not by us." End on the River.

---

## Honesty guardrails (repeat, because judges punish overclaiming)
- No live on-chain settle exists today — settlement is fail-closed by design. Tell the forge story; do not fake a settle signature.
- The frontend renders curated WC26 fixture data, not the live API yet. The loop you film is real (engine/bus/cortex/TxLINE via replay); the board's data source is fixtures. Don't claim live-API wiring on the web.
- Moments are server-rendered PNGs; `mint_moment` is a stub. Show the Moment card, not an on-chain mint.
