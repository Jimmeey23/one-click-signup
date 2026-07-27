export type StoredAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
};

export function parseAttributionFromSearch(
  search: string,
): Omit<StoredAttribution, "referrer" | "landingPage"> {
  const params = new URLSearchParams(search);
  const attribution: Omit<StoredAttribution, "referrer" | "landingPage"> = {};
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmTerm = params.get("utm_term");
  const utmContent = params.get("utm_content");
  const gclid = params.get("gclid");
  const fbclid = params.get("fbclid");
  if (utmSource) attribution.utmSource = utmSource;
  if (utmMedium) attribution.utmMedium = utmMedium;
  if (utmCampaign) attribution.utmCampaign = utmCampaign;
  if (utmTerm) attribution.utmTerm = utmTerm;
  if (utmContent) attribution.utmContent = utmContent;
  if (gclid) attribution.gclid = gclid;
  if (fbclid) attribution.fbclid = fbclid;
  return attribution;
}
