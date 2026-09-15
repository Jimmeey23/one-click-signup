export type ShareableRoutePayload = {
  eventName: string;
  eventDate: string;
  eventTime: string;
  instructorName: string;
  classType: string;
  studio: string;
  studioVariant: "mumbai" | "bengaluru";
  homeLocationId: number;
  paymentType: "paid" | "free";
  sessionLink: string;
  isKids: boolean;
  /** Momence session the signup is booked into. 0 means "no class booked by the route". */
  sessionId: number;
  sessionLabel: string;
  /** Momence membership the new member is put on. 0 falls back to the studio default. */
  membershipId: number;
  membershipLabel: string;
  includeKidsConsent: boolean;
  includeWaiver: boolean;
  leadSource: string;
  sourceId: string;
  tags: string[];
  utmSource: string;
  utmCampaign: string;
  otherDetails: string;
  heroImagePreset: string;
  heroImageUrl: string;
};

const ENCODED_ROUTE_PREFIX = "p57";

function base64UrlEncode(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  return window
    .btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  if (typeof window === "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  return decodeURIComponent(escape(window.atob(padded)));
}

export function encodeShareableRoutePayload(payload: ShareableRoutePayload) {
  return `${ENCODED_ROUTE_PREFIX}.${base64UrlEncode(JSON.stringify(payload))}`;
}

export function decodeShareableRoutePayload(encoded: string): ShareableRoutePayload | null {
  const raw = String(encoded || "");
  const token = raw.startsWith(`${ENCODED_ROUTE_PREFIX}.`)
    ? raw.slice(ENCODED_ROUTE_PREFIX.length + 1)
    : raw;

  try {
    const parsed = JSON.parse(base64UrlDecode(token)) as Partial<ShareableRoutePayload>;
    return {
      eventName: String(parsed.eventName || "").trim(),
      eventDate: String(parsed.eventDate || "").trim(),
      eventTime: String(parsed.eventTime || "").trim(),
      instructorName: String(parsed.instructorName || "").trim(),
      classType: String(parsed.classType || "").trim(),
      studio: String(parsed.studio || "").trim(),
      studioVariant: parsed.studioVariant === "bengaluru" ? "bengaluru" : "mumbai",
      homeLocationId: Number.isFinite(Number(parsed.homeLocationId))
        ? Number(parsed.homeLocationId)
        : 0,
      paymentType: parsed.paymentType === "free" ? "free" : "paid",
      sessionLink: String(parsed.sessionLink || "").trim(),
      isKids: Boolean(parsed.isKids),
      sessionId: Number.isFinite(Number(parsed.sessionId)) ? Number(parsed.sessionId) : 0,
      sessionLabel: String(parsed.sessionLabel || "").trim(),
      membershipId: Number.isFinite(Number(parsed.membershipId)) ? Number(parsed.membershipId) : 0,
      membershipLabel: String(parsed.membershipLabel || "").trim(),
      includeKidsConsent: Boolean(parsed.includeKidsConsent),
      includeWaiver: Boolean(parsed.includeWaiver),
      leadSource: String(parsed.leadSource || "").trim(),
      sourceId: String(parsed.sourceId || "").trim(),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      utmSource: String(parsed.utmSource || "").trim(),
      utmCampaign: String(parsed.utmCampaign || "").trim(),
      otherDetails: String(parsed.otherDetails || "").trim(),
      heroImagePreset: String(parsed.heroImagePreset || "").trim(),
      heroImageUrl: String(parsed.heroImageUrl || "").trim(),
    };
  } catch {
    return null;
  }
}

export function buildShareableRouteUrl(payload: ShareableRoutePayload) {
  return `/signup/${encodeShareableRoutePayload(payload)}`;
}
