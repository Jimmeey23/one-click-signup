import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMonthCalendarWeeks } from "./schedule-calendar.helpers.ts";

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

describe("Schedule calendar helpers", () => {
  it("builds a Sunday-first month calendar with adjacent-month padding days", () => {
    const weeks = buildMonthCalendarWeeks(new Date("2026-06-15T00:00:00+05:30"));

    assert.equal(weeks.length, 5);
    assert.equal(localDateKey(weeks[0][0].date), "2026-05-31");
    assert.equal(weeks[0][0].inCurrentMonth, false);
    assert.equal(localDateKey(weeks[0][1].date), "2026-06-01");
    assert.equal(weeks[0][1].inCurrentMonth, true);
    assert.equal(localDateKey(weeks[4][2].date), "2026-06-30");
    assert.equal(weeks[4][2].inCurrentMonth, true);
    assert.equal(localDateKey(weeks[4][6].date), "2026-07-04");
    assert.equal(weeks[4][6].inCurrentMonth, false);
  });
});
