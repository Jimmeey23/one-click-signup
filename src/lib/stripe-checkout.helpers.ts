import type Stripe from "stripe";
import {
  NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
  NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR,
  bengaluruIntroMembershipIdForLocation,
  bengaluruIntroChargePriceInrForLocation,
} from "./momence-booking.helpers.ts";

export type NewcomersCheckoutSessionInput = {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
  className: string;
  sessionStartsAt: string;
  successUrl: string;
  cancelUrl: string;
};

export type NewcomersCheckoutMetadata = {
  memberId: string;
  sessionId: string;
  homeLocationId: string;
  membershipId: string;
  className: string;
};

function appendSuccessParams(input: NewcomersCheckoutSessionInput): string {
  const url = new URL(input.successUrl);
  url.searchParams.set("locationId", String(input.homeLocationId));
  url.searchParams.set("checkout_session_id", "{CHECKOUT_SESSION_ID}");
  url.searchParams.set("paidSessionId", String(input.sessionId));
  url.searchParams.set("paidLocationId", String(input.homeLocationId));
  return url.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
}

function buildCheckoutMetadata(
  { memberId, sessionId, homeLocationId, className }: NewcomersCheckoutSessionInput,
  membershipId: number,
): NewcomersCheckoutMetadata {
  return {
    memberId: String(memberId),
    sessionId: String(sessionId),
    homeLocationId: String(homeLocationId),
    membershipId: String(membershipId),
    className,
  };
}

function buildCheckoutSessionParams(
  input: NewcomersCheckoutSessionInput,
  { membershipId, priceInr, productName, productDescription }: {
    membershipId: number;
    priceInr: string;
    productName: string;
    productDescription: string;
  },
): Stripe.Checkout.SessionCreateParams {
  const metadata = buildCheckoutMetadata(input, membershipId);

  return {
    mode: "payment",
    client_reference_id: `${input.memberId}:${input.sessionId}`,
    success_url: appendSuccessParams(input),
    cancel_url: input.cancelUrl,
    metadata,
    payment_intent_data: { metadata },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: Number(priceInr) * 100,
          product_data: {
            name: productName,
            description: productDescription,
          },
        },
      },
    ],
  };
}

export function buildNewcomersCheckoutMetadata(
  input: NewcomersCheckoutSessionInput,
): NewcomersCheckoutMetadata {
  return buildCheckoutMetadata(input, NEWCOMERS_2_FOR_1_MEMBERSHIP_ID);
}

export function buildNewcomersCheckoutSessionParams(
  input: NewcomersCheckoutSessionInput,
): Stripe.Checkout.SessionCreateParams {
  return buildCheckoutSessionParams(input, {
    membershipId: NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
    priceInr: NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR,
    productName: `${input.className} Newcomers 2 For 1`,
    productDescription: "Physique 57 India Newcomers 2 For 1 membership.",
  });
}

export type BengaluruCheckoutMetadata = NewcomersCheckoutMetadata;

export function buildBengaluruCheckoutSessionParams(
  input: NewcomersCheckoutSessionInput,
): Stripe.Checkout.SessionCreateParams {
  const membershipId = bengaluruIntroMembershipIdForLocation(input.homeLocationId);
  if (!membershipId) {
    throw new Error(
      `No Bengaluru intro pack membership configured for location ${input.homeLocationId}.`,
    );
  }

  return buildCheckoutSessionParams(input, {
    membershipId,
    priceInr: bengaluruIntroChargePriceInrForLocation(input.homeLocationId),
    productName: `${input.className} Intro Pack`,
    productDescription: "Physique 57 India Bengaluru intro pack.",
  });
}
