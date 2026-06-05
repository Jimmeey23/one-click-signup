import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMembershipCheckoutRequest,
  buildNewcomersMembershipCheckoutRequest,
  buildCompatibleMembershipsRequest,
  findCompatibleBoughtMembershipId,
  isPaidNewcomersClassName,
  membershipIdForClassName,
  MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID,
  NEWCOMERS_2_FOR_1_PRICE_INR,
} from "./momence-booking.helpers.ts";

describe("Momence booking helpers", () => {
  it("builds the host checkout compatible-memberships request for a session", () => {
    const request = buildCompatibleMembershipsRequest({
      memberId: 27473761,
      sessionId: 15525,
      homeLocationId: 9030,
    });

    assert.equal(request.path, "/host/checkout/compatible-memberships");
    assert.deepEqual(request.body, {
      memberId: 27473761,
      homeLocationId: 9030,
      items: [{ id: "1", type: "session", sessionId: 15525 }],
    });
  });

  it("finds a compatible bought Open Barre membership from the nested response shape", () => {
    const boughtMembershipId = findCompatibleBoughtMembershipId(
      {
        items: [
          {
            boughtMembership: {
              id: 111,
              membership: { id: 12345 },
            },
          },
          {
            boughtMembership: {
              id: 222,
              membership: { id: 33609 },
            },
            incompatibility: "session-bought-membership-usage-limit-reached",
          },
          {
            boughtMembership: {
              id: 333,
              membership: { id: 33609 },
            },
          },
        ],
      },
      33609,
    );

    assert.equal(boughtMembershipId, 333);
  });

  it("detects powerCycle and StrengthLab classes that require the newcomers membership", () => {
    assert.equal(isPaidNewcomersClassName("powerCycle"), true);
    assert.equal(isPaidNewcomersClassName("45 Min Spin Express"), true);
    assert.equal(isPaidNewcomersClassName("StrengthLab"), true);
    assert.equal(isPaidNewcomersClassName("Strength Lab Push"), true);
    assert.equal(isPaidNewcomersClassName("Barre 57"), false);
    assert.equal(isPaidNewcomersClassName("Studio FIT"), false);
    assert.equal(membershipIdForClassName("powerCycle"), 240932);
    assert.equal(membershipIdForClassName("Strength Lab Push"), 240932);
    assert.equal(membershipIdForClassName("Barre 57"), 33609);
  });

  it("builds the paid membership checkout request using Momence custom payment", () => {
    assert.equal(NEWCOMERS_2_FOR_1_PRICE_INR, "1750");

    const request = buildMembershipCheckoutRequest({
      memberId: 27473761,
      homeLocationId: 9030,
      membershipId: 240932,
      attemptedPriceInCurrency: NEWCOMERS_2_FOR_1_PRICE_INR,
      paymentMethodType: "custom",
      customPaymentMethodId: 9876,
    });

    assert.equal(request.path, "/host/checkout");
    assert.deepEqual(request.body, {
      memberId: 27473761,
      homeLocationId: 9030,
      items: [
        {
          id: "1",
          type: "subscription",
          membershipId: 240932,
          attemptedPriceInCurrency: "1750",
        },
      ],
      paymentMethods: [{ id: "1", type: "custom", customPaymentMethodId: 9876 }],
    });
  });

  it("builds the paid newcomers membership checkout request with Momence custom payment", () => {
    const request = buildNewcomersMembershipCheckoutRequest({
      memberId: 27473761,
      homeLocationId: 9030,
    });

    assert.equal(MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID, 4578);
    assert.equal(request.path, "/host/checkout");
    assert.deepEqual(request.body, {
      memberId: 27473761,
      homeLocationId: 9030,
      items: [
        {
          id: "1",
          type: "subscription",
          membershipId: 240932,
          attemptedPriceInCurrency: "1750",
        },
      ],
      paymentMethods: [{ id: "1", type: "custom", customPaymentMethodId: 4578 }],
    });
  });

  it("finds a compatible bought paid newcomers membership from the nested response shape", () => {
    const boughtMembershipId = findCompatibleBoughtMembershipId(
      {
        items: [
          {
            boughtMembership: {
              id: 111,
              membership: { id: 33609 },
            },
          },
          {
            boughtMembership: {
              id: 222,
              membership: { id: 240932 },
            },
            incompatibility: "session-bought-membership-usage-limit-reached",
          },
          {
            boughtMembership: {
              id: 333,
              membership: { id: 240932 },
            },
          },
        ],
      },
      240932,
    );

    assert.equal(boughtMembershipId, 333);
  });
});
