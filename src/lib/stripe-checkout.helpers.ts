import type Stripe from "stripe";
import {
  NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
  NEWCOMERS_2_FOR_1_PRICE_INR,
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

export function buildNewcomersCheckoutMetadata({
  memberId,
  sessionId,
  homeLocationId,
  className,
}: NewcomersCheckoutSessionInput): NewcomersCheckoutMetadata {
  return {
    memberId: String(memberId),
    sessionId: String(sessionId),
    homeLocationId: String(homeLocationId),
    membershipId: String(NEWCOMERS_2_FOR_1_MEMBERSHIP_ID),
    className,
  };
}

export function buildNewcomersCheckoutSessionParams(
  input: NewcomersCheckoutSessionInput,
): Stripe.Checkout.SessionCreateParams {
  const metadata = buildNewcomersCheckoutMetadata(input);

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
          unit_amount: Number(NEWCOMERS_2_FOR_1_PRICE_INR) * 100,
          product_data: {
            name: "Newcomers 2 For 1",
            description:
              "Two Physique 57 India Studio Session credits, valid for 14 days from first use.",
          },
        },
      },
    ],
  };
}
