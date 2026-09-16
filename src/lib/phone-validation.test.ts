import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isValidPhoneNumber, phoneDigits, phoneNumberError } from "./phone-validation.ts";

describe("Phone validation", () => {
  it("requires exactly ten digits for Indian numbers", () => {
    assert.equal(isValidPhoneNumber("9876543210", "+91"), true);
    assert.equal(isValidPhoneNumber("987654321", "+91"), false);
    assert.equal(isValidPhoneNumber("98765432101", "+91"), false);
    assert.equal(isValidPhoneNumber("", "+91"), false);
  });

  it("ignores spaces, dashes and brackets when counting digits", () => {
    assert.equal(phoneDigits("98765 43210"), "9876543210");
    assert.equal(isValidPhoneNumber("98765 43210", "+91"), true);
    assert.equal(isValidPhoneNumber("(98765) 43-210", "+91"), true);
    assert.equal(
      isValidPhoneNumber("+91 98765 43210", "+91"),
      false,
      "dial code must not be typed in",
    );
  });

  it("keeps the looser minimum for other countries", () => {
    assert.equal(isValidPhoneNumber("501234567", "+971"), true);
    assert.equal(isValidPhoneNumber("12345", "+971"), false);
  });

  it("stays quiet on an empty field and explains what is missing once typing starts", () => {
    assert.equal(phoneNumberError("", "+91"), null);
    assert.equal(phoneNumberError("9876543210", "+91"), null);
    assert.equal(
      phoneNumberError("98765", "+91"),
      "Enter all 10 digits of your mobile number (5 so far).",
    );
    assert.equal(phoneNumberError("123", "+1"), "Enter a valid phone number.");
  });
});
