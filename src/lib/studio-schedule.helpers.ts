import { CLASS_FORMAT_KEYS, type ClassFormatKey } from "./class-format-matchers.ts";
import { LOCATIONS } from "./momence-locations.ts";

// Public, shareable schedule links: /schedule/bandra?format=strength-lab&time=evening
export const STUDIO_SCHEDULE_SLUGS = {
  "kemps-corner": 9030,
  bandra: 29821,
  "lavelle-road": 22116,
  indiranagar: 36372,
  sadashivnagar: 287883,
} as const satisfies Record<string, (typeof LOCATIONS)[number]["id"]>;

export type StudioScheduleSlug = keyof typeof STUDIO_SCHEDULE_SLUGS;

export type StudioScheduleStudio = {
  slug: StudioScheduleSlug;
  location: (typeof LOCATIONS)[number];
};

export function studioForScheduleSlug(slug: string): StudioScheduleStudio | null {
  const normalized = slug.toLowerCase();
  if (!(normalized in STUDIO_SCHEDULE_SLUGS)) return null;
  const typedSlug = normalized as StudioScheduleSlug;
  const location = LOCATIONS.find((l) => l.id === STUDIO_SCHEDULE_SLUGS[typedSlug]);
  return location ? { slug: typedSlug, location } : null;
}

export function listScheduleStudios(): StudioScheduleStudio[] {
  return (Object.keys(STUDIO_SCHEDULE_SLUGS) as StudioScheduleSlug[])
    .map((slug) => studioForScheduleSlug(slug))
    .filter((studio): studio is StudioScheduleStudio => studio !== null);
}

export const TIME_OF_DAY_KEYS = ["morning", "afternoon", "evening"] as const;
export type TimeOfDay = (typeof TIME_OF_DAY_KEYS)[number];

export const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type StudioScheduleFilters = {
  formats: ClassFormatKey[];
  times: TimeOfDay[];
  days: WeekdayKey[];
  trainer: string;
};

export type StudioScheduleSearch = {
  format?: string;
  time?: string;
  day?: string;
  trainer?: string;
};

function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Friendly spellings people will type into a link by hand.
const FORMAT_ALIASES: Record<string, ClassFormatKey> = {
  barre: "barre-57",
  barre57: "barre-57",
  cycle: "power-cycle",
  powercycle: "power-cycle",
  spin: "power-cycle",
  strength: "strength-lab",
  strengthlab: "strength-lab",
};

function parseFormat(value: string): ClassFormatKey | null {
  const key = compact(value);
  return (
    CLASS_FORMAT_KEYS.find((formatKey) => compact(formatKey) === key) ?? FORMAT_ALIASES[key] ?? null
  );
}

function parseTime(value: string): TimeOfDay | null {
  const key = compact(value);
  return TIME_OF_DAY_KEYS.find((time) => time === key) ?? null;
}

function parseDay(value: string): WeekdayKey | null {
  const key = compact(value).slice(0, 3);
  return WEEKDAY_KEYS.find((day) => day === key) ?? null;
}

function parseList<T>(raw: string | undefined, parse: (value: string) => T | null): T[] {
  if (!raw) return [];
  const parsed: T[] = [];
  for (const part of raw.split(",")) {
    const value = parse(part.trim());
    if (value !== null && !parsed.includes(value)) parsed.push(value);
  }
  return parsed;
}

// Unknown values are dropped rather than rejected so a mistyped link still shows a schedule.
export function parseStudioScheduleFilters(search: StudioScheduleSearch): StudioScheduleFilters {
  return {
    formats: parseList(search.format, parseFormat),
    times: parseList(search.time, parseTime),
    days: parseList(search.day, parseDay),
    trainer: (search.trainer ?? "").trim(),
  };
}

export function studioScheduleSearchForFilters(
  filters: StudioScheduleFilters,
): StudioScheduleSearch {
  return {
    format: filters.formats.length ? filters.formats.join(",") : undefined,
    time: filters.times.length ? filters.times.join(",") : undefined,
    day: filters.days.length ? filters.days.join(",") : undefined,
    trainer: filters.trainer || undefined,
  };
}

function istHourAndWeekday(startsAt: string): { hour: number; weekday: WeekdayKey } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(new Date(startsAt));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const weekday = (parts.find((p) => p.type === "weekday")?.value ?? "sun")
    .toLowerCase()
    .slice(0, 3) as WeekdayKey;
  return { hour, weekday };
}

export function timeOfDayForSession(startsAt: string): TimeOfDay {
  const { hour } = istHourAndWeekday(startsAt);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sessionMatchesStudioScheduleFilters(
  session: { name: string; startsAt: string; teacherName: string | null },
  formatKey: ClassFormatKey,
  filters: StudioScheduleFilters,
): boolean {
  if (filters.formats.length && !filters.formats.includes(formatKey)) return false;
  if (filters.times.length && !filters.times.includes(timeOfDayForSession(session.startsAt))) {
    return false;
  }
  if (filters.days.length && !filters.days.includes(istHourAndWeekday(session.startsAt).weekday)) {
    return false;
  }
  if (filters.trainer) {
    const wanted = normalizeName(filters.trainer);
    if (wanted && !normalizeName(session.teacherName ?? "").includes(wanted)) return false;
  }
  return true;
}

// Private and internal sessions that should never show on a bookable schedule.
const EXCLUDED_CLASS_NAME_KEYWORDS = ["hosted", "physique 57", "p57", "studio juniors"];

export function isExcludedClassName(name: string): boolean {
  const lower = name.toLowerCase();
  return EXCLUDED_CLASS_NAME_KEYWORDS.some((keyword) => lower.includes(keyword));
}
