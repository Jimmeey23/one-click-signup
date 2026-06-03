import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  Bike,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  List,
  MapPin,
} from "lucide-react";
import { LOCATIONS } from "@/lib/momence-locations";
import {
  listSessions,
  bookWithMembership,
  type SessionDTO,
} from "@/lib/momence-sessions.functions";
import {
  completeNewcomersCheckoutBooking,
  createNewcomersCheckoutSession,
} from "@/lib/stripe-checkout.functions";
import { isPaidNewcomersClassName } from "@/lib/momence-booking.helpers";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Footer } from "@/components/Footer";
import trainerPortrait from "@/assets/2136 _ Physique57 _ Trainer Shots _ _56A2021.jpg";
import fitImage from "@/assets/139 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _56A3173.jpg";
import strengthImage from "@/assets/2007 _ Physique57 _ Trainer Shots _ _56A2318.jpg";
import barreImage from "@/assets/120 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _04A1551.jpg";
import cardioImage from "@/assets/3014 _ Physique57 _ Deliverable 3 _ _56A1625.jpg";
import matImage from "@/assets/3012 _ Physique57 _ Deliverable 3 _ _56A1619.jpg";
import cycleImage from "@/assets/2115 _ Physique57 _ Trainer Shots _ _56A3035.jpg";
import anishaThumb from "@/assets/images/001-1_Anisha-1-e1590837044475.jpg";
import atulanThumb from "@/assets/images/002-Atulan-Image-1.jpg";
import cauveriThumb from "@/assets/images/003-Cauveri-1.jpg";
import kajolThumb from "@/assets/images/004-Kajol-Kanchan-1.jpg";
import karanBhatiaThumb from "@/assets/images/005-Karan-Bhatia-1-1.jpeg";
import mrigakshiThumb from "@/assets/images/007-Mrigakshi-Image-2.jpg";
import pranjaliThumb from "@/assets/images/008-Pranjali-Image-1.jpg";
import pushyankThumb from "@/assets/images/009-Pushyank-Nahar-1.jpeg";
import reshmaThumb from "@/assets/images/010-Reshma-Image-3.jpg";
import richardThumb from "@/assets/images/011-Richard-Image-3.jpg";
import rohanThumb from "@/assets/images/012-Rohan-Image-3.jpg";
import saniyaThumb from "@/assets/images/013-Saniya-Image-1.jpg";
import shrutiKulkarniThumb from "@/assets/images/014-Shruti-Kulkarni.jpeg";
import vivaranThumb from "@/assets/images/015-Vivaran-Image-4.jpg";
import anmolThumb from "@/assets/images/Anmol.jpeg";
import bretThumb from "@/assets/images/Bret.jpeg";
import karanveerThumb from "@/assets/images/Karanveer.jpg";
import raunakThumb from "@/assets/images/Raunak.jpeg";
import simonelleThumb from "@/assets/images/Simonelle.jpeg";
import simranThumb from "@/assets/images/Simran.jpeg";
import sovenaThumb from "@/assets/images/Sovena.jpeg";
import veenaThumb from "@/assets/images/Veena.jpeg";

const searchSchema = z.object({
  locationId: z.coerce.number().int().positive().default(LOCATIONS[0].id),
  checkout_session_id: z.string().optional(),
  paidSessionId: z.coerce.number().int().positive().optional(),
  paidLocationId: z.coerce.number().int().positive().optional(),
});

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/classes/$memberId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Your Classes — Physique 57 India" }] }),
  component: ClassesPage,
});

type BookedClass = {
  session: SessionDTO;
  location: { id: number; name: string; mapsQ: string };
};

type ViewMode = "day" | "week" | "month";

type FormatInfo = {
  family: string;
  level: string;
  teaser: string;
  detail: string;
  bestFor: string;
  expect: string;
  icon: ReactNode;
  image: string;
};

const ACCENT = "#6732f5";
const DROP_IN_PRICE = "₹1,750";

