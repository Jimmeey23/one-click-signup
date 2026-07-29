import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { momenceDashboardFetch, momenceFetch, MOMENCE_HOST_ID, LOCATIONS } from "./momence.server";
import {
  classTypeValueForClassFormatKey,
  type ClassFormatKey,
} from "./class-format-matchers";
import {
  buildOpenBarreCheckoutRequestForLocation,
  BENGALURU_LAVELLE_ROAD_LOCATION_ID,
  BENGALURU_LAVELLE_ROAD_INTRO_MEMBERSHIP_ID,
} from "./momence-booking.helpers";
import { payBengaluruMembershipCart } from "./momence-sessions.functions";
import { buildHostMemberCreateRequest } from "./momence-member.helpers";
import {
  buildDashboardPublicWaiverSignRequests,
  type DashboardWaiver,
} from "./momence-waivers.helpers";
import {
  runSignupAndEnroll,
  type LeadCapturePayload,
  type SignupAndEnrollDependencies,
} from "./signup-and-enroll.helpers";

const SignatureSchema = z.object({
  documentId: z.number().int().positive(),
  signatureText: z.string().min(1).max(200),
});

const SignupInput = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150),
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  phoneNumber: z
    .string()
    .trim()
    .min(5)
    .max(20)
    .regex(/^[0-9 -]+$/),
  homeLocationId: z.number().int().positive(),
  waiverAccepted: z.literal(true),
  signatureName: z.string().trim().min(2).max(120),
  signatureRealSignature: z.string().min(2).max(300000).optional(),
  signatureDataUrl: z.string().max(300000).optional(),
  signatures: z.array(SignatureSchema).max(20).optional().default([]),
  classType: z.string().max(100).optional(),
  whatsappConsent: z.boolean().optional().default(false),
  whatsappConsentAt: z.string().max(40).optional(),
  // Tracking
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
  abVariant: z.string().max(20).optional(),
});

const PartialLeadInput = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email().max(150),
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  phoneNumber: z
    .string()
    .trim()
    .min(5)
    .max(20)
    .regex(/^[0-9 -]+$/),
  homeLocationId: z.number().int().positive().optional(),
  whatsappConsent: z.boolean().optional().default(false),
  whatsappConsentAt: z.string().max(40).optional(),
  // Tracking
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
  abVariant: z.string().max(20).optional(),
  classType: z.string().max(100).optional(),
});

const LeadAndOpenBarreInput = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150),
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  phoneNumber: z
    .string()
    .trim()
    .min(5)
    .max(20)
    .regex(/^[0-9 -]+$/),
  homeLocationId: z.number().int().positive(),
  whatsappConsent: z.boolean().optional().default(false),
  whatsappConsentAt: z.string().max(40).optional(),
  // Tracking
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
  abVariant: z.string().max(20).optional(),
  classType: z.string().max(100).optional(),
});

type RespondAttempt = {
  path: string;
  method?: "POST" | "PUT";
  body: unknown;
};

async function callRespondIo(
  baseUrl: string,
  apiKey: string,
  attempt: RespondAttempt,
): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
  const response = await fetch(`${baseUrl}${attempt.path}`, {
    method: attempt.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(attempt.body),
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    text,
  };
}

const RESPONDIO_LIFECYCLE_STAGE = "New Enquiry";
const RESPONDIO_TAG = "Website";

export function buildRespondIoContactBody({
  firstName,
  lastName,
  email,
  phoneE164,
  center,
  classType,
  whatsappConsent,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  center: string;
  classType?: string;
  whatsappConsent?: boolean;
}) {
  const classTypeValue = classType
    ? classTypeValueForClassFormatKey(classType as ClassFormatKey)
    : "Barre";

  return {
    firstName,
    lastName,
    email,
    phone: phoneE164,
    customFields: [
      { name: "center", value: center },
      { name: "classType", value: classTypeValue },
      { name: "whatsappConsent", value: whatsappConsent ? "opted_in" : "not_opted_in" },
    ],
  };
}

