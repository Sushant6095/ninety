// Runnable check for the money/streak/resolution logic (ponytail: one check behind non-trivial logic).
// No test runner is wired in apps/web; run with `node --test` after a TS transpile (e.g. `npx tsx --test`)
// or point any node:test-compatible runner at it. It also type-checks under `tsc --noEmit`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyResult,
  awardFor,
  celebrationTier,
  detectGoal,
  multiplierFor,
  resultFor,
  EMPTY_STATS,
  type GameStats,
} from "./nextGoalMachine";

test("multiplier escalates then caps at 3x", () => {
  assert.equal(multiplierFor(0), 0);
  assert.equal(multiplierFor(1), 1);
  assert.equal(multiplierFor(2), 1.5);
  assert.equal(multiplierFor(3), 2);
  assert.equal(multiplierFor(5), 3);
  assert.equal(multiplierFor(9), 3); // capped
});

test("award follows the multiplier off a 100 base", () => {
  assert.equal(awardFor(1), 100);
  assert.equal(awardFor(2), 150);
  assert.equal(awardFor(3), 200);
  assert.equal(awardFor(5), 300);
});

test("a 3 celebrates harder than a 2", () => {
  assert.ok(celebrationTier(3) > celebrationTier(2));
  assert.equal(celebrationTier(0), 0);
  assert.equal(celebrationTier(5), 4);
});

test("detectGoal reads a score delta by side", () => {
  const lock = { home: 0, away: 0 };
  assert.equal(detectGoal(lock, { home: 1, away: 0 }), "H");
  assert.equal(detectGoal(lock, { home: 0, away: 1 }), "A");
  assert.equal(detectGoal(lock, { home: 0, away: 0 }), null);
});

test("resultFor: picked side wins, other loses", () => {
  assert.equal(resultFor("H", "H"), "WON");
  assert.equal(resultFor("H", "A"), "LOST");
});

test("WON increments streak, awards points, tracks best", () => {
  const s: GameStats = { points: 0, streak: 2, best: 2 };
  const next = applyResult(s, "WON");
  assert.equal(next.streak, 3);
  assert.equal(next.points, awardFor(3)); // 200
  assert.equal(next.best, 3);
  assert.notEqual(next, s); // immutable
});

test("LOST keeps points, soft-resets streak, keeps best", () => {
  const s: GameStats = { points: 550, streak: 4, best: 4 };
  const next = applyResult(s, "LOST");
  assert.equal(next.points, 550); // never punished
  assert.equal(next.streak, 0);
  assert.equal(next.best, 4);
});

test("NO_CALL changes nothing", () => {
  const s: GameStats = { points: 300, streak: 3, best: 5 };
  assert.equal(applyResult(s, "NO_CALL"), s);
});

test("EMPTY_STATS is the zero", () => {
  assert.deepEqual(EMPTY_STATS, { points: 0, streak: 0, best: 0 });
});
