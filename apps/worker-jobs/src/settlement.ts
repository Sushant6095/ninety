// Idempotent saga (SettlementSaga table): FT_DETECTED → PROOF_FETCHED → TX_SENT → CONFIRMED → CREDITED → ROOT_POSTED → MOMENTS.
// The worker FORWARDS the proof; programs/omnipitch_core/proof.rs VERIFIES it. No admin result path exists.
export {};