const TRAINER_THUMBNAILS: Array<[string, string]> = [
  ["karan bhatia", karanBhatiaThumb],
  ["shruti kulkarni", shrutiKulkarniThumb],
  ["simonelle", simonelleThumb],
  ["pushyank", pushyankThumb],
  ["mrigakshi", mrigakshiThumb],
  ["pranjali", pranjaliThumb],
  ["richard", richardThumb],
  ["reshma", reshmaThumb],
  ["anisha", anishaThumb],
  ["atulan", atulanThumb],
  ["cauveri", cauveriThumb],
  ["kajol", kajolThumb],
  ["rohan", rohanThumb],
  ["saniya", saniyaThumb],
  ["vivaran", vivaranThumb],
  ["karanveer", karanveerThumb],
  ["anmol", anmolThumb],
  ["raunak", raunakThumb],
  ["simran", simranThumb],
  ["sovena", sovenaThumb],
  ["veena", veenaThumb],
  ["bret", bretThumb],
];

function normalizeTrainerName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function trainerImageForName(name?: string | null): string | null {
  const normalized = normalizeTrainerName(name ?? "");
  if (!normalized) return null;
  return (
    TRAINER_THUMBNAILS.find(
      ([trainerName]) => normalized.includes(trainerName) || trainerName.includes(normalized),
    )?.[1] ?? null
  );
}

function formatInfoForSession(session: SessionDTO): FormatInfo {
  const name = session.name.toLowerCase();

  if (name.includes("cycle") || name.includes("spin")) {
    return {
      family: "powerCycle",
      level: "OPEN LEVEL CARDIO",
      teaser:
        "Rhythm-driven indoor cycling that builds cardiovascular capacity and lower-body endurance.",
      detail:
        "A science-backed ride where cadence, resistance, and music work together. The class stays focused on pedaling mechanics and cardio intervals, with no weights or core work on the bike.",
      bestFor: "Low-impact cardio, endurance, and barre cross-training.",
      expect:
        "Bike setup, RPM and wattage cues, resistance pushes, speed surges, and active recovery blocks.",
      icon: <Bike className="h-4 w-4" aria-hidden="true" />,
      image: cycleImage,
    };
  }

  if (name.includes("fit") || name.includes("functional")) {
    return {
      family: "Studio FIT",
      level: "HIGH INTENSITY",
      teaser:
        "Functional interval training with strength work, endurance blocks, and core conditioning.",
      detail:
        "FIT is a 50-minute strength-based interval format using progressive resistance and athletic conditioning to challenge major muscle groups and core stability.",
      bestFor: "Members who want a demanding, weights-forward conditioning session.",
      expect:
        "Heavy weights, full-body circuits, cardio intervals, core work, and efficient transitions.",
      icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
      image: fitImage,
    };
  }

  if (name.includes("hiit")) {
    return {
      family: "HIIT",
      level: "INTERMEDIATE",
      teaser: "Cardio and strength intervals designed to maximize burn and training efficiency.",
      detail:
        "HIIT alternates high-output cardio bursts with active recovery and strength movements, targeting aerobic and anaerobic fitness in a compact class structure.",
      bestFor: "Members seeking a high-energy, sweat-forward full-body burn.",
      expect:
        "Fast intervals, bodyweight resistance, lunges, planks, sprints, and recovery blocks.",
      icon: <Flame className="h-4 w-4" aria-hidden="true" />,
      image: cardioImage,
    };
  }

  if (name.includes("cardio")) {
    return {
      family: "Cardio Barre",
      level: "INTERMEDIATE TO ADVANCED",
      teaser:
        "A faster barre format that combines sculpting precision with cardiovascular intervals.",
      detail:
        "Cardio Barre layers traditional barre work with dynamic, higher-intensity sequences to elevate heart rate, build endurance, and sculpt lean muscle.",
      bestFor: "Members who want a sweat-forward barre class with stronger cardio demand.",
      expect:
        "Standing barre work, light resistance, faster transitions, cardio bursts, and active recovery.",
      icon: <Flame className="h-4 w-4" aria-hidden="true" />,
      image: cardioImage,
    };
  }

  if (
    name.includes("strength") ||
    name.includes("lab") ||
    name.includes("pull") ||
    name.includes("push") ||
    name.includes("blaze")
  ) {
    return {
      family: "StrengthLab",
      level: "ADVANCED STRENGTH",
      teaser:
        "Structured circuit training with heavier weights, progressive overload, and power work.",
      detail:
        "StrengthLab is a 57-minute full-body strength class built around power, upper-body, lower-body, and core circuits. It prioritizes heavier weights, moderate reps, and clean form.",
      bestFor: "Experienced members with FIT experience or a consistent external strength base.",
      expect:
        "Dumbbells, kettlebells, resistance bands, pull-up bars, strength circuits, and form-led progressions.",
      icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
      image: strengthImage,
    };
  }

  if (name.includes("mat")) {
    return {
      family: "Mat 57",
      level: "MODERATE TO HIGH",
      teaser:
        "Pilates-inspired floor work focused on core strength, posture, balance, and flexibility.",
      detail:
        "Mat 57 brings Physique 57 sculpting techniques to the floor with targeted core work, posture training, alignment, balance, and flexibility sequences.",
      bestFor: "Core strength, better posture, flexibility, and all-level floor-based practice.",
      expect: "Mat-based core work, ab-focused sequences, alignment coaching, and deep control.",
      icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
      image: matImage,
    };
  }

  return {
    family: "Barre 57",
    level: "BEGINNER FRIENDLY",
    teaser:
      "The signature Physique 57 method: ballet-inspired movement, isometric holds, and targeted strength.",
    detail:
      "Barre 57 is the cornerstone format, rooted in Interval Overload with sculpting, toning, lengthening, upbeat music, and instructor-led precision.",
    bestFor: "All fitness levels, from newcomers to experienced practitioners.",
    expect: "Thighs, seat, arms, core, stretch, precise holds, dynamic reps, and modifications.",
    icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
    image: barreImage,
  };
}

