// REST auth routes (ADR-006 hybrid, prompt 25). Reads/writes Postgres (User). NEVER touches engine state.
import type { FastifyInstance } from "fastify";
import bs58 from "bs58";
import { prisma } from "../../db";
import { deriveEmbeddedWallet, verifyWalletSignature } from "../../auth/wallet";
import { issueChallenge, verifyChallenge } from "../../auth/challenge";
import { issueOtp, verifyOtp, type OtpSender } from "../../auth/otp";
import { signJwt } from "../../auth/jwt";
import { authFromBearer } from "../../auth/middleware";

const handleFor = (pubkey: string): string => `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;

async function upsertUser(walletPubkey: string, authKind: string): Promise<string> {
  const user = await prisma.user.upsert({
    where: { walletPubkey },
    update: {}, // identity is fixed by the key; nothing to change on re-login
    create: { walletPubkey, authKind, handle: handleFor(walletPubkey) },
  });
  return user.id;
}

export function registerAuthRoutes(app: FastifyInstance, otpSender: OtpSender): void {
  // EMBEDDED step 1: request an OTP. Proves email OWNERSHIP before any session is issued — knowing the email
  // string is no longer enough to log in as someone (security-reviewer CRITICAL #1). The code is sent out-of-band.
  app.post("/auth/embedded/start", async (req, reply) => {
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email || !email.includes("@")) return reply.code(400).send({ error: "email required" });
    const { code, verificationToken } = issueOtp(email);
    await otpSender.send(email, code);
    return { verificationToken };
  });

  // EMBEDDED step 2: verify the OTP → deterministic custodial wallet → JWT. The secret is never returned (see /export).
  app.post("/auth/embedded", async (req, reply) => {
    const { email, otp, verificationToken } = (req.body ?? {}) as { email?: string; otp?: string; verificationToken?: string };
    if (!email || !email.includes("@") || !otp || !verificationToken) return reply.code(400).send({ error: "email, otp, verificationToken required" });
    if (!verifyOtp(email, otp, verificationToken)) return reply.code(401).send({ error: "invalid or expired code" });
    const w = deriveEmbeddedWallet(email);
    const userId = await upsertUser(w.walletPubkey, "embedded");
    return { token: signJwt(userId, "embedded"), walletPubkey: w.walletPubkey };
  });

  // EXPORT PATH: hand back the raw secret key for self-custody — but ONLY to the authenticated owner of that
  // wallet (a valid session whose User.walletPubkey matches the email-derived wallet). Knowing an email is NOT enough.
  app.post("/auth/embedded/export", async (req, reply) => {
    const authed = authFromBearer(req.headers.authorization);
    if (!authed) return reply.code(401).send({ error: "unauthenticated" });
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email || !email.includes("@")) return reply.code(400).send({ error: "email required" });
    const w = deriveEmbeddedWallet(email);
    const user = await prisma.user.findUnique({ where: { id: authed.userId } });
    if (!user || user.walletPubkey !== w.walletPubkey) return reply.code(403).send({ error: "not your wallet" });
    return { secretKey: bs58.encode(w.secretKey) };
  });

  // EXTERNAL (Phantom): 1) get a server challenge, 2) sign it, 3) connect. The challenge is HMAC-signed + expiring
  // + wallet-bound, so a captured signature can't be replayed and a client can't forge its own challenge.
  app.get("/auth/challenge", async (req, reply) => {
    const { walletPubkey } = (req.query ?? {}) as { walletPubkey?: string };
    if (!walletPubkey) return reply.code(400).send({ error: "walletPubkey required" });
    return { message: issueChallenge(walletPubkey) };
  });

  app.post("/auth/connect", async (req, reply) => {
    const { walletPubkey, message, signature } = (req.body ?? {}) as { walletPubkey?: string; message?: string; signature?: string };
    if (!walletPubkey || !message || !signature) return reply.code(400).send({ error: "walletPubkey, message, signature required" });
    if (!verifyChallenge(walletPubkey, message)) return reply.code(401).send({ error: "invalid or expired challenge" });
    if (!verifyWalletSignature(walletPubkey, message, signature)) return reply.code(401).send({ error: "bad signature" });
    const userId = await upsertUser(walletPubkey, "external");
    return { token: signJwt(userId, "external"), walletPubkey };
  });

  // whoami — a protected route demonstrating the bearer middleware.
  app.get("/auth/me", async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    return user;
  });
}
