// Leaderboard read service. The projection (ADR-027) maintains the `lb:global` Redis sorted set
// (member = userId, score = net credit P&L). This just reads it — top N, ranked.
import type { Redis } from "ioredis";
import { LB_KEY } from "./projection";

export interface LeaderboardRow {
  rank: number;
  userId: string;
  pnl: number; // net credit P&L (play-money)
}

export async function getLeaderboard(redis: Redis, limit = 100): Promise<LeaderboardRow[]> {
  const flat = await redis.zrevrange(LB_KEY, 0, Math.max(0, limit - 1), "WITHSCORES"); // [member, score, member, score, …]
  const rows: LeaderboardRow[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    rows.push({ rank: i / 2 + 1, userId: flat[i], pnl: Number(flat[i + 1]) });
  }
  return rows;
}
