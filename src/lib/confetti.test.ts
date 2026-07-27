import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDualSideConfettiBursts } from "./confetti.ts";

describe("confetti", () => {
  it("builds a left-origin and a right-origin burst, angled inward", () => {
    const bursts = buildDualSideConfettiBursts();

    assert.equal(bursts.length, 2);
    assert.deepEqual(bursts[0].origin, { x: 0, y: 0.6 });
    assert.equal(bursts[0].angle, 60);
    assert.deepEqual(bursts[1].origin, { x: 1, y: 0.6 });
    assert.equal(bursts[1].angle, 120);
    assert.equal(bursts[1].delayMs, 150);
    assert.equal(bursts[0].delayMs, 0);
  });
});
