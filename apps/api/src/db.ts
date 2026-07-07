// The single shared Prisma client. Cached on globalThis so dev hot-reload / repeated imports don't open a new
// connection pool each time (the standard Prisma singleton). Postgres is the durable truth (README rule 3).
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { __omnipitchPrisma?: PrismaClient };
export const prisma: PrismaClient = g.__omnipitchPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.__omnipitchPrisma = prisma;
