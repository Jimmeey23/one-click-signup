import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { z } from "zod";
import {
  buildCompatibleMembershipsRequest,
  buildMembershipCheckoutRequest,
  findCompatibleBoughtMembershipId,
  isPaidNewcomersClassName,
  NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
  NEWCOMERS_2_FOR_1_PRICE_INR,
  type CompatibleMembershipsResponse,
} from "./momence-booking.helpers";
import { momenceFetch, requireServerEnv } from "./momence.server";
import { bookSessionWithMomenceMembership } from "./momence-sessions.functions";
import {
  buildNewcomersCheckoutSessionParams,
  type NewcomersCheckoutMetadata,
} from "./stripe-checkout.helpers";

const STRIPE_API_VERSION = "2026-05-27.dahlia";
const NEWCOMERS_MEMBERSHIP_LABEL = "Newcomers 2 For 1";

const CheckoutSessionInput = z.object({
  memberId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  homeLocationId: z.number().int().positive(),
  className: z.string().trim().min(1).max(200),
  sessionStartsAt: z.string().datetime(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const CompleteCheckoutInput = z.object({
  checkoutSessionId: z.string().trim().min(1).max(200),
  memberId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  homeLocationId: z.number().int().positive(),
});

const CheckoutMetadataSchema = z.object({
  memberId: z.coerce.number().int().positive(),
  sessionId: z.coerce.number().int().positive(),
  homeLocationId: z.coerce.number().int().positive(),
  membershipId: z.coerce.number().int().positive(),
  className: z.string().trim().min(1),
});

let cachedStripe: Stripe | null = null;
let cachedStripeKey: string | null = null;

async function getStripeClient(): Promise<Stripe> {
  const stripeSecretKey = await requireServerEnv("STRIPE_SECRET_KEY");
  if (cachedStripe && cachedStripeKey === stripeSecretKey) return cachedStripe;

  cachedStripe = new Stripe(stripeSecretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
  cachedStripeKey = stripeSecretKey;
  return cachedStripe;
}

function parseCheckoutMetadata(metadata: Stripe.Metadata | null | undefined) {
  return CheckoutMetadataSchema.parse(metadata ?? {});
}

function assertCheckoutMatchesExpected(
  metadata: z.infer<typeof CheckoutMetadataSchema>,
  expected?: z.infer<typeof CompleteCheckoutInput>,
) {
  if (metadata.membershipId !== NEWCOMERS_2_FOR_1_MEMBERSHIP_ID) {
    throw new Error("Stripe Checkout session is not for the Newcomers 2 For 1 membership.");
  }
  if (!isPaidNewcomersClassName(metadata.className)) {
    throw new Error("Stripe Checkout session is not for a paid class format.");
  }
  if (!expected) return;
  if (
    metadata.memberId !== expected.memberId ||
    metadata.sessionId !== expected.sessionId ||
    metadata.homeLocationId !== expected.homeLocationId
  ) {
    throw new Error("Stripe Checkout session metadata does not match this booking request.");
  }
}

async function findBoughtNewcomersMembershipId({
  memberId,
  sessionId,
  homeLocationId,
}: {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
}): Promise<number | null> {
  const compatibilityRequest = buildCompatibleMembershipsRequest({
    memberId,
    sessionId,
    homeLocationId,
  });
  const compatibleMemberships = await momenceFetch<CompatibleMembershipsResponse>(
    compatibilityRequest.path,
    {
      method: "POST",
      body: JSON.stringify(compatibilityRequest.body),
    },
  );
  return findCompatibleBoughtMembershipId(compatibleMemberships, NEWCOMERS_2_FOR_1_MEMBERSHIP_ID);
}

async function ensureNewcomersMembership({
  memberId,
  sessionId,
  homeLocationId,
}: {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
}) {
  const existing = await findBoughtNewcomersMembershipId({ memberId, sessionId, homeLocationId });
  if (existing) return;

  const purchaseRequest = buildMembershipCheckoutRequest({
    memberId,
    homeLocationId,
    membershipId: NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
    attemptedPriceInCurrency: NEWCOMERS_2_FOR_1_PRICE_INR,
    // Stripe Checkout collected the payment. Momence receives a granted package so the
    // same member can spend the credit on the selected class without a second charge.
    paymentMethodType: "free",
  });

  await momenceFetch(purchaseRequest.path, {
    method: "POST",
    body: JSON.stringify(purchaseRequest.body),
  });
}

function isAlreadyFulfilledBookingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("session-bought-membership-already-used") ||
    error.message.includes("err-session-purchase-limit-reached") ||
    error.message.toLowerCase().includes("already booked")
  );
}

export async function fulfillNewcomersCheckoutSession(
  checkoutSessionId: string,
  expected?: z.infer<typeof CompleteCheckoutInput>,
) {
  const stripe = await getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);

  if (checkoutSession.payment_status !== "paid" && checkoutSession.status !== "complete") {
    throw new Error("Stripe Checkout session is not paid yet.");
  }

  const metadata = parseCheckoutMetadata(checkoutSession.metadata);
  assertCheckoutMatchesExpected(metadata, expected);

  const bookingInput = {
    memberId: metadata.memberId,
    sessionId: metadata.sessionId,
    homeLocationId: metadata.homeLocationId,
  };

  await ensureNewcomersMembership(bookingInput);

  try {
    return await bookSessionWithMomenceMembership({
      ...bookingInput,
      membershipId: NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
      membershipLabel: NEWCOMERS_MEMBERSHIP_LABEL,
    });
  } catch (error) {
    if (isAlreadyFulfilledBookingError(error)) {
      return { booked: true as const, method: "already-booked" as const };
    }
    throw error;
  }
}

export async function handleStripeWebhook(rawBody: string, signature: string | null) {
  if (!signature) {
    throw new Error("Missing Stripe signature header.");
  }

  const stripe = await getStripeClient();
  const webhookSecret = await requireServerEnv("STRIPE_WEBHOOK_SECRET");
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillNewcomersCheckoutSession(session.id);
    return { received: true as const, fulfilled: true as const };
  }

  return { received: true as const, fulfilled: false as const };
}

export const createNewcomersCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => CheckoutSessionInput.parse(i))
  .handler(async ({ data }) => {
    if (!isPaidNewcomersClassName(data.className)) {
      throw new Error("This class does not require the Newcomers 2 For 1 checkout flow.");
    }

    const stripe = await getStripeClient();
    const params = buildNewcomersCheckoutSessionParams(data);
    const checkoutSession = await stripe.checkout.sessions.create(params);

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return {
      id: checkoutSession.id,
      url: checkoutSession.url,
      metadata: params.metadata as NewcomersCheckoutMetadata,
    };
  });

export const completeNewcomersCheckoutBooking = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => CompleteCheckoutInput.parse(i))
  .handler(async ({ data }) => {
    const result = await fulfillNewcomersCheckoutSession(data.checkoutSessionId, data);
    return result;
  });
