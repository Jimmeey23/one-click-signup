// Fires GA4 and Meta Pixel events for the signup funnel. No-ops if the scripts
// (see routes/__root.tsx) never loaded because VITE_GA_MEASUREMENT_ID /
// VITE_META_PIXEL_ID aren't configured.

type EventParams = Record<string, unknown>;

type WindowWithTrackers = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

function getWindow(): WindowWithTrackers | undefined {
  return typeof window === "undefined" ? undefined : (window as WindowWithTrackers);
}

function gtagEvent(name: string, params?: EventParams) {
  getWindow()?.gtag?.("event", name, params);
}

function fbqEvent(name: string, params?: EventParams, eventId?: string) {
  const fbq = getWindow()?.fbq;
  if (!fbq) return;
  if (eventId) {
    fbq("track", name, params, { eventID: eventId });
  } else {
    fbq("track", name, params);
  }
}

// Re-initializing with user data lets the pixel hash + attach it as advanced matching,
// improving Meta's match rate without changing what fbq('track', ...) sends per event.
// Safe to call repeatedly - Meta merges each call's fields into the pixel's match data.
export function setMetaAdvancedMatching(user: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
}) {
  const win = getWindow();
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!win?.fbq || !pixelId) return;
  const matchData: Record<string, string> = {};
  if (user.email) matchData.em = user.email.trim().toLowerCase();
  if (user.phone) matchData.ph = user.phone.replace(/[^0-9]/g, "");
  if (user.firstName) matchData.fn = user.firstName.trim().toLowerCase();
  if (user.lastName) matchData.ln = user.lastName.trim().toLowerCase();
  if (user.externalId) matchData.external_id = user.externalId;
  if (Object.keys(matchData).length === 0) return;
  win.fbq("init", pixelId, matchData);
}

// _fbc only gets set by the pixel once fbevents.js has loaded and run - on a fast
// conversion (or with the pixel blocked) the cookie can still be missing even though
// the fbclid is right there in the URL/stored attribution. Meta's own documented format
// for synthesizing it is fb.1.<creation time ms>.<fbclid>, so fall back to building one
// from fbclid when the cookie isn't there yet.
export function readMetaCookies(fbclid?: string): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const cookies = document.cookie.split("; ").reduce<Record<string, string>>((acc, pair) => {
    const [key, ...rest] = pair.split("=");
    if (key) acc[key] = rest.join("=");
    return acc;
  }, {});
  const fbc = cookies._fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
  return { fbp: cookies._fbp || undefined, fbc };
}

export function trackSignupStart(params?: EventParams, eventId?: string) {
  gtagEvent("generate_lead", params);
  fbqEvent("Lead", { value: 0, currency: "INR", ...params }, eventId);
}

export function trackWaiverSigned(params?: EventParams) {
  gtagEvent("waiver_signed", params);
}

export function trackBookingComplete(params?: EventParams, eventId?: string) {
  gtagEvent("sign_up", params);
  fbqEvent("CompleteRegistration", { value: 0, currency: "INR", ...params }, eventId);
}
