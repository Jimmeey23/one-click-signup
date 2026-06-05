import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  momenceDashboardFetch,
  momenceFetch,
  MOMENCE_HOST_ID,
  OPEN_BARRE_MEMBERSHIP_ID,
  LOCATIONS,
} from "./momence.server";
import { buildHostMemberCreateRequest } from "./momence-member.helpers";
import {
  buildDashboardPublicWaiverSignRequests,
  type DashboardWaiver,
} from "./momence-waivers.helpers";

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

async function captureLead(payload: {
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
}): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.MOMENCE_API_TOKEN;
  if (!token) {
    console.warn("MOMENCE_API_TOKEN not set — skipping lead capture");
    return { ok: false, error: "Lead webhook token not configured" };
  }
  try {
    const res = await fetch("https://api.momence.com/integrations/customer-leads/13752/collect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
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
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Lead capture failed:", res.status, t);
      return { ok: false, error: `Lead capture ${res.status}` };
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

export const signupAndEnroll = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SignupInput.parse(input))
  .handler(async ({ data }) => {
    const phoneE164 = `${data.countryCode}${data.phoneNumber.replace(/[^0-9]/g, "")}`;
    const center = LOCATIONS.find((l) => l.id === data.homeLocationId)?.name ?? "Physique 57 India";
    const signatureRealSignature = data.signatureRealSignature?.trim();
    if (!signatureRealSignature) {
      throw new Error("Please sign the waiver before submitting it.");
    }

    // 1. Create member
    const createMemberRequest = buildHostMemberCreateRequest({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: phoneE164,
      homeLocationId: data.homeLocationId,
    });
    const created = await momenceFetch<{ memberId: number }>(createMemberRequest.path, {
      method: createMemberRequest.method,
      body: JSON.stringify(createMemberRequest.body),
    });

    // 2. Record required waiver/policy consent in Momence before granting access.
    let signed = 0;
    let availableWaivers = 0;
    try {
      const consent = await signMemberWaivers({
        memberId: created.memberId,
        realSignature: signatureRealSignature,
      });
      signed = consent.signedCount;
      availableWaivers = consent.availableCount;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Waiver consent failed";
      console.error("Waiver consent failed:", msg);
      throw new Error(
        "Waiver and policy consent could not be recorded in Momence. Please contact the studio team before booking.",
      );
    }

    // 3. Enroll into Open Barre (free)
    let enrolled = false;
    let enrollError: string | null = null;
    try {
      await momenceFetch("/host/checkout", {
        method: "POST",
        body: JSON.stringify({
          memberId: created.memberId,
          homeLocationId: data.homeLocationId,
          items: [
            {
              id: "1",
              type: "subscription",
              membershipId: OPEN_BARRE_MEMBERSHIP_ID,
              attemptedPriceInCurrency: "0",
            },
          ],
          paymentMethods: [{ id: "1", type: "free" }],
        }),
      });
      enrolled = true;
    } catch (e) {
      enrollError = e instanceof Error ? e.message : "Enrollment failed";
      console.error("Membership enrollment failed:", enrollError);
    }

    // 4. Capture lead in Momence CRM webhook
    const lead = await captureLead({
      firstName: createMemberRequest.body.firstName,
      lastName: createMemberRequest.body.lastName,
      email: data.email,
      phoneE164,
      center,
      waiverAccepted: data.waiverAccepted,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      referrer: data.referrer,
      landingPage: data.landingPage,
      memberId: created.memberId,
    });

    return {
      memberId: created.memberId,
      homeLocationId: data.homeLocationId,
      enrolled,
      enrollError,
      signedCount: signed,
      availableWaivers,
      leadCaptured: lead.ok,
      leadError: lead.error,
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
