import { isIP } from "node:net";

export type MetaRequestContext = {
  ip?: string;
  userAgent?: string;
  url?: string;
  countryIso?: string;
  city?: string;
  state?: string;
  postcode?: string;
};

function firstValidIp(value: string | null): string | undefined {
  if (!value) return undefined;
  for (const raw of value.split(",")) {
    const candidate = raw.trim().replace(/^\[([^\]]+)\](?::\d+)?$/, "$1");
    if (isIP(candidate)) return candidate;
  }
  return undefined;
}

function decodedHeader(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value).trim() || undefined;
  } catch {
    return value.trim() || undefined;
  }
}

// Vercel documents x-vercel-forwarded-for as the protected copy of the public client IP.
// It can contain either IPv4 or IPv6. Preserve the address family the edge received;
// synthesizing an IPv6 address from an IPv4 address would give Meta incorrect identity data.
export function metaRequestContext(headers: Headers): MetaRequestContext {
  const ip =
    firstValidIp(headers.get("x-vercel-forwarded-for")) ??
    firstValidIp(headers.get("x-forwarded-for")) ??
    firstValidIp(headers.get("x-real-ip"));

  return {
    ip,
    userAgent: headers.get("user-agent") ?? undefined,
    url: headers.get("referer") ?? undefined,
    countryIso: decodedHeader(headers.get("x-vercel-ip-country")),
    city: decodedHeader(headers.get("x-vercel-ip-city")),
    state: decodedHeader(headers.get("x-vercel-ip-country-region")),
    postcode: decodedHeader(headers.get("x-vercel-ip-postal-code")),
  };
}
