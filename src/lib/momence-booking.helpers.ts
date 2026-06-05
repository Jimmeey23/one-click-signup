export type CompatibleMembershipsRequest = {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
};

export const OPEN_BARRE_MEMBERSHIP_ID = 33609;
export const NEWCOMERS_2_FOR_1_MEMBERSHIP_ID = 240932;
export const STANDARD_CLASS_PRICE_INR = "1750";
export const NEWCOMERS_2_FOR_1_PRICE_INR = "1750";
export const MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID = 4578;

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
    normalized.includes("pull") ||
    normalized.includes("blaze")
  );
}

export function membershipIdForClassName(className: string): number {
  return isPaidNewcomersClassName(className)
    ? NEWCOMERS_2_FOR_1_MEMBERSHIP_ID
    : OPEN_BARRE_MEMBERSHIP_ID;
}

export function getSchedulePriceDisplay(className: string): {
  originalPriceInCurrency: string | null;
  bookingPriceInCurrency: string;
  label: string;
  slashOriginalPrice: boolean;
} {
  if (isPaidNewcomersClassName(className)) {
    return {
      originalPriceInCurrency: null,
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
