import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRespondIoContactBody } from "./momence.functions.ts";

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
    ]);
  });
});
