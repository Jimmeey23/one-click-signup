import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { eventDetailLine, formatEventDate, formatEventTime } from "./route-event.ts";

describe("Route event date", () => {
  it("reads the builder's stored format", () => {
    assert.equal(formatEventDate("2026-10-04"), "Sun 4 Oct");
    assert.equal(formatEventDate("2026-01-01"), "Thu 1 Jan");
  });

  it("gives nothing back rather than a broken date", () => {
    assert.equal(formatEventDate(""), null);
    assert.equal(formatEventDate(undefined), null);
    assert.equal(formatEventDate("next Tuesday"), null);
    // A real date that does not exist - the builder should never send it, but a hand-edited
    // link can.
    assert.equal(formatEventDate("2026-02-30"), null);
  });
});

describe("Route event time", () => {
  it("turns the builder's 24-hour time into how the studio writes it", () => {
    assert.equal(formatEventTime("18:30"), "6:30 PM");
    assert.equal(formatEventTime("07:00"), "7:00 AM");
    assert.equal(formatEventTime("00:15"), "12:15 AM");
    assert.equal(formatEventTime("12:00"), "12:00 PM");
  });

  it("gives nothing back rather than a broken time", () => {
    assert.equal(formatEventTime(""), null);
    assert.equal(formatEventTime(undefined), null);
    assert.equal(formatEventTime("6pm"), null);
    assert.equal(formatEventTime("25:00"), null);
    assert.equal(formatEventTime("10:74"), null);
  });
});

describe("Route event detail line", () => {
  it("reads as one sentence when the route filled everything in", () => {
    assert.equal(
      eventDetailLine({
        name: "Barre X Rooftop Sunset",
        date: "2026-10-04",
        time: "18:30",
        instructor: "Mrigakshi",
      }),
      "Sun 4 Oct · 6:30 PM · with Mrigakshi",
    );
  });

  it("joins only the parts the route has", () => {
    assert.equal(eventDetailLine({ name: "Pop-up", date: "2026-10-04" }), "Sun 4 Oct");
    assert.equal(eventDetailLine({ name: "Pop-up", instructor: "Anisha" }), "with Anisha");
    assert.equal(
      eventDetailLine({ name: "Pop-up", time: "09:45", instructor: "Anisha" }),
      "9:45 AM · with Anisha",
    );
  });

  it("is empty when there is nothing to say, so the page can leave the line out", () => {
    assert.equal(eventDetailLine({ name: "Pop-up" }), null);
    assert.equal(eventDetailLine({ name: "Pop-up", date: "whenever", time: "sometime" }), null);
  });
});
