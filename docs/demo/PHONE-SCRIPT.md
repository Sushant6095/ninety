# 📱 PHONE CUE CARD

Glance → say it in your own words. **Bold = say exactly.** ⏸ = stop talking.

---

## 1 · ME — 0:45
**[GitHub profile]**

- Sushant · backend + blockchain engineer
- 20+ apps built
- Day job: backend/infra, startup, **half a million active users**
- 2 years building things like this
- Honest: **frontend is not my home ground** — built fast, AI help, strict design system
- **The part underneath is what I know how to do**

---

## 2 · WHAT IT IS — 1:00
**[ninety-nu.vercel.app]**

- **Every match is a market for ninety minutes**
- Millions watch with a phone in hand → nothing to *do* with it
- Check a score, read a stat — can't express a view
- Sportsbooks → closed, legal walls, house against you
- Stats apps → beautiful, **read-only**
- Fantasy → weekly, asleep during the 90 min
- Ninety = live play-money exchange
- **1,000 free credits every match. No deposits, no payouts, ever**
- Not a limitation → why it opens in every country

---

## 3 · HOW IT WORKS — 1:30
**[/terminal — the Final]**

- Spain / draw / Argentina
- These are probabilities — 61 = 61% chance
- **Price is probability** ⏸

**[play the halt]**
- ⏸⏸ **SAY NOTHING — 3 seconds**
- Goal → market halts (like a real exchange, no stale fills)
- Reprices to new reality
- **41 → 61 on one goal** = the crowd changing its mind, drawn as a line

**[Booth panel]**
- AI explains the swing in one sentence
- So a non-trader understands what happened

**[place a trade]** → buy, size, fill, position, P&L

**[/play — Next Goal]**
- One tap. No account, no jargon, no risk
- **My dad could use this**
- The ramp: one tap for a fan, terminal for a trader, same data

---

## 4 · TxLINE ⭐ 2:00 — NEVER CUT
**[PPT TxLINE slide → code]**

**Coverage**
- **8 typed endpoint wrappers**
- Fixtures · 4 score endpoints (incl. **SSE stream** + Merkle stat-validation) · 3 odds endpoints (incl. stream)

**Streaming not polling**
- Polling = half an interval of latency + burns rate limit
- One upstream connection → Redis bus → many consumers
- **No thundering herd**

**Auth is on-chain**
- Guest token → **Solana subscribe transaction** → activate
- **The chain is the gate, not a logo**

**[synthesis diagram]** — the proud part
- Free feed **never ships a match-result market**
- Only Over/Under + Asian handicap = both **two-outcome**
- We trade Home/Draw/Away = **three**
- So we recover it:
  - Invert **Poisson** on O/U → expected goals
  - Invert **Skellam** on handicap → supremacy
  - Both → **Dixon-Coles** grid → H/D/A

**[the numbers]**
- **30.58 · 48.92 · 20.50**
- The actual Final, from the actual feed
- **27 tests**
- Books too thin → **stays unpriced. Never a fake 33/33/33**

---

## 5 · REPO — 1:00 ⚠️ CUT FOR 5-MIN
**[github.com/Sushant6095/ninety]**

- **87 ADRs** — every call written down *before* coding
- TypeScript monorepo: API + 3 workers + Python quant + Rust Anchor
- Engine → **single writer, journal-then-ack** (crash can't lose or double-apply a fill)
- Bus → **no service calls another directly** = everything replaceable

---

## 6 · INFRA — 1:00 ⚠️ CUT FOR 5-MIN
**[Fly → Aiven → /docs]**

- Fly: 4 process groups (api, ingest, cortex, jobs)
- Aiven: Postgres + Valkey
- **30 endpoints, live Swagger — call it yourself**
- **Nothing is a mockup**
- **$0** — Vercel, Aiven ×2, Fly, Solana devnet
- Constraint made the architecture better

---

## 7 · MINDSET — 1:00
**[PPT — SETTLEMENT_LIVE = false]**

Three rules:
1. **Write the decision down before you code it** → 87 ADRs
2. **Never claim — verify** → read-out-loud test caught more bugs than every tool
3. **Never fabricate** → replay says replay; unpriceable stays unpriced

⏸ The one I'm proudest of:
- Built on-chain settlement → reviewed it adversarially
- Found **TxLINE's proof doesn't bind match finality on-chain**
- A caller could settle a wrong result with a genuine mid-match proof
- Proved it forgeable → **turned settlement off**
- Compile-time constant. Filed the finding back to TxODDS
- **We'd rather ship something honest and unfinished than something trusted and forgeable**

---

## 8 · FUTURE — 1:00
**[/docs → Future plans]**

- It's a prototype. **I want to run it for years**
- World Cup ends — **there's a match every day**

If we win, money goes in:
- Real infra — EC2, managed Postgres w/ pooling, prod Redis, observability
- **Paid TxLINE credits** = highest leverage → one tournament becomes every league
- **Sportmonks** for the general data free tiers ration
- **Mobile** — football is watched with a phone in hand
- Seamless UI — dense + functional now, effortless next

⏸ The compounding part:
- A play-money record of **who actually predicts football best**
- No bookmaker can farm it — nobody plays honestly with their own money at risk
- **That record is the real asset**

---

## 9 · CLOSE — 0:20
**[landing / wordmark]**

- 13 days · **185 commits · 87 ADRs**
- **Priced by TxLINE. Proven on Solana. Play money, forever.**
- **Every match is a market for ninety minutes.**
- Thank you

---

## ⏱ CUT TO 5:00
Drop **5** + **6** · trim 1 → 0:20 · trim 7, 8 → 0:30 each · **TxLINE stays whole**

## 🎬 BEFORE RECORDING
- Terminal pre-loaded · tabs closed · notifications off
- Test the halt once — know its timing
- **Never say "live" over a replay**
- Break? Name it, move on
- **The 3-second silence after the halt is the best moment in the video. Don't fill it.**
