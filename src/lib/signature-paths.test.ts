import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  drawablePaths,
  rescaleFactor,
  scalePaths,
  shouldRebuildCanvas,
} from "./signature-paths.ts";

describe("Signature pad resize behaviour", () => {
  it("keeps the signature when only the height changes", () => {
    // The mobile keyboard opening fires resize with the same width.
    assert.equal(shouldRebuildCanvas(390, 390), false);
  });

  it("rebuilds when the width actually changes", () => {
    assert.equal(shouldRebuildCanvas(390, 844), true);
  });

  it("treats the first measurement as a rebuild", () => {
    assert.equal(shouldRebuildCanvas(0, 390), true);
  });

  it("does not rescale on the first measurement", () => {
    assert.equal(rescaleFactor(0, 390), 1);
  });

  it("rescales strokes proportionally when the pad gets wider", () => {
    assert.equal(rescaleFactor(390, 780), 2);
  });

  it("ignores a zero or negative next width rather than collapsing the signature", () => {
    assert.equal(rescaleFactor(390, 0), 1);
  });

  it("scales every coordinate in every stroke", () => {
    const paths = [
      [0, 0, 10, 10],
      [20, 5, 30, 15],
    ];
    assert.deepEqual(scalePaths(paths, 2), [
      [0, 0, 20, 20],
      [40, 10, 60, 30],
    ]);
  });

  it("returns the same strokes untouched at scale 1", () => {
    const paths = [[1, 2, 3, 4]];
    assert.equal(scalePaths(paths, 1), paths);
  });

  it("drops taps that are too short to be part of a signature", () => {
    assert.deepEqual(
      drawablePaths([
        [1, 2],
        [1, 2, 3, 4],
      ]),
      [[1, 2, 3, 4]],
    );
  });

  it("survives a full keyboard-open, keyboard-close cycle with the signature intact", () => {
    const signature = [[10, 10, 40, 30, 70, 20]];
    let width = 390;
    let paths = signature;
    for (const next of [390, 390, 390]) {
      if (shouldRebuildCanvas(width, next)) {
        paths = scalePaths(paths, rescaleFactor(width, next));
        width = next;
      }
    }
    assert.deepEqual(paths, signature, "signature must survive height-only resize events");
    assert.equal(drawablePaths(paths).length, 1);
  });
});
