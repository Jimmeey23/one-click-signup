import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { trimToMaxLength } from "./attribution.helpers.ts";

describe("trimToMaxLength", () => {
  it("caps a shareable route URL at the 500 characters the signup schemas accept", () => {
    // A route built in the Route Builder encodes its whole payload into the path, which
    // runs well past 500 characters. Sending that href untrimmed as landingPage failed
    // validation with "String must contain at most 500 character(s)".
    const encodedRouteHref = `https://trial.physique57india.com/signup/p57.${"e".repeat(900)}`;
    assert.ok(encodedRouteHref.length > 500);
    assert.equal(trimToMaxLength(encodedRouteHref).length, 500);
  });

  it("leaves a short URL untouched", () => {
    assert.equal(
      trimToMaxLength("https://trial.physique57india.com/battle-school"),
      "https://trial.physique57india.com/battle-school",
    );
  });

  it("turns a missing value into an empty string", () => {
    assert.equal(trimToMaxLength(undefined), "");
    assert.equal(trimToMaxLength(""), "");
  });
});
