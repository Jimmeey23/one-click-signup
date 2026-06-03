import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHostMemberCreateRequest } from "./momence-member.helpers.ts";

describe("Momence member helpers", () => {
  it("builds the host member create request with Momence-safe names", () => {
    const request = buildHostMemberCreateRequest({
      firstName: " Asha😊 123 ",
      lastName: " Shah-Jain ",
      email: "asha@example.com",
      phoneNumber: "+919999999999",
      homeLocationId: 9030,
    });

    assert.deepEqual(request, {
      path: "/host/members",
      method: "POST",
      body: {
        firstName: "Asha",
        lastName: "Shah Jain",
        email: "asha@example.com",
        phoneNumber: "+919999999999",
        homeLocationId: 9030,
      },
    });
  });

  it("rejects names that do not contain letters after normalization", () => {
    assert.throws(
      () =>
        buildHostMemberCreateRequest({
          firstName: "123",
          lastName: "!!!",
          email: "asha@example.com",
          phoneNumber: "+919999999999",
          homeLocationId: 9030,
        }),
      /first and last name/i,
    );
  });
});
