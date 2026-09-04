import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createHash } from "node:crypto";
import { sendMetaCapiEvent } from "./meta-capi.ts";

type CapturedBody = {
  data: Array<{ custom_data: Record<string, unknown>; event_name: string }>;
};

const realFetch = globalThis.fetch;
let sent: CapturedBody | undefined;

beforeEach(() => {
  sent = undefined;
  process.env.VITE_META_PIXEL_ID = "1234567890";
  process.env.META_CONVERSIONS_API_ACCESS_TOKEN = "test-token";
  globalThis.fetch = (async (_url: string, init?: { body?: string }) => {
    sent = JSON.parse(init?.body ?? "{}") as CapturedBody;
    return { ok: true, text: async () => "" } as Response;
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

async function customData(input: Partial<Parameters<typeof sendMetaCapiEvent>[0]>) {
  await sendMetaCapiEvent({
    eventName: "Lead",
    eventId: "e1",
    user: { email: "a@b.com" },
    ...input,
  } as Parameters<typeof sendMetaCapiEvent>[0]);
  return sent!.data[0].custom_data;
}

describe("Meta CAPI custom_data", () => {
  it("always sends a nonzero value and a currency", async () => {
    assert.deepEqual(await customData({}), { value: 1, currency: "INR" });
  });

  it("replaces a zero value, which Meta reports as missing", async () => {
    const cd = await customData({ value: 0, currency: "INR" });
    assert.equal(cd.value, 1);
    assert.equal(cd.currency, "INR");
  });

  it("keeps a real amount and currency when given", async () => {
    const cd = await customData({ value: 2500, currency: "USD" });
    assert.equal(cd.value, 2500);
    assert.equal(cd.currency, "USD");
  });

  it("falls back to INR for a blank currency", async () => {
    assert.equal((await customData({ currency: "  " })).currency, "INR");
  });
});

describe("Meta CAPI user_data", () => {
  it("hashes country as a lowercased ISO code array", async () => {
    await sendMetaCapiEvent({
      eventName: "CompleteRegistration",
      eventId: "e2",
      user: { countryIso: "IN" },
    });
    const ud = (sent!.data[0] as unknown as { user_data: Record<string, unknown> }).user_data;
    // sha256("in")
    assert.deepEqual(ud.country, [
      "582967534d0f909d196b97f9e6921342777aea87b46fa52df165389db1fb8ccf",
    ]);
  });

  it("omits country when absent", async () => {
    await sendMetaCapiEvent({ eventName: "Lead", eventId: "e3", user: { email: "a@b.com" } });
    const ud = (sent!.data[0] as unknown as { user_data: Record<string, unknown> }).user_data;
    assert.equal("country" in ud, false);
  });
});

describe("Meta CAPI geo normalization", () => {
  it("strips spaces and punctuation before hashing ct/st/zp", async () => {
    await sendMetaCapiEvent({
      eventName: "Lead",
      eventId: "e4",
      user: { city: "Bengaluru", state: "Karnataka", postcode: "560 003" },
    });
    const ud = (sent!.data[0] as unknown as { user_data: Record<string, unknown> }).user_data;
    const hash = (v: string) => createHash("sha256").update(v).digest("hex");
    assert.deepEqual(ud.ct, [hash("bengaluru")]);
    assert.deepEqual(ud.st, [hash("karnataka")]);
    assert.deepEqual(ud.zp, [hash("560003")]);
  });
});
