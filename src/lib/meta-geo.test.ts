import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LOCATIONS, metaGeoForLocationId } from "./momence-locations.ts";

describe("Meta geo from studio location", () => {
  it("resolves each studio to a city, state and postcode", () => {
    for (const location of LOCATIONS) {
      const geo = metaGeoForLocationId(location.id);
      assert.ok(geo, `no geo for ${location.name}`);
      assert.match(geo.postcode, /^\d{6}$/);
      assert.ok(geo.city.length > 0);
      assert.ok(geo.state.length > 0);
      // The postcode must be the one in that studio's own address.
      assert.ok(location.address.includes(geo.postcode));
    }
  });

  it("returns undefined for an unknown or missing location", () => {
    assert.equal(metaGeoForLocationId(999999), undefined);
    assert.equal(metaGeoForLocationId(undefined), undefined);
  });

  it("maps the Bengaluru studios to Karnataka and Mumbai to Maharashtra", () => {
    assert.deepEqual(metaGeoForLocationId(29821), {
      city: "Mumbai",
      state: "Maharashtra",
      postcode: "400050",
    });
    assert.deepEqual(metaGeoForLocationId(287883), {
      city: "Bengaluru",
      state: "Karnataka",
      postcode: "560003",
    });
  });
});
