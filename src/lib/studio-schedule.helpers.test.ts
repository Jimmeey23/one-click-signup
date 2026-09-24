import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseStudioScheduleFilters,
  sessionMatchesStudioScheduleFilters,
  studioForScheduleSlug,
  studioScheduleSearchForFilters,
  timeOfDayForSession,
} from "./studio-schedule.helpers.ts";

describe("Studio schedule helpers", () => {
  it("resolves studio slugs to Momence locations", () => {
    assert.equal(studioForScheduleSlug("bandra")?.location.id, 29821);
    assert.equal(studioForScheduleSlug("Kemps-Corner")?.location.id, 9030);
    assert.equal(studioForScheduleSlug("nowhere"), null);
  });

  it("parses friendly filter values and drops unknown ones", () => {
    const filters = parseStudioScheduleFilters({
      format: "StrengthLab,cycle,zumba",
      time: "evening,late",
      day: "Saturday,sun,sat",
      trainer: "  Anisha ",
    });
    assert.deepEqual(filters, {
      formats: ["strength-lab", "power-cycle"],
      times: ["evening"],
      days: ["sat", "sun"],
      trainer: "Anisha",
    });
    assert.deepEqual(studioScheduleSearchForFilters(filters), {
      format: "strength-lab,power-cycle",
      time: "evening",
      day: "sat,sun",
      trainer: "Anisha",
    });
  });

  it("buckets sessions by IST time of day", () => {
    assert.equal(timeOfDayForSession("2026-09-26T02:00:00Z"), "morning"); // 7:30 IST
    assert.equal(timeOfDayForSession("2026-09-26T08:00:00Z"), "afternoon"); // 13:30 IST
    assert.equal(timeOfDayForSession("2026-09-26T13:00:00Z"), "evening"); // 18:30 IST
  });

  it("matches sessions against every active filter", () => {
    const session = {
      name: "StrengthLab Push",
      startsAt: "2026-09-26T13:00:00Z", // Saturday 18:30 IST
      teacherName: "Anisha Shah",
    };
    const match = (search: Parameters<typeof parseStudioScheduleFilters>[0]) =>
      sessionMatchesStudioScheduleFilters(
        session,
        "strength-lab",
        parseStudioScheduleFilters(search),
      );

    assert.equal(match({}), true);
    assert.equal(match({ format: "strength-lab", time: "evening", day: "sat" }), true);
    assert.equal(match({ trainer: "anisha" }), true);
    assert.equal(match({ format: "barre" }), false);
    assert.equal(match({ time: "morning" }), false);
    assert.equal(match({ day: "mon" }), false);
    assert.equal(match({ trainer: "reshma" }), false);
  });
});
