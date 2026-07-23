import {
  buildMembershipCheckoutRequest,
  OPEN_BARRE_MEMBERSHIP_ID,
} from "./momence-booking.helpers";
import {
  buildHostMemberCreateRequest,
  type HostMemberCreateRequest,
} from "./momence-member.helpers";

export type SignupAndEnrollInput = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  homeLocationId: number;
  waiverAccepted: true;
  signatureName: string;
  signatureRealSignature?: string;
  signatureDataUrl?: string;
  signatures?: Array<{ documentId: number; signatureText: string }>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
};

export type LeadCapturePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  center: string;
  waiverAccepted: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
  memberId: number;
};

export type SignupAndEnrollResult = {
  memberId: number;
  homeLocationId: number;
  enrolled: boolean;
  enrollError: string | null;
  signedCount: number;
  availableWaivers: number;
  leadCaptured: boolean;
  leadError: string | null;
};

export type OpenBarreCheckoutRequest = ReturnType<typeof buildMembershipCheckoutRequest>;

export type SignupAndEnrollDependencies = {
  createMember: (request: HostMemberCreateRequest) => Promise<{ memberId: number }>;
  signMemberWaivers: (input: {
    memberId: number;
    realSignature: string;
  }) => Promise<{ signedCount: number; availableCount: number }>;
  enrollOpenBarre: (request: OpenBarreCheckoutRequest) => Promise<void>;
  captureLead: (payload: LeadCapturePayload) => Promise<{ ok: boolean; error?: string | null }>;
  resolveCenterName: (homeLocationId: number) => string;
};

export async function runSignupAndEnroll(
  data: SignupAndEnrollInput,
  dependencies: SignupAndEnrollDependencies,
  { captureLead }: { captureLead: boolean },
): Promise<SignupAndEnrollResult> {
  const phoneE164 = `${data.countryCode}${data.phoneNumber.replace(/[^0-9]/g, "")}`;
  const signatureRealSignature = data.signatureRealSignature?.trim();
  if (!signatureRealSignature) {
    throw new Error("Please sign the waiver before submitting it.");
  }

  const createMemberRequest = buildHostMemberCreateRequest({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneNumber: phoneE164,
    homeLocationId: data.homeLocationId,
  });
  const created = await dependencies.createMember(createMemberRequest);
  console.debug("[debug:signup] member created", { memberId: created.memberId });

  let signed = 0;
  let availableWaivers = 0;
  try {
    const consent = await dependencies.signMemberWaivers({
      memberId: created.memberId,
      realSignature: signatureRealSignature,
    });
    signed = consent.signedCount;
    availableWaivers = consent.availableCount;
    console.debug("[debug:signup] waivers signed", { signed, availableWaivers });
    if (signed === 0 || signed < availableWaivers) {
      console.warn("[debug:signup] not all waivers signed", { signed, availableWaivers });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Waiver consent failed";
    console.error("Waiver consent failed:", msg);
    throw new Error(
      "Waiver and policy consent could not be recorded in Momence. Please contact the studio team before booking.",
    );
  }

  let enrolled = false;
  let enrollError: string | null = null;
  try {
    const checkoutRequest = buildMembershipCheckoutRequest({
      memberId: created.memberId,
      homeLocationId: data.homeLocationId,
      membershipId: OPEN_BARRE_MEMBERSHIP_ID,
      attemptedPriceInCurrency: "0",
      paymentMethodType: "free",
    });
    await dependencies.enrollOpenBarre(checkoutRequest);
    enrolled = true;
    console.debug("[debug:signup] open barre enrolled", { memberId: created.memberId });
  } catch (e) {
    enrollError = e instanceof Error ? e.message : "Enrollment failed";
    console.error("Membership enrollment failed:", enrollError);
  }

  let leadCaptured = false;
  let leadError: string | null = null;
  if (captureLead) {
    const lead = await dependencies.captureLead({
      firstName: createMemberRequest.body.firstName,
      lastName: createMemberRequest.body.lastName,
      email: data.email,
      phoneE164,
      center: dependencies.resolveCenterName(data.homeLocationId),
      waiverAccepted: data.waiverAccepted,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      referrer: data.referrer,
      landingPage: data.landingPage,
      memberId: created.memberId,
    });
    leadCaptured = lead.ok;
    leadError = lead.error ?? null;
    console.debug("[debug:signup] lead capture", { leadCaptured, leadError });
  }

  return {
    memberId: created.memberId,
    homeLocationId: data.homeLocationId,
    enrolled,
    enrollError,
    signedCount: signed,
    availableWaivers,
    leadCaptured,
    leadError,
  };
}
