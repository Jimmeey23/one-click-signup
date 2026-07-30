export type CompatibleMembershipsRequest = {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
};

export const OPEN_BARRE_MEMBERSHIP_ID = 33609;
export const NEWCOMERS_2_FOR_1_MEMBERSHIP_ID = 240932;
export const BENGALURU_LAVELLE_ROAD_LOCATION_ID = 22116;
export const BENGALURU_INDIRANAGAR_LOCATION_ID = 36372;
// 50%-off first-class intro pack - Lavelle Road only.
export const BENGALURU_LAVELLE_ROAD_INTRO_MEMBERSHIP_ID = 654474;
// Indiranagar has no first-class promo; new members go on the Copper + Cloves single class package.
export const BENGALURU_INDIRANAGAR_MEMBERSHIP_ID = 548528;

export function isBengaluruLocation(homeLocationId: number | undefined | null): boolean {
  return (
    homeLocationId === BENGALURU_LAVELLE_ROAD_LOCATION_ID ||
    homeLocationId === BENGALURU_INDIRANAGAR_LOCATION_ID
  );
}

export function openBarreMembershipIdForLocation(homeLocationId: number): number {
  if (homeLocationId === BENGALURU_LAVELLE_ROAD_LOCATION_ID) {
    return BENGALURU_LAVELLE_ROAD_INTRO_MEMBERSHIP_ID;
  }
  if (homeLocationId === BENGALURU_INDIRANAGAR_LOCATION_ID) {
    return BENGALURU_INDIRANAGAR_MEMBERSHIP_ID;
  }
  return OPEN_BARRE_MEMBERSHIP_ID;
}
// Momence's own catalog price for this membership (matches mum_price_metadata in the
// products export) - this is what must be sent back to Momence's checkout API.
export const STANDARD_CLASS_PRICE_INR = "1750";
export const NEWCOMERS_2_FOR_1_PRICE_INR = "1750";
export const MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID = 4578;
// Custom payment methods are per-host in Momence - Bengaluru (host 33905) has its own id.
export const BENGALURU_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID = 5801;
// GST applied on top of the Momence catalog price when charging the member directly
// through Stripe Checkout (Momence's own checkout already accounts for tax internally).
export const GST_RATE = 0.05;

export function toGstInclusiveInr(preTaxAmountInCurrency: string): string {
  return String(Math.round(Number(preTaxAmountInCurrency) * (1 + GST_RATE)));
}

export const NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR = toGstInclusiveInr(
  NEWCOMERS_2_FOR_1_PRICE_INR,
);

// Copper + Cloves single class package (Indiranagar) - INR 900 + 5% GST, charged via Stripe.
export const BENGALURU_INDIRANAGAR_PRICE_INR = "900";
export const BENGALURU_INDIRANAGAR_STRIPE_CHARGE_PRICE_INR = toGstInclusiveInr(
  BENGALURU_INDIRANAGAR_PRICE_INR,
);

// Lavelle Road's drop-in rate is 1350; the intro pack halves that pre-tax to 675, then adds 5% GST.
export const BENGALURU_LAVELLE_ROAD_DROP_IN_PRICE_INR = "1350";
export const BENGALURU_LAVELLE_ROAD_INTRO_PRICE_INR = "675";
export const BENGALURU_LAVELLE_ROAD_INTRO_STRIPE_CHARGE_PRICE_INR = toGstInclusiveInr(
  BENGALURU_LAVELLE_ROAD_INTRO_PRICE_INR,
);

// Stripe product ids backing the Bengaluru intro pack checkout line items.
export const BENGALURU_LAVELLE_ROAD_STRIPE_PRODUCT_ID = "prod_UykA65J7aUXlLe";
export const BENGALURU_INDIRANAGAR_STRIPE_PRODUCT_ID = "prod_UykBa2v6q915IL";

export function bengaluruStripeProductIdForLocation(homeLocationId: number): string {
  return homeLocationId === BENGALURU_LAVELLE_ROAD_LOCATION_ID
    ? BENGALURU_LAVELLE_ROAD_STRIPE_PRODUCT_ID
    : BENGALURU_INDIRANAGAR_STRIPE_PRODUCT_ID;
}

export function bengaluruIntroMembershipIdForLocation(homeLocationId: number): number | null {
  if (homeLocationId === BENGALURU_LAVELLE_ROAD_LOCATION_ID) {
    return BENGALURU_LAVELLE_ROAD_INTRO_MEMBERSHIP_ID;
  }
  if (homeLocationId === BENGALURU_INDIRANAGAR_LOCATION_ID) {
    return BENGALURU_INDIRANAGAR_MEMBERSHIP_ID;
  }
  return null;
}

