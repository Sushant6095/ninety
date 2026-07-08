// Prompt 20 VERIFY (anchor tests): valid claim once ✓, replay ✗, wrong proof ✗, foreign leaf ✗.
// Plus authority-gating on post_leaderboard_root. Runs on the anchor localnet validator.
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
const BN = (anchor as any).default.BN; // BN isn't ESM-named-exportable from the CJS anchor pkg; take it off the default export
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, getAccount } from "@solana/spl-token";
import sha3 from "js-sha3";
import { assert } from "chai";
const { keccak256 } = sha3; // js-sha3 is CommonJS — default import + destructure works under both CJS and ESM interop

const kc = (...bufs: Buffer[]) => Buffer.from(keccak256.arrayBuffer(Buffer.concat(bufs)));
const u32le = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
const u64le = (n: number | bigint) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
const leafHash = (pk: PublicKey, amount: number) => kc(pk.toBuffer(), u64le(amount));
const nodeHash = (a: Buffer, b: Buffer) => (Buffer.compare(a, b) <= 0 ? kc(a, b) : kc(b, a));

describe("omnipitch_core — leaderboard claim (prompt 20)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.omnipitchCore as Program;
  const me = provider.wallet.publicKey;

  const pda = (seeds: Buffer[]) => PublicKey.findProgramAddressSync(seeds, program.programId)[0];
  const config = pda([Buffer.from("config")]);
  const vaultAuth = pda([Buffer.from("vault_auth")]);
  const mint = pda([Buffer.from("mint")]);
  const vault = pda([Buffer.from("vault")]);
  const pointsEpoch = (e: number) => pda([Buffer.from("points"), u32le(e)]);
  const receipt = (e: number, who: PublicKey) => pda([Buffer.from("claim"), u32le(e), who.toBuffer()]);

  // A 4-leaf tree: leaf 0 = (me, 100) is the one we claim; the rest are decoys.
  const AMOUNT = 100;
  const decoy = () => Keypair.generate().publicKey;
  const leaves = [leafHash(me, AMOUNT), leafHash(decoy(), 200), leafHash(decoy(), 300), leafHash(decoy(), 400)];
  const ab = nodeHash(leaves[0], leaves[1]);
  const cd = nodeHash(leaves[2], leaves[3]);
  const root = nodeHash(ab, cd);
  const validProof = [leaves[1], cd]; // proof for leaf 0
  const wrongProof = [leaves[2], cd]; // bad sibling
  const myAta = getAssociatedTokenAddressSync(mint, me);

  before(async () => {
    await program.methods.initConfig(me).accounts({ config, payer: me, systemProgram: SystemProgram.programId }).rpc();
    await program.methods.initVault().accounts({ mint, vault, vaultAuthority: vaultAuth, payer: me, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId, rent: anchor.web3.SYSVAR_RENT_PUBKEY }).rpc();
    // create my ATA to receive claimed points
    const tx = new anchor.web3.Transaction().add(createAssociatedTokenAccountInstruction(me, myAta, me, mint));
    await provider.sendAndConfirm(tx);
  });

  const postRoot = (e: number) =>
    program.methods.postLeaderboardRoot(e, [...root]).accounts({ config, authority: me, pointsEpoch: pointsEpoch(e), systemProgram: SystemProgram.programId }).rpc();

  const claim = (e: number, amount: number, proof: Buffer[]) =>
    program.methods.claimPoints(e, new BN(amount), proof.map((p) => [...p]))
      .accounts({ pointsEpoch: pointsEpoch(e), receipt: receipt(e, me), claimer: me, vault, vaultAuthority: vaultAuth, mint, claimerAta: myAta, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId }).rpc();

  it("valid claim credits the exact amount ONCE", async () => {
    await postRoot(1);
    await claim(1, AMOUNT, validProof);
    const bal = await getAccount(provider.connection, myAta);
    assert.equal(bal.amount.toString(), AMOUNT.toString());
  });

  it("replay of the same claim FAILS (receipt PDA already exists)", async () => {
    let failed = false;
    try { await claim(1, AMOUNT, validProof); } catch { failed = true; }
    assert.isTrue(failed, "replay must fail");
    const bal = await getAccount(provider.connection, myAta);
    assert.equal(bal.amount.toString(), AMOUNT.toString(), "balance unchanged after replay");
  });

  it("a WRONG proof FAILS (fresh epoch → not a receipt collision)", async () => {
    await postRoot(2);
    let failed = false;
    try { await claim(2, AMOUNT, wrongProof); } catch { failed = true; }
    assert.isTrue(failed, "wrong proof must fail");
  });

  it("a FOREIGN leaf (tampered amount, not in the tree) FAILS", async () => {
    await postRoot(3);
    let failed = false;
    try { await claim(3, AMOUNT + 1, validProof); } catch { failed = true; } // leaf(me, 101) ∉ tree
    assert.isTrue(failed, "foreign leaf must fail");
  });

  it("post_leaderboard_root is AUTHORITY-GATED (a non-authority signer is rejected)", async () => {
    const stranger = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(stranger.publicKey, 1e9);
    await provider.connection.confirmTransaction(sig);
    let failed = false;
    try {
      await program.methods.postLeaderboardRoot(9, [...root])
        .accounts({ config, authority: stranger.publicKey, pointsEpoch: pointsEpoch(9), systemProgram: SystemProgram.programId })
        .signers([stranger]).rpc();
    } catch { failed = true; }
    assert.isTrue(failed, "non-authority must be rejected");
  });
});
