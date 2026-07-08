import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { deriveEmbeddedWallet, verifyWalletSignature } from "./wallet";
import { signJwt, verifyJwt } from "./jwt";
import { issueChallenge, verifyChallenge } from "./challenge";
import { issueOtp, verifyOtp, MemOtpSender } from "./otp";
import { authFromBearer, authFromWsToken } from "./middleware";
import { grantMatchCredits, MemGrantStore, MATCH_GRANT } from "./grant";

describe("auth — wallet identity (ADR-006)", () => {
  it("embedded wallet is deterministic per email (trim+lowercase); distinct emails → distinct wallets; exports a 64B key", () => {
    const a = deriveEmbeddedWallet("Alice@Example.com ");
    const a2 = deriveEmbeddedWallet("alice@example.com");
    const b = deriveEmbeddedWallet("bob@example.com");
    expect(a.walletPubkey).toBe(a2.walletPubkey);
    expect(a.walletPubkey).not.toBe(b.walletPubkey);
    expect(bs58.decode(a.walletPubkey)).toHaveLength(32); // valid Solana pubkey
    expect(a.secretKey).toHaveLength(64); // the export path
  });

  it("verifies a Phantom-style ed25519 signature over the challenge; rejects wrong message / wrong key", () => {
    const kp = nacl.sign.keyPair();
    const pubkey = bs58.encode(kp.publicKey);
    const msg = "omnipitch login nonce=12345";
    const sig = bs58.encode(nacl.sign.detached(new TextEncoder().encode(msg), kp.secretKey));
    expect(verifyWalletSignature(pubkey, msg, sig)).toBe(true);
    expect(verifyWalletSignature(pubkey, "omnipitch login nonce=99999", sig)).toBe(false);
    expect(verifyWalletSignature(bs58.encode(nacl.sign.keyPair().publicKey), msg, sig)).toBe(false);
  });
});

describe("auth — JWT (HS256, pinned)", () => {
  it("round-trips claims and rejects tamper / expiry / alg-confusion", () => {
    const now = 1_000_000;
    const tok = signJwt("user-1", "embedded", 3600, now);
    expect(verifyJwt(tok, now)).toMatchObject({ sub: "user-1", authKind: "embedded" });
    expect(verifyJwt(tok, now + 3601)).toBeNull(); // expired
    expect(verifyJwt(tok + "x", now)).toBeNull(); // tampered signature
    const [, payload] = tok.split(".");
    const noneHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    expect(verifyJwt(`${noneHeader}.${payload}.`, now)).toBeNull(); // alg:none forgery rejected
  });
});

describe("auth — embedded OTP (email ownership proof, closes 'log in as anyone')", () => {
  it("verifies the issued code; rejects wrong code / wrong email / expired / tampered token", () => {
    const now = 1_000_000;
    const { code, verificationToken } = issueOtp("alice@example.com", now);
    const wrongCode = String((Number(code) + 1) % 1_000_000).padStart(6, "0"); // guaranteed != code
    expect(verifyOtp("alice@example.com", code, verificationToken, now)).toBe(true);
    expect(verifyOtp("alice@example.com", wrongCode, verificationToken, now)).toBe(false); // wrong code
    expect(verifyOtp("mallory@example.com", code, verificationToken, now)).toBe(false); // wrong email
    expect(verifyOtp("alice@example.com", code, verificationToken, now + 601)).toBe(false); // expired (TTL 600)
    expect(verifyOtp("alice@example.com", code, verificationToken.slice(0, -2) + "zz", now)).toBe(false); // tampered token
  });
  it("delivers the code out-of-band via the sender", async () => {
    const sender = new MemOtpSender();
    const { code } = issueOtp("bob@example.com");
    await sender.send("bob@example.com", code);
    expect(sender.sent).toEqual([{ email: "bob@example.com", code }]);
  });
});

describe("auth — login challenge (stateless, replay-safe)", () => {
  it("accepts a fresh challenge for the right wallet; rejects wrong-wallet / expired / forged", () => {
    const pk = "So11111111111111111111111111111111111111112";
    const now = 1_000_000;
    const msg = issueChallenge(pk, now);
    expect(verifyChallenge(pk, msg, now)).toBe(true);
    expect(verifyChallenge("Other1111111111111111111111111111111111111", msg, now)).toBe(false); // wrong wallet
    expect(verifyChallenge(pk, msg, now + 301)).toBe(false); // expired (TTL 300s)
    expect(verifyChallenge(pk, msg.slice(0, -2) + "zz", now)).toBe(false); // tampered mac
    expect(verifyChallenge(pk, `omnipitch:login:${pk}:${now + 100}:deadbeef`, now)).toBe(false); // fabricated (no valid mac)
  });
});

describe("auth — middleware (unauthenticated rejected)", () => {
  it("accepts a valid bearer/ws token, rejects missing/garbage (unauthenticated WS order rejected)", () => {
    const tok = signJwt("u9", "external");
    expect(authFromBearer(`Bearer ${tok}`)).toEqual({ userId: "u9", authKind: "external" });
    expect(authFromWsToken(tok)).toEqual({ userId: "u9", authKind: "external" });
    expect(authFromWsToken(undefined)).toBeNull(); // no token → reject
    expect(authFromWsToken("garbage.token.here")).toBeNull();
    expect(authFromBearer(undefined)).toBeNull();
    expect(authFromBearer("Basic xyz")).toBeNull();
  });
});

describe("auth — per-match grant (idempotent once per user·match)", () => {
  it("grants 1000 credits exactly once per (user, match)", async () => {
    const store = new MemGrantStore();
    expect(await grantMatchCredits(store, "u1", "wc26-bra-arg")).toEqual({ granted: true });
    expect(await grantMatchCredits(store, "u1", "wc26-bra-arg")).toEqual({ granted: false }); // idempotent replay
    expect(await grantMatchCredits(store, "u1", "wc26-usa-eng")).toEqual({ granted: true }); // different match
    expect(await grantMatchCredits(store, "u2", "wc26-bra-arg")).toEqual({ granted: true }); // different user
    expect(store.credits.filter((c) => c.reason === "match_grant")).toHaveLength(3);
    expect(store.credits.every((c) => c.delta === MATCH_GRANT)).toBe(true);
  });

  it("both auth kinds produce verifiable sessions (embedded + external can each trade)", () => {
    expect(authFromBearer(`Bearer ${signJwt("u-embedded", "embedded")}`)?.authKind).toBe("embedded");
    expect(authFromBearer(`Bearer ${signJwt("u-external", "external")}`)?.authKind).toBe("external");
  });
});
