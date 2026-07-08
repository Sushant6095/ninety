// Centralized auth secrets (security-reviewer CRITICAL #2 + #6). Secrets MUST be set in production — a missing
// one throws (fail loud, never silently fall back to a repo-readable dev string). Sub-secrets are domain-separated
// from JWT_SECRET via a KDF so the JWT / login-challenge / OTP HMACs never share a raw key.
import { createHmac } from "node:crypto";

const isProd = (): boolean => process.env.NODE_ENV === "production";

function requireSecret(name: string, devFallback: string): string {
  const v = process.env[name];
  if (v) return v;
  if (isProd()) throw new Error(`${name} must be set in production`); // fail loud, no insecure fallback in prod
  return devFallback; // dev/test only
}

export const jwtSecret = (): string => requireSecret("JWT_SECRET", "dev-insecure-jwt-secret");
export const embeddedSecret = (): string => requireSecret("EMBEDDED_WALLET_SECRET", "dev-insecure-embedded-secret");

/** Domain-separated sub-key derived from JWT_SECRET (distinct `purpose` → distinct HMAC key). */
export const purposeKey = (purpose: string): Buffer => createHmac("sha256", jwtSecret()).update(`omnipitch:kdf:${purpose}`).digest();

/** Fail fast at process boot if required secrets are missing in production. */
export function assertSecretsAtBoot(): void {
  jwtSecret();
  embeddedSecret();
}
