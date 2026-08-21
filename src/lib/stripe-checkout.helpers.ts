import type Stripe from "stripe";
import {
  NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
  NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR,
  bengaluruIntroMembershipIdForLocation,
  bengaluruIntroChargePriceInrForLocation,
  bengaluruStripePriceIdForLocation,
  bengaluruStripeProductIdForLocation,
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

type CheckoutLineItemSource =
  | { priceId: string; productId?: never; productName?: never; productDescription?: never }
  | { priceId?: never; productId: string; productName?: never; productDescription?: never }
  | { priceId?: never; productId?: never; productName: string; productDescription: string };

function productFieldsFor(
  source: CheckoutLineItemSource,
): Pick<Stripe.Checkout.SessionCreateParams.LineItem.PriceData, "product" | "product_data"> {
  if (source.productId != null) return { product: source.productId };
  if (source.productName != null) {
    return { product_data: { name: source.productName, description: source.productDescription } };
  }
  throw new Error("A Stripe product source is required when no Price ID is supplied.");
}

function buildCheckoutSessionParams(
  input: NewcomersCheckoutSessionInput,
  params: { membershipId: number; priceInr: string } & CheckoutLineItemSource,
): Stripe.Checkout.SessionCreateParams {
  const { membershipId, priceInr } = params;
  const metadata = buildCheckoutMetadata(input, membershipId);
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = params.priceId
    ? { quantity: 1, price: params.priceId }
    : {
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: Number(priceInr) * 100,
          ...productFieldsFor(params),
        },
      };

  return {
    mode: "payment",
    client_reference_id: `${input.memberId}:${input.sessionId}`,
    success_url: appendSuccessParams(input),
    cancel_url: input.cancelUrl,
    metadata,
    payment_intent_data: { metadata },
    line_items: [lineItem],
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
    ...(bengaluruStripePriceIdForLocation(input.homeLocationId)
      ? { priceId: bengaluruStripePriceIdForLocation(input.homeLocationId) as string }
      : { productId: bengaluruStripeProductIdForLocation(input.homeLocationId) }),
  });
}
