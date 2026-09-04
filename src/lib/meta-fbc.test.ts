import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readRawFbclid, validateFbc } from "./analytics.ts";
import { parseAttributionFromSearch } from "./attribution.helpers.ts";

describe("Meta fbc handling", () => {
  it("returns the fbclid exactly as it appears in the query string", () => {
    const raw = "IwAR0abc%2Fdef-GH_ij.kl%3D";
    assert.equal(readRawFbclid(`?utm_source=fb&fbclid=${raw}`), raw);
    assert.equal(readRawFbclid(`utm_source=fb&fbclid=${raw}`), raw);
  });

  it("does not match params that merely end in fbclid", () => {
    assert.equal(readRawFbclid("?myfbclid=nope"), undefined);
    assert.equal(readRawFbclid("?fbclid="), undefined);
    assert.equal(readRawFbclid(""), undefined);
  });

  it("stores the raw fbclid in attribution", () => {
    const raw = "IwAR%2Fzz";
    assert.equal(parseAttributionFromSearch(`?fbclid=${raw}`).fbclid, raw);
  });

  it("accepts a well-formed fbc whose tail is the unmodified fbclid", () => {
    const fbclid = "IwAR0abc%2Fdef";
    assert.equal(validateFbc(`fb.1.1717171717171.${fbclid}`, fbclid), true);
  });

  it("rejects an fbc whose fbclid tail was altered", () => {
    const fbclid = "IwAR0abc%2Fdef";
    assert.equal(validateFbc(`fb.1.1717171717171.IwAR0abc/def`, fbclid), false);
    assert.equal(validateFbc(`fb.1.1717171717171.${fbclid.toLowerCase()}`, fbclid), false);
  });

  it("rejects malformed or missing fbc values", () => {
    assert.equal(validateFbc(undefined), false);
    assert.equal(validateFbc("not-an-fbc"), false);
    assert.equal(validateFbc("fb.1.abc.xyz"), false);
    assert.equal(validateFbc("fb.1.1717171717171."), false);
  });
});
