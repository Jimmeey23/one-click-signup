import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBengaluruCheckoutSessionParams,
  buildNewcomersCheckoutSessionParams,
} from "./stripe-checkout.helpers.ts";
import {
  BENGALURU_INDIRANAGAR_LOCATION_ID,
  BENGALURU_INDIRANAGAR_STRIPE_PRODUCT_ID,
  BENGALURU_LAVELLE_ROAD_LOCATION_ID,
  BENGALURU_LAVELLE_ROAD_STRIPE_PRODUCT_ID,
  BENGALURU_PLASH_PILATES_LOCATION_ID,
  BENGALURU_PLASH_PILATES_MEMBERSHIP_ID,
  BENGALURU_PLASH_PILATES_STRIPE_PRICE_ID,
} from "./momence-booking.helpers.ts";

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
    // 1750 pre-tax + 5% GST = 1838
    assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 183800);
    assert.equal(
      params.line_items?.[0]?.price_data?.product_data?.name,
      "powerCycle Newcomers 2 For 1",
    );
  });

  it("builds hosted Checkout params for the Lavelle Road Bengaluru intro pack using its Stripe product id", () => {
    const params = buildBengaluruCheckoutSessionParams({
      memberId: 15199641,
      sessionId: 139066783,
      homeLocationId: BENGALURU_LAVELLE_ROAD_LOCATION_ID,
      className: "Barre",
      sessionStartsAt: "2026-06-05T10:30:00.000Z",
      successUrl: "https://trial.physique57india.com/classes/15199641",
      cancelUrl: "https://trial.physique57india.com/classes/15199641?locationId=22116",
    });

    // 675 pre-tax + 5% GST = 709
    assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 70900);
    assert.equal(
      params.line_items?.[0]?.price_data?.product,
      BENGALURU_LAVELLE_ROAD_STRIPE_PRODUCT_ID,
    );
    assert.equal(params.line_items?.[0]?.price_data?.product_data, undefined);
  });

  it("builds hosted Checkout params for the Indiranagar Copper + Cloves package using its Stripe product id", () => {
    const params = buildBengaluruCheckoutSessionParams({
      memberId: 15199641,
      sessionId: 139066783,
      homeLocationId: BENGALURU_INDIRANAGAR_LOCATION_ID,
      className: "Barre",
      sessionStartsAt: "2026-06-05T10:30:00.000Z",
      successUrl: "https://trial.physique57india.com/classes/15199641",
      cancelUrl: "https://trial.physique57india.com/classes/15199641?locationId=36372",
    });

    // 900 pre-tax + 5% GST = 945
    assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 94500);
    assert.equal(
      params.line_items?.[0]?.price_data?.product,
      BENGALURU_INDIRANAGAR_STRIPE_PRODUCT_ID,
    );
    assert.equal(params.line_items?.[0]?.price_data?.product_data, undefined);
  });

  it("builds Plash Pilates checkout with its full-price Stripe price and Momence package", () => {
    const params = buildBengaluruCheckoutSessionParams({
      memberId: 15199641,
      sessionId: 139066783,
      homeLocationId: BENGALURU_PLASH_PILATES_LOCATION_ID,
      className: "Barre",
      sessionStartsAt: "2026-06-05T10:30:00.000Z",
      successUrl: "https://trial.physique57india.com/classes/15199641",
      cancelUrl: "https://trial.physique57india.com/classes/15199641?locationId=287883",
    });

    assert.equal(params.metadata?.membershipId, String(BENGALURU_PLASH_PILATES_MEMBERSHIP_ID));
    assert.equal(params.line_items?.[0]?.price, BENGALURU_PLASH_PILATES_STRIPE_PRICE_ID);
    assert.equal(params.line_items?.[0]?.price_data, undefined);
  });
});
