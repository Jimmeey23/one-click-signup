import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildChildAccountCreateRequest,
  parseChildAccountMemberId,
} from "./momence-child-account.helpers.ts";

describe("Momence child account helpers", () => {
  it("creates the child under the parent with their date of birth", () => {
    const request = buildChildAccountCreateRequest({
      hostId: 13752,
      parentMemberId: 555,
      firstName: "Riya",
      lastName: "Shah",
      childDateOfBirth: "2017-04-02",
    });

    assert.equal(request.path, "/host/13752/customers/555/children");
    assert.deepEqual(request.body.customerFields, [{ id: 6592, value: "2017-04-02" }]);
    assert.equal(request.body.autoGenerateEmail, true);
    assert.equal(request.headers.Referer, "https://momence.com/dashboard/13752/crm/555");
  });

  it("reads the child's member id out of the shapes Momence returns", () => {
    assert.equal(parseChildAccountMemberId({ memberId: 42 }), 42);
    assert.equal(parseChildAccountMemberId({ payload: [{ id: 43 }] }), 43);
    assert.equal(parseChildAccountMemberId({ children: [{ customerId: "44" }] }), 44);
    assert.equal(parseChildAccountMemberId({}), null);
  });
});
