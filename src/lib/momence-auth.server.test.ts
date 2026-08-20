import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  generateTotp,
  base32Decode,
  getMomenceCookies,
  resetMomenceCookiesCacheForTests,
} from "./momence-auth.server.ts";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = { ...process.env };

function setLoginEnv() {
  process.env.MOMENCE_LOGIN_EMAIL = "test@example.com";
  process.env.MOMENCE_LOGIN_PASSWORD = "secret";
  process.env.MOMENCE_TOTP_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
}

function fakeResponse({
  ok,
  status,
  body,
  setCookies,
}: {
  ok: boolean;
  status: number;
  body: unknown;
  setCookies: string[];
}) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body),
    headers: { getSetCookie: () => setCookies },
  } as unknown as Response;
}

describe("Momence TOTP generation", () => {
  it("matches the RFC 6238 SHA1 test vector at T=59s", async () => {
    // RFC 6238 Appendix B: ASCII secret "12345678901234567890" base32-encoded,
    // T=59 seconds produces the 8-digit code 94287082; we truncate to 6 digits.
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const code = await generateTotp(secret, 30, 6, 59_000);
    assert.equal(code, "287082");
  });

  it("decodes base32 secrets into raw key bytes", () => {
    const decoded = base32Decode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    assert.equal(decoded.toString("ascii"), "12345678901234567890");
  });
});

describe("getMomenceCookies", () => {
  beforeEach(() => {
    resetMomenceCookiesCacheForTests();
    setLoginEnv();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    process.env = { ...ORIGINAL_ENV };
    resetMomenceCookiesCacheForTests();
  });

  it("logs in, verifies MFA, and returns a merged session cookie string", async () => {
    const calls: string[] = [];
    globalThis.fetch = (async (url: string) => {
      calls.push(String(url));
      if (String(url).includes("/auth/login")) {
        return fakeResponse({ ok: true, status: 200, body: {}, setCookies: ["ribbon.connect.sid=abc; Path=/"] });
      }
      if (String(url).includes("/auth/mfa/totp/verify")) {
        return fakeResponse({ ok: true, status: 200, body: {}, setCookies: ["csrf_token=xyz; Path=/"] });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const cookies = await getMomenceCookies();
    assert.equal(cookies, "ribbon.connect.sid=abc; csrf_token=xyz");
    assert.equal(calls.length, 2);
  });

  it("caches the cookie string and does not re-login on a second call", async () => {
    let loginCalls = 0;
    globalThis.fetch = (async (url: string) => {
      if (String(url).includes("/auth/login")) {
        loginCalls += 1;
        return fakeResponse({ ok: true, status: 200, body: {}, setCookies: ["ribbon.connect.sid=abc"] });
      }
      return fakeResponse({ ok: true, status: 200, body: {}, setCookies: ["csrf_token=xyz"] });
    }) as typeof fetch;

    await getMomenceCookies();
    await getMomenceCookies();
    assert.equal(loginCalls, 1);
  });

  it("forceRefresh bypasses the cache and logs in again", async () => {
    let loginCalls = 0;
    globalThis.fetch = (async (url: string) => {
      if (String(url).includes("/auth/login")) {
        loginCalls += 1;
        return fakeResponse({ ok: true, status: 200, body: {}, setCookies: ["ribbon.connect.sid=abc"] });
      }
      return fakeResponse({ ok: true, status: 200, body: {}, setCookies: ["csrf_token=xyz"] });
    }) as typeof fetch;

    await getMomenceCookies();
    await getMomenceCookies(true);
    assert.equal(loginCalls, 2);
  });

  it("retries MFA on failure and eventually throws after max attempts", async () => {
    let mfaCalls = 0;
    globalThis.fetch = (async (url: string) => {
      if (String(url).includes("/auth/login")) {
        return fakeResponse({ ok: true, status: 200, body: {}, setCookies: ["ribbon.connect.sid=abc"] });
      }
      mfaCalls += 1;
      return fakeResponse({ ok: false, status: 401, body: { error: "bad otp" }, setCookies: [] });
    }) as typeof fetch;

    await assert.rejects(() => getMomenceCookies());
    assert.equal(mfaCalls, 3);
  });

  it("throws when login credentials are missing", async () => {
    delete process.env.MOMENCE_LOGIN_EMAIL;
    await assert.rejects(
      () => getMomenceCookies(),
      /Missing server environment variable: MOMENCE_LOGIN_EMAIL/,
    );
  });
});
