// The event a Route Builder link is for, in the shape the landing page needs it.
//
// A route carries its own identity - a name, a date, who is teaching, whether it costs
// anything - and the page it opens should show that rather than the studio's standard
// signup copy. Everything here is optional: a route can be published with a name alone.

export type RouteEvent = {
  name: string;
  /** As the builder stores it: YYYY-MM-DD. */
  date?: string;
  /** As the builder stores it: 24-hour HH:MM. */
  time?: string;
  instructor?: string;
  studio?: string;
  /** Free text the route author wrote about this event. */
  details?: string;
  paid?: boolean;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-10-04" -> "Sat 4 Oct". Returns null for anything that is not a date the builder
 * could have produced, so the page leaves the line out rather than printing "Invalid Date".
 *
 * The parts are read by hand instead of through `new Date(value)` because that parses a
 * bare date as UTC, which lands on the previous day for anyone east of Greenwich - every
 * visitor this page has.
 */
export function formatEventDate(value: string | undefined | null): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;

  const [, year, month, day] = match.map(Number) as unknown as [string, number, number, number];
  const date = new Date(year, month - 1, day);
  // Rejects the 30th of February and friends: the Date constructor rolls them forward.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return `${DAYS[date.getDay()]} ${day} ${MONTHS[month - 1]}`;
}

/** "18:30" -> "6:30 PM". Null when it is not a 24-hour time. */
export function formatEventTime(value: string | undefined | null): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  const suffix = hours < 12 ? "AM" : "PM";
  // Midnight and noon are both written as 12.
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/**
 * The one-line "when and with whom" under the event name, e.g.
 * "Sat 4 Oct · 6:30 PM · with Mrigakshi". Only the parts the route actually has are
 * joined, and a route with none of them gets null so the page can skip the line entirely.
 */
export function eventDetailLine(event: RouteEvent): string | null {
  const parts = [
    formatEventDate(event.date),
    formatEventTime(event.time),
    event.instructor?.trim() ? `with ${event.instructor.trim()}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length ? parts.join(" · ") : null;
}
