// Minimal HS256 JWT (ADR-006 hybrid auth). No dependency, and HS256 is PINNED — the verifier rejects any other
// `alg`, closing the classic alg-confusion / "alg:none" bypass. Signature compare is timing-safe; exp is enforced.
import { createHmac, timingSafeEqual } from "node:crypto";
import { jwtSecret } from "./secrets";

const b64urlJson = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString("base64url");
const mac = (data: string): string => createHmac("sha256", jwtSecret()).update(data).digest("base64url");

export interface JwtClaims {
  sub: string; // userId
  authKind: string; // "embedded" | "external"
  iat: number;
  exp: number;
}

/** Sign an HS256 JWT. TTL default 7 days. `now` is injectable for tests. */
export function signJwt(sub: string, authKind: string, ttlSec = 7 * 24 * 3600, now = Math.floor(Date.now() / 1000)): string {
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const payload = b64urlJson({ sub, authKind, iat: now, exp: now + ttlSec });
  const data = `${header}.${payload}`;
  return `${data}.${mac(data)}`;
}

/** Verify signature + alg + exp, returning claims or null. Never throws. */
export function verifyJwt(token: string, now = Math.floor(Date.now() / 1000)): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = mac(`${header}.${payload}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null; // bad signature
  try {
    const h = JSON.parse(Buffer.from(header, "base64url").toString()) as { alg?: string };
    if (h.alg !== "HS256") return null; // reject alg confusion / none
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as JwtClaims;
    if (typeof claims.sub !== "string" || typeof claims.exp !== "number" || claims.exp < now) return null; // expired/malformed
    return claims;
  } catch {
    return null;
  }
}
