// Settlement saga (prompt 24). Steps FT_DETECTED → PROOF_FETCHED → TX_SENT → CONFIRMED → CREDITED → ROOT_POSTED →
// MOMENTS → DONE, each IDEMPOTENT and PERSISTED (SettlementSaga) so a crash resumes from the last saved step. The
// worker FORWARDS the proof; programs/omnipitch_core/proof.rs VERIFIES it — no admin result path. All side effects
// are injected (SagaDeps) so the resume + zero-double-credit invariants are unit-tested without a chain or DB.

export type SagaStep = "FT_DETECTED" | "PROOF_FETCHED" | "TX_SENT" | "CONFIRMED" | "CREDITED" | "ROOT_POSTED" | "MOMENTS" | "DONE";
export const STEPS: readonly SagaStep[] = ["FT_DETECTED", "PROOF_FETCHED", "TX_SENT", "CONFIRMED", "CREDITED", "ROOT_POSTED", "MOMENTS", "DONE"];

export const WINNER_CREDIT = 100; // credits per winning share (qty × 100)
export const STUCK_MS = 120_000;

export interface SagaRecord {
  marketId: string;
  matchday: number;
  step: SagaStep;
  result?: string; // H/D/A (from the proof — never fabricated)
  proof?: string; // opaque forwarded proof
  sig?: string; // settle tx signature
  rootSig?: string; // matchday-root post signature
  updatedAt: number; // for stuck detection
}

export interface SagaDeps {
  now(): number;
  loadSaga(marketId: string): Promise<SagaRecord | null>;
  saveSaga(r: SagaRecord): Promise<void>;
  fetchProof(marketId: string): Promise<{ result: string; proof: string }>; // 404 → THROWS (retried; never fabricated)
  sendSettle(marketId: string, result: string, proof: string): Promise<string>; // on-chain one-shot → a re-send no-ops
  confirm(sig: string): Promise<boolean>;
  winners(marketId: string): Promise<Array<{ userId: string; qty: number }>>;
  creditOnce(marketId: string, userId: string, amount: number): Promise<boolean>; // idempotent per (marketId, userId)
  computeMatchdayRoot(matchday: number): Promise<Uint8Array>;
  postRoot(matchday: number, root: Uint8Array): Promise<string>;
  mintMoments?(marketId: string): Promise<void>; // MOMENTS_ONCHAIN is cut (ADR-032) → usually a no-op
  alert(marketId: string, msg: string): void;
}

// One forward step, idempotent. Returns the SAME step (no progress) when it must wait (e.g. tx not yet confirmed).
async function advance(r: SagaRecord, deps: SagaDeps): Promise<SagaRecord> {
  const updatedAt = deps.now();
  switch (r.step) {
    case "FT_DETECTED":
      return { ...r, step: "PROOF_FETCHED", updatedAt };
    case "PROOF_FETCHED": {
      const { result, proof } = await deps.fetchProof(r.marketId); // may throw (404) — caller retries + alerts
      return { ...r, result, proof, step: "TX_SENT", updatedAt };
    }
    case "TX_SENT": {
      const sig = await deps.sendSettle(r.marketId, r.result!, r.proof!); // re-send is a no-op via the on-chain one-shot
      return { ...r, sig, step: "CONFIRMED", updatedAt };
    }
    case "CONFIRMED":
      return (await deps.confirm(r.sig!)) ? { ...r, step: "CREDITED", updatedAt } : { ...r, updatedAt }; // wait if unconfirmed
    case "CREDITED": {
      for (const w of await deps.winners(r.marketId)) await deps.creditOnce(r.marketId, w.userId, w.qty * WINNER_CREDIT); // per-user idempotent
      return { ...r, step: "ROOT_POSTED", updatedAt };
    }
    case "ROOT_POSTED": {
      const rootSig = await deps.postRoot(r.matchday, await deps.computeMatchdayRoot(r.matchday));
      return { ...r, rootSig, step: "MOMENTS", updatedAt };
    }
    case "MOMENTS":
      await deps.mintMoments?.(r.marketId);
      return { ...r, step: "DONE", updatedAt };
    default:
      return r;
  }
}

/** Run/resume the saga to completion (or until a step must wait). Persists after EACH step → crash-resumable. */
export async function runSettlement(marketId: string, matchday: number, deps: SagaDeps): Promise<SagaRecord> {
  let r = (await deps.loadSaga(marketId)) ?? { marketId, matchday, step: "FT_DETECTED" as SagaStep, updatedAt: deps.now() };
  while (r.step !== "DONE") {
    const next = await advance(r, deps);
    await deps.saveSaga(next); // persist BEFORE the next step — a crash here resumes at next.step, re-running it idempotently
    if (next.step === r.step) break; // no forward progress (e.g. awaiting confirmation) → a later tick resumes
    r = next;
  }
  return r;
}

/** One scheduler tick: resume the saga, alerting (not fabricating) on a step failure so it's retried next tick. */
export async function tickSettlement(marketId: string, matchday: number, deps: SagaDeps): Promise<SagaRecord | null> {
  try {
    return await runSettlement(marketId, matchday, deps);
  } catch (err) {
    deps.alert(marketId, `settlement step failed, will retry: ${String((err as Error)?.message ?? err)}`);
    return null;
  }
}

/** Alert any saga that isn't DONE and hasn't advanced in > thresholdMs. */
export function checkStuck(records: SagaRecord[], now: number, alert: (marketId: string, msg: string) => void, thresholdMs = STUCK_MS): void {
  for (const r of records) if (r.step !== "DONE" && now - r.updatedAt > thresholdMs) alert(r.marketId, `settlement stuck at ${r.step} for ${now - r.updatedAt}ms`);
}
