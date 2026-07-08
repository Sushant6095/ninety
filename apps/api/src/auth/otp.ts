// Email-ownership proof for embedded signup (security-reviewer CRITICAL #1). Without this, `deriveEmbeddedWallet`
// is a pure function of the email string, so knowing an email = a full session as that user. STATELESS OTP: /start
// generates a code, HMAC-binds (email, codeHash, exp) into a verificationToken, and SENDS the code out-of-band; the
// user proves possession by returning the code + token. No server-side storage; the token can't be forged (our HMAC)
// or replayed past exp. The email transport is a pluggable prod dependency (unconfigured → throws, like the secrets).
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { purposeKey } from "./secrets";

export const OTP_TTL = 600; // seconds

const key = (): Buffer => purposeKey("otp");
const codeHash = (email: string, code: string): string => createHmac("sha256", key()).update(`${email.trim().toLowerCase()}:${code}`).digest("base64url");
const tokenFor = (email: string, code: string, exp: number): string =>
  createHmac("sha256", key()).update(`${email.trim().toLowerCase()}:${codeHash(email, code)}:${exp}`).digest("base64url");

export interface OtpChallenge {
  code: string; // 6-digit — SENT to the email, never returned to the browser
  verificationToken: string; // returned to the browser; binds (email, codeHash, exp), HMAC-signed
}

/** Issue a fresh OTP + its stateless verification token. Caller sends `code` to the email via an OtpSender. */
export function issueOtp(email: string, now = Math.floor(Date.now() / 1000)): OtpChallenge {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const exp = now + OTP_TTL;
  return { code, verificationToken: `${exp}:${tokenFor(email, code, exp)}` };
}

/** True iff `code` matches the OTP bound into `verificationToken` for `email` and it hasn't expired. */
export function verifyOtp(email: string, code: string, verificationToken: string, now = Math.floor(Date.now() / 1000)): boolean {
  const sep = verificationToken.indexOf(":");
  if (sep < 0) return false;
  const exp = Number(verificationToken.slice(0, sep));
  const mac = verificationToken.slice(sep + 1);
  if (!Number.isFinite(exp) || exp < now) return false; // expired
  const expected = tokenFor(email, code, exp);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- pluggable email transport ---
export interface OtpSender {
  send(email: string, code: string): Promise<void>;
}
/** Test/dev sender: captures the last code instead of emailing. */
export class MemOtpSender implements OtpSender {
  readonly sent: Array<{ email: string; code: string }> = [];
  async send(email: string, code: string): Promise<void> {
    this.sent.push({ email, code });
  }
}
/** Dev sender: logs the code (NEVER use in production — the code must go only to the email owner). */
export class ConsoleOtpSender implements OtpSender {
  async send(email: string, code: string): Promise<void> {
    console.log(JSON.stringify({ evt: "otp.dev", email, code }));
  }
}
/** Prod default: a real email sender MUST be injected. Fails loud rather than silently skipping ownership proof. */
export class UnconfiguredOtpSender implements OtpSender {
  async send(): Promise<void> {
    throw new Error("no OtpSender configured — wire an email provider before enabling embedded signup in production");
  }
}
