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
  countryIso?: string;
  city?: string;
  state?: string;
  postcode?: string;
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
  // Meta wants the 2-letter ISO code lowercased. This is the country the member picked
  // for their phone number, not a guess from the studio address.
  if (user.countryIso) matchData.country = user.countryIso.trim().toLowerCase();
  // Meta strips punctuation and spaces from ct / st itself, but wants them lowercased.
  if (user.city)
    matchData.ct = user.city
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  if (user.state)
    matchData.st = user.state
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  if (user.postcode) matchData.zp = user.postcode.trim().toLowerCase().replace(/\s/g, "");
  if (Object.keys(matchData).length === 0) return;
  win.fbq("init", pixelId, matchData);
}

// Meta requires the fbclid to reach fbc byte-for-byte as it appeared in the URL.
// URLSearchParams.get() percent-decodes, so an fbclid containing %xx would be altered.
// Pull the raw substring out of the query string instead.
export function readRawFbclid(search: string): string | undefined {
  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const pair of query.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    if (pair.slice(0, eq) !== "fbclid") continue;
    const value = pair.slice(eq + 1);
    return value || undefined;
  }
  return undefined;
}

// fb.<subdomain index>.<creation time ms>.<fbclid>, with the fbclid segment unmodified.
const FBC_PATTERN = /^fb\.\d+\.\d+\..+$/;

// Payload check before the value goes to Meta: right shape, and the fbclid tail still
// matches the click id we were given.
export function validateFbc(fbc: string | undefined, fbclid?: string): boolean {
  if (!fbc) return false;
  if (!FBC_PATTERN.test(fbc)) return false;
  if (!fbclid) return true;
  return fbc.slice(fbc.indexOf(".", fbc.indexOf(".", 3) + 1) + 1) === fbclid;
}

// _fbc only gets set by the pixel once fbevents.js has loaded and run - on a fast
// conversion (or with the pixel blocked) the cookie can still be missing even though
// the fbclid is right there in the URL/stored attribution. Meta's own documented format
// for synthesizing it is fb.1.<creation time ms>.<fbclid>, so fall back to building one
// from fbclid when the cookie isn't there yet. Either way the fbclid is passed through
// verbatim - never trimmed, decoded, lowercased or re-encoded.
export function readMetaCookies(fbclid?: string): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const cookies = document.cookie.split("; ").reduce<Record<string, string>>((acc, pair) => {
    const [key, ...rest] = pair.split("=");
    if (key) acc[key] = rest.join("=");
    return acc;
  }, {});
  const candidate = cookies._fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
  // A cookie written by something else (or a malformed synthesized value) is worse than
  // no fbc at all - Meta drops the whole user_data block on a bad one.
  const fbc = validateFbc(candidate, cookies._fbc ? undefined : fbclid) ? candidate : undefined;
  return { fbp: cookies._fbp || undefined, fbc };
}

// Meta's event diagnostics report value+currency as "missing" when value is 0, so Lead
// and CompleteRegistration carry a nonzero placeholder rather than a real price - these
// events are not revenue. value/currency come last so a caller's params can't drop them.
export const META_PLACEHOLDER_VALUE = 1;
export const META_CURRENCY = "INR";

export function trackSignupStart(params?: EventParams, eventId?: string) {
  gtagEvent("generate_lead", params);
  fbqEvent("Lead", { ...params, value: META_PLACEHOLDER_VALUE, currency: META_CURRENCY }, eventId);
}

export function trackWaiverSigned(params?: EventParams) {
  gtagEvent("waiver_signed", params);
}

export function trackBookingComplete(params?: EventParams, eventId?: string) {
  gtagEvent("sign_up", params);
  fbqEvent(
    "CompleteRegistration",
    { ...params, value: META_PLACEHOLDER_VALUE, currency: META_CURRENCY },
    eventId,
  );
}
