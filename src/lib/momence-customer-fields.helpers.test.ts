import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCustomerFieldsDataRequest,
  validateCustomerFieldValues,
  type CustomerFieldValues,
} from "./momence-customer-fields.helpers.ts";

const completeValues: CustomerFieldValues = {
  fitnessGoal: "Build endurance",
  emergencyContactInfo: "9899911999",
  pregnancyStatus: "No ",
  medicalHistory: "No concerns",
  postNatalStatus: "No",
  fnf: "Friend referral",
  gender: "Male",
  euShoeSize: "43",
  howDidHear: "Yellow Messenger/Whatsapp Enquiry",
};

describe("Momence customer field helpers", () => {
  it("builds the Momence customer field data request with string field ids", () => {
    const request = buildCustomerFieldsDataRequest({
      memberId: 32242429,
      values: completeValues,
    });

    assert.equal(request.path, "/host/13752/customer-fields/data");
    assert.deepEqual(request.body, {
      memberId: 32242429,
      values: {
        "8149": "Build endurance",
        "8251": "9899911999",
        "8252": "No ",
        "8253": "No concerns",
        "8254": "No",
        "8401": "Friend referral",
        "16549": "Male",
        "17139": "43",
        "19050": "Yellow Messenger/Whatsapp Enquiry",
      },
    });
  });

  it("requires health fields for all classes and shoe size for cycle classes", () => {
    assert.deepEqual(
      validateCustomerFieldValues(
        { emergencyContactInfo: "", pregnancyStatus: "", medicalHistory: "", postNatalStatus: "" },
        { requiresShoeSize: false },
      ),
      {
        emergencyContactInfo: "Emergency Contact Info is required.",
        pregnancyStatus: "Are you currently pregnant? is required.",
        medicalHistory: "Medical History is required.",
        postNatalStatus: "Post Natal is required.",
      },
    );

    assert.deepEqual(validateCustomerFieldValues(completeValues, { requiresShoeSize: true }), {});
    assert.deepEqual(
      validateCustomerFieldValues(
        { ...completeValues, euShoeSize: "" },
        { requiresShoeSize: true },
      ),
      { euShoeSize: "EU Shoe Size is required for powerCycle classes." },
    );
  });
});
