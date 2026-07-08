//! Merkle inclusion for leaderboard point claims (prompt 20). PURE — host-testable (cargo test), no accounts/IO.
//! Leaf = keccak256(claimer_pubkey(32) || amount_le(8)); internal nodes = keccak256(sorted pair). Sorted-pair
//! (OpenZeppelin-style) folding makes proofs order-independent and second-preimage-safe for THIS fixed leaf shape.
use anchor_lang::solana_program::keccak::hashv;

/// The leaderboard leaf commitment: binds a specific claimer to a specific amount.
pub fn leaf_hash(pubkey: &[u8; 32], amount: u64) -> [u8; 32] {
    hashv(&[pubkey, &amount.to_le_bytes()]).0
}

/// Fold `leaf` up through `proof` (sorted pairs) and check it reconstructs `root`. A wrong sibling, a foreign
/// leaf, or a tampered amount all yield a different computed root → false. No allocation beyond the 32-byte acc.
pub fn verify_proof(leaf: [u8; 32], proof: &[[u8; 32]], root: [u8; 32]) -> bool {
    let mut computed = leaf;
    for sib in proof {
        computed = if computed <= *sib {
            hashv(&[&computed, sib]).0
        } else {
            hashv(&[sib, &computed]).0
        };
    }
    computed == root
}

#[cfg(test)]
mod tests {
    use super::*;

    fn node(a: [u8; 32], b: [u8; 32]) -> [u8; 32] {
        if a <= b {
            hashv(&[&a, &b]).0
        } else {
            hashv(&[&b, &a]).0
        }
    }

    // A 4-leaf tree over (pubkey, amount) claims: verify inclusion, and reject wrong proof / foreign leaf / tampered amount.
    #[test]
    fn verifies_inclusion_and_rejects_forgeries() {
        let pk = |n: u8| [n; 32];
        let (a, b, c, d) = (
            leaf_hash(&pk(1), 100),
            leaf_hash(&pk(2), 200),
            leaf_hash(&pk(3), 300),
            leaf_hash(&pk(4), 400),
        );
        let (ab, cd) = (node(a, b), node(c, d));
        let root = node(ab, cd);

        // valid: A's proof is [B, CD]
        assert!(verify_proof(a, &[b, cd], root));
        // valid: C's proof is [D, AB]
        assert!(verify_proof(c, &[d, ab], root));

        // wrong proof (bad sibling) → reject
        assert!(!verify_proof(a, &[c, cd], root));
        // foreign leaf (not in the tree) → reject
        assert!(!verify_proof(leaf_hash(&pk(9), 999), &[b, cd], root));
        // tampered amount (same claimer, different amount) → reject
        assert!(!verify_proof(leaf_hash(&pk(1), 101), &[b, cd], root));
        // empty proof only verifies a single-leaf tree (leaf == root)
        assert!(verify_proof(a, &[], a));
        assert!(!verify_proof(a, &[], root));
    }
}
