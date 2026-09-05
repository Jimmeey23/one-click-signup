import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { metaRequestContext } from "./meta-request.helpers.ts";

describe("Meta request context", () => {
  it("preserves a real IPv6 client address from Vercel", () => {
    const context = metaRequestContext(
      new Headers({
        "x-vercel-forwarded-for": "2401:4900:1c80:1234::1",
        "x-forwarded-for": "203.0.113.9",
      }),
    );
    assert.equal(context.ip, "2401:4900:1c80:1234::1");
  });

  it("keeps IPv4 when the hosting edge did not receive IPv6", () => {
    const context = metaRequestContext(new Headers({ "x-forwarded-for": "203.0.113.9" }));
    assert.equal(context.ip, "203.0.113.9");
  });

  it("ignores malformed IP values", () => {
    const context = metaRequestContext(
      new Headers({ "x-vercel-forwarded-for": "not-an-ip", "x-real-ip": "198.51.100.4" }),
    );
    assert.equal(context.ip, "198.51.100.4");
  });

  it("captures Vercel visitor geography and decodes city names", () => {
    const context = metaRequestContext(
      new Headers({
        "x-vercel-ip-country": "IN",
        "x-vercel-ip-country-region": "MH",
        "x-vercel-ip-city": "Navi%20Mumbai",
        "x-vercel-ip-postal-code": "400706",
      }),
    );
    assert.deepEqual(
      {
        countryIso: context.countryIso,
        state: context.state,
        city: context.city,
        postcode: context.postcode,
      },
      { countryIso: "IN", state: "MH", city: "Navi Mumbai", postcode: "400706" },
    );
  });
});
