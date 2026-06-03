import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDashboardPublicWaiverSignRequests,
  buildMemberHostSignableDocumentsSignRequest,
} from "./momence-waivers.helpers.ts";

describe("Momence waiver helpers", () => {
  it("builds the public signable-documents request using Momence's schema", () => {
    const request = buildMemberHostSignableDocumentsSignRequest({
      signatureName: "Asha Shah",
      customWaiverIdsToSign: [364],
    });

    assert.deepEqual(request, {
      path: "/member/host/signable-documents/sign",
      method: "PUT",
      body: {
        customWaiverIdsToSign: [364],
        predefinedWaiverTypesToSign: ["waiver", "membership-waiver", "privacy-policy"],
        simpleSignature: "Asha Shah",
      },
    });
  });

  it("builds dashboard public waiver sign requests using signature keys and realSignature", () => {
    const requests = buildDashboardPublicWaiverSignRequests({
      hostId: 13752,
      memberId: 32166499,
      realSignature: "[[189.5,79.5,189.5,79.5]]",
      waivers: [
        {
          type: "predefined",
          id: "waiver",
          signatureStatus: "unsigned",
          signatureKey: "waiver-key",
        },
        {
          type: "predefined",
          id: "membership-waiver",
          signatureStatus: "unsigned",
          signatureKey: "membership-key",
        },
        {
          type: "predefined",
          id: "child-waiver",
          signatureStatus: "signed",
          signatureKey: "child-key",
        },
      ],
    });

    assert.deepEqual(requests, [
      {
        path: "/public/hosts/13752/members/32166499/waivers/waiver/sign?signatureKey=waiver-key",
        method: "POST",
        body: { realSignature: "[[189.5,79.5,189.5,79.5]]" },
        headers: {
          Referer:
            "https://momence.com/dashboard/13752/crm/32166499/waivers/waiver/sign?signature=waiver-key&returnTo=/dashboard/13752/crm/32166499",
          "X-Origin":
            "https://momence.com/dashboard/13752/crm/32166499/waivers/waiver/sign?signature=waiver-key&returnTo=/dashboard/13752/crm/32166499",
        },
      },
      {
        path: "/public/hosts/13752/members/32166499/waivers/membership-waiver/sign?signatureKey=membership-key",
        method: "POST",
        body: { realSignature: "[[189.5,79.5,189.5,79.5]]" },
        headers: {
          Referer:
            "https://momence.com/dashboard/13752/crm/32166499/waivers/membership-waiver/sign?signature=membership-key&returnTo=/dashboard/13752/crm/32166499",
          "X-Origin":
            "https://momence.com/dashboard/13752/crm/32166499/waivers/membership-waiver/sign?signature=membership-key&returnTo=/dashboard/13752/crm/32166499",
        },
      },
    ]);
  });
});
