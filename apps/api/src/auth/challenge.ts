// Stateless login challenge for external (Phantom) wallets. The server issues a message bound to a wallet + an
// expiry and signed with our HMAC; /auth/connect then requires (a) our HMAC is valid (unforgeable), (b) it isn't
// expired, (c) it's bound to THIS wallet, AND (d) the ed25519 signature over it is valid. This prevents a captured
// wallet-signature from being replayed to log in forever, without any server-side nonce storage.
import { createHmac, timingSafeEqual } from "node:crypto";
import { purposeKey } from "./secrets";

export const CHALLENGE_TTL = 300; // seconds

const bodyOf = (walletPubkey: string, exp: number): string => `omnipitch:login:${walletPubkey}:${exp}`;
const mac = (body: string): string => createHmac("sha256", purposeKey("challenge")).update(body).digest("base64url");

/** Issue a challenge string for a wallet to sign. */
export function issueChallenge(walletPubkey: string, now = Math.floor(Date.now() / 1000)): string {
  const body = bodyOf(walletPubkey, now + CHALLENGE_TTL);
  return `${body}:${mac(body)}`;
}

/** True iff `message` is a live, unexpired challenge WE issued for exactly `walletPubkey`. */
export function verifyChallenge(walletPubkey: string, message: string, now = Math.floor(Date.now() / 1000)): boolean {
  const parts = message.split(":");
  if (parts.length !== 5 || parts[0] !== "omnipitch" || parts[1] !== "login") return false;
  const [, , pubkey, expStr, sig] = parts;
  if (pubkey !== walletPubkey) return false; // bound to a different wallet
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return false; // expired
  const expected = mac(bodyOf(pubkey, exp));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b); // our HMAC → not forged
}
