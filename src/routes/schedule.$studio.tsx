import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Check, Clock3, Link2, MapPin, UserRound, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { listSessions, type SessionDTO } from "@/lib/momence-sessions.functions";
import { isBengaluruLocation } from "@/lib/momence-booking.helpers";
import { classFormatForKey, classFormatForSessionName } from "@/lib/class-formats";
import type { ClassFormatKey } from "@/lib/class-format-matchers";
import {
  isExcludedClassName,
  listScheduleStudios,
  parseStudioScheduleFilters,
  sessionMatchesStudioScheduleFilters,
  studioForScheduleSlug,
  studioScheduleSearchForFilters,
  TIME_OF_DAY_KEYS,
  WEEKDAY_KEYS,
  type StudioScheduleFilters,
  type TimeOfDay,
  type WeekdayKey,
} from "@/lib/studio-schedule.helpers";

// Every filter is a loose string so a hand-typed link never errors - the helpers drop
// anything they don't recognise.
const searchSchema = z.object({
  format: z.string().optional().catch(undefined),
  time: z.string().optional().catch(undefined),
  day: z.string().optional().catch(undefined),
  trainer: z.string().optional().catch(undefined),
});

const logoUrl = "/physique57-logo.png";
const INITIAL_DAYS_AHEAD = 14;
const MAX_DAYS_AHEAD = 60;

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

// Monday-first reads more naturally for a studio week than the Sunday-first key order.
const WEEKDAY_CHIP_ORDER: WeekdayKey[] = [...WEEKDAY_KEYS.slice(1), WEEKDAY_KEYS[0]];

export const Route = createFileRoute("/schedule/$studio")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const studio = studioForScheduleSlug(params.studio);
    if (!studio) throw notFound();
    return { slug: studio.slug };
  },
  head: ({ params }) => {
    const studio = studioForScheduleSlug(params.studio);
    const studioName = studio?.location.name.split(",")[0] ?? "Studio";
    const title = `${studioName} Class Schedule - Physique 57 India`;
    return {
      meta: [
        { title },
        { name: "description", content: `Upcoming classes at Physique 57 ${studioName}.` },
        { property: "og:title", content: title },
      ],
    };
  },
  notFoundComponent: StudioNotFound,
  component: StudioSchedulePage,
});