// Drop-in rate shown struck through on the schedule page (pre-tax, matches the studio's
// posted single-class price - Indiranagar has no discount, so this equals its intro price).
export function bengaluruDropInPriceInrForLocation(homeLocationId: number): string {
  return homeLocationId === BENGALURU_LAVELLE_ROAD_LOCATION_ID
    ? BENGALURU_LAVELLE_ROAD_DROP_IN_PRICE_INR
    : BENGALURU_INDIRANAGAR_PRICE_INR;
}

// Actual Stripe-charged, tax-inclusive intro pack price.
export function bengaluruIntroChargePriceInrForLocation(homeLocationId: number): string {
  return homeLocationId === BENGALURU_LAVELLE_ROAD_LOCATION_ID
    ? BENGALURU_LAVELLE_ROAD_INTRO_STRIPE_CHARGE_PRICE_INR
    : BENGALURU_INDIRANAGAR_STRIPE_CHARGE_PRICE_INR;
}

export function buildBengaluruIntroMembershipCheckoutRequest({
  memberId,
  homeLocationId,
  customPaymentMethodId,
  customPaymentNote,
}: {
  memberId: number;
  homeLocationId: number;
  customPaymentMethodId?: number;
  customPaymentNote?: string;
}) {
  const membershipId = bengaluruIntroMembershipIdForLocation(homeLocationId);
  if (!membershipId) {
    throw new Error(`No Bengaluru intro pack membership configured for location ${homeLocationId}.`);
  }

  return buildMembershipCheckoutRequest({
    memberId,
    homeLocationId,
    membershipId,
    attemptedPriceInCurrency: bengaluruIntroChargePriceInrForLocation(homeLocationId),
    paymentMethodType: "custom",
    customPaymentMethodId: customPaymentMethodId ?? BENGALURU_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID,
    customPaymentNote,
  });
}

// Bengaluru studios sit under a separate Momence host; booking's auto-book dashboard call
// needs this host id instead of Mumbai's.
export const BENGALURU_MOMENCE_HOST_ID = 33905;

export function buildOpenBarreCheckoutRequestForLocation({
  memberId,
  homeLocationId,
}: {
  memberId: number;
  homeLocationId: number;
}) {
  if (homeLocationId === BENGALURU_INDIRANAGAR_LOCATION_ID) {
    return buildMembershipCheckoutRequest({
      memberId,
      homeLocationId,
      membershipId: BENGALURU_INDIRANAGAR_MEMBERSHIP_ID,
      attemptedPriceInCurrency: BENGALURU_INDIRANAGAR_STRIPE_CHARGE_PRICE_INR,
      paymentMethodType: "custom",
      customPaymentMethodId: MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID,
    });
  }

  return buildMembershipCheckoutRequest({
    memberId,
    homeLocationId,
    membershipId: openBarreMembershipIdForLocation(homeLocationId),
    attemptedPriceInCurrency: "0",
    paymentMethodType: "free",
  });
}

export type CompatibleBoughtMembership = {
  id: number;
  membership?: { id?: number | null } | null;
};

export type CompatibleMembership = {
  boughtMembership?: CompatibleBoughtMembership | null;
  incompatibility?: string | null;
};

export type CompatibleMembershipsResponse = {
  items?: CompatibleMembership[];
};

export type MembershipCheckoutRequest = {
  memberId: number;
  homeLocationId: number;
  membershipId: number;
  attemptedPriceInCurrency: string;
} & (
  | {
      paymentMethodType: "free";
    }
  | {
      paymentMethodType: "custom";
      customPaymentMethodId: number;
      customPaymentNote?: string;
    }
);

export type NewcomersMembershipCheckoutRequest = {
  memberId: number;
  homeLocationId: number;
  customPaymentMethodId?: number;
  customPaymentNote?: string;
};

function normalizeClassName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isPaidNewcomersClassName(className: string): boolean {
  const normalized = normalizeClassName(className);
  return (
    normalized.includes("powercycle") ||
    normalized.includes("power cycle") ||
    normalized.includes("cycle") ||
    normalized.includes("spin") ||
    normalized.includes("strengthlab") ||
    normalized.includes("strength lab") ||
    normalized.includes("strength") ||
    normalized.includes("lab") ||
    normalized.includes("push") ||
    normalized.includes("pull")
  );
}

