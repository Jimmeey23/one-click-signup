import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classFormatKeyForSessionName,
  detailedClassFormatKeyForSessionName,
} from "./class-format-matchers.ts";

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

  it("keeps barre-family formats apart for schedule display", () => {
    assert.equal(detailedClassFormatKeyForSessionName("Studio FIT"), "studio-fit");
    assert.equal(
      detailedClassFormatKeyForSessionName("Studio Back Body Blaze Express"),
      "back-body-blaze",
    );
    assert.equal(detailedClassFormatKeyForSessionName("Cardio Barre Plus"), "cardio-barre-plus");
    assert.equal(detailedClassFormatKeyForSessionName("Studio Cardio Barre"), "cardio-barre");
    assert.equal(detailedClassFormatKeyForSessionName("Studio HIIT"), "hiit");
    assert.equal(detailedClassFormatKeyForSessionName("Studio Mat 57"), "mat-57");
    assert.equal(detailedClassFormatKeyForSessionName("Recovery Stretch"), "recovery");
    assert.equal(detailedClassFormatKeyForSessionName("Studio Barre 57"), "barre-57");
    assert.equal(detailedClassFormatKeyForSessionName("Strength Lab (Focus)"), "strength-lab");
    assert.equal(detailedClassFormatKeyForSessionName("powerCycle 45"), "power-cycle");
  });
});
