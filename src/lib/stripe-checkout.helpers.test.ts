import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildNewcomersCheckoutSessionParams } from "./stripe-checkout.helpers.ts";

describe("Stripe checkout helpers", () => {
  it("builds hosted Checkout params for the newcomers membership", () => {
    const params = buildNewcomersCheckoutSessionParams({
      memberId: 27473761,
      sessionId: 15525,
      homeLocationId: 9030,
      className: "powerCycle",
      sessionStartsAt: "2026-06-05T10:30:00.000Z",
      successUrl: "https://trial.physique57india.com/classes/27473761",
      cancelUrl: "https://trial.physique57india.com/classes/27473761?locationId=9030",
    });

    assert.equal(params.mode, "payment");
    assert.equal(
      params.success_url,
      "https://trial.physique57india.com/classes/27473761?locationId=9030&checkout_session_id={CHECKOUT_SESSION_ID}&paidSessionId=15525&paidLocationId=9030",
    );
    assert.equal(
      params.cancel_url,
      "https://trial.physique57india.com/classes/27473761?locationId=9030",
    );
    assert.deepEqual(params.metadata, {
      memberId: "27473761",
      sessionId: "15525",
      homeLocationId: "9030",
      membershipId: "240932",
      className: "powerCycle",
    });
    assert.deepEqual(params.payment_intent_data?.metadata, params.metadata);
    assert.equal(params.line_items?.[0]?.quantity, 1);
    assert.equal(params.line_items?.[0]?.price_data?.currency, "inr");
    assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 175000);
    assert.equal(
      params.line_items?.[0]?.price_data?.product_data?.name,
      "powerCycle Newcomers 2 For 1",
    );
  });
});
