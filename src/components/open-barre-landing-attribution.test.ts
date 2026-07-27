import assert from "node:assert/strict";
import { describe, it } from "node:test";
// Imported from the pure helper module (not OpenBarreLanding.tsx directly): that component file
// has top-level .jpg asset imports that Node's test runner (no bundler/asset pipeline) cannot
// resolve, so importing it here would fail regardless of the logic under test. See
// src/lib/attribution.helpers.ts, which OpenBarreLanding.tsx imports from and re-exports.
import { parseAttributionFromSearch } from "../lib/attribution.helpers.ts";

describe("attribution capture", () => {
  it("captures utm_term, utm_content, gclid, and fbclid alongside the existing utm fields", () => {
    const attribution = parseAttributionFromSearch(
      "?utm_source=google&utm_medium=cpc&utm_campaign=trial&utm_term=barre+class&utm_content=variant-a&gclid=abc123&fbclid=xyz789",
    );

    assert.equal(attribution.utmSource, "google");
    assert.equal(attribution.utmMedium, "cpc");
    assert.equal(attribution.utmCampaign, "trial");
    assert.equal(attribution.utmTerm, "barre class");
    assert.equal(attribution.utmContent, "variant-a");
    assert.equal(attribution.gclid, "abc123");
    assert.equal(attribution.fbclid, "xyz789");
  });

  it("omits fields that are absent from the query string", () => {
    const attribution = parseAttributionFromSearch("?utm_source=google");
    assert.equal(attribution.utmSource, "google");
    assert.equal(attribution.utmTerm, undefined);
    assert.equal(attribution.gclid, undefined);
  });
});
