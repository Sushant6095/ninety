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
#[account]
pub struct PointsEpoch { pub epoch: u32, pub root: [u8; 32], pub total: u64 }
