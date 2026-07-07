// 07 proof spike — reproduce txoracle.validate_stat on devnet with a real stat-validation bundle,
// two-stat home−away predicate. Emits a devnet SIG proving a validated stat + measures CU consumed
// (the number that decides Plan A CPI vs Plan B replicate). Needs funded devnet wallet.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createPrivateKey, sign as edSign } from "node:crypto";
import anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
const { BN } = anchor;

const API = "https://txline-dev.txodds.com";
const RPC = "https://api.devnet.solana.com";
const PROGRAM = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const MINT = new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG");
const T22 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATAP = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const SUB_DISC = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);
const idl = JSON.parse(readFileSync(new URL("../packages/txline/txoracle.json", import.meta.url), "utf8"));

const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8"))));
const conn = new Connection(RPC, "confirmed");
const ata = (o) => PublicKey.findProgramAddressSync([o.toBuffer(), T22.toBuffer(), MINT.toBuffer()], ATAP)[0];
const edB64 = (m, sk) => edSign(null, Buffer.from(m), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(sk.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");
const b32 = (v) => Array.from(v);
const nodes = (ps) => (ps ?? []).map((p) => ({ hash: b32(p.hash), isRightSibling: p.isRightSibling }));

async function auth() {
  const [tPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM);
  const [pm] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM);
  const u = ata(kp.publicKey), vault = ata(tPda);
  const args = Buffer.alloc(3); args.writeUInt16LE(1, 0); args.writeUInt8(4, 2);
  const createAta = new TransactionInstruction({ programId: ATAP, keys: [
    { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: u, isSigner: false, isWritable: true },
    { pubkey: kp.publicKey, isSigner: false, isWritable: false }, { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, { pubkey: T22, isSigner: false, isWritable: false }], data: Buffer.from([1]) });
  const sub = new TransactionInstruction({ programId: PROGRAM, keys: [
    { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: pm, isSigner: false, isWritable: false },
    { pubkey: MINT, isSigner: false, isWritable: false }, { pubkey: u, isSigner: false, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true }, { pubkey: tPda, isSigner: false, isWritable: false },
    { pubkey: T22, isSigner: false, isWritable: false }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: ATAP, isSigner: false, isWritable: false }], data: Buffer.concat([SUB_DISC, args]) });
  const tx = new Transaction().add(createAta).add(sub);
  tx.feePayer = kp.publicKey; tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash; tx.sign(kp);
  const sig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  await conn.confirmTransaction(sig, "confirmed");
  const jwt = (await (await fetch(`${API}/auth/guest/start`, { method: "POST" })).json()).token;
  const act = await fetch(`${API}/api/token/activate`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` }, body: JSON.stringify({ txSig: sig, walletSignature: edB64(`${sig}::${jwt}`, kp.secretKey), leagues: [] }) });
  const t = await act.text(); let apiToken; try { const j = JSON.parse(t); apiToken = j.token || j; } catch { apiToken = t.trim(); }
  return { jwt, apiToken };
}

async function main() {
  console.log("wallet", kp.publicKey.toBase58(), "| bal", (await conn.getBalance(kp.publicKey)) / 1e9);
  const { jwt, apiToken } = await auth();
  const H = { authorization: `Bearer ${jwt}`, "x-api-token": apiToken };

  // pick a fixture + seq, fetch a TWO-stat validation bundle (home=1002, away=1003)
  const fixtures = await (await fetch(`${API}/api/fixtures/snapshot`, { headers: H })).json();
  const wc = fixtures.find((f) => f.CompetitionId === 72) || fixtures[0];
  const fid = wc.FixtureId;
  const scores = await (await fetch(`${API}/api/scores/snapshot/${fid}`, { headers: H })).json();
  const seq = scores[0]?.Seq;
  console.log(`fixture ${fid} (${wc.Participant1} v ${wc.Participant2}) seq ${seq}`);
  const v = await (await fetch(`${API}/api/scores/stat-validation?fixtureId=${fid}&seq=${seq}&statKey=1002&statKey2=1003`, { headers: H })).json();
  const a = v.statToProve?.value, b = (v.statToProve2 ?? v.statToProve)?.value;
  const twoStat = v.statToProve2 != null && v.statProof2 != null;
  console.log("STEP0 statToProve(1002).value =", a, "| statToProve2(1003).value =", b, "| twoStat:", twoStat, "| finished signal GameState=", scores[0]?.GameState, "StatusId=", scores[0]?.StatusId);

  // predicate matched to reality so the validated result is TRUE
  const cmp = twoStat ? (a > b ? { greaterThan: {} } : a < b ? { lessThan: {} } : { equalTo: {} }) : { greaterThan: {} };
  const predicate = { threshold: 0, comparison: cmp };
  const stat1 = { statToProve: v.statToProve, eventStatRoot: b32(v.eventStatRoot), statProof: nodes(v.statProof) };
  const stat2 = twoStat ? { statToProve: v.statToProve2, eventStatRoot: b32(v.eventStatRoot), statProof: nodes(v.statProof2) } : null;
  const op = twoStat ? { subtract: {} } : null;
  const summary = {
    fixtureId: new BN(v.summary.fixtureId),
    updateStats: { updateCount: v.summary.updateStats.updateCount, minTimestamp: new BN(v.summary.updateStats.minTimestamp), maxTimestamp: new BN(v.summary.updateStats.maxTimestamp) },
    eventsSubTreeRoot: b32(v.summary.eventStatsSubTreeRoot),
  };
  const fixtureProof = nodes(v.subTreeProof);
  const mainTreeProof = nodes(v.mainTreeProof);
  const targetTs = Number(v.summary.updateStats.minTimestamp);
  const epochDay = Math.floor(targetTs / 86400000);
  const eb = Buffer.alloc(2); eb.writeUInt16LE(epochDay);
  const [dailyPda] = PublicKey.findProgramAddressSync([Buffer.from("daily_scores_roots"), eb], PROGRAM);
  console.log(`predicate: (1002 ${twoStat ? "− 1003" : ""}) ${JSON.stringify(cmp)} 0 | epochDay ${epochDay} | dailyScoresPda ${dailyPda.toBase58()}`);

  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(kp), { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);
  const cuIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 });
  const method = program.methods.validateStat(new BN(targetTs), summary, fixtureProof, mainTreeProof, predicate, stat1, stat2, op).accounts({ dailyScoresMerkleRoots: dailyPda }).preInstructions([cuIx]);

  // read-only simulation → is the predicate validated?
  let isValid;
  try { isValid = await method.view(); console.log("VIEW isValid =", isValid); } catch (e) { console.log("VIEW err:", e.message?.slice(0, 200)); }

  // real devnet tx → SIG + measured CU
  const sig = await method.rpc({ commitment: "confirmed" });
  await conn.confirmTransaction(sig, "confirmed");
  const tx = await conn.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
  const cu = tx?.meta?.computeUnitsConsumed;
  const retB64 = tx?.meta?.returnData?.data?.[0];
  const retTrue = retB64 ? Buffer.from(retB64, "base64")[0] === 1 : undefined;
  console.log("\n── PROOF SPIKE RESULT ──");
  console.log("validate_stat devnet SIG:", sig);
  console.log("computeUnitsConsumed:", cu, "(of 1,400,000 budget; per-tx max = 1,400,000)");
  console.log("returnData(valid):", retTrue, "| view:", isValid);
  console.log(`VERDICT INPUT: validate_stat consumes ${cu} CU; single read-only account (daily_scores_merkle_roots), no signer, returns bool.`);
}
main().catch((e) => { console.error("SPIKE FAILED:", e?.message || e); if (e?.logs) console.error(e.logs.slice(0, 20).join("\n")); process.exit(1); });
