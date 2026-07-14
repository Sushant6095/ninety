# BUILD LOG — what we built, honestly

Ninety: a play-money live football exchange for WC26. This log is the honest inventory — what runs,
what is gated off on purpose, and what we proved along the way. Numbers here are verified against the
repo (the commands are inline), not estimated.

## 1. The strongest thing in this repo: we broke our own settlement, and shipped the OFF switch

The headline feature was trustless settlement: at full time, `settle_market` verifies a TxODDS
cryptographic proof of the score on-chain — no admin result path exists in the program, by design.

Building it, we adversarially reviewed our own gate three times, and each round survived honestly:

- **Round 1 (ADR-036, C-1 swap forge).** Our first cut only required the two proven stats to share a
  period. The proof-auditor showed that was forgeable: present the real away-goals leaf as `stat_home`
  (or any two genuinely-anchored stats) and settle an arbitrary result with 100%-valid Merkle proofs.
  Fixed by pinning statKey identity + the final period.
- **Round 2 (ADR-036, the sentinel refutation).** The fix pinned statKeys `1002/1003` — and the
  auditor refuted the fix: those are real anchored stats that are *not* goals, so a "fail-closed"
  constant that is merely *wrong* is an open forge, strictly worse than an impossible one. We replaced
  them with impossible sentinels so nothing could settle at all.
- **Round 3 (ADR-037, the finality forge — filed upstream).** The TxLINE admin confirmed the real
  mechanism (statKeys 1/2 = total goals; "final" = the `game_finalised` record, selected off-chain).
  That surfaced the deepest hole: the sponsor's own sanctioned instruction, `validate_stat_v2`,
  proves a stat is anchored in *some* batch of the fixture — not that it is the finalised one. A
  permissionless caller could settle HOME with a genuine mid-match proof from a moment the home side
  happened to lead. **That is a wrong-result forge in the sanctioned path, and we filed it back to
  the sponsor.**

So settlement today is `SETTLEMENT_LIVE = false` — an explicit `require!` revert as the first
statement of the handler, not a TODO. The off-chain recipe (`settlementProof`: find `game_finalised`,
derive H/D/A, prove statKeys 1,2 from its `Seq`) is implemented and unit-verified against the mock;
the V2 CPI is documented with its real discriminator and ready to wire the moment finality binding is
answered. We will not ship a settle we can prove is forgeable — even in play-money.

## 2. What runs today

- **The terminal** (`/terminal`): the pro match view — Momentum River as the hero, live tape with
  180 ms tick-flash, LMSR trade panel, live P&L, Booth commentary, attack momentum, and Sofascore
  depth inside tabs (stats bars, native-SVG lineups, H2H + crowd vote, incident timeline). The
  74' halt choreography (goal → halt → amber sweep → reprice 31 → 55 → Booth call) is the money shot,
  and it replays deterministically from a seeded frame.
- **The board** (`/board`): the trader's slate — 16 Round-of-16 markets grouped live/upcoming/finished,
  movers with real Δ-vs-open, standings, power rankings, Booth strip.
- **The landing** (`/`): hyperfoundation-informed arrival — live hero River tape, the halt loop
  replaying on scroll in the REAL FeaturedPanel, one giant number, the proof section (the page's only
  violet), and one filled CTA repeated verbatim: **Open the terminal**.
- **One store, one universe.** Every live surface reads `matchLiveStore` (useSyncExternalStore, one
  Map, per-match subscriptions), and every fixture derives from ONE `MARKETS` array — the ticker and
  the terminal rail are computed from it, not hand-written twins. The R16 slate is exactly 16 matches
  and 32 unique teams; R32 is the settled past with receipts on `/proofs`.
- **The plumbing:** two-plane bus (domain events + system signals) as the only inter-service path;
  the engine as the single writer of market state (journal-then-ack); `packages/txline` as the only
  TxLINE caller; `packages/chain` as the only tx builder; the Anchor program with no admin result path.

## 3. How it is verified (this session's numbers)

- **The read-out-loud test.** Enumerate every text element on a still; if any two disagree, it is not
  done. This caught more real bugs than any tool: Argentina in two matches at once, a ticker quoting
  "H" on a 0–1 scoreline, a date strip calling Jul 5 "today" above Jul 4 kickoffs, Qatar playing an
  R16 match while its group table showed it eliminated, a moment card citing a 41 → 63 reprice on a
  tape that opened at 52.
- **Lighthouse** (landing): live before this session's push — desktop 99 / FCP 0.3 s; local
  production build after — desktop 100 / FCP 0.2 s / CLS 0. (The 9.7 s FCP measured earlier in the
  week was the pre-restructure deploy that gated the whole page behind an IntersectionObserver; the
  hero now renders in server HTML with no opacity gate.)
- **axe:** 0 violations on `/`, `/board`, `/terminal` (production build).
- **design-cop:** full-rubric verdicts written to `design/verdicts/`.
- **Provenance:** every non-Ninety component in `design/PROVENANCE.md` with the tool that produced it
  and the searches that missed — including the pull we rejected (a 21st.dev avatar group that turned
  out to re-export Meta's design system; logged, not merged).
- `pnpm --filter web build` green; `tsc --noEmit` green after every change batch.

## 4. Honest gaps

- **Settlement is off** (§1) until `validate_stat_v2` finality binding is answered upstream — the
  strongest decision here is the one that keeps it off. Knockout shootouts additionally need a
  decision stat (total goals read level).
- **The web app trades on seeded fixtures + a local drift clock**, not the live TxLINE feed; the
  live-integration branch carries the swap (the live API serves OU/AH lines; the web SSOT models
  H/D/A — the merge is a modelling exercise, not a seed swap).
- **Mobile is explicitly out of scope** for this pass (desktop lg/xl only, per the sprint brief).
- Market creation is permissionless with caller-supplied kickoff (liveness squat, ADR-036 M-1) —
  gated as a follow-up.

## 5. The count (verified, not estimated)

```
git rev-list --count HEAD   → 125 commits
ls docs/adr/*.md | wc -l    → 58 ADRs
```

Every decision in this repo has an ADR; chat is not memory.
