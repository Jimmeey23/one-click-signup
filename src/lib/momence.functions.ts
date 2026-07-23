import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { momenceDashboardFetch, momenceFetch, MOMENCE_HOST_ID, LOCATIONS } from "./momence.server";
import {
  buildMembershipCheckoutRequest,
  OPEN_BARRE_MEMBERSHIP_ID,
} from "./momence-booking.helpers";
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
  // Tracking
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
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
  // Tracking
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
});

type RespondAttempt = {
  path: string;
  method?: "POST" | "PUT";
  body: Record<string, unknown>;
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

function readContactId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const direct = record.id ?? record.contactId;
  if (typeof direct === "string" || typeof direct === "number") return String(direct);

  const contact = record.contact;
  if (contact && typeof contact === "object") {
    const nested = (contact as Record<string, unknown>).id;
    if (typeof nested === "string" || typeof nested === "number") return String(nested);
  }

  const data = record.data;
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).id;
    if (typeof nested === "string" || typeof nested === "number") return String(nested);
  }

  return null;
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
  const channelId = process.env.RESPONDIO_CHANNEL_ID?.trim();

  const contactAttempts: RespondAttempt[] = [
    {
      path: "/contact",
      body: {
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phoneE164,
        phoneNumber: payload.phoneE164,
        type: "phone",
      },
    },
    {
      path: "/contact/phone",
      body: {
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phoneE164,
        phoneNumber: payload.phoneE164,
        type: "phone",
      },
    },
  ];

  let contactId: string | null = null;
  let lastContactError = "";

  for (const attempt of contactAttempts) {
    try {
      const response = await callRespondIo(baseUrl, apiKey, attempt);
      if (response.ok) {
        contactId = readContactId(response.data);
        if (contactId) break;
      } else {
        lastContactError = `${attempt.path} -> ${response.status} ${response.text}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Respond.io error";
      lastContactError = `${attempt.path} -> ${message}`;
    }
  }

  if (!contactId) {
    console.error("Respond.io contact creation failed", lastContactError);
    return;
  }

  const conversationAttempts: RespondAttempt[] = [
    {
      path: "/conversation",
      body: {
        contactId,
        ...(channelId ? { channelId: Number(channelId) } : {}),
      },
    },
    {
      path: `/contact/${contactId}/conversation`,
      body: {
        ...(channelId ? { channelId: Number(channelId) } : {}),
      },
    },
    {
      path: `/contact/${contactId}/openConversation`,
      body: {
        ...(channelId ? { channelId: Number(channelId) } : {}),
      },
    },
  ];

  let conversationOpened = false;
  let lastConversationError = "";

  for (const attempt of conversationAttempts) {
    try {
      const response = await callRespondIo(baseUrl, apiKey, attempt);
      if (response.ok) {
        conversationOpened = true;
        break;
      }
      lastConversationError = `${attempt.path} -> ${response.status} ${response.text}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Respond.io error";
      lastConversationError = `${attempt.path} -> ${message}`;
    }
  }

  if (!conversationOpened) {
    console.error("Respond.io conversation open failed", lastConversationError);
  }
}

async function captureLead(payload: LeadCapturePayload): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.MOMENCE_API_TOKEN;
  if (!token) {
    console.warn("MOMENCE_API_TOKEN not set - skipping lead capture");
    return { ok: false, error: "Lead webhook token not configured" };
  }
  try {
    const leadBody = {
      token,
      sourceId: "8082",
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phoneNumber: payload.phoneE164,
      time: "Flexible / Needs Recommendation",
      center: payload.center,
      type: "Barre 57",
      waiverAccepted: payload.waiverAccepted ? "accepted" : "declined",
      event_id: `signup_${payload.memberId}_${Date.now()}`,
      utm_source: payload.utmSource ?? "website",
      utm_medium: payload.utmMedium ?? "trial-landing",
      utm_campaign: payload.utmCampaign ?? "open-barre-trial",
      landing_page: payload.landingPage ?? "https://trial.physique57india.com/",
      referrer: payload.referrer ?? "",
    };

    const res = await fetch("https://api.momence.com/integrations/customer-leads/13752/collect", {
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
  enrollOpenBarre: async (request) => {
    await momenceFetch(request.path, {
      method: "POST",
      body: JSON.stringify(request.body),
    });
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

    const checkoutRequest = buildMembershipCheckoutRequest({
      memberId: created.memberId,
      homeLocationId: data.homeLocationId,
      membershipId: OPEN_BARRE_MEMBERSHIP_ID,
      attemptedPriceInCurrency: "0",
      paymentMethodType: "free",
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
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      referrer: data.referrer,
      landingPage: data.landingPage,
      memberId: created.memberId,
    });

    return {
      memberId: created.memberId,
      openBarreAssigned: true,
      leadCaptured: lead.ok,
      leadError: lead.error ?? null,
    };
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