function StudioSchedulePage() {
  const { slug } = Route.useLoaderData();
  const studio = studioForScheduleSlug(slug)!;
  const location = studio.location;
  const studioName = location.name.split(",")[0];
  const isBengaluru = isBengaluruLocation(location.id);

  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters = useMemo(() => parseStudioScheduleFilters(search), [search]);

  const listFn = useServerFn(listSessions);
  const [sessions, setSessions] = useState<SessionDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [daysAhead, setDaysAhead] = useState(INITIAL_DAYS_AHEAD);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoadError(null);
    listFn({ data: { locationId: location.id, daysAhead } })
      .then((r) => {
        if (!cancel) setSessions(r.sessions.filter((s) => !isExcludedClassName(s.name)));
      })
      .catch((e) => {
        if (!cancel) setLoadError(e instanceof Error ? e.message : "Failed to load schedule");
      });
    return () => {
      cancel = true;
    };
  }, [daysAhead, listFn, location.id]);

  const sessionsWithFormat = useMemo(
    () =>
      (sessions ?? []).map((session) => ({
        session,
        formatKey: classFormatForSessionName(session.name).key,
      })),
    [sessions],
  );

  // Offer only the formats and trainers this studio actually runs, plus anything already
  // selected in the link so it can always be switched off.
  const formatOptions = useMemo(() => {
    const keys = new Set<ClassFormatKey>(filters.formats);
    for (const { formatKey } of sessionsWithFormat) keys.add(formatKey);
    return [...keys];
  }, [filters.formats, sessionsWithFormat]);

  const trainerOptions = useMemo(() => {
    const names = new Set<string>();
    for (const { session } of sessionsWithFormat) {
      if (session.teacherName) names.add(session.teacherName);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [sessionsWithFormat]);

  const visible = useMemo(
    () =>
      sessionsWithFormat.filter(({ session, formatKey }) =>
        sessionMatchesStudioScheduleFilters(session, formatKey, filters),
      ),
    [filters, sessionsWithFormat],
  );
  const grouped = useMemo(() => groupByDay(visible), [visible]);
  const hasFilters =
    filters.formats.length > 0 ||
    filters.times.length > 0 ||
    filters.days.length > 0 ||
    filters.trainer !== "";

  function applyFilters(next: StudioScheduleFilters) {
    navigate({ search: studioScheduleSearchForFilters(next), replace: true });
  }

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", window.location.href);
    }
  }

  function bookHref(formatKey: ClassFormatKey): string {
    const params = new URLSearchParams({
      homeLocationId: String(location.id),
      classType: formatKey,
    });
    return `${isBengaluru ? "/bengaluru" : "/"}?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_60%_at_50%_-10%,color-mix(in_oklab,var(--primary)_10%,var(--background))_0%,var(--background)_45%,var(--background)_100%)] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Physique 57" className="h-9 w-auto" />
          </Link>
          <Link
            to="/schedule"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            All studios
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <section className="mb-8 rounded-[28px] border border-border bg-card/90 p-4 shadow-[var(--shadow-card)] backdrop-blur-sm md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-deep">
                {studioName}
              </p>
              <h1 className="font-display mt-0.5 text-[26px] italic leading-none tracking-[-0.01em] text-foreground sm:text-[34px]">
                Class schedule
              </h1>
              <div className="mt-2 h-[3px] w-8 rounded-full bg-primary" />
              <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep" aria-hidden="true" />
                {location.address}
              </p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full border border-border bg-card px-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80 transition hover:border-primary-deep hover:text-primary-deep"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>

          <div className="mt-5 space-y-3 rounded-[18px] border border-border bg-secondary/40 p-3.5">
            <FilterRow label="Class">
              {formatOptions.map((key) => (
                <FilterChip
                  key={key}
                  active={filters.formats.includes(key)}
                  onClick={() =>
                    applyFilters({ ...filters, formats: toggle(filters.formats, key) })
                  }
                >
                  <img
                    src={classFormatForKey(key).image}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover object-top"
                  />
                  {classFormatForKey(key).name}
                </FilterChip>
              ))}
            </FilterRow>
            <FilterRow label="Time">
              {TIME_OF_DAY_KEYS.map((time) => (
                <FilterChip
                  key={time}
                  active={filters.times.includes(time)}
                  onClick={() => applyFilters({ ...filters, times: toggle(filters.times, time) })}
                >
                  {TIME_LABELS[time]}
                </FilterChip>
              ))}
            </FilterRow>
            <FilterRow label="Day">
              {WEEKDAY_CHIP_ORDER.map((day) => (
                <FilterChip
                  key={day}
                  active={filters.days.includes(day)}
                  onClick={() => applyFilters({ ...filters, days: toggle(filters.days, day) })}
                >
                  {WEEKDAY_LABELS[day]}
                </FilterChip>
              ))}
            </FilterRow>
            <FilterRow label="Trainer">
              <select
                value={
                  trainerOptions.find(
                    (name) => name.toLowerCase() === filters.trainer.toLowerCase(),
                  ) ?? filters.trainer
                }
                onChange={(e) => applyFilters({ ...filters, trainer: e.target.value })}
                className="h-9 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Any trainer</option>
                {filters.trainer &&
                  !trainerOptions.some(
                    (name) => name.toLowerCase() === filters.trainer.toLowerCase(),
                  ) && <option value={filters.trainer}>{filters.trainer}</option>}
                {trainerOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </FilterRow>
            {hasFilters && (
              <button
                type="button"
                onClick={() => applyFilters({ formats: [], times: [], days: [], trainer: "" })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-deep hover:underline"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>
        </section>

        {loadError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {loadError}
          </p>
        )}

        {!sessions && !loadError && <ScheduleSkeleton />}

        {sessions && grouped.length === 0 && (
          <div className="rounded-[26px] border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
            <p className="font-display text-xl italic text-foreground">
              {hasFilters ? "No classes match these filters" : "Nothing on the books yet"}
            </p>
            <p className="mt-1.5 text-sm">
              {hasFilters
                ? "Try clearing a filter or loading more dates."
                : `No upcoming classes at ${studioName} in the next ${daysAhead} days.`}
            </p>
          </div>
        )}

        {grouped.length > 0 && (
          <div className="space-y-8">
            {grouped.map(({ day, relative, items }) => (
              <section key={day} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-display shrink-0 text-2xl italic tracking-[-0.01em] text-foreground">
                    {relative}
                  </h2>
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {items.length} {items.length === 1 ? "class" : "classes"}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map(({ session, formatKey }) => (
                    <PublicSessionCard
                      key={session.id}
                      session={session}
                      formatKey={formatKey}
                      bookHref={bookHref(formatKey)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {sessions && daysAhead < MAX_DAYS_AHEAD && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setDaysAhead((days) => Math.min(MAX_DAYS_AHEAD, days + 14))}
              className="h-11 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground/80 transition hover:border-primary-deep hover:text-primary-deep"
            >
              Show more dates
            </button>
          </div>
        )}
      </main>

      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} showWhatsApp />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-foreground text-background"
          : "border border-border bg-card text-foreground/80 hover:border-primary-deep hover:text-primary-deep"
      }`}
    >
      {children}
    </button>
  );
}

