// The single shared ioredis client (mirrors db.ts / the Prisma singleton). Redis is a derived READ CACHE of
// Postgres (README rule 3) — never the durable authority. Cached on globalThis so dev hot-reload doesn't open a
// new connection each import.
import { Redis } from "ioredis";

const g = globalThis as unknown as { __omnipitchRedis?: Redis };
export const redis: Redis =
  g.__omnipitchRedis ?? new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
if (process.env.NODE_ENV !== "production") g.__omnipitchRedis = redis;
