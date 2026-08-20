// Server-only: logs into the Momence dashboard (email + password + TOTP MFA) and
// caches the resulting session cookie in-memory, refreshing it automatically when
// missing or expired instead of relying on a manually pasted MOMENCE_ALL_COOKIES value.
import { requireServerEnv } from "./momence.server";

const LOGIN_URL = "https://api.momence.com/auth/login";
const MFA_URL = "https://api.momence.com/auth/mfa/totp/verify";
const COOKIE_TTL_MS = 20 * 60 * 60 * 1000; // refresh well before typical session expiry

let cachedCookies: { value: string; fetchedAt: number } | null = null;
let refreshInFlight: Promise<string> | null = null;

export function resetMomenceCookiesCacheForTests(): void {
  cachedCookies = null;
  refreshInFlight = null;
}

export function base32Decode(secret: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = secret.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export async function generateTotp(
  secret: string,
  timeStepSeconds = 30,
  digits = 6,
  nowMs = Date.now(),
): Promise<string> {
  const { createHmac } = await import("node:crypto");
  const key = base32Decode(secret);
  const counter = Math.floor(nowMs / 1000 / timeStepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuffer.writeUInt32BE(counter % 2 ** 32, 4);

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 10 ** digits).padStart(digits, "0");
}

function normalizeSetCookie(setCookie: string[] | string | null): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const seen = new Set<string>();
  const pairs: string[] = [];
  for (const raw of cookies) {
    const nameValue = raw.split(";")[0]?.trim();
    if (!nameValue) continue;
    const name = nameValue.split("=")[0];
    if (seen.has(name)) continue;
    seen.add(name);
    pairs.push(nameValue);
  }
  return pairs.join("; ");
}

async function loginAndFetchCookies(): Promise<string> {
  const email = await requireServerEnv("MOMENCE_LOGIN_EMAIL");
  const password = await requireServerEnv("MOMENCE_LOGIN_PASSWORD");
  const totpSecret = await requireServerEnv("MOMENCE_TOTP_SECRET");

  const deviceData = {
    browser:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    screen: { width: 1470, height: 956 },
  };

  const loginRes = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, deviceData }),
  });
  if (!loginRes.ok) {
    throw new Error(`Momence login failed (${loginRes.status}): ${await loginRes.text()}`);
  }
  const loginCookies = loginRes.headers.getSetCookie?.() ?? [];

  const MAX_ATTEMPTS = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const otp = await generateTotp(totpSecret);
    try {
      const mfaRes = await fetch(MFA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Cookie: normalizeSetCookie(loginCookies),
        },
        body: JSON.stringify({ token: otp, deviceData, trustDevice: true }),
      });
      if (!mfaRes.ok) {
        lastError = new Error(`Momence MFA failed (${mfaRes.status}): ${await mfaRes.text()}`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          continue;
        }
        throw lastError;
      }
      const mfaCookies = mfaRes.headers.getSetCookie?.() ?? [];
      const cookieString = normalizeSetCookie([...loginCookies, ...mfaCookies]);
      if (!cookieString) {
        throw new Error("Momence MFA succeeded but returned no session cookies.");
      }
      return cookieString;
    } catch (e) {
      lastError = e;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Momence MFA login failed");
}

export async function getMomenceCookies(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedCookies && Date.now() - cachedCookies.fetchedAt < COOKIE_TTL_MS) {
    return cachedCookies.value;
  }
  if (!refreshInFlight) {
    refreshInFlight = loginAndFetchCookies()
      .then((value) => {
        cachedCookies = { value, fetchedAt: Date.now() };
        return value;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}
