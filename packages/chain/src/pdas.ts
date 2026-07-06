import { PublicKey } from "@solana/web3.js";
export const marketPda = (programId: PublicKey, matchId: string) =>
  PublicKey.findProgramAddressSync([Buffer.from("market"), Buffer.from(matchId)], programId);
