// Server-only Momence API client (token cached in-memory per worker)
const BASE = "https://api.momence.com/api/v2";

type TokenCache = { accessToken: string; expiresAt: number } | null;
let cached: TokenCache = null;

export async function getMomenceToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.accessToken;

  const clientId = process.env.MOMENCE_CLIENT_ID!;
  const clientSecret = process.env.MOMENCE_CLIENT_SECRET!;
  const username = process.env.MOMENCE_USERNAME!;
  const password = process.env.MOMENCE_PASSWORD!;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
    scope: "public-api-v2",
  });

  const res = await fetch(`${BASE}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basic}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Momence auth failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    accessToken?: string;
    access_token?: string;
    accessTokenExpiresAt?: string;
  };
  const token = data.accessToken ?? data.access_token!;
  const exp = data.accessTokenExpiresAt
    ? new Date(data.accessTokenExpiresAt).getTime()
    : Date.now() + 30 * 60_000;
  cached = { accessToken: token, expiresAt: exp };
  return token;
}

export async function momenceFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getMomenceToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Momence ${path} ${res.status}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const OPEN_BARRE_MEMBERSHIP_ID = 33609;
export const LOCATIONS = [
  { id: 9030, name: "Kwality House, Kemps Corner" },
  { id: 29821, name: "Supreme HQ, Bandra" },
] as const;
