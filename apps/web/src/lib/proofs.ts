// Proofs fixtures — the settlement proof log. Shaped like GET /proofs. ADR-051: the RESULT comes from TxLINE
// consensus (who won, the final score); Solana devnet holds the immutable PROOF (the settle tx). There is NO
// admin result path. Play-money: "volume" is credits, never cash. Winners are consistent with the group
// standings on /competition (group leaders advanced) so the log never contradicts the board.
import type { Outcome } from "./types";

export interface Proof {
  id: string;
  matchId: string;
  homeCode: string; // FIFA 3-letter
  awayCode: string;
  score: string; // final score, TxLINE-decided
  outcome: Outcome; // the outcome that resolved to 1 (H/D/A)
  winnerCode: string; // team code for the winner chip, or "DRAW"
  stage: string; // "Round of 32" / "Group A" …
  settledAt: string; // "1h ago" / "4 Jul"
  slot: number; // Solana devnet slot the settle tx landed in
  txSig: string; // settle-tx signature → Solscan (the ONLY chain surface, violet)
  volume: number; // credits traded on the market (play money)
  traders: number;
}

// Total settled to date — matches the "Proofs" nav badge count.
export const PROOFS_TOTAL = 88;

export const PROOFS: Proof[] = [
  { id: "p-srb-cmr", matchId: "wc26-srb-cmr", homeCode: "SRB", awayCode: "CMR", score: "2–1", outcome: "H", winnerCode: "SRB", stage: "Round of 16", settledAt: "1h ago", slot: 297_431_402, txSig: "5Kx7bQ…9f2aTx", volume: 214_800, traders: 3_910 },
  { id: "p-mex-rsa", matchId: "wc26-mex-rsa", homeCode: "MEX", awayCode: "RSA", score: "2–0", outcome: "H", winnerCode: "MEX", stage: "Group A", settledAt: "Jun 27", slot: 296_884_017, txSig: "7pR2mE…4kQ1Ln", volume: 168_300, traders: 3_120 },
  { id: "p-bra-hai", matchId: "wc26-bra-hai", homeCode: "BRA", awayCode: "HAI", score: "4–0", outcome: "H", winnerCode: "BRA", stage: "Group C", settledAt: "Jun 26", slot: 296_712_559, txSig: "9aL4nP…2mW8Rv", volume: 201_450, traders: 3_640 },
  { id: "p-ger-ecu", matchId: "wc26-ger-ecu", homeCode: "GER", awayCode: "ECU", score: "3–1", outcome: "H", winnerCode: "GER", stage: "Group E", settledAt: "Jun 25", slot: 296_540_921, txSig: "3hT8vD…7cX5Bq", volume: 152_900, traders: 2_870 },
  { id: "p-ned-tun", matchId: "wc26-ned-tun", homeCode: "NED", awayCode: "TUN", score: "2–0", outcome: "H", winnerCode: "NED", stage: "Group F", settledAt: "Jun 24", slot: 296_388_144, txSig: "6bY1wF…8dZ3Km", volume: 141_600, traders: 2_540 },
  { id: "p-fra-irq", matchId: "wc26-fra-irq", homeCode: "FRA", awayCode: "IRQ", score: "3–0", outcome: "H", winnerCode: "FRA", stage: "Group I", settledAt: "Jun 23", slot: 296_201_733, txSig: "2cN9sJ…5vQ7Hp", volume: 176_050, traders: 3_010 },
  { id: "p-cro-gha", matchId: "wc26-cro-gha", homeCode: "CRO", awayCode: "GHA", score: "2–1", outcome: "H", winnerCode: "CRO", stage: "Group L", settledAt: "Jun 22", slot: 296_044_612, txSig: "8eM3rK…1bL9Wt", volume: 118_700, traders: 2_180 },
  { id: "p-arg-jor", matchId: "wc26-arg-jor", homeCode: "ARG", awayCode: "JOR", score: "3–1", outcome: "H", winnerCode: "ARG", stage: "Group J", settledAt: "Jun 21", slot: 295_889_305, txSig: "4dP6tL…3nR2Yx", volume: 189_240, traders: 3_330 },
];
