// Server-only Momence API clients (token cached in-memory per worker)
const BASE = "https://api.momence.com/api/v2";
const DASHBOARD_BASE = "https://momence.com/_api/primary";
export const MOMENCE_HOST_ID = 13752;

type TokenCache = { accessToken: string; expiresAt: number } | null;
let cached: TokenCache = null;
let localEnvCache: Record<string, string> | null | undefined;

async function readLocalEnv(): Promise<Record<string, string> | null> {
  if (localEnvCache !== undefined) return localEnvCache;

  try {
    const [{ readFile }, { resolve }] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);
    const values: Record<string, string> = {};
    const home = process.env.HOME;
    const envPaths = [
      resolve(process.cwd(), ".env"),
      ...(home
        ? [resolve(home, ".env"), resolve(home, "Manual Library/Developer/Momence Login/.env")]
        : []),
    ];

    for (const envPath of envPaths) {
      let text = "";
      try {
        text = await readFile(envPath, "utf8");
      } catch {
        continue;
      }
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const [rawKey, ...rawValueParts] = line.split("=");
        const key = rawKey.trim();
        const value = rawValueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
        values[key] ??= value;
      }
    }
    localEnvCache = values;
  } catch {
    localEnvCache = null;
  }

  return localEnvCache;
}

export async function requireServerEnv(name: string): Promise<string> {
  const value = process.env[name]?.trim() ?? (await readLocalEnv())?.[name]?.trim();
  if (!value) {
    throw new Error(`Missing server environment variable: ${name}`);
  }
  return value;
}

export async function getMomenceToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.accessToken;

  const clientId = await requireServerEnv("MOMENCE_CLIENT_ID");
  const clientSecret = await requireServerEnv("MOMENCE_CLIENT_SECRET");
  const username = await requireServerEnv("MOMENCE_USERNAME");
  const password = await requireServerEnv("MOMENCE_PASSWORD");

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
    let type = "unknown_error";
    try {
      const data = (await res.json()) as { type?: string; error?: string };
      type = data.type ?? data.error ?? type;
    } catch {
      // Keep auth failures concise; do not echo provider response bodies.
    }
    throw new Error(`Momence auth failed (${res.status}): ${type}`);
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

export async function momenceFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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

function getCookieValue(cookies: string, name: string): string | undefined {
  return cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function momenceDashboardFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookies = await requireServerEnv("MOMENCE_ALL_COOKIES");
  const csrfToken = getCookieValue(cookies, "csrf_token");
  const res = await fetch(`${DASHBOARD_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Cookie: cookies,
      Origin: "https://momence.com",
      "X-App": "dashboard",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Momence dashboard ${path} ${res.status}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export {
  NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
  OPEN_BARRE_MEMBERSHIP_ID,
} from "./momence-booking.helpers";

export const LOCATIONS = [
  { id: 9030, name: "Kwality House, Kemps Corner" },
  { id: 29821, name: "Supreme HQ, Bandra" },
] as const;
