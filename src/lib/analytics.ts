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

function fbqEvent(name: string, params?: EventParams) {
  getWindow()?.fbq?.("track", name, params);
}

export function trackSignupStart(params?: EventParams) {
  gtagEvent("generate_lead", params);
  fbqEvent("Lead", params);
}

export function trackWaiverSigned(params?: EventParams) {
  gtagEvent("waiver_signed", params);
}

export function trackBookingComplete(params?: EventParams) {
  gtagEvent("sign_up", params);
  fbqEvent("CompleteRegistration", params);
}
