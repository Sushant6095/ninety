// Reads archived TxLINE samples (docs/txline-samples/) and re-publishes through the SAME pipeline at Nx
// speed. Demo insurance + backtests + deterministic tests without live auth (TXLINE-MAP §2).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { OddsTick, ScoreState } from "@omnipitch/txline";
import type { Pipeline } from "./ingest";

const SAMPLES = fileURLToPath(new URL("../../../docs/txline-samples/", import.meta.url));

export function loadSample<T = unknown>(name: string): T {
  return JSON.parse(readFileSync(`${SAMPLES}${name}.json`, "utf8")) as T;
}

/** All archived odds ticks (updates bucket + a live stream sample) as one replay list. */
export function replayOddsTicks(): OddsTick[] {
  const updates = loadSample<OddsTick[]>("odds-updates");
  const streamed = loadSample<OddsTick>("odds-stream-event");
  return [...updates, streamed];
}

/** Replay archived odds + scores through the pipeline. */
export async function replay(pipe: Pipeline): Promise<void> {
  for (const tick of replayOddsTicks()) await pipe.ingestOdds(tick);
  for (const state of loadSample<ScoreState[]>("scores-updates")) await pipe.ingestScore(state);
}
