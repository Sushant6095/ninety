// Proofs fixtures — the result + settlement log. Shaped like GET /proofs. ADR-051: the RESULT comes from TxLINE
// consensus (who won, the final score) with NO admin path. The on-chain PROOF (a Solscan-verifiable settle tx)
// is NOT here yet: settlement is fail-closed on purpose (ADR-036 / ADR-037) — a forgeable path was found in the
// sanctioned oracle (validate_stat_v2 doesn't bind finality), so settlement was disabled rather than shipped.
// Hence NO txSig / slot — a proof appears only once a real settle tx exists (never a fabricated Solscan link).
// Play-money: "volume" is credits, never cash. Winners match the /competition group standings so the log never
// contradicts the board.
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
  decidedAt: string; // when TxLINE consensus decided the result — "1h ago" / "Jun 27"
  volume: number; // credits traded on the market (play money)
  traders: number;
}

// Total results decided to date — matches the "Proofs" nav badge count.
export const PROOFS_TOTAL = 88;

export const PROOFS: Proof[] = [
  { id: "p-srb-cmr", matchId: "wc26-srb-cmr", homeCode: "SRB", awayCode: "CMR", score: "2–1", outcome: "H", winnerCode: "SRB", stage: "Round of 16", decidedAt: "1h ago", volume: 214_800, traders: 3_910 },
  { id: "p-mex-rsa", matchId: "wc26-mex-rsa", homeCode: "MEX", awayCode: "RSA", score: "2–0", outcome: "H", winnerCode: "MEX", stage: "Group A", decidedAt: "Jun 27", volume: 168_300, traders: 3_120 },
  { id: "p-bra-hai", matchId: "wc26-bra-hai", homeCode: "BRA", awayCode: "HAI", score: "4–0", outcome: "H", winnerCode: "BRA", stage: "Group C", decidedAt: "Jun 26", volume: 201_450, traders: 3_640 },
  { id: "p-ger-ecu", matchId: "wc26-ger-ecu", homeCode: "GER", awayCode: "ECU", score: "3–1", outcome: "H", winnerCode: "GER", stage: "Group E", decidedAt: "Jun 25", volume: 152_900, traders: 2_870 },
  { id: "p-ned-tun", matchId: "wc26-ned-tun", homeCode: "NED", awayCode: "TUN", score: "2–0", outcome: "H", winnerCode: "NED", stage: "Group F", decidedAt: "Jun 24", volume: 141_600, traders: 2_540 },
  { id: "p-fra-irq", matchId: "wc26-fra-irq", homeCode: "FRA", awayCode: "IRQ", score: "3–0", outcome: "H", winnerCode: "FRA", stage: "Group I", decidedAt: "Jun 23", volume: 176_050, traders: 3_010 },
  { id: "p-cro-gha", matchId: "wc26-cro-gha", homeCode: "CRO", awayCode: "GHA", score: "2–1", outcome: "H", winnerCode: "CRO", stage: "Group L", decidedAt: "Jun 22", volume: 118_700, traders: 2_180 },
  { id: "p-arg-jor", matchId: "wc26-arg-jor", homeCode: "ARG", awayCode: "JOR", score: "3–1", outcome: "H", winnerCode: "ARG", stage: "Group J", decidedAt: "Jun 21", volume: 189_240, traders: 3_330 },
];