async function syncRespondIoContactAndConversation(payload: LeadCapturePayload): Promise<void> {
  const apiKey = process.env.RESPONDIO_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESPONDIO_API_KEY not set - skipping Respond.io contact sync");
    return;
  }

  const baseUrl = (process.env.RESPONDIO_BASE_URL?.trim() || "https://api.respond.io/v2").replace(
    /\/$/,
    "",
  );

  // Identifier format per respond.io API v2: "phone:+<e164 digits>" (no URL-encoding needed,
  // phoneE164 is already restricted to '+' and digits by upstream validation).
  const identifier = `phone:${payload.phoneE164}`;

  try {
    const created = await callRespondIo(baseUrl, apiKey, {
      path: `/contact/create_or_update/${identifier}`,
      body: buildRespondIoContactBody({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneE164: payload.phoneE164,
        center: payload.center,
        classType: payload.abVariant === "bengaluru" ? "barre-57" : payload.classType,
        whatsappConsent: payload.whatsappConsent,
      }),
    });
    if (!created.ok) {
      console.error(
        "Respond.io contact creation failed",
        `${created.status} ${created.text}`,
      );
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Respond.io error";
    console.error("Respond.io contact creation failed", message);
    return;
  }

  const tags = payload.stage === "partial" ? [RESPONDIO_TAG, "Partial Signup"] : [RESPONDIO_TAG];
  if (payload.whatsappConsent) tags.push("WhatsApp Opt-In");

  const followUps: RespondAttempt[] = [
    {
      path: `/contact/${identifier}/lifecycle/update`,
      body: { name: RESPONDIO_LIFECYCLE_STAGE },
    },
    {
      path: `/contact/${identifier}/tag`,
      body: tags,
    },
    {
      path: `/contact/${identifier}/conversation/status`,
      body: { status: "open" },
    },
  ];

  // A freshly created contact is indexed asynchronously on respond.io's side; calls made
  // immediately after creation can hit their queue and return 449 until indexing finishes.
  const RETRY_DELAYS_MS = [1500, 3000, 5000];

  for (const attempt of followUps) {
    for (let retry = 0; ; retry++) {
      try {
        const response = await callRespondIo(baseUrl, apiKey, attempt);
        if (response.ok) break;
        if (response.status === 449 && retry < RETRY_DELAYS_MS.length) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[retry]));
          continue;
        }
        console.error(
          `Respond.io ${attempt.path} failed`,
          `${response.status} ${response.text}`,
        );
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Respond.io error";
        console.error(`Respond.io ${attempt.path} failed`, message);
        break;
      }
    }
  }
}

const BENGALURU_LEADS_HOST_ID = 33905;
const BENGALURU_LEADS_SOURCE_ID = "11615";
const BENGALURU_LEADS_FALLBACK_TOKEN = "qy71rOk8en";

