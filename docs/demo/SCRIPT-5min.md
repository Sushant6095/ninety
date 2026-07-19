# Ninety — 5-minute demo script
**Track:** Consumer & Fan Experiences · TxODDS World Cup Hackathon
**Runtime:** 5:00 · ~740 spoken words at ~150 wpm
**Rule:** never say bet / stake / odds / wager. Say **price · trade · credits**.

**Delivery notes:** short sentences. Land the full stop. Slow down on numbers. The pauses marked `[beat]` are not optional — they are what makes it feel confident instead of rushed.

---

## 0:00 — 0:22 · COLD OPEN (no slides — start on the product)

> **VISUAL:** Terminal, live match, price ticking. Then the goal fires: River flashes, amber HALT sweeps, prices freeze, the cliff lands, spread decays.

**"Watch this."**

*[let it play — 3 seconds of silence]*

**"A goal just went in.**
**The market froze — because nobody should get to trade a price that's already dead.**
**It re-anchored. The cliff landed. And the spread is walking back in as liquidity returns."**

*[beat]*

**"That took eight hundred milliseconds. From the ball crossing the line, to a signed feed, to a market that repriced itself. Nobody touched it."**

---

## 0:22 — 0:52 · THE GAP

> **VISUAL:** Slide 2

**"This is Ninety. A live football exchange for the World Cup.**

**A billion people watch this tournament. Almost none of them get to participate.**

**Scores apps are passive — you refresh a number, and nothing you do changes anything.**
**Sportsbooks are gated, licensed, and banned from most app stores. Most fans can't use them, and plenty shouldn't.**
**And prediction markets are built for traders. They're cold, they're sparse, and nobody using them is actually watching the match.**

*[beat]*

**"So we built the thing in the middle. A live market a fan can actually play — with the drama of a real exchange, and none of the money."**

---

## 0:52 — 1:25 · WHAT IT IS

> **VISUAL:** Slide 3, then the board

**"The whole product is one idea: price is probability.**

**Every outcome trades from zero to a hundred. Canada at 61.4 means the market rates them a 61.4 percent chance, right now. A winning share settles at a hundred credits — so if you buy below the true chance, that's your edge.**

**You get a thousand free credits every match. No deposit. No wallet to fund. There is no cash in this system and there never will be — no deposits, no payouts, ever.**

*[beat]*

**"That's not a limitation we're apologising for. It's the strategy. Play-money means we're app-store safe, licence-free, and available in every country on day one."**

---

## 1:25 — 2:20 · THE DEMO

> **VISUAL:** live walkthrough — board → click a match → Terminal → buy → the halt again

**"This is the board. Every live match, every price, one glance. Real World Cup data — there isn't a placeholder anywhere on this screen.**

**I'll open Canada–Morocco.**

**This is the Terminal. The Momentum River is the hero — live win-probability across ninety minutes, with the goal cliff marked right there. It's the match, drawn as a market.**

**I want Canada. Sixty shares.** *[drag]* **Cost, average price, maximum payout — all live.** *[click]* **Filled.**

**Now watch the bottom.** *[Booth line appears]*

**"That's the Booth — an AI commentator that watches the price, not the pitch. It only speaks when the market actually moves, and it quotes the real numbers. It's the difference between a chart and a story."**

---

## 2:20 — 3:00 · THE CONSUMER LAYER

> **VISUAL:** Slide 9 — wallet, games, Moments, bracket

**"But a fan isn't a trader, so we wrapped a product around the engine.**

**You can connect Phantom if you want. Or just use an email and a one-time code — we derive a key for you, and you're trading in ten seconds instead of ten minutes.**

**There are free games running on the same live feed. Pick the next goal. Beat the market. Fill the bracket — and your bracket gets scored by a cryptographic proof, not by us.**

**And Moments: the biggest swing of a match, captured as a card, minted on Solana. Yours to keep.**

**Forty-eight teams. Sixteen stadiums. All hundred-and-four fixtures — through to the Final at MetLife, on July nineteenth."**

---

## 3:00 — 3:55 · UNDER THE HOOD

> **VISUAL:** Slide 7, then slide 8

**"Now — why Solana, and why TxLINE.**

**Because the alternative is asking you to trust us. And you shouldn't have to.**

**Every price we quote traces back to TxLINE's signed feed. Consensus odds, de-vigged into fair marks. Live scores that trigger the halt. And here's the part no other data provider gives you — the same feed that moves the price is the one that proves the result.**

*[beat]*

**"So our Anchor program is the referee. `settle_market` is permissionless and one-shot. It refuses to settle unless a TxLINE proof verifies on-chain, by CPI. There is no admin key. There is no override. We could not cheat our own market if we wanted to.**

**And that only works on Solana. Sub-second finality, sub-cent fees — that's what makes per-match settlement, leaderboard roots and on-chain Moments economically possible at all. On any other chain, this product doesn't exist.**

**Behind it: an LMSR market maker, single-writer, journal-then-ack, fully replayable. Every input becomes a signed event on a bus. No service calls another service directly."**

---

## 3:55 — 4:30 · THE FINDING

> **VISUAL:** Slide 10

**"One more thing. And it's the reason I'd trust this thing over most of what you'll see today.**

**We tried to break our own settlement.**

**And we succeeded.**

*[beat]*

**"The sanctioned path selects the finalised score record off-chain, by sequence number. But on-chain, the validator proves a stat leaf is in the Merkle root — it never sees whether that record was the final one. So a caller could pick a mid-match sequence and produce a proof that verifies identically. Finality is asserted. It isn't proven.**

**Two independent adversarial audits found it. So we hard-gated settlement off — inside the program itself — and took the question to TxODDS.**

**We'd rather be the team that found that than the team that shipped it."**

---

## 4:30 — 5:00 · CLOSE

> **VISUAL:** Slide 11 → slide 12 → title card

**"All of this was built in thirteen days. One engineer, and a team of AI agents under a written constitution — a hundred and eighty-one commits, eighty-seven architecture decisions, every one written down before it was coded.**

**Next: we finish the live wiring, and Ninety monitors the World Cup Final on the nineteenth — real prices, real halts, real settlement. Prize money goes straight into infrastructure, so the feed and the proofs keep running.**

*[beat]*

**"Play-money is the moat. It makes Ninety the clean front door that a sportsbook is not legally allowed to build.**

**Ninety. The market moves the moment the ball does.**

**Thank you."**

---

## Cheat sheet

| Say | Never say |
|---|---|
| price · trade · credits · shares | bet · stake · odds · wager · gamble |
| play-money · free to play | free bet · risk-free |
| the market repriced | the odds shifted |

**Numbers to land clean:** 0–100 · 1,000 free credits · 104 fixtures · 181 commits · 87 ADRs · 13 days · July 19.

**If you overrun:** cut the LMSR/bus sentence at 3:45 and the Moments line at 2:50. Never cut the cold open, the halt, or the settlement finding.
