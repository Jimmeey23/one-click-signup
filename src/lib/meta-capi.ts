// Server-only: sends events to the Meta Conversions API so Lead / CompleteRegistration
// still reach Meta when the browser pixel is blocked (iOS, ad-blockers, ITP). Uses the
// same VITE_META_PIXEL_ID as the browser pixel plus a server-only access token so both
// paths report to the same pixel and can be deduped via a shared event_id.
import { createHash } from "node:crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizedPhoneHash(phoneE164: string): string {
  return sha256(phoneE164.replace(/[^0-9]/g, ""));
}

export type MetaCapiUserData = {
  email?: string;
  phoneE164?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string | number;
  countryIso?: string;
  city?: string;
  state?: string;
  postcode?: string;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
};

export type MetaCapiEventInput = {
  eventName: "Lead" | "CompleteRegistration";
  eventId: string;
  eventSourceUrl?: string;
  user: MetaCapiUserData;
  value?: number;
  currency?: string;
  contentName?: string;
  contentCategory?: string;
};

export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<void> {
  const pixelId = process.env.VITE_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) {
    console.warn(
      "Meta CAPI not configured (VITE_META_PIXEL_ID / META_CONVERSIONS_API_ACCESS_TOKEN) - skipping",
    );
    return;
  }

  const { user } = input;
  const userData: Record<string, unknown> = {};
  if (user.email) userData.em = [sha256(user.email)];
  if (user.phoneE164) userData.ph = [normalizedPhoneHash(user.phoneE164)];
  if (user.firstName) userData.fn = [sha256(user.firstName)];
  if (user.lastName) userData.ln = [sha256(user.lastName)];
  if (user.externalId !== undefined) userData.external_id = [sha256(String(user.externalId))];
  if (user.countryIso) userData.country = [sha256(user.countryIso)];
  if (user.city) userData.ct = [sha256(user.city.replace(/[^A-Za-z]/g, ""))];
  if (user.state) userData.st = [sha256(user.state.replace(/[^A-Za-z]/g, ""))];
  if (user.postcode) userData.zp = [sha256(user.postcode.replace(/\s/g, ""))];
  if (user.fbp) userData.fbp = user.fbp;
  if (user.fbc) userData.fbc = user.fbc;
  if (user.clientIpAddress) userData.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) userData.client_user_agent = user.clientUserAgent;

  // Meta's diagnostics flag value+currency as missing when value is 0 or absent, so both
  // always go out with a nonzero placeholder unless the caller supplies a real amount.
  const customData: Record<string, unknown> = {
    value: input.value && input.value > 0 ? input.value : 1,
    currency: input.currency?.trim() || "INR",
  };
  if (input.contentName) customData.content_name = input.contentName;
  if (input.contentCategory) customData.content_category = input.contentCategory;

  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("Meta CAPI event failed", res.status, text);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta CAPI request failed";
    console.error("Meta CAPI event failed", message);
  }
}
