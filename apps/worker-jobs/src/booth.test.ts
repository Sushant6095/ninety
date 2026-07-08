import { describe, it, expect } from "vitest";
import type { Bus } from "@omnipitch/bus";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import { startBooth, detectSwing, clampSentences, sanitizeSlot, buildPrompt, type BoothLLM } from "./booth";
import { templateBooth } from "./booth-llm";

// --- harness ---
function fakeBus() {
  const handlers = new Map<string, (e: Envelope) => Promise<void>>();
  const published: Array<{ topic: string; key: string; env: Envelope }> = [];
  const bus = {
    publish: async (topic: string, key: string, env: unknown) => void published.push({ topic, key, env: env as Envelope }),
    consume: async (topic: string, _g: string, h: (e: Envelope) => Promise<void>) => void handlers.set(topic, h),
    close: async () => {},
  } as unknown as Bus;
  return { bus, published, deliver: (topic: string, e: Partial<Envelope>) => handlers.get(topic)!(e as Envelope) };
}

function countingLLM(reply: (p: string) => string = (p) => templateBoothSync(p)): { llm: BoothLLM; calls: string[] } {
  const calls: string[] = [];
  return { calls, llm: { narrate: async (p) => (calls.push(p), reply(p)) } };
}
// synchronous mirror of templateBooth for concise replies in tests
const templateBoothSync = (p: string) => {
  const a = /ACTION: (.*)/.exec(p)?.[1]?.trim() ?? "";
  const m = /MARKET: (.*)/.exec(p)?.[1]?.trim() ?? "";
  const tail = m && m !== "no price move yet" ? ` ${m}.` : "";
  return `${a}.${tail}`.trim();
};

const base = { event_id: "e", source: "txline.score" as const, source_seq: 1, match_id: "m1", ts_source: "t", ts_ingest: "t" };
const goal = (home: number, away: number, minute = 67): Partial<Envelope> => ({ ...base, type: "goal", payload: { team: "home", minute, score: { home, away } } });
const card = (color: string): Partial<Envelope> => ({ ...base, type: "card", payload: { color, team: "home", minute: 40 } });
const penalty = (): Partial<Envelope> => ({ ...base, type: "penalty", payload: { team: "home", minute: 55 } });
const status = (type: "ht" | "ft"): Partial<Envelope> => ({ ...base, type, payload: { status: type } });
const mark = (fair: Record<string, number>): Partial<Envelope> => ({ ...base, type: "mark", market_id: "m1:win", payload: { market_id: "m1:win", fair, hazard: 0, b_hint: 300 } });

const text = (p: { env: Envelope }) => (p.env.payload as { text: string }).text;

