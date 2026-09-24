import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Link2,
  MapPin,
  X,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { listSessions, type SessionDTO } from "@/lib/momence-sessions.functions";
import { getSchedulePriceDisplay, isBengaluruLocation } from "@/lib/momence-booking.helpers";
import { classFormatForKey, classFormatForSessionName } from "@/lib/class-formats";
import {
  detailedClassFormatKeyForSessionName,
  type ClassFormatKey,
} from "@/lib/class-format-matchers";
import { trainerImageForName } from "@/lib/trainer-thumbnails";
import {
  isExcludedClassName,
  listScheduleStudios,
  parseStudioScheduleFilters,
  sessionMatchesStudioScheduleFilters,
  studioForScheduleSlug,
  studioScheduleSearchForFilters,
  TIME_OF_DAY_KEYS,
  type StudioScheduleFilters,
  type StudioScheduleSlug,
  type TimeOfDay,
  type WeekdayKey,
} from "@/lib/studio-schedule.helpers";
import fallbackTrainerPortrait from "@/assets/2136 _ Physique57 _ Trainer Shots _ _56A2021.jpg";

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
const RAIL_DAYS = 7;

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const WEEKDAY_PLURALS: Record<WeekdayKey, string> = {
  sun: "Sundays",
  mon: "Mondays",
  tue: "Tuesdays",
  wed: "Wednesdays",
  thu: "Thursdays",
  fri: "Fridays",
  sat: "Saturdays",
};

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

type ScheduleItem = { session: SessionDTO; formatKey: ClassFormatKey };

