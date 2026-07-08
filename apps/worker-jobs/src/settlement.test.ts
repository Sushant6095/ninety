import { describe, it, expect } from "vitest";
import { runSettlement, tickSettlement, checkStuck, WINNER_CREDIT, STEPS, type SagaDeps, type SagaRecord, type SagaStep } from "./settlement";

function harness(over: Partial<SagaDeps> = {}) {
  const sagas = new Map<string, SagaRecord>();
  const credited = new Set<string>();
  const credits: Array<{ userId: string; amount: number }> = [];
  const alerts: string[] = [];
  const counts = { send: 0, postRoot: 0 };
  const deps: SagaDeps = {
    now: () => 1000,
    loadSaga: async (m) => sagas.get(m) ?? null,
    saveSaga: async (r) => void sagas.set(r.marketId, { ...r }),
    fetchProof: async () => ({ result: "H", proof: "PROOF" }),
    sendSettle: async () => ((counts.send += 1), "SETTLE_SIG"),
    confirm: async () => true,
    winners: async () => [{ userId: "u1", qty: 10 }, { userId: "u2", qty: 5 }],
    creditOnce: async (m, userId, amount) => {
      const k = `${m}:${userId}`;
      if (credited.has(k)) return false;
      credited.add(k);
      credits.push({ userId, amount });
      return true;
    },
    computeMatchdayRoot: async () => new Uint8Array(32),
    postRoot: async () => ((counts.postRoot += 1), "ROOT_SIG"),
    alert: (m, msg) => alerts.push(`${m}:${msg}`),
    ...over,
  };
  return { deps, sagas, credited, credits, alerts, counts };
}

describe("settlement saga (prompt 24)", () => {
  it("runs FT_DETECTED → DONE and credits each winner qty×100 exactly once", async () => {
    const h = harness();
    const r = await runSettlement("m", 3, h.deps);
    expect(r.step).toBe("DONE");
    expect(r.sig).toBe("SETTLE_SIG");
    expect(r.rootSig).toBe("ROOT_SIG");
    expect(h.credits).toEqual([{ userId: "u1", amount: 10 * WINNER_CREDIT }, { userId: "u2", amount: 5 * WINNER_CREDIT }]);
  });

  it("resumes from EACH persisted step to DONE (worker-killed-at-each-step table)", async () => {
    for (const step of STEPS.filter((s) => s !== "DONE")) {
      const h = harness();
      h.sagas.set("m", { marketId: "m", matchday: 1, step: step as SagaStep, result: "H", proof: "P", sig: "S", updatedAt: 0 });
      const r = await runSettlement("m", 1, h.deps);
      expect(r.step, `resume from ${step}`).toBe("DONE");
    }
  });

  it("kill mid-saga then restart completes with ZERO double-credit (per-user idempotency)", async () => {
    const h = harness();
    h.sagas.set("m", { marketId: "m", matchday: 1, step: "CREDITED", result: "H", proof: "P", sig: "S", updatedAt: 0 });
    await h.deps.creditOnce("m", "u1", 10 * WINNER_CREDIT); // u1 credited in the crashed pass
    h.credits.length = 0; // count only what the resume does
    const r = await runSettlement("m", 1, h.deps);
    expect(r.step).toBe("DONE");
    expect(h.credits).toEqual([{ userId: "u2", amount: 5 * WINNER_CREDIT }]); // u1 NOT re-credited
  });

  it("a re-sent settle tx is a no-op via the on-chain one-shot (resume at TX_SENT)", async () => {
    const h = harness();
    h.sagas.set("m", { marketId: "m", matchday: 1, step: "TX_SENT", result: "H", proof: "P", updatedAt: 0 });
    await runSettlement("m", 1, h.deps);
    expect(h.counts.send).toBe(1); // one send; a duplicate is harmless (AlreadySettled) — the saga never double-settles
  });

  it("proof 404 alerts + never fabricates a result; a later tick completes (out-of-order/retry tolerant)", async () => {
    let proofUp = false;
    const h = harness({ fetchProof: async () => { if (!proofUp) throw new Error("404"); return { result: "H", proof: "P" }; } });
    expect(await tickSettlement("m", 1, h.deps)).toBeNull(); // step failed
    expect(h.alerts.some((a) => a.includes("retry"))).toBe(true);
    expect(h.sagas.get("m")!.step).toBe("PROOF_FETCHED");
    expect(h.sagas.get("m")!.result).toBeUndefined(); // NEVER fabricated
    proofUp = true;
    expect((await tickSettlement("m", 1, h.deps))!.step).toBe("DONE");
  });

  it("partial credit failure mid-user-list resumes crediting only the uncredited user", async () => {
    let failU2 = true;
    const credited = new Set<string>();
    const credits: string[] = [];
    const h = harness({
      creditOnce: async (m, userId) => {
        if (userId === "u2" && failU2) throw new Error("credit u2 failed");
        const k = `${m}:${userId}`;
        if (credited.has(k)) return false;
        credited.add(k);
        credits.push(userId);
        return true;
      },
    });
    h.sagas.set("m", { marketId: "m", matchday: 1, step: "CREDITED", result: "H", proof: "P", sig: "S", updatedAt: 0 });
    await tickSettlement("m", 1, h.deps); // u1 ok, u2 throws → stays at CREDITED
    expect(credits).toEqual(["u1"]);
    failU2 = false;
    await tickSettlement("m", 1, h.deps); // re-run: u1 skipped (idempotent), u2 credited
    expect(credits).toEqual(["u1", "u2"]); // u1 not doubled
  });

  it("alerts a saga stuck > 120s", () => {
    const alerts: string[] = [];
    checkStuck(
      [{ marketId: "m1", matchday: 1, step: "CONFIRMED", updatedAt: 0 }, { marketId: "m2", matchday: 1, step: "DONE", updatedAt: 0 }],
      130_000,
      (m, msg) => alerts.push(`${m}:${msg}`),
    );
    expect(alerts).toHaveLength(1); // only the not-DONE, stale one
    expect(alerts[0]).toContain("m1");
  });
});
