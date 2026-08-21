import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRespondIoContactBody, webhookCenterForLocationId } from "./momence.functions.ts";

describe("respond.io contact body", () => {
  it("includes center and classType as custom fields alongside name/email/phone", () => {
    const body = buildRespondIoContactBody({
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phoneE164: "+919876543210",
      center: "Kwality House, Kemps Corner",
      classType: "barre-57",
    });

    assert.deepEqual(body, {
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phone: "+919876543210",
      customFields: [
        { name: "center", value: "Kwality House, Kemps Corner" },
        { name: "classType", value: "Barre" },
        { name: "whatsappConsent", value: "not_opted_in" },
      ],
    });
  });

  it("falls back to Barre for classType when not provided", () => {
    const body = buildRespondIoContactBody({
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phoneE164: "+919876543210",
      center: "Kwality House, Kemps Corner",
    });

    assert.deepEqual(body.customFields, [
      { name: "center", value: "Kwality House, Kemps Corner" },
      { name: "classType", value: "Barre" },
      { name: "whatsappConsent", value: "not_opted_in" },
    ]);
  });
});

describe("Bengaluru webhook center mapping", () => {
  it("uses the required center labels for every Bengaluru destination", () => {
    assert.equal(webhookCenterForLocationId(22116), "Kenkere House");
    assert.equal(webhookCenterForLocationId(36372), "The Studio - By Copper & Cloves");
    assert.equal(webhookCenterForLocationId(287883), "Plash Pilates");
  });
});