function StudioSchedulePage() {
  const { slug } = Route.useLoaderData();
  const studio = studioForScheduleSlug(slug)!;
  const location = studio.location;
  const isBengaluru = isBengaluruLocation(location.id);

  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters = useMemo(() => parseStudioScheduleFilters(search), [search]);

  const listFn = useServerFn(listSessions);
  const [sessions, setSessions] = useState<SessionDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedDays, setLoadedDays] = useState(INITIAL_DAYS_AHEAD);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const railStart = useMemo(() => addDays(new Date(), weekOffset * RAIL_DAYS), [weekOffset]);
  const rail = useMemo(() => buildDateRail(railStart), [railStart]);
  const railStartKey = rail[0].key;
  const maxWeekOffset = Math.floor((MAX_DAYS_AHEAD - 1) / RAIL_DAYS);
  // Paging the rail past what's loaded widens the fetch to cover the visible week.
  const daysAhead = Math.min(MAX_DAYS_AHEAD, Math.max(loadedDays, (weekOffset + 1) * RAIL_DAYS));

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

  const items = useMemo<ScheduleItem[]>(
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
    for (const { formatKey } of items) keys.add(formatKey);
    return [...keys];
  }, [filters.formats, items]);

  const trainerOptions = useMemo(() => {
    const names = new Set<string>();
    for (const { session } of items) {
      if (session.teacherName) names.add(session.teacherName);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const matching = useMemo(
    () =>
      items.filter(({ session, formatKey }) =>
        sessionMatchesStudioScheduleFilters(session, formatKey, filters),
      ),
    [filters, items],
  );
  const matchingDays = useMemo(
    () => new Set(matching.map(({ session }) => dateKey(session.startsAt))),
    [matching],
  );
  const visible = useMemo(
    () =>
      matching.filter(({ session }) => {
        const key = dateKey(session.startsAt);
        return selectedDateKey ? key === selectedDateKey : key >= railStartKey;
      }),
    [matching, railStartKey, selectedDateKey],
  );
  const grouped = useMemo(() => groupByDay(visible), [visible]);

  const hasFilters =
    filters.formats.length > 0 ||
    filters.times.length > 0 ||
    filters.days.length > 0 ||
    filters.trainer !== "";
  const todayKey = dateKey(new Date());

  function applyFilters(next: StudioScheduleFilters) {
    navigate({ search: studioScheduleSearchForFilters(next), replace: true });
  }

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function switchStudio(nextSlug: StudioScheduleSlug) {
    setSessions(null);
    setWeekOffset(0);
    setSelectedDateKey(null);
    navigate({ to: "/schedule/$studio", params: { studio: nextSlug }, search });
  }

  function showAllDates() {
    setWeekOffset(0);
    setSelectedDateKey(null);
  }

  function showToday() {
    setWeekOffset(0);
    setSelectedDateKey(todayKey);
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

  const lastLoadedKey = dateKey(addDays(new Date(), daysAhead - 1));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-8 w-auto" />
          </Link>
          <Link
            to="/schedule"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            All studios
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[44px] leading-none tracking-[-0.01em] sm:text-[56px]">
              Schedule
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <label className="relative inline-flex items-center">
                <span className="sr-only">Studio</span>
                <select
                  value={studio.slug}
                  onChange={(e) => switchStudio(e.target.value as StudioScheduleSlug)}
                  className="h-9 appearance-none rounded-full border border-border bg-card pl-4 pr-9 text-sm font-semibold text-foreground transition hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep"
                >
                  {listScheduleStudios().map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.location.name.split(",")[0]}, {s.location.city}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </label>
              <span className="text-sm text-muted-foreground">India time (GMT+5:30)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground/80 transition hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary-deep" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-20 mt-6 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <RailArrow
              label="Previous week"
              disabled={weekOffset === 0}
              onClick={() => {
                setSelectedDateKey(null);
                setWeekOffset((w) => Math.max(0, w - 1));
              }}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </RailArrow>
            <div className="grid flex-1 grid-cols-7">
              {rail.map((day) => {
                const selected = selectedDateKey === day.key;
                const isToday = day.key === todayKey;
                const hasClasses = matchingDays.has(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${day.label}${hasClasses ? "" : ", no classes"}`}
                    onClick={() => setSelectedDateKey(selected ? null : day.key)}
                    className="group flex flex-col items-center gap-1 rounded-xl py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep"
                  >
                    <span
                      className={`text-[11px] font-medium ${
                        isToday ? "text-primary-deep" : "text-muted-foreground"
                      }`}
                    >
                      {isToday ? "Today" : day.weekday}
                    </span>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold transition ${
                        selected
                          ? "bg-foreground text-background"
                          : hasClasses
                            ? "text-foreground group-hover:bg-secondary"
                            : "text-muted-foreground/50 group-hover:bg-secondary"
                      }`}
                    >
                      {day.day}
                    </span>
                    <span
                      className={`h-1 w-1 rounded-full ${
                        hasClasses && !selected ? "bg-primary-deep" : "bg-transparent"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
            <RailArrow
              label="Next week"
              disabled={weekOffset >= maxWeekOffset}
              onClick={() => {
                setSelectedDateKey(null);
                setWeekOffset((w) => Math.min(maxWeekOffset, w + 1));
              }}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </RailArrow>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-border p-0.5">
              <SegmentButton
                active={selectedDateKey === null && weekOffset === 0}
                onClick={showAllDates}
              >
                All dates
              </SegmentButton>
              <SegmentButton active={selectedDateKey === todayKey} onClick={showToday}>
                Today
              </SegmentButton>
            </div>
            <label className="relative inline-flex items-center">
              <span className="sr-only">Trainer</span>
              <select
                value={
                  trainerOptions.find(
                    (name) => name.toLowerCase() === filters.trainer.toLowerCase(),
                  ) ?? filters.trainer
                }
                onChange={(e) => applyFilters({ ...filters, trainer: e.target.value })}
                className={`h-9 w-40 appearance-none truncate rounded-full border pl-4 pr-9 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep ${
                  filters.trainer
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground/80 hover:border-foreground/30"
                }`}
              >
                <option value="">All trainers</option>
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
              <ChevronDown
                className={`pointer-events-none absolute right-3 h-4 w-4 ${
                  filters.trainer ? "text-background" : "text-muted-foreground"
                }`}
                aria-hidden="true"
              />
            </label>
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            {formatOptions.map((key) => (
              <FilterChip
                key={key}
                active={filters.formats.includes(key)}
                onClick={() => applyFilters({ ...filters, formats: toggle(filters.formats, key) })}
              >
                {classFormatForKey(key).name}
              </FilterChip>
            ))}
            {TIME_OF_DAY_KEYS.map((time) => (
              <FilterChip
                key={time}
                active={filters.times.includes(time)}
                onClick={() => applyFilters({ ...filters, times: toggle(filters.times, time) })}
              >
                {TIME_LABELS[time]}
              </FilterChip>
            ))}
            {filters.days.map((day) => (
              <FilterChip
                key={day}
                active
                onClick={() =>
                  applyFilters({ ...filters, days: filters.days.filter((d) => d !== day) })
                }
              >
                {WEEKDAY_PLURALS[day]}
                <X className="h-3.5 w-3.5" aria-label="Remove" />
              </FilterChip>
            ))}
            {hasFilters && (
              <button
                type="button"
                onClick={() => applyFilters({ formats: [], times: [], days: [], trainer: "" })}
                className="ml-auto text-sm font-medium text-primary-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        {loadError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            The schedule didn't load: {loadError}. Refresh the page to try again.
          </p>
        )}

        {!sessions && !loadError && <ScheduleSkeleton />}

        {sessions && grouped.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <p className="text-base font-semibold">
              {selectedDateKey ? "No classes on this day" : "No classes match these filters"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {hasFilters
                ? "Clear a filter or pick another date to see more classes."
                : "Pick another date to see more classes."}
            </p>
          </div>
        )}

        {grouped.length > 0 && (
          <div className="space-y-8">
            {grouped.map(({ day, heading, items: dayItems }) => (
              <section key={day} aria-label={heading}>
                <h2 className="mb-3 flex items-baseline gap-2 text-[15px] font-semibold">
                  {heading}
                  <span className="text-sm font-normal text-muted-foreground">
                    {dayItems.length} {dayItems.length === 1 ? "class" : "classes"}
                  </span>
                </h2>
                <div className="space-y-3">
                  {dayItems.map(({ session, formatKey }) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      locationId={location.id}
                      bookHref={bookHref(formatKey)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {sessions && !selectedDateKey && daysAhead < MAX_DAYS_AHEAD && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing classes up to {longDateLabel(lastLoadedKey)}
            </p>
            <button
              type="button"
              onClick={() => setLoadedDays(Math.min(MAX_DAYS_AHEAD, daysAhead + 14))}
              className="h-10 rounded-full border border-border px-5 text-sm font-medium transition hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep"
            >
              Show later dates
            </button>
          </div>
        )}
      </main>

      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} showWhatsApp />
    </div>
  );
}

function RailArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function SegmentButton({
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
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded-full px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep ${
        active ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
      }`}
    >
      {children}
    </button>
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
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground/80 hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function compactName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatInr(amountInRupees: string | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amountInRupees));
}

function SessionCard({
  session,
  locationId,
  bookHref,
}: {
  session: SessionDTO;
  locationId: number;
  bookHref: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const format = classFormatForKey(detailedClassFormatKeyForSessionName(session.name));
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  const isFull = session.spotsLeft === 0;
  const fewLeft = session.spotsLeft != null && session.spotsLeft > 0 && session.spotsLeft <= 5;
  const trainerName = session.teacherName ?? "Studio instructor";
  const trainerImage =
    trainerImageForName(session.teacherName) ?? session.bannerImageUrl ?? fallbackTrainerPortrait;
  const price = getSchedulePriceDisplay(session.name, locationId);
  const isFree = Number(price.bookingPriceInCurrency) === 0;

  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 sm:grid-cols-[104px_minmax(0,1fr)_176px] sm:gap-x-5 sm:p-5">
      <div className="h-16 w-16 overflow-hidden rounded-xl bg-secondary sm:h-[104px] sm:w-[104px] sm:rounded-2xl">
        <img
          src={trainerImage}
          alt={session.teacherName ?? ""}
          loading="lazy"
          className="h-full w-full object-cover object-top mix-blend-multiply"
        />
      </div>

      <div className="min-w-0">
        {!compactName(session.name).includes(compactName(format.name)) && (
          <p className="text-[13px] font-medium text-primary-deep">{format.name}</p>
        )}
        <h3 className="mt-0.5 text-lg font-semibold leading-snug tracking-[-0.01em] sm:text-xl">
          {session.name}
        </h3>
        <p className="mt-1 text-sm text-foreground/80">with {trainerName}</p>

        <div className="mt-3 hidden sm:block">
          <Description
            text={format.description}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </div>

        <ul className="mt-3 space-y-1.5 text-sm text-foreground/75">
          <MetaItem icon={<CalendarDays className="h-4 w-4" />}>
            {start.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "Asia/Kolkata",
            })}
          </MetaItem>
          <MetaItem icon={<Clock3 className="h-4 w-4" />}>
            {formatTime(start)} – {formatTime(end)}
            <span className="text-muted-foreground"> ({session.durationInMinutes} min)</span>
          </MetaItem>
          <MetaItem icon={<MapPin className="h-4 w-4" />}>
            {session.locationName ?? "Studio"}
          </MetaItem>
        </ul>
      </div>

      <div className="col-span-2 sm:hidden">
        <Description
          text={format.description}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      </div>

      <div className="col-span-2 flex items-end justify-between gap-4 border-t border-border pt-4 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-between sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="sm:text-right">
          <p className="flex items-baseline gap-2 sm:justify-end">
            {price.originalPriceInCurrency && price.slashOriginalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatInr(price.originalPriceInCurrency)}
              </span>
            )}
            <span className="text-2xl font-semibold tracking-[-0.02em]">
              {isFree ? "Free" : formatInr(price.bookingPriceInCurrency)}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{price.label}</p>
          {(isFull || fewLeft) && (
            <p
              className={`mt-2 text-xs font-medium ${isFull ? "text-destructive" : "text-primary-deep"}`}
            >
              {isFull
                ? "Class full"
                : `${session.spotsLeft} ${session.spotsLeft === 1 ? "spot" : "spots"} left`}
            </p>
          )}
        </div>
        {isFull ? (
          <span className="inline-flex h-11 min-w-[128px] items-center justify-center rounded-xl bg-secondary px-5 text-sm font-semibold text-muted-foreground">
            Class full
          </span>
        ) : (
          <a
            href={bookHref}
            className="inline-flex h-11 min-w-[128px] items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2"
          >
            Book now
          </a>
        )}
      </div>
    </article>
  );
}

function Description({
  text,
  expanded,
  onToggle,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="max-w-[62ch]">
      <p
        className={`text-sm leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-2"}`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-1 text-sm font-medium text-foreground/80 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </li>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="grid animate-pulse grid-cols-[64px_1fr] gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[104px_1fr_176px] sm:p-5"
        >
          <div className="h-16 w-16 rounded-xl bg-secondary sm:h-[104px] sm:w-[104px]" />
          <div className="space-y-2.5">
            <div className="h-3 w-20 rounded bg-secondary" />
            <div className="h-5 w-2/3 rounded bg-secondary" />
            <div className="h-3 w-1/3 rounded bg-secondary" />
            <div className="h-3 w-1/2 rounded bg-secondary" />
          </div>
          <div className="hidden flex-col items-end justify-between sm:flex">
            <div className="h-6 w-20 rounded bg-secondary" />
            <div className="h-11 w-32 rounded-xl bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StudioNotFound() {
  const { studio } = Route.useParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">No studio called "{studio}"</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Pick a studio schedule:</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {listScheduleStudios().map((s) => (
            <Link
              key={s.slug}
              to="/schedule/$studio"
              params={{ studio: s.slug }}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:border-foreground/30 hover:text-foreground"
            >
              {s.location.name.split(",")[0]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function longDateLabel(key: string): string {
  return new Date(`${key}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });
}

function buildDateRail(start: Date) {
  return Array.from({ length: RAIL_DAYS }).map((_, index) => {
    const date = addDays(start, index);
    return {
      key: dateKey(date),
      weekday: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }),
      day: date.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }),
      label: date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Asia/Kolkata",
      }),
    };
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function dayHeading(key: string): string {
  if (key === dateKey(new Date())) return "Today";
  if (key === dateKey(addDays(new Date(), 1))) return "Tomorrow";
  return longDateLabel(key);
}

function groupByDay(
  items: ScheduleItem[],
): Array<{ day: string; heading: string; items: ScheduleItem[] }> {
  const buckets = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const day = dateKey(item.session.startsAt);
    const bucket = buckets.get(day);
    if (bucket) bucket.push(item);
    else buckets.set(day, [item]);
  }
  return Array.from(buckets.entries()).map(([day, dayItems]) => ({
    day,
    heading: dayHeading(day),
    items: dayItems,
  }));
}
