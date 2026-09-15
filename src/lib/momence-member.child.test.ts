import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { childEmailVariant, splitChildName } from "./momence-member.helpers.ts";

describe("splitChildName", () => {
  it("splits a full child name", () => {
    assert.deepEqual(splitChildName("Riya Shah", "Mehta"), {
      firstName: "Riya",
      lastName: "Shah",
    });
  });

  it("gives a single-word child name the parent's surname", () => {
    assert.deepEqual(splitChildName("Riya", "Shah"), { firstName: "Riya", lastName: "Shah" });
  });

  it("keeps multi-part surnames together", () => {
    assert.deepEqual(splitChildName("Riya Van Der Berg", "Shah"), {
      firstName: "Riya",
      lastName: "Van Der Berg",
    });
  });

  it("strips characters Momence rejects in a name", () => {
    assert.deepEqual(splitChildName("Riya (11)", "Shah"), {
      firstName: "Riya",
      lastName: "Shah",
    });
  });
});

describe("childEmailVariant", () => {
  it("tags the parent address with the child's first name", () => {
    assert.equal(childEmailVariant("asha@example.com", "Riya"), "asha+riya@example.com");
  });

  it("does not stack tags when the parent already uses a plus address", () => {
    assert.equal(childEmailVariant("asha+p57@example.com", "Riya"), "asha+riya@example.com");
  });

  it("leaves an address alone when the child name has nothing usable", () => {
    assert.equal(childEmailVariant("asha@example.com", "!!"), "asha@example.com");
  });
});
