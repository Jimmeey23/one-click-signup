import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_LEADS_SOURCE_ID, webhookSourceId } from "./momence.functions.ts";
import { leadSourceIdForName } from "./lead-sources.ts";

describe("webhookSourceId", () => {
  it("files the lead under the source the route selected", () => {
    // The builder stores the source id but it was never sent, so every lead arrived in
    // Momence as "Website" whatever the route named.
    const shaan = leadSourceIdForName("Influencer Marketing - Shaan");
    assert.equal(shaan, "148921");
    assert.equal(webhookSourceId(shaan, false), "148921");
  });

  it("keeps the studio default when a route names no source", () => {
    assert.equal(webhookSourceId(undefined, false), DEFAULT_LEADS_SOURCE_ID);
    assert.equal(webhookSourceId("", false), DEFAULT_LEADS_SOURCE_ID);
    assert.equal(webhookSourceId("   ", false), DEFAULT_LEADS_SOURCE_ID);
  });

  it("never applies a Mumbai source id to the Bengaluru host", () => {
    assert.equal(webhookSourceId("148921", true), "11615");
  });
});
