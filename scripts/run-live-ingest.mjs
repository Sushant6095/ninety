// Live-ingest runner: loads the repo .env (worker-ingest has no dotenv wiring) and spawns the
// worker with TXLINE_NETWORK set. Usage: node scripts/run-live-ingest.mjs [devnet|mainnet]
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const network = process.argv[2] ?? "devnet";
process.loadEnvFile(ROOT + ".env");

const child = spawn("pnpm", ["--filter", "@omnipitch/worker-ingest", "dev"], {
  cwd: ROOT,
  env: { ...process.env, TXLINE_NETWORK: network },
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
