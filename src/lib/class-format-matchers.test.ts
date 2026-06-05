import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classFormatKeyForSessionName } from "./class-format-matchers.ts";

describe("Class format matching", () => {
  it("maps schedule session names to the canonical class catalog keys", () => {
    assert.equal(classFormatKeyForSessionName("Barre 57"), "barre-57");
    assert.equal(classFormatKeyForSessionName("powerCycle 45"), "power-cycle");
    assert.equal(classFormatKeyForSessionName("Studio FIT"), "studio-fit");
    assert.equal(classFormatKeyForSessionName("Cardio Barre Plus"), "cardio-barre-plus");
    assert.equal(classFormatKeyForSessionName("Back Body Blaze"), "back-body-blaze");
    assert.equal(classFormatKeyForSessionName("StrengthLab Push"), "strength-lab");
    assert.equal(classFormatKeyForSessionName("Recovery Stretch"), "recovery");
  });
});