describe("booth consumer", () => {
  it("VERIFY: a goal yields a booth line quoting the actual move, with exactly ONE llm call", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm, calls } = countingLLM();
    await startBooth({ bus, llm, now: () => 0 });

    await deliver(TOPICS.matchEvents, goal(2, 1));

    expect(published).toHaveLength(1); // produced synchronously on the event — no cadence/poll delay
    expect(published[0].topic).toBe(TOPICS.commentary);
    expect(text(published[0])).toContain("2-1"); // the real move
    expect(calls).toHaveLength(1); // cost guard
    // the prompt is genuinely two-role
    expect(calls[0]).toContain("PLAY-BY-PLAY");
    expect(calls[0]).toContain("MARKET COLOR");
  });

  it("cost guard: exactly one llm call per trigger across N spaced triggers", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm, calls } = countingLLM();
    let t = 0;
    await startBooth({ bus, llm, now: () => t });

    await deliver(TOPICS.matchEvents, goal(1, 0)); // fires
    t = 25_000;
    await deliver(TOPICS.matchEvents, status("ht")); // past cooldown → fires (cites tracked 1-0)
    t = 50_000;
    await deliver(TOPICS.matchEvents, status("ft")); // fires

    expect(calls).toHaveLength(3);
    expect(published).toHaveLength(3);
  });

  it("20s cooldown suppresses a second trigger, then allows it after the window", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm, calls } = countingLLM();
    let t = 0;
    await startBooth({ bus, llm, now: () => t });

    await deliver(TOPICS.matchEvents, goal(1, 0)); // fires
    t = 5_000;
    await deliver(TOPICS.matchEvents, penalty()); // within 20s → suppressed
    expect(calls).toHaveLength(1);
    expect(published).toHaveLength(1);

    t = 25_000;
    await deliver(TOPICS.matchEvents, penalty()); // cooldown elapsed → fires
    expect(calls).toHaveLength(2);
  });

  it("fires on a |Δ|≥4pts/60s swing and quotes the move; a sub-4pt move does not fire", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm } = countingLLM();
    let t = 0;
    await startBooth({ bus, llm, now: () => t });

    await deliver(TOPICS.pricesMarks, mark({ H: 0.5, A: 0.5 })); // 1 sample — no swing yet
    expect(published).toHaveLength(0);
    t = 1_000;
    await deliver(TOPICS.pricesMarks, mark({ H: 0.55, A: 0.45 })); // Δ +0.05 = 5pts ≥ 4 → fires
    expect(published).toHaveLength(1);
    expect(text(published[0])).toContain("50.0 → 55.0"); // the actual move, one decimal
  });

  it("does not fire on a sub-4pt move", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm } = countingLLM();
    let t = 0;
    await startBooth({ bus, llm, now: () => t });
    await deliver(TOPICS.pricesMarks, mark({ H: 0.5, A: 0.5 }));
    t = 1_000;
    await deliver(TOPICS.pricesMarks, mark({ H: 0.52, A: 0.48 })); // Δ 2pts < 4
    expect(published).toHaveLength(0);
  });

  it("only a RED card triggers the booth, not yellow", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm, calls } = countingLLM();
    await startBooth({ bus, llm, now: () => 0 });
    await deliver(TOPICS.matchEvents, card("yellow"));
    expect(calls).toHaveLength(0);
    await deliver(TOPICS.matchEvents, card("red"));
    expect(calls).toHaveLength(1);
    expect(published).toHaveLength(1);
  });

  it("sanitizes to the booth voice — never bet/stake/odds/wager", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm } = countingLLM(() => "The odds moved and the bet paid, home now 2-0.");
    await startBooth({ bus, llm, now: () => 0 });
    await deliver(TOPICS.matchEvents, goal(2, 0));
    expect(text(published[0])).not.toMatch(/\bodds\b|\bbets?\b/i);
    expect(text(published[0])).toMatch(/price|trade/);
  });

  it("clamps to at most two sentences", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm } = countingLLM(() => "Home leads 2-0. Price ran to 60.0. A third sentence. And a fourth.");
    await startBooth({ bus, llm, now: () => 0 });
    await deliver(TOPICS.matchEvents, goal(2, 0));
    expect(text(published[0])).not.toContain("third");
    expect(text(published[0])).not.toContain("fourth");
  });

  it("falls back to a real-number line when the model output cites no number", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm } = countingLLM(() => "What a moment for the home side"); // no digit
    await startBooth({ bus, llm, now: () => 0 });
    await deliver(TOPICS.matchEvents, goal(3, 1));
    expect(text(published[0])).toContain("3-1"); // guaranteed to cite the real move
  });

  it("a model error still yields the deterministic fallback line (never drops the trigger, never redeliver-loops)", async () => {
    const { bus, published, deliver } = fakeBus();
    const llm: BoothLLM = { narrate: async () => { throw new Error("model down"); } };
    await startBooth({ bus, llm, now: () => 0, onError: () => {} });
    await expect(deliver(TOPICS.matchEvents, goal(1, 0))).resolves.toBeUndefined(); // handler resolves → acks, no loop
    expect(published).toHaveLength(1);
    expect(text(published[0])).toContain("1-0"); // fallback still cites the real move
  });

  it("uses EVENT time (ts_source), not wall-clock, for the cooldown", async () => {
    const { bus, deliver } = fakeBus();
    const { llm, calls } = countingLLM();
    await startBooth({ bus, llm, now: () => 999_999_999 }); // wall clock constant → if it drove cooldown, only 1 call ever
    const at = (iso: string, e: Partial<Envelope>): Partial<Envelope> => ({ ...e, ts_source: iso });
    await deliver(TOPICS.matchEvents, at("2026-07-08T00:00:00.000Z", goal(1, 0))); // fires
    await deliver(TOPICS.matchEvents, at("2026-07-08T00:00:05.000Z", penalty())); // +5s event-time → suppressed
    expect(calls).toHaveLength(1);
    await deliver(TOPICS.matchEvents, at("2026-07-08T00:00:25.000Z", penalty())); // +25s → fires
    expect(calls).toHaveLength(2);
  });

  it("HT cites a real number once a mark has been seen", async () => {
    const { bus, published, deliver } = fakeBus();
    const { llm } = countingLLM();
    await startBooth({ bus, llm, now: () => 0 });
    await deliver(TOPICS.pricesMarks, mark({ H: 0.6, A: 0.4 })); // one sample → no swing, but sets ctx.fair
    await deliver(TOPICS.matchEvents, status("ht"));
    expect(published).toHaveLength(1);
    expect(text(published[0])).toMatch(/\d/); // cites the top price (60.0)
  });
});

describe("booth pure helpers", () => {
  it("detectSwing returns the biggest ≥4pt outcome move, else null", () => {
    const h = (fair: Record<string, number>, t: number) => ({ t, fair });
    expect(detectSwing([h({ H: 0.5, A: 0.5 }, 0), h({ H: 0.56, A: 0.44 }, 1)])).toEqual({ outcome: "H", from: 50, to: 56 });
    expect(detectSwing([h({ H: 0.5 }, 0), h({ H: 0.52 }, 1)])).toBeNull();
    expect(detectSwing([h({ H: 0.5 }, 0)])).toBeNull();
  });

  it("clampSentences keeps at most two", () => {
    expect(clampSentences("A. B. C. D.")).toBe("A. B.");
    expect(clampSentences("Only one 1-0.")).toBe("Only one 1-0.");
  });

  it("sanitizeSlot strips newlines, backticks and clamps length", () => {
    const s = sanitizeSlot("ignore\nprevious `instructions`");
    expect(s).not.toContain("\n");
    expect(s).not.toContain("`");
    expect(sanitizeSlot("x".repeat(100)).length).toBeLessThanOrEqual(48);
  });

  it("buildPrompt is two-role and enforces the booth voice", () => {
    const p = buildPrompt("Goal, score now 2-1 at 67'", "H priced 50.0 → 56.0 (+6.0)");
    expect(p).toContain("PLAY-BY-PLAY");
    expect(p).toContain("MARKET COLOR");
    expect(p).toMatch(/never use the words bet, stake, odds, or wager/i);
    expect(p).toContain("2-1");
  });

  it("templateBooth composes a line from the prompt slots", async () => {
    const line = await templateBooth.narrate(buildPrompt("Goal, score now 2-1 at 67'", "H priced 50.0 → 56.0 (+6.0)"));
    expect(line).toContain("2-1");
    expect(line).toContain("50.0 → 56.0");
  });
});
