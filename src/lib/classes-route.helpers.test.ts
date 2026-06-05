import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildClearedPaidCheckoutUrl } from "./classes-route.helpers.ts";

describe("Classes route helpers", () => {
  it("clears one-time paid checkout params without changing the route", () => {
    const nextUrl = buildClearedPaidCheckoutUrl(
      "https://trial.physique57india.com/classes/27473761?locationId=9030&checkout_session_id=cs_test_123&paidSessionId=15525&paidLocationId=9030#schedule",
      9030,
    );

    assert.equal(nextUrl, "/classes/27473761?locationId=9030#schedule");
  });
});
