// Vault + config init (prompt 20). Run ONCE per deploy against the provider cluster:
//   ANCHOR_PROVIDER_URL=... ANCHOR_WALLET=~/.config/solana/id.json npx ts-node scripts/init-vault.ts
// Creates the Config (authority = the deploy wallet) and the points mint + vault (mint authority = PDA), and
// mints the claim supply into the vault. The same flow is exercised by the anchor test's before() hook.
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.omnipitchCore as anchor.Program;
  const me = provider.wallet.publicKey;
  const pda = (s: Buffer[]) => PublicKey.findProgramAddressSync(s, program.programId)[0];
  const config = pda([Buffer.from("config")]);
  const vaultAuthority = pda([Buffer.from("vault_auth")]);
  const mint = pda([Buffer.from("mint")]);
  const vault = pda([Buffer.from("vault")]);

  await program.methods.initConfig(me).accounts({ config, payer: me, systemProgram: SystemProgram.programId }).rpc();
  await program.methods
    .initVault()
    .accounts({ mint, vault, vaultAuthority, payer: me, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId, rent: anchor.web3.SYSVAR_RENT_PUBKEY })
    .rpc();

  console.log("initialized:", { config: config.toBase58(), mint: mint.toBase58(), vault: vault.toBase58(), authority: me.toBase58() });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