async function captureLead(payload: LeadCapturePayload): Promise<{ ok: boolean; error?: string }> {
  const isBengaluru = payload.abVariant === "bengaluru";
  const token = isBengaluru
    ? (process.env.MOMENCE_API_TOKEN_BLR?.trim() || BENGALURU_LEADS_FALLBACK_TOKEN)
    : process.env.MOMENCE_API_TOKEN;
  if (!token) {
    console.warn("MOMENCE_API_TOKEN not set - skipping lead capture");
    return { ok: false, error: "Lead webhook token not configured" };
  }
  try {
    const leadBody = {
      token,
      sourceId: isBengaluru ? BENGALURU_LEADS_SOURCE_ID : "8082",
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phoneNumber: payload.phoneE164,
      time: "Flexible / Needs Recommendation",
      center: payload.center,
      type: isBengaluru ? "Barre 57" : (payload.classType ?? "Barre 57"),
      waiverAccepted: payload.waiverAccepted ? "accepted" : "declined",
      whatsapp_consent: payload.whatsappConsent ? "opted_in" : "not_opted_in",
      whatsapp_consent_at: payload.whatsappConsentAt ?? "",
      event_id: `${payload.stage ?? "completed"}_${payload.memberId ?? "prospect"}_${Date.now()}`,
      utm_source: payload.utmSource ?? "website",
      utm_medium: payload.utmMedium ?? (payload.abVariant === "bengaluru" ? "bengaluru-landing" : "trial-landing"),
      utm_campaign: payload.utmCampaign ?? (payload.abVariant === "bengaluru" ? "bengaluru-first-class-offer" : "open-barre-trial"),
      utm_term: payload.utmTerm ?? "",
      utm_content: payload.utmContent ?? "",
      gclid: payload.gclid ?? "",
      fbclid: payload.fbclid ?? "",
      landing_page:
        payload.landingPage ??
        (payload.abVariant === "bengaluru"
          ? "https://trial.physique57india.com/bengaluru"
          : "https://trial.physique57india.com/"),
      referrer: payload.referrer ?? "",
      ab_variant: payload.abVariant ?? "",
      lead_stage: payload.stage ?? "completed",
    };

    const leadsHostId = isBengaluru ? BENGALURU_LEADS_HOST_ID : 13752;
    const res = await fetch(`https://api.momence.com/integrations/customer-leads/${leadsHostId}/collect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(leadBody),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Lead capture failed:", res.status, t);
      return { ok: false, error: `Lead capture ${res.status}` };
    }

    try {
      await syncRespondIoContactAndConversation(payload);
    } catch (respondError) {
      console.error(
        "Respond.io sync failed",
        respondError instanceof Error ? respondError.message : respondError,
      );
    }

    const additionalWebhookUrl = process.env.MOMENCE_LEADS_WEBHOOK_URL?.trim();
    if (additionalWebhookUrl) {
      try {
        const webhookRes = await fetch(additionalWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadBody),
        });

        if (!webhookRes.ok) {
          const body = await webhookRes.text();
          console.error("Additional Momence leads webhook failed:", webhookRes.status, body);
        }
      } catch (webhookError) {
        const webhookMsg =
          webhookError instanceof Error ? webhookError.message : "Additional webhook failed";
        console.error(webhookMsg);
      }
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lead capture failed";
    console.error(msg);
    return { ok: false, error: msg };
  }
}

async function signMemberWaivers({
  memberId,
  realSignature,
}: {
  memberId: number;
  realSignature: string;
}): Promise<{ signedCount: number; availableCount: number }> {
  const res = await momenceDashboardFetch<{ waivers?: DashboardWaiver[] }>(
    `/host/${MOMENCE_HOST_ID}/members/${memberId}/waivers`,
    { method: "GET" },
  );
  const waivers = res.waivers ?? [];
  const signRequests = buildDashboardPublicWaiverSignRequests({
    hostId: MOMENCE_HOST_ID,
    memberId,
    realSignature,
    waivers,
  });

  if (waivers.length === 0) {
    throw new Error("No Momence waiver records were available for this member.");
  }

  await Promise.all(
    signRequests.map((request) =>
      momenceDashboardFetch(request.path, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(request.body),
      }),
    ),
  );

  return { signedCount: signRequests.length, availableCount: waivers.length };
}

const signupAndEnrollDependencies: SignupAndEnrollDependencies = {
  createMember: async (request) =>
    momenceFetch<{ memberId: number }>(request.path, {
      method: request.method,
      body: JSON.stringify(request.body),
    }),
  signMemberWaivers,
  enrollOpenBarre: async ({ memberId, homeLocationId }) => {
    if (homeLocationId === BENGALURU_LAVELLE_ROAD_LOCATION_ID) {
      return payBengaluruMembershipCart({
        memberId,
        homeLocationId,
        membershipId: BENGALURU_LAVELLE_ROAD_INTRO_MEMBERSHIP_ID,
      });
    }
    const checkoutRequest = buildOpenBarreCheckoutRequestForLocation({ memberId, homeLocationId });
    await momenceFetch(checkoutRequest.path, {
      method: "POST",
      body: JSON.stringify(checkoutRequest.body),
    });
    return { boughtMembershipId: null };
  },
  captureLead,
  resolveCenterName: (homeLocationId) =>
    LOCATIONS.find((l) => l.id === homeLocationId)?.name ?? "Physique 57 India",
};

export const signupAndEnroll = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SignupInput.parse(input))
  .handler(async ({ data }) =>
    runSignupAndEnroll(data, signupAndEnrollDependencies, { captureLead: true }),
  );

export const signupAndEnrollWithoutLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SignupInput.parse(input))
  .handler(async ({ data }) =>
    runSignupAndEnroll(data, signupAndEnrollDependencies, { captureLead: false }),
  );

export const createLeadAndAssignOpenBarre = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadAndOpenBarreInput.parse(input))
  .handler(async ({ data }) => {
    const phoneE164 = `${data.countryCode}${data.phoneNumber.replace(/[^0-9]/g, "")}`;

    const memberRequest = buildHostMemberCreateRequest({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: phoneE164,
      homeLocationId: data.homeLocationId,
    });

    const created = await momenceFetch<{ memberId: number }>(memberRequest.path, {
      method: memberRequest.method,
      body: JSON.stringify(memberRequest.body),
    });

    const checkoutRequest = buildOpenBarreCheckoutRequestForLocation({
      memberId: created.memberId,
      homeLocationId: data.homeLocationId,
    });

    await momenceFetch(checkoutRequest.path, {
      method: "POST",
      body: JSON.stringify(checkoutRequest.body),
    });

    const lead = await captureLead({
      firstName: memberRequest.body.firstName,
      lastName: memberRequest.body.lastName,
      email: data.email,
      phoneE164,
      center: LOCATIONS.find((l) => l.id === data.homeLocationId)?.name ?? "Physique 57 India",
      waiverAccepted: true,
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
      classType: data.classType,
      memberId: created.memberId,
      stage: "completed",
    });

    return {
      memberId: created.memberId,
      openBarreAssigned: true,
      leadCaptured: lead.ok,
      leadError: lead.error ?? null,
    };
  });

// Fires as soon as a visitor has entered contact details but before they finish
// the waiver/booking steps, so an abandoned form still reaches respond.io for
// follow-up instead of vanishing with zero trace.
export const captureLeadPartial = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PartialLeadInput.parse(input))
  .handler(async ({ data }) => {
    const phoneE164 = `${data.countryCode}${data.phoneNumber.replace(/[^0-9]/g, "")}`;
    const center = data.homeLocationId
      ? (LOCATIONS.find((l) => l.id === data.homeLocationId)?.name ?? "Physique 57 India")
      : "Physique 57 India";

    const lead = await captureLead({
      firstName: data.firstName,
      lastName: data.lastName ?? "",
      email: data.email,
      phoneE164,
      center,
      waiverAccepted: false,
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
      classType: data.classType,
      stage: "partial",
    });

    return { leadCaptured: lead.ok, leadError: lead.error ?? null };
  });

// Kept for backwards compatibility; the classes page now uses the Momence widget.
const ListSessionsInput = z.object({
  locationId: z.number().int().positive(),
});

type HostSession = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  durationInMinutes: number;
  capacity: number | null;
  bookingCount: number;
  isCancelled: boolean;
  teacher?: { firstName?: string; lastName?: string } | null;
  inPersonLocation?: { name?: string } | null;
  bannerImageUrl?: string | null;
};

export const listUpcomingSessions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListSessionsInput.parse(input))
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      page: "0",
      pageSize: "50",
      sortBy: "startsAt",
      sortOrder: "ASC",
      locationId: String(data.locationId),
      startAfter: new Date().toISOString(),
    });
    const res = await momenceFetch<{ payload: HostSession[] }>(
      `/host/sessions?${params.toString()}`,
    );
    return { sessions: res.payload.filter((s) => !s.isCancelled) };
  });

const BookInput = z.object({
  sessionId: z.number().int().positive(),
  memberId: z.number().int().positive(),
});

export const bookSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BookInput.parse(input))
  .handler(async ({ data }) => {
    throw new Error(
      `Direct free session booking is disabled. Book member ${data.memberId} into session ${data.sessionId} through bookWithMembership instead.`,
    );
  });
