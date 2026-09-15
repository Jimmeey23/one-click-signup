export type ShareableRoutePayload = {
  eventName: string
  eventDate: string
  eventTime: string
  instructorName: string
  classType: string
  studio: string
  paymentType: "paid" | "free"
  sessionLink: string
  isKids: boolean
  includeKidsConsent: boolean
  includeWaiver: boolean
  leadSource: string
  sourceId: string
  tags: string[]
  utmSource: string
  utmCampaign: string
  otherDetails: string
  heroImageMode: "preset" | "upload"
  heroImagePreset: string
  heroImageUrl: string
}

const ENCODED_ROUTE_PREFIX = "p57"

function base64UrlEncode(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64url")
  }

  return window.btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)

  if (typeof window === "undefined") {
    return Buffer.from(padded, "base64").toString("utf8")
  }

  return decodeURIComponent(escape(window.atob(padded)))
}

export function encodeShareableRoutePayload(payload: ShareableRoutePayload) {
  return `${ENCODED_ROUTE_PREFIX}.${base64UrlEncode(JSON.stringify(payload))}`
}

export function decodeShareableRoutePayload(encoded: string): ShareableRoutePayload | null {
  const raw = String(encoded || "")
  const token = raw.startsWith(`${ENCODED_ROUTE_PREFIX}.`) ? raw.slice(ENCODED_ROUTE_PREFIX.length + 1) : raw

  try {
    const parsed = JSON.parse(base64UrlDecode(token)) as Partial<ShareableRoutePayload>
    return {
      eventName: String(parsed.eventName || "").trim(),
      eventDate: String(parsed.eventDate || "").trim(),
      eventTime: String(parsed.eventTime || "").trim(),
      instructorName: String(parsed.instructorName || "").trim(),
      classType: String(parsed.classType || "").trim(),
      studio: String(parsed.studio || "").trim(),
      paymentType: parsed.paymentType === "free" ? "free" : "paid",
      sessionLink: String(parsed.sessionLink || "").trim(),
      isKids: Boolean(parsed.isKids),
      includeKidsConsent: Boolean(parsed.includeKidsConsent),
      includeWaiver: Boolean(parsed.includeWaiver),
      leadSource: String(parsed.leadSource || "").trim(),
      sourceId: String(parsed.sourceId || "").trim(),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      utmSource: String(parsed.utmSource || "").trim(),
      utmCampaign: String(parsed.utmCampaign || "").trim(),
      otherDetails: String(parsed.otherDetails || "").trim(),
      heroImageMode: parsed.heroImageMode === "upload" ? "upload" : "preset",
      heroImagePreset: String(parsed.heroImagePreset || "").trim(),
      heroImageUrl: String(parsed.heroImageUrl || "").trim(),
    }
  } catch {
    return null
  }
}

export function buildShareableRouteUrl(payload: ShareableRoutePayload) {
  return `/signup/${encodeShareableRoutePayload(payload)}`
}
