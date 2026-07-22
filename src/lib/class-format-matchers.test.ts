import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classFormatKeyForSessionName } from "./class-format-matchers.ts";

describe("Class format matching", () => {
  it("maps schedule session names to the canonical class catalog keys", () => {
    assert.equal(classFormatKeyForSessionName("Barre 57"), "barre-57");
    assert.equal(classFormatKeyForSessionName("powerCycle 45"), "power-cycle");
    assert.equal(classFormatKeyForSessionName("Power Cycle Express"), "power-cycle");
    assert.equal(classFormatKeyForSessionName("Spin Intervals"), "power-cycle");
    assert.equal(classFormatKeyForSessionName("StrengthLab Push"), "strength-lab");
    assert.equal(classFormatKeyForSessionName("Strength Lab Pull"), "strength-lab");
    assert.equal(classFormatKeyForSessionName("Cardio Barre Plus"), "barre-57");
    assert.equal(classFormatKeyForSessionName("Recovery Stretch"), "barre-57");
  });
});
