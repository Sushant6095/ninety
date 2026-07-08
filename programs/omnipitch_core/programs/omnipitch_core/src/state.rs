use anchor_lang::prelude::*;
#[account]
pub struct Market {
    pub match_id: String,   // seeds: ["market", match_id]
    pub kickoff: i64,
    pub status: u8,         // 0 sched 1 live 2 resolving 3 settled 4 voided
    pub result: u8,         // 0 unset 1 H 2 D 3 A
    pub proof_hash: [u8; 32],
    pub settled_slot: u64,
    pub lb_root: [u8; 32],
}

// Program config — set once at init. Gates who may post leaderboard roots (prompt 20).
#[account]
pub struct Config {
    pub authority: Pubkey, // the only signer allowed to post_leaderboard_root
    pub bump: u8,
}

// A posted leaderboard root for an epoch. seeds: ["points", epoch_le]. root commits (pubkey, amount) leaves.
#[account]
pub struct PointsEpoch {
    pub epoch: u32,
    pub root: [u8; 32],
    pub total: u64,
}

// Double-claim guard. seeds: ["claim", epoch_le, claimer]. Its mere EXISTENCE means this (epoch, claimer) already
// claimed — `init` in claim_points fails on a replay (account-already-in-use), so a second claim is impossible.
#[account]
pub struct ClaimReceipt {
    pub amount: u64, // what was claimed (audit)
}