function PublicSessionCard({
  session,
  formatKey,
  bookHref,
}: {
  session: SessionDTO;
  formatKey: ClassFormatKey;
  bookHref: string;
}) {
  const format = classFormatForKey(formatKey);
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  const isFull = session.spotsLeft === 0;

  return (
    <article className="grid gap-4 rounded-[22px] border border-border bg-card p-4 shadow-[var(--shadow-card)] transition duration-200 hover:border-primary/50 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center">
      <img
        src={format.image}
        alt={`${format.name} class format`}
        className="hidden h-[88px] w-[88px] rounded-[16px] object-cover object-top sm:block"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-background">
            {format.name}
          </span>
          {session.spotsLeft != null && (
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                isFull
                  ? "bg-destructive/10 text-destructive"
                  : session.spotsLeft <= 3
                    ? "bg-primary/15 text-primary-deep"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {isFull ? "Full" : `${session.spotsLeft} spots left`}
            </span>
          )}
        </div>
        <h3 className="font-display mt-1.5 truncate text-2xl italic leading-tight tracking-[-0.01em] text-foreground">
          {session.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] font-medium text-foreground/70">
          <Meta icon={<Clock3 className="h-4 w-4" />}>
            {formatTime(start)} - {formatTime(end)} · {session.durationInMinutes} min
          </Meta>
          <Meta icon={<UserRound className="h-4 w-4" />}>
            {session.teacherName ?? "Studio Instructor"}
          </Meta>
          {session.locationName && (
            <Meta icon={<MapPin className="h-4 w-4" />}>{session.locationName}</Meta>
          )}
        </div>
      </div>
      {isFull ? (
        <span className="inline-flex h-[46px] items-center justify-center rounded-[12px] border border-border px-6 text-sm font-semibold text-muted-foreground">
          Class full
        </span>
      ) : (
        <a
          href={bookHref}
          className="inline-flex h-[46px] items-center justify-center rounded-[12px] bg-foreground px-6 text-sm font-semibold text-background shadow-[0_12px_26px_-8px_rgb(0_0_0/0.35)] transition hover:bg-primary-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Book this class
        </a>
      )}
    </article>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-primary-deep">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[120px] animate-pulse rounded-[22px] border border-border bg-card/70"
        />
      ))}
    </div>
  );
}

function StudioNotFound() {
  const { studio } = Route.useParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">No studio called "{studio}"</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Pick a studio schedule:</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {listScheduleStudios().map((s) => (
            <Link
              key={s.slug}
              to="/schedule/$studio"
              params={{ studio: s.slug }}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground/80 hover:border-primary-deep hover:text-primary-deep"
            >
              {s.location.name.split(",")[0]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function dateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function relativeDayLabel(date: Date): string {
  const key = dateKey(date);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (key === dateKey(today)) return "Today";
  if (key === dateKey(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function groupByDay<T extends { session: SessionDTO }>(
  items: T[],
): Array<{ day: string; relative: string; items: T[] }> {
  const buckets = new Map<string, { date: Date; items: T[] }>();
  for (const item of items) {
    const date = new Date(item.session.startsAt);
    const day = dateKey(date);
    const bucket = buckets.get(day);
    if (bucket) bucket.items.push(item);
    else buckets.set(day, { date, items: [item] });
  }
  return Array.from(buckets.entries()).map(([day, bucket]) => ({
    day,
    relative: relativeDayLabel(bucket.date),
    items: bucket.items,
  }));
}
