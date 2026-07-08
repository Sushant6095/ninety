// Auth middleware (prompt 25): resolve the caller from a JWT, for REST (Authorization: Bearer) and WS (?token=).
// A null result = unauthenticated → the caller MUST reject (no anonymous orders; unauthenticated WS order rejected).
import { verifyJwt } from "./jwt";

export interface AuthedUser {
  userId: string;
  authKind: string;
}

const fromToken = (token: string | undefined): AuthedUser | null => {
  if (!token) return null;
  const claims = verifyJwt(token);
  return claims ? { userId: claims.sub, authKind: claims.authKind } : null;
};

/** REST: parse + verify a `Bearer <jwt>` Authorization header. */
export function authFromBearer(authorization: string | undefined): AuthedUser | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  return fromToken(authorization.slice(7));
}

/** WS: verify the token supplied on connect (query `?token=` or a first-message auth). */
export function authFromWsToken(token: string | undefined): AuthedUser | null {
  return fromToken(token);
}
