use anchor_lang::prelude::*;
use crate::proof::OmniError;
use crate::state::Market;
use crate::txoracle_cpi::{self, daily_scores_roots_pda, ProofNode, ScoresBatchSummary, StatTerm, EPOCH_DAY_SECS, SETTLEMENT_LIVE, STAT_KEY_AWAY_GOALS, STAT_KEY_HOME_GOALS, TXORACLE_ID};

// Permissionless, one-shot settlement. The ONLY gate is txoracle.validate_stat (CPI) — no admin result path.
#[derive(Accounts)]
pub struct SettleMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub caller: Signer<'info>, // permissionless — anyone may settle; the proof is the sole gate
    /// CHECK: the txoracle daily_scores_roots PDA — verified == the derived PDA for this market's epochDay (C2).
    pub daily_scores_roots: UncheckedAccount<'info>,
    /// CHECK: the txoracle program — pinned to TXORACLE_ID, never caller-chosen (C2).
    #[account(address = TXORACLE_ID @ OmniError::Unauthorized)]
    pub txoracle_program: UncheckedAccount<'info>,
}

#[allow(clippy::too_many_arguments)]
pub fn handler(
    ctx: Context<SettleMarket>,
    result: u8,
    ts: i64,
    fixture_summary: ScoresBatchSummary,
    fixture_proof: Vec<ProofNode>,
    main_tree_proof: Vec<ProofNode>,
    stat_home: StatTerm,
    stat_away: StatTerm,
) -> Result<()> {
    // FAIL-CLOSED: settlement is hard-disabled until the on-chain finality gate + validateStatV2 land (ADR-037).
    // With SETTLEMENT_LIVE=false EVERY settle is rejected here — nothing below can run, so no result is ever written.
    require!(SETTLEMENT_LIVE, OmniError::SettlementDisabled);

    let m = &mut ctx.accounts.market;
    require!(m.status < 3, OmniError::AlreadySettled); // one-shot: a second settle no-ops (idempotent for the saga)

    // C1 — bind the proof to THIS market: the summary's fixtureId is our match_id, and epochDay is derived ON-CHAIN
    // from the market's kickoff (never the caller), so a valid proof for the WRONG fixture/day cannot settle us.
    let match_fixture_id: i64 = m.match_id.parse().map_err(|_| error!(OmniError::InvalidProof))?;
    require!(fixture_summary.fixture_id == match_fixture_id, OmniError::InvalidProof);
    let epoch_day = (m.kickoff / EPOCH_DAY_SECS) as u16;

    // C2 — the roots account MUST be the txoracle PDA for this epochDay (the program is pinned via #[account(address)]).
    require_keys_eq!(ctx.accounts.daily_scores_roots.key(), daily_scores_roots_pda(epoch_day), OmniError::Unauthorized);

    // C-1 (stat identity) — bind WHICH stat is home vs away: stat_home MUST be statKey 1 (home total goals) and
    // stat_away MUST be statKey 2 (away total goals). Without this a caller could pass any two anchored stats (or the
    // goal stats SWAPPED) and settle an arbitrary result with genuine proofs. NOTE: this does NOT prove the record is
    // game_finalised — that finality gate is unresolved on-chain (see SETTLEMENT_LIVE in txoracle_cpi.rs / ADR-037),
    // which is why the hard gate above keeps settlement disabled.
    require!(stat_home.stat_to_prove.key == STAT_KEY_HOME_GOALS, OmniError::InvalidProof);
    require!(stat_away.stat_to_prove.key == STAT_KEY_AWAY_GOALS, OmniError::InvalidProof);

    // The Merkle score-proof verification happens INSIDE txoracle.validate_stat via CPI; false/None/other-program
    // ⇒ reject. The predicate (home−away vs 0, comparison from `result`) is built on-chain. Only then write the result.
    txoracle_cpi::cpi_validate(&ctx.accounts.txoracle_program, &ctx.accounts.daily_scores_roots, result, ts, fixture_summary, fixture_proof, main_tree_proof, stat_home, stat_away)?;

    m.result = result;
    m.status = 3;
    m.settled_slot = Clock::get()?.slot;
    Ok(())
}
