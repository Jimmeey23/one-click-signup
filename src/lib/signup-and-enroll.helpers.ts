import {
  buildHostMemberCreateRequest,
  type HostMemberCreateRequest,
} from "./momence-member.helpers";
import {
  isPaidNewcomersClassName,
  momenceHomeLocationIdForLocation,
} from "./momence-booking.helpers";

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
  classType?: string;
  whatsappConsent?: boolean;
  whatsappConsentAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
  abVariant?: string;
};

export type LeadCapturePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  center: string;
  classType?: string;
  waiverAccepted: boolean;
  whatsappConsent?: boolean;
  whatsappConsentAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
  abVariant?: string;
  memberId?: number;
  stage?: "partial" | "completed";
};

export class WaiverConsentError extends Error {
  constructor(
    message = "Waiver and policy consent could not be recorded in Momence. Please contact the studio team before booking.",
  ) {
    super(message);
    this.name = "WaiverConsentError";
  }
}

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

export type SignupAndEnrollDependencies = {
  createMember: (request: HostMemberCreateRequest) => Promise<{ memberId: number }>;
  signMemberWaivers: (input: {
    memberId: number;
    realSignature: string;
    homeLocationId: number;
  }) => Promise<{ signedCount: number; availableCount: number }>;
  enrollOpenBarre: (input: { memberId: number; homeLocationId: number }) => Promise<void>;
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
    homeLocationId: momenceHomeLocationIdForLocation(data.homeLocationId),
  });
  const created = await dependencies.createMember(createMemberRequest);
  console.debug("[debug:signup] member created", { memberId: created.memberId });

  let signed = 0;
  let availableWaivers = 0;
  try {
    const consent = await dependencies.signMemberWaivers({
      memberId: created.memberId,
      realSignature: signatureRealSignature,
      homeLocationId: data.homeLocationId,
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
    throw new WaiverConsentError();
  }

  let enrolled = false;
  let enrollError: string | null = null;
  if (data.classType && isPaidNewcomersClassName(data.classType)) {
    // Strength/powerCycle classes skip the free Open Barre trial - member gets billed for
    // Newcomers 2 for 1 directly when they book their class instead.
    enrolled = true;
    console.debug("[debug:signup] skipped open barre enrollment for paid newcomers class", {
      memberId: created.memberId,
      classType: data.classType,
    });
  } else {
    try {
      await dependencies.enrollOpenBarre({
        memberId: created.memberId,
        homeLocationId: data.homeLocationId,
      });
      enrolled = true;
      console.debug("[debug:signup] open barre enrolled", { memberId: created.memberId });
    } catch (e) {
      enrollError = e instanceof Error ? e.message : "Enrollment failed";
      console.error("Membership enrollment failed:", enrollError);
    }
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
      classType: data.classType,
      waiverAccepted: data.waiverAccepted,
      whatsappConsent: data.whatsappConsent ?? false,
      whatsappConsentAt: data.whatsappConsentAt,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
      gclid: data.gclid,
      fbclid: data.fbclid,
      referrer: data.referrer,
      landingPage: data.landingPage,
      abVariant: data.abVariant,
      memberId: created.memberId,
      stage: "completed",
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