export function membershipIdForClassName(className: string): number {
  return isPaidNewcomersClassName(className)
    ? NEWCOMERS_2_FOR_1_MEMBERSHIP_ID
    : OPEN_BARRE_MEMBERSHIP_ID;
}

export function getSchedulePriceDisplay(
  className: string,
  homeLocationId?: number,
): {
  originalPriceInCurrency: string | null;
  bookingPriceInCurrency: string;
  label: string;
  slashOriginalPrice: boolean;
} {
  if (isBengaluruLocation(homeLocationId)) {
    // Indiranagar's intro pack has no discount (900 pre-tax === its drop-in rate), so show
    // the plain 900 with no strikethrough. The 945 GST-inclusive amount is only what Stripe
    // actually charges, sourced separately in buildBengaluruIntroMembershipCheckoutRequest.
    if (homeLocationId === BENGALURU_INDIRANAGAR_LOCATION_ID) {
      return {
        originalPriceInCurrency: null,
        bookingPriceInCurrency: BENGALURU_INDIRANAGAR_PRICE_INR,
        label: "Intro Pack",
        slashOriginalPrice: false,
      };
    }
    return {
      originalPriceInCurrency: bengaluruDropInPriceInrForLocation(homeLocationId as number),
      // Pre-tax price - GST is only added when the amount is charged on the Stripe checkout page.
      bookingPriceInCurrency: BENGALURU_LAVELLE_ROAD_INTRO_PRICE_INR,
      label: "Intro Pack",
      slashOriginalPrice: true,
    };
  }

  if (isPaidNewcomersClassName(className)) {
    return {
      originalPriceInCurrency: null,
      // Pre-tax price - GST is only added when the amount is charged on the Stripe checkout page.
      bookingPriceInCurrency: NEWCOMERS_2_FOR_1_PRICE_INR,
      label: "Newcomers 2 for 1",
      slashOriginalPrice: false,
    };
  }

  return {
    originalPriceInCurrency: STANDARD_CLASS_PRICE_INR,
    bookingPriceInCurrency: "0",
    label: "Open Barre trial",
    slashOriginalPrice: true,
  };
}

export function buildCompatibleMembershipsRequest({
  memberId,
  sessionId,
  homeLocationId,
}: CompatibleMembershipsRequest) {
  return {
    path: "/host/checkout/compatible-memberships",
    body: {
      memberId,
      homeLocationId,
      items: [{ id: "1", type: "session", sessionId }],
    },
  } as const;
}

export function buildMembershipCheckoutRequest({
  memberId,
  homeLocationId,
  membershipId,
  attemptedPriceInCurrency,
  ...paymentMethod
}: MembershipCheckoutRequest) {
  return {
    path: "/host/checkout",
    body: {
      memberId,
      homeLocationId,
      items: [
        {
          id: "1",
          type: "subscription",
          membershipId,
          attemptedPriceInCurrency,
        },
      ],
      paymentMethods: [
        paymentMethod.paymentMethodType === "custom"
          ? {
              id: "1",
              type: "custom",
              customPaymentMethodId: paymentMethod.customPaymentMethodId,
              ...(paymentMethod.customPaymentNote ? { note: paymentMethod.customPaymentNote } : {}),
            }
          : { id: "1", type: "free" },
      ],
    },
  } as const;
}

export function buildNewcomersMembershipCheckoutRequest({
  memberId,
  homeLocationId,
  customPaymentMethodId,
  customPaymentNote,
}: NewcomersMembershipCheckoutRequest) {
  return buildMembershipCheckoutRequest({
    memberId,
    homeLocationId,
    membershipId: NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
    attemptedPriceInCurrency: NEWCOMERS_2_FOR_1_PRICE_INR,
    paymentMethodType: "custom",
    customPaymentMethodId: customPaymentMethodId ?? MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID,
    customPaymentNote,
  });
}

export function findCompatibleBoughtMembershipId(
  response: CompatibleMembershipsResponse,
  membershipId: number,
): number | null {
  const match = (response.items ?? []).find(
    (item) => !item.incompatibility && item.boughtMembership?.membership?.id === membershipId,
  );

  return match?.boughtMembership?.id ?? null;
}

export function findMembershipIncompatibility(
  response: CompatibleMembershipsResponse,
  membershipId: number,
): string | null {
  const match = (response.items ?? []).find(
    (item) => item.incompatibility && item.boughtMembership?.membership?.id === membershipId,
  );

  return match?.incompatibility ?? null;
}