function ClassesPage() {
  const { memberId: memberIdStr } = Route.useParams();
  const {
    locationId,
    checkout_session_id: checkoutSessionId,
    paidSessionId,
    paidLocationId,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const memberId = Number(memberIdStr);

  const listFn = useServerFn(listSessions);
  const bookFn = useServerFn(bookWithMembership);
  const createCheckoutFn = useServerFn(createNewcomersCheckoutSession);
  const completeCheckoutFn = useServerFn(completeNewcomersCheckoutBooking);
  const completedCheckoutRef = useRef<string | null>(null);

  const [sessions, setSessions] = useState<SessionDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [booked, setBooked] = useState<BookedClass | null>(null);
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [dateOffsetDays, setDateOffsetDays] = useState(0);

  const currentLoc = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];
  const pageSpanDays = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30;
  const fetchDaysAhead = Math.min(60, Math.max(pageSpanDays, dateOffsetDays + pageSpanDays));
  const dateStepDays = viewMode === "day" ? 1 : 7;
  const activeDateKey =
    viewMode === "day" ? dateKey(addDays(new Date(), dateOffsetDays)) : selectedDateKey;
  const windowStartKey = dateKey(addDays(new Date(), dateOffsetDays));
  const windowEndKey = dateKey(addDays(new Date(), dateOffsetDays + pageSpanDays));

  useEffect(() => {
    let cancel = false;
    setSessions(null);
    setLoadError(null);
    listFn({ data: { locationId, daysAhead: fetchDaysAhead } })
      .then((r) => {
        if (!cancel) setSessions(r.sessions);
      })
      .catch((e) => {
        if (!cancel) setLoadError(e instanceof Error ? e.message : "Failed to load schedule");
      });
    return () => {
      cancel = true;
    };
  }, [fetchDaysAhead, locationId, listFn]);

  useEffect(() => {
    if (!checkoutSessionId || !paidSessionId) return;
    if (completedCheckoutRef.current === checkoutSessionId) return;

    const checkoutLocationId = paidLocationId ?? locationId;
    const paidSession =
      sessions?.find((session) => session.id === paidSessionId) ??
      readStoredPaidCheckoutSession(paidSessionId);

    if (!paidSession) return;

    let cancel = false;
    completedCheckoutRef.current = checkoutSessionId;
    setBookErr(null);
    setBookingId(paidSessionId);

    completeCheckoutFn({
      data: {
        checkoutSessionId,
        memberId,
        sessionId: paidSessionId,
        homeLocationId: checkoutLocationId,
      },
    })
      .then(() => {
        if (cancel) return;
        clearStoredPaidCheckoutSession();
        setBooked({
          session: paidSession,
          location: bookingLocationForId(checkoutLocationId),
        });
        navigate({ search: { locationId: checkoutLocationId }, replace: true });
      })
      .catch((e) => {
        if (!cancel) {
          setBookErr(e instanceof Error ? e.message : "Paid booking failed");
        }
      })
      .finally(() => {
        if (!cancel) setBookingId(null);
      });

    return () => {
      cancel = true;
    };
  }, [
    checkoutSessionId,
    completeCheckoutFn,
    locationId,
    memberId,
    navigate,
    paidLocationId,
    paidSessionId,
    sessions,
  ]);

  async function onBook(s: SessionDTO) {
    setBookErr(null);
    setBookingId(s.id);
    try {
      if (isPaidNewcomersClassName(s.name)) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("checkout_session_id");
        currentUrl.searchParams.delete("paidSessionId");
        currentUrl.searchParams.delete("paidLocationId");

        storePaidCheckoutSession(s);
        const checkout = await createCheckoutFn({
          data: {
            memberId,
            sessionId: s.id,
            homeLocationId: locationId,
            className: s.name,
            sessionStartsAt: s.startsAt,
            successUrl: `${window.location.origin}/classes/${memberId}`,
            cancelUrl: currentUrl.toString(),
          },
        });
        window.location.assign(checkout.url);
        return;
      }

      await bookFn({ data: { memberId, sessionId: s.id, homeLocationId: locationId } });
      setBooked({ session: s, location: bookingLocationForId(currentLoc.id) });
    } catch (e) {
      setBookErr(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBookingId(null);
    }
  }

  const dateRail = useMemo(
    () => buildDateRail(viewMode, dateOffsetDays),
    [dateOffsetDays, viewMode],
  );
  const visibleSessions = useMemo(() => {
    const items = sessions ?? [];
    return items.filter((session) => {
      const sessionKey = dateKey(session.startsAt);
      if (activeDateKey) return sessionKey === activeDateKey;
      return sessionKey >= windowStartKey && sessionKey < windowEndKey;
    });
  }, [activeDateKey, sessions, windowEndKey, windowStartKey]);
  const grouped = useMemo(() => groupByDay(visibleSessions), [visibleSessions]);

  function switchViewMode(mode: ViewMode) {
    setViewMode(mode);
    setSelectedDateKey(null);
    setDateOffsetDays(0);
  }

  if (booked) return <ThankYou booked={booked} onAnother={() => setBooked(null)} />;

  return (
    <div className="min-h-screen bg-white text-[#1f1f22]">
      <header className="sticky top-0 z-30 border-b border-[#ececf1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Physique 57" className="h-9 w-auto" />
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#77757f]">
            Member #{memberId}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[23px] font-semibold tracking-[-0.01em]" style={{ color: ACCENT }}>
              Classes
            </h1>
            <div className="mt-1 h-0.5 w-5 rounded-full" style={{ backgroundColor: ACCENT }} />
          </div>
          <div className="flex shrink-0 overflow-hidden rounded-full border border-[#e1e1e7] bg-white p-0.5 shadow-[0_1px_2px_rgb(15_20_30/0.03)]">
            <button
              type="button"
              onClick={() => switchViewMode("day")}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                viewMode === "day"
                  ? "bg-white text-[#6732f5] ring-2 ring-[#6732f5]"
                  : "text-[#1f1f22]"
              }`}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Day
            </button>
            <button
              type="button"
              onClick={() => switchViewMode("week")}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                viewMode === "week"
                  ? "bg-white text-[#6732f5] ring-2 ring-[#6732f5]"
                  : "text-[#1f1f22]"
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              Week
            </button>
            <button
              type="button"
              onClick={() => switchViewMode("month")}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                viewMode === "month"
                  ? "bg-white text-[#6732f5] ring-2 ring-[#6732f5]"
                  : "text-[#1f1f22]"
              }`}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Month
            </button>
          </div>
        </div>

        <div className="mb-7 flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedDateKey(null);
              setDateOffsetDays((days) => Math.max(0, days - dateStepDays));
            }}
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e7e7ec] text-[#1f1f22] transition hover:border-[#6732f5] hover:text-[#6732f5] sm:flex"
            aria-label={`Previous ${viewMode}`}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <div
            className={`grid flex-1 gap-2 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-4 sm:grid-cols-7"}`}
          >
            {dateRail.map((item) => {
              const selected = activeDateKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (viewMode !== "day") setSelectedDateKey(selected ? null : item.key);
                  }}
                  className={`min-h-[54px] rounded-xl px-2 text-center transition ${
                    selected ? "bg-[#f4efff] text-[#6732f5]" : "text-[#77757f] hover:bg-[#f7f7fa]"
                  }`}
                >
                  <span className="block text-[11px] font-semibold uppercase leading-none">
                    {item.weekday}
                  </span>
                  <span
                    className={`mt-1 block text-lg font-semibold leading-none ${
                      selected ? "text-[#6732f5]" : "text-[#4e4d55]"
                    }`}
                  >
                    {item.day}
                  </span>
                  <span className="mt-2 flex justify-center gap-1" aria-hidden="true">
                    <span className="h-1 w-1 rounded-full bg-[#a8a6ad]" />
                    <span className="h-1 w-1 rounded-full bg-[#a8a6ad]" />
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedDateKey(null);
              setDateOffsetDays((days) => days + dateStepDays);
            }}
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e7e7ec] text-[#1f1f22] transition hover:border-[#6732f5] hover:text-[#6732f5] sm:flex"
            aria-label={`Next ${viewMode}`}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-7 grid gap-3 md:grid-cols-[auto_auto_1fr_1fr]">
          <button
            type="button"
            onClick={() => {
              if (viewMode === "day") {
                setViewMode("week");
                setDateOffsetDays(0);
              }
              setSelectedDateKey(null);
            }}
            className="h-11 rounded-full border border-[#e5e5ea] bg-white px-4 text-sm font-semibold uppercase text-[#1f1f22] transition hover:border-[#6732f5] hover:text-[#6732f5]"
          >
            Show all
          </button>
          <button
            type="button"
            onClick={() => {
              setDateOffsetDays(0);
              setSelectedDateKey(viewMode === "day" ? null : dateKey(new Date()));
            }}
            className="h-11 rounded-full border border-[#e5e5ea] bg-white px-5 text-sm font-semibold uppercase text-[#1f1f22] transition hover:border-[#6732f5] hover:text-[#6732f5]"
          >
            Today
          </button>
          <div className="h-11 rounded-full border border-[#e5e5ea] bg-white px-5">
            <div className="flex h-full items-center justify-between gap-3 text-sm font-semibold">
              <span>Instructors</span>
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="h-11 rounded-full border border-[#e5e5ea] bg-white px-5">
            <div className="flex h-full items-center justify-between gap-3 text-sm font-semibold">
              <span>{currentLoc.name.split(",")[0]}</span>
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {LOCATIONS.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate({ search: { locationId: l.id }, replace: true })}
              className={`h-9 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                l.id === locationId
                  ? "border-[#6732f5] bg-[#6732f5] text-white"
                  : "border-[#e5e5ea] bg-white text-[#5f5d66] hover:border-[#6732f5] hover:text-[#6732f5]"
              }`}
            >
              {l.name.split(",")[0]}
            </button>
          ))}
        </div>

        {bookErr && (
          <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{bookErr}</p>
        )}

        {loadError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
        )}

        {!sessions && !loadError && <ScheduleSkeleton />}

        {sessions && sessions.length === 0 && (
          <div className="rounded-[24px] border border-[#dedee5] bg-white p-10 text-center text-[#65636d]">
            No upcoming classes in this {viewMode} view at this studio.
          </div>
        )}

        {sessions && sessions.length > 0 && grouped.length === 0 && (
          <div className="rounded-[24px] border border-[#dedee5] bg-white p-10 text-center text-[#65636d]">
            No classes match this date. Show all classes to browse the full schedule.
          </div>
        )}

        {sessions && grouped.length > 0 && (
          <div className="space-y-7">
            {grouped.map(({ day, items, relative }) => (
              <section key={day} className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#686771]">
                  {relative}
                </h2>
                <div className="space-y-5">
                  {items.map((s) => (
                    <SessionCard
                      key={s.id}
                      s={s}
                      loading={bookingId === s.id}
                      requiresPayment={isPaidNewcomersClassName(s.name)}
                      onBook={() => onBook(s)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function SessionCard({
  s,
  loading,
  requiresPayment,
  onBook,
}: {
  s: SessionDTO;
  loading: boolean;
  requiresPayment: boolean;
  onBook: () => void;
}) {
  const start = new Date(s.startsAt);
  const end = new Date(s.endsAt);
  const dateLabel = start.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const timeLabel = `${formatTime(start)} - ${formatTime(end)}`;
  const isFull = s.spotsLeft === 0;
  const format = formatInfoForSession(s);
  const teacherImage = trainerImageForName(s.teacherName) ?? s.bannerImageUrl ?? trainerPortrait;

  return (
    <article className="relative grid gap-5 overflow-visible rounded-[24px] border border-[#dfdfe6] bg-white p-5 shadow-[0_1px_2px_rgb(20_20_28/0.02)] transition hover:border-[#cfc9ef] hover:shadow-[0_18px_40px_rgb(30_24_70/0.08)] md:grid-cols-[150px_minmax(0,1fr)_180px] md:p-8">
      <div className="flex items-start gap-4 md:block">
        <img
          src={format.image}
          alt={`${format.family} class format`}
          className="h-28 w-28 shrink-0 rounded-[18px] object-cover object-top md:h-32 md:w-32"
        />
        <div className="md:hidden">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#686771]">Class</p>
          <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#202024]">{s.name}</h3>
        </div>
      </div>

      <div className="min-w-0">
        <p className="hidden text-[11px] font-bold uppercase tracking-[0.22em] text-[#686771] md:block">
          Class
        </p>
        <h3 className="hidden text-[34px] font-bold leading-[1.05] tracking-[-0.05em] text-[#202024] md:block">
          {s.name}
        </h3>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <img
            src={teacherImage}
            alt={s.teacherName ? `${s.teacherName} instructor thumbnail` : ""}
            className="h-7 w-7 rounded-full object-cover object-top"
            aria-hidden={!s.teacherName}
          />
          <span className="font-medium text-[#232329]">{s.teacherName ?? "Studio Instructor"}</span>
          <span className="text-[#c5c3ca]" aria-hidden="true">
            •
          </span>
          <FormatTrigger format={format} />
        </div>

        <p className="mt-4 max-w-[44rem] text-base font-semibold leading-snug text-[#686771]">
          {format.level} - {format.teaser}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5a5862]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6f4ff] px-3 py-1 text-[#6732f5]">
            {format.icon}
            {format.family}
          </span>
          <span className="rounded-full bg-[#f7f7fa] px-3 py-1">{format.bestFor}</span>
        </div>

        <div className="mt-4 grid gap-3 text-[15px] font-medium text-[#55535d]">
          <ScheduleMeta icon={<CalendarDays className="h-4 w-4" />} text={dateLabel} />
          <ScheduleMeta
            icon={<Clock3 className="h-4 w-4" />}
            text={`${timeLabel} · ${s.durationInMinutes} min`}
          />
          <ScheduleMeta icon={<MapPin className="h-4 w-4" />} text={s.locationName ?? "Studio"} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#e4e4ea] pt-5 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-7 md:pt-0">
        <div className="text-right">
          <p className="text-3xl font-bold tracking-[-0.05em] text-[#202024]">{DROP_IN_PRICE}</p>
          {requiresPayment && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6732f5]">
              Newcomers 2 For 1
            </p>
          )}
          {s.spotsLeft != null && (
            <p
              className={`mt-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
                isFull ? "text-red-600" : s.spotsLeft <= 3 ? "text-[#6732f5]" : "text-[#77757f]"
              }`}
            >
              {isFull ? "Full" : `${s.spotsLeft} spots left`}
            </p>
          )}
        </div>
        <button
          onClick={onBook}
          disabled={loading || isFull}
          className="h-[52px] min-w-[140px] rounded-[11px] bg-[#6732f5] px-7 text-base font-bold text-white transition hover:bg-[#5424d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6732f5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading
            ? requiresPayment
              ? "Redirecting..."
              : "Booking..."
            : isFull
              ? "Class full"
              : requiresPayment
                ? "Pay & book"
                : "Book now"}
        </button>
      </div>
    </article>
  );
}

function FormatTrigger({ format }: { format: FormatInfo }) {
  return (
    <span className="group/format relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[#5f5d66] outline-none transition hover:text-[#6732f5] focus-visible:text-[#6732f5]"
      >
        {format.icon}
        Show format
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-8 z-30 hidden w-[340px] rounded-[18px] border border-[#dedce8] bg-white p-3 text-left shadow-[0_24px_60px_rgb(25_20_45/0.16)] group-hover/format:block group-focus-within/format:block md:left-1/2 md:-translate-x-1/2"
      >
        <img
          src={format.image}
          alt={`${format.family} format preview`}
          className="h-36 w-full rounded-[12px] object-cover"
        />
        <span className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6732f5]">
          {format.icon}
          {format.family}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-[#4d4b55]">{format.detail}</span>
        <span className="mt-3 grid gap-2 rounded-[12px] bg-[#f8f8fb] p-3 text-xs leading-relaxed text-[#4d4b55]">
          <span>
            <strong className="text-[#232329]">Intensity:</strong> {format.level}
          </span>
          <span>
            <strong className="text-[#232329]">Best for:</strong> {format.bestFor}
          </span>
          <span>
            <strong className="text-[#232329]">What to expect:</strong> {format.expect}
          </span>
        </span>
      </span>
    </span>
  );
}

function ScheduleMeta({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-5 w-5 items-center justify-center text-[#8b8992]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="grid animate-pulse gap-5 rounded-[24px] border border-[#dfdfe6] bg-white p-5 md:grid-cols-[150px_minmax(0,1fr)_180px] md:p-8"
        >
          <div className="h-28 w-28 rounded-[18px] bg-[#eeeeF3] md:h-32 md:w-32" />
          <div>
            <div className="mb-4 h-3 w-16 rounded bg-[#eeeeF3]" />
            <div className="mb-5 h-8 w-3/4 rounded bg-[#eeeeF3]" />
            <div className="mb-4 h-4 w-1/2 rounded bg-[#eeeeF3]" />
            <div className="h-4 w-5/6 rounded bg-[#eeeeF3]" />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#e4e4ea] pt-5 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-7 md:pt-0">
            <div className="h-8 w-24 rounded bg-[#eeeeF3]" />
            <div className="h-12 w-36 rounded-[11px] bg-[#eeeeF3]" />
          </div>
        </div>
      ))}
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

function buildDateRail(viewMode: ViewMode, offsetDays: number) {
  const count = viewMode === "day" ? 1 : 7;
  const start = addDays(new Date(), offsetDays);
  return Array.from({ length: count }).map((_, index) => {
    const date = addDays(start, index);
    return {
      key: dateKey(date),
      weekday: date
        .toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" })
        .toUpperCase(),
      day: date.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }),
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

function relativeDayLabel(date: Date): string {
  const key = dateKey(date);
  if (key === dateKey(new Date())) return "Today";
  if (key === dateKey(addDays(new Date(), 1))) return "Tomorrow";
  return date
    .toLocaleDateString("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    })
    .toUpperCase();
}

function groupByDay(sessions: SessionDTO[]): Array<{
  day: string;
  relative: string;
  items: SessionDTO[];
}> {
  const buckets = new Map<string, { date: Date; items: SessionDTO[] }>();
  for (const s of sessions) {
    const d = new Date(s.startsAt);
    const day = dateKey(d);
    if (!buckets.has(day)) buckets.set(day, { date: d, items: [] });
    buckets.get(day)!.items.push(s);
  }
  return Array.from(buckets.entries()).map(([day, bucket]) => ({
    day,
    relative: relativeDayLabel(bucket.date),
    items: bucket.items,
  }));
}

function bookingLocationForId(locationId: number): BookedClass["location"] {
  const location = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];
  const mapsQ =
    location.name === "Kwality House, Kemps Corner"
      ? "Physique 57 India Kwality House Kemps Corner Mumbai"
      : "Physique 57 India Supreme HQ Bandra Mumbai";
  return { id: location.id, name: location.name, mapsQ };
}

function storePaidCheckoutSession(session: SessionDTO) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("p57PaidCheckoutSession", JSON.stringify(session));
}

function readStoredPaidCheckoutSession(sessionId: number): SessionDTO | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem("p57PaidCheckoutSession");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionDTO;
    return parsed.id === sessionId ? parsed : null;
  } catch {
    return null;
  }
}

function clearStoredPaidCheckoutSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("p57PaidCheckoutSession");
}

// ============= Thank-you screen =============

function classPolicy(name: string): { entryMin: number; cancelHrs: number; family: string } {
  const n = name.toLowerCase();
  if (n.includes("cycle") || n.includes("spin")) {
    return { entryMin: 5, cancelHrs: 6, family: "powerCycle" };
  }
  return { entryMin: 10, cancelHrs: 4, family: "Barre" };
}

function ThankYou({ booked, onAnother }: { booked: BookedClass; onAnother: () => void }) {
  const policy = classPolicy(booked.session.name);
  const start = new Date(booked.session.startsAt);
  const dateStr = start.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });
  const timeStr = start.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-9 w-auto" />
          </Link>
          <button
            onClick={onAnother}
            className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-foreground"
          >
            ← Back to schedule
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-14">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-6 animate-scale-in">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary-deep font-bold mb-3">
            You're booked
          </p>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">
            See you at the barre.
          </h1>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-card)]">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary-deep font-bold mb-3">
              Your class
            </p>
            <h2 className="font-display text-3xl">{booked.session.name}</h2>
            {booked.session.teacherName && (
              <p className="text-sm text-muted-foreground mt-1">
                with {booked.session.teacherName}
              </p>
            )}
            <div className="mt-5 space-y-2 text-sm">
              <Row label="When" value={`${dateStr} · ${timeStr}`} />
              <Row label="Duration" value={`${booked.session.durationInMinutes} minutes`} />
              <Row label="Studio" value={booked.location.name} />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booked.location.mapsQ)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block text-xs uppercase tracking-[0.15em] font-bold text-primary-deep underline"
            >
              Get directions →
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
            <iframe
              title="Studio map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(booked.location.mapsQ)}&output=embed`}
              className="w-full h-full min-h-[280px] border-0"
              loading="lazy"
            />
          </div>
        </div>

        {/* Policies */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <PolicyCard
            tone="primary"
            family={policy.family}
            title="Late entry policy"
            valueBig={`${policy.entryMin} min`}
            valueLabel="grace period"
            icon={<ClockIcon />}
            body={`For ${policy.family} classes, entry is permitted strictly until ${policy.entryMin} minutes after the class start time. After that, our doors close to protect everyone's workout.`}
          />
          <PolicyCard
            tone="dark"
            family={policy.family}
            title="Late cancellation policy"
            valueBig={`${policy.cancelHrs} hrs`}
            valueLabel="advance notice"
            icon={<XCircleIcon />}
            body={`Please cancel at least ${policy.cancelHrs} hours before your ${policy.family} class to avoid a late-cancel fee. No-shows are also charged.`}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <button
            onClick={onAnother}
            className="h-12 px-6 rounded-full bg-foreground text-background text-xs uppercase tracking-[0.2em] font-bold"
          >
            Book another class
          </button>
          <a
            href={`https://wa.me/919004001057?text=${encodeURIComponent(`Hi! I just booked ${booked.session.name} at ${booked.location.name}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="h-12 px-6 rounded-full bg-[#25D366] text-white text-xs uppercase tracking-[0.2em] font-bold flex items-center"
          >
            Message the studio
          </a>
        </div>
      </main>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right">{value}</span>
    </div>
  );
}

function PolicyCard({
  tone,
  family,
  title,
  valueBig,
  valueLabel,
  icon,
  body,
}: {
  tone: "primary" | "dark";
  family: string;
  title: string;
  valueBig: string;
  valueLabel: string;
  icon: React.ReactNode;
  body: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      className={`rounded-2xl p-6 border ${
        dark
          ? "bg-foreground text-background border-foreground"
          : "bg-gradient-to-br from-primary/30 to-primary/10 border-primary/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-primary text-foreground" : "bg-foreground text-background"}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p
            className={`text-[10px] uppercase tracking-[0.25em] font-bold ${dark ? "text-primary" : "text-primary-deep"}`}
          >
            {family} · {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-5xl leading-none">{valueBig}</span>
            <span
              className={`text-xs uppercase tracking-widest ${dark ? "text-background/60" : "text-muted-foreground"}`}
            >
              {valueLabel}
            </span>
          </div>
          <p
            className={`mt-3 text-sm leading-relaxed ${dark ? "text-background/80" : "text-foreground/80"}`}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
function XCircleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  );
}
