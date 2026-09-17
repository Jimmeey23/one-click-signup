import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runSignupAndEnroll,
  type LeadCapturePayload,
  type SignupAndEnrollDependencies,
  type SignupAndEnrollInput,
} from "./signup-and-enroll.helpers.ts";

const completeInput: SignupAndEnrollInput = {
  firstName: "Asha",
  lastName: "Shah",
  email: "asha@example.com",
  countryCode: "+91",
  phoneNumber: "98765 43210",
  homeLocationId: 29821,
  waiverAccepted: true,
  signatureName: "Asha Shah",
  signatureRealSignature: "real-signature-payload",
  signatures: [],
  utmSource: "instagram",
  utmMedium: "social",
  utmCampaign: "open-barre",
  referrer: "https://example.com",
  landingPage: "https://trial.physique57india.com/skip-lead",
};

function createDependencies(calls: string[]): SignupAndEnrollDependencies {
  return {
    createMember: async (request) => {
      calls.push("createMember");
      assert.equal(request.path, "/host/members");
      assert.deepEqual(request.body, {
        firstName: "Asha",
        lastName: "Shah",
        email: "asha@example.com",
        phoneNumber: "+919876543210",
        homeLocationId: 29821,
      });
      return { memberId: 32166499 };
    },
    signMemberWaivers: async ({ memberId, realSignature }) => {
      calls.push("signMemberWaivers");
      assert.equal(memberId, 32166499);
      assert.equal(realSignature, "real-signature-payload");
      return { signedCount: 2, availableCount: 2 };
    },
    enrollOpenBarre: async ({ memberId, homeLocationId }) => {
      calls.push("enrollOpenBarre");
      assert.equal(memberId, 32166499);
      assert.equal(homeLocationId, 29821);
    },
    captureLead: async (_payload, { sendToMomence }) => {
      calls.push("captureLead");
      return sendToMomence ? { ok: true } : { ok: false, skipped: true };
    },
    resolveCenterName: () => "Supreme HQ, Bandra",
  };
}

describe("signup and enroll helper", () => {
  it("skips lead capture while still creating the member, signing waivers, and enrolling Open Barre", async () => {
    const calls: string[] = [];
    const result = await runSignupAndEnroll(completeInput, createDependencies(calls), {
      sendLeadToMomence: false,
    });

    // The lead is still captured - that is what records the submission - it simply never
    // reaches the Momence webhook.
    assert.deepEqual(calls, [
      "createMember",
      "signMemberWaivers",
      "enrollOpenBarre",
      "captureLead",
    ]);
    assert.deepEqual(result, {
      memberId: 32166499,
      homeLocationId: 29821,
      enrolled: true,
      enrollError: null,
      signedCount: 2,
      availableWaivers: 2,
      leadCaptured: false,
      leadError: null,
    });
  });

  it("captures lead details when lead capture is enabled", async () => {
    const calls: string[] = [];
    const result = await runSignupAndEnroll(completeInput, createDependencies(calls), {
      sendLeadToMomence: true,
    });

    assert.deepEqual(calls, [
      "createMember",
      "signMemberWaivers",
      "enrollOpenBarre",
      "captureLead",
    ]);
    assert.equal(result.leadCaptured, true);
    assert.equal(result.leadError, null);
  });

  it("still records the submission when the lead is not sent to Momence", async () => {
    let options: { sendToMomence: boolean } | undefined;
    const dependencies = createDependencies([]);
    dependencies.captureLead = async (_payload, opts) => {
      options = opts;
      return { ok: false, skipped: true, error: "Lead webhook not sent for this signup" };
    };

    const result = await runSignupAndEnroll(completeInput, dependencies, {
      sendLeadToMomence: false,
    });

    assert.deepEqual(options, { sendToMomence: false });
    assert.equal(result.leadCaptured, false);
    // Skipped on purpose, so nothing is reported as having gone wrong.
    assert.equal(result.leadError, null);
  });

  it("continues signup when waiver signing is incomplete", async () => {
    const calls: string[] = [];
    const dependencies = createDependencies(calls);
    dependencies.signMemberWaivers = async ({ realSignature }) => {
      calls.push("signMemberWaivers");
      assert.equal(realSignature, "real-signature-payload");
      throw new Error("membership-waiver is still provisioning");
    };

    const result = await runSignupAndEnroll(completeInput, dependencies, {
      sendLeadToMomence: false,
    });

    assert.deepEqual(calls, [
      "createMember",
      "signMemberWaivers",
      "enrollOpenBarre",
      "captureLead",
    ]);
    assert.equal(result.memberId, 32166499);
    assert.equal(result.enrolled, true);
    assert.equal(result.signedCount, 0);
    assert.equal(result.availableWaivers, 0);
  });

  it("threads classType through to the captureLead payload", async () => {
    let capturedPayload: LeadCapturePayload | undefined;
    const dependencies: SignupAndEnrollDependencies = {
      createMember: async () => ({ memberId: 1 }),
      signMemberWaivers: async () => ({ signedCount: 1, availableCount: 1 }),
      enrollOpenBarre: async () => {},
      captureLead: async (payload) => {
        capturedPayload = payload;
        return { ok: true };
      },
      resolveCenterName: () => "Kwality House, Kemps Corner",
    };

    await runSignupAndEnroll(
      {
        firstName: "Asha",
        lastName: "Rao",
        email: "asha@example.com",
        countryCode: "+91",
        phoneNumber: "9876543210",
        homeLocationId: 9030,
        waiverAccepted: true,
        signatureName: "Asha Rao",
        signatureRealSignature: "sig-data",
        classType: "barre-57",
      },
      dependencies,
      { sendLeadToMomence: true },
    );

    assert.equal(capturedPayload?.classType, "barre-57");
  });
});
