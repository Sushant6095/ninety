# 07 — Settlement proof spike (txoracle.validateStat)

Goal: prove OMNIPITCH can settle a 1X2 market trustlessly from a final score — reconstruct the result
predicate, CPI into `txoracle.validateStat` against the anchored `daily_scores_roots` PDA, `require(true)`,
write result. See TXLINE-MAP §3. Requires **05 + 06 GREEN** (world-verified data spine) — the IDL,
`stat-validation` bundle shape, and stream freshness are all now proven live (ADR-015/016).

## STEP 0 — catalog discovery (do this FIRST; closes ADR-015's open ⚠)

The numeric `Stats`-map key→metric table is still unconfirmed, and settlement needs the FINAL score keys.
Before writing any Anchor code, discover and record (into TXLINE-MAP §1 K1 + a `statkeys.ts` table):

1. **statKey catalog** — pull the full table from the TxLINE `scores/soccer-feed` docs page. Map every
   key seen live (`1..8`, `1001..1008`, `2001..2008`, …) to its metric name.
2. **FINAL-goals key(s)** — determine which statKey the `stat-validation` endpoint proves for *final home
   goals* and *final away goals*. NOTE (ADR-015): `Score.*.Total.Goals` is the human-readable score, but
   statKey `1002`≠goals (live: `statToProve.key=1002 value=2` while `Score.P1.Total.Goals=1`). Find the
   real goals key(s) by requesting `stat-validation?...&statKey=<candidate>` for a FINISHED fixture whose
   final score is known, until `statToProve.value` matches `Score.*.Total.Goals`. Record the confirmed keys.
3. **FINISHED field** — identify the field+value that means the match is over (candidates: `GameState`,
   `StatusId`, `Clock.Running=false`). Confirm on a finished fixture. Settlement must gate on FINISHED
   (never settle at 90' of a knockout tie going to extra time — TXLINE-MAP §3).

Exit STEP 0 only when: goals-key(s) confirmed against a real final score, FINISHED signal confirmed, and
both are written to TXLINE-MAP + `statkeys.ts`. If the soccer-feed table is unreachable, STOP and mark
07 YELLOW with that exact unblock (PROGRAM-STANDARD).

## STEP 1 — result derivation (off-chain, from the confirmed keys)
- HOME win ⇔ `validateStat(homeGoals − awayGoals, subtract, greaterThan 0)`; AWAY ⇔ `lessThan 0`; DRAW ⇔ both false.

## STEP 2 — on-chain: CPI vs replicate
- Run TxLINE's single-stat validation example as-is on devnet, then attempt CPI into `txoracle.validateStat`
  from a scratch Anchor program (their example uses `.view()` simulation). Needs `setComputeUnitLimit(1_400_000)`.
- Decide **CPI** vs **replicate Merkle verification in `proof.rs`** (all shapes — fixtureSummary, subTreeProof,
  mainTreeProof, statProof — are in the `stat-validation` bundle). Update `proof.rs` + ADR-004.

## STEP 3 — wire into `settle_market(result, proof_bundle)`; require FINISHED; write result + `settleSig`.
