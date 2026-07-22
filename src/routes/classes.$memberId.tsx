import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  BadgeCheck,
  Bike,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  List,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  UserRound,
  Zap,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCATIONS } from "@/lib/momence-locations";
import { CLASS_FORMAT_KEYS, type ClassFormatKey } from "@/lib/class-format-matchers";
import {
  listSessions,
  bookWithMembership,
  type SessionDTO,
} from "@/lib/momence-sessions.functions";
import {
  completeNewcomersCheckoutBooking,
  createNewcomersCheckoutSession,
} from "@/lib/stripe-checkout.functions";
import { getSchedulePriceDisplay, isPaidNewcomersClassName } from "@/lib/momence-booking.helpers";
import { buildClearedPaidCheckoutUrl } from "@/lib/classes-route.helpers";
import { saveCustomerFieldsForMember } from "@/lib/momence-customer-fields.functions";
import {
  sanitizePhoneNumber,
  validateCustomerFieldValues,
  type CustomerFieldErrors,
  type CustomerFieldValues,
} from "@/lib/momence-customer-fields.helpers";
import {
  classFormatForSessionName,
  classFormatForKey,
  classTypeOptionsForLocation,
} from "@/lib/class-formats";
import {
  addCalendarMonths,
  buildMonthCalendarWeeks,
  startOfCalendarMonth,
  type MonthCalendarWeek,
} from "@/lib/schedule-calendar.helpers";
import { whatsappPhoneForLocationId } from "@/lib/whatsapp-contact.helpers";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Footer } from "@/components/Footer";
import trainerPortrait from "@/assets/2136 _ Physique57 _ Trainer Shots _ _56A2021.jpg";
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
  classType: z.enum(CLASS_FORMAT_KEYS).optional(),
});

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/classes/$memberId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Your Classes - Physique 57 India" }] }),
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
  levelIcon: ReactNode;
  image: string;
};

const ACCENT = "#1d7cf2";

function formatInr(amountInRupees: string | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amountInRupees));
}

const emptyCustomerFieldValues: CustomerFieldValues = {
  fitnessGoal: "",
  emergencyContactInfo: "",
  pregnancyStatus: "",
  medicalHistory: "",
  postNatalStatus: "",
  fnf: "",
  gender: "",
  euShoeSize: "",
  howDidHear: "",
};

const FITNESS_GOAL_SUGGESTIONS = [
  "Build strength",
  "Improve flexibility",
  "Weight management",
  "Better posture",
] as const;

const MEDICAL_HISTORY_SUGGESTIONS = [
  "No concerns",
  "Back or neck pain",
  "Knee or ankle concern",
  "Previous injury",
] as const;

const EU_SHOE_SIZE_OPTIONS: Array<[string, string]> = Array.from({ length: 13 }, (_, index) => {
  const size = String(index + 35);
  return [size, size];
});

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
  return formatInfoForKey(classFormatForSessionName(session.name).key);
}

function formatInfoForKey(key: ClassFormatKey): FormatInfo {
  const classFormat = classFormatForKey(key);

  switch (classFormat.key) {
    case "power-cycle":
      return {
        family: classFormat.name,
        level: "ALL LEVELS",
        teaser:
          "Rhythm-driven indoor cycling that builds cardiovascular capacity and lower-body endurance.",
        detail:
          "A science-backed ride where cadence, resistance, and music work together. The class stays focused on pedaling mechanics and cardio intervals, with no weights or core work on the bike.",
        bestFor: "Low-impact cardio, endurance, and barre cross-training.",
        expect:
          "Bike setup, RPM and wattage cues, resistance pushes, speed surges, and active recovery blocks.",
        icon: <Bike className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Bike className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "studio-fit":
      return {
        family: classFormat.name,
        level: "HIGH INTENSITY",
        teaser:
          "Functional interval training with strength work, endurance blocks, and core conditioning.",
        detail:
          "FIT is a 50-minute strength-based interval format using progressive resistance and athletic conditioning to challenge major muscle groups and core stability.",
        bestFor: "Members who want a demanding, weights-forward conditioning session.",
        expect:
          "Heavy weights, full-body circuits, cardio intervals, core work, and efficient transitions.",
        icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Zap className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "recovery":
      return {
        family: classFormat.name,
        level: "LOW INTENSITY RESTORATIVE",
        teaser:
          "Mobility, breath, and lengthening work designed to restore the body between classes.",
        detail:
          "Recovery slows the pace down with guided mobility, assisted stretch patterns, breath-led resets, and low-intensity movement to support flexibility and better training consistency.",
        bestFor: "Mobility, flexibility, active recovery, and nervous-system reset.",
        expect:
          "Breath work, long holds, gentle mobility, supported stretches, and slower transitions.",
        icon: <HeartPulse className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <HeartPulse className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "hiit":
      return {
        family: classFormat.name,
        level: "INTERMEDIATE",
        teaser: "Cardio and strength intervals designed to maximize burn and training efficiency.",
        detail:
          "HIIT alternates high-output cardio bursts with active recovery and strength movements, targeting aerobic and anaerobic fitness in a compact class structure.",
        bestFor: "Members seeking a high-energy, sweat-forward full-body burn.",
        expect:
          "Fast intervals, bodyweight resistance, lunges, planks, sprints, and recovery blocks.",
        icon: <Flame className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Zap className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "cardio-barre-plus":
      return {
        family: classFormat.name,
        level: "ADVANCED CARDIO BARRE",
        teaser:
          "A stronger cardio-barre progression with longer burn blocks and sharper transitions.",
        detail:
          "Cardio Barre Plus builds from classic barre precision into athletic, heart-rate-elevating sequences with added endurance work, quick transitions, and sustained sculpting blocks.",
        bestFor: "Members who want a more athletic barre challenge.",
        expect:
          "Faster barre combinations, cardio intervals, standing sculpting, active recovery, and core work.",
        icon: <Flame className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Flame className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "cardio-barre":
      return {
        family: classFormat.name,
        level: "INTERMEDIATE TO ADVANCED",
        teaser:
          "A faster barre format that combines sculpting precision with cardiovascular intervals.",
        detail:
          "Cardio Barre layers traditional barre work with dynamic, higher-intensity sequences to elevate heart rate, build endurance, and sculpt lean muscle.",
        bestFor: "Members who want a sweat-forward barre class with stronger cardio demand.",
        expect:
          "Standing barre work, light resistance, faster transitions, cardio bursts, and active recovery.",
        icon: <Flame className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Zap className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "back-body-blaze":
      return {
        family: classFormat.name,
        level: "ADVANCED POSTERIOR CHAIN",
        teaser: "Focused strength work for glutes, hamstrings, back, posture, and core stability.",
        detail:
          "Back Body Blaze targets the posterior chain with controlled resistance, posture-focused pulls, glute and hamstring work, and stability sequences that support stronger movement patterns.",
        bestFor: "Back-body strength, posture, glutes, hamstrings, and power.",
        expect:
          "Rows, hinges, glute work, hamstring sets, resistance bands, heavier weights, and core stability.",
        icon: <Flame className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "strength-lab":
      return {
        family: classFormat.name,
        level: "ADVANCED STRENGTH",
        teaser:
          "Structured circuit training with heavier weights, progressive overload, and power work.",
        detail:
          "StrengthLab is a 57-minute full-body strength class built around power, upper-body, lower-body, and core circuits. It prioritizes heavier weights, moderate reps, and clean form.",
        bestFor: "Experienced members with FIT experience or a consistent external strength base.",
        expect:
          "Dumbbells, kettlebells, resistance bands, pull-up bars, strength circuits, and form-led progressions.",
        icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    case "mat-57":
      return {
        family: classFormat.name,
        level: "MODERATE TO HIGH",
        teaser:
          "Pilates-inspired floor work focused on core strength, posture, balance, and flexibility.",
        detail:
          "Mat 57 brings Physique 57 sculpting techniques to the floor with targeted core work, posture training, alignment, balance, and flexibility sequences.",
        bestFor: "Core strength, better posture, flexibility, and all-level floor-based practice.",
        expect: "Mat-based core work, ab-focused sequences, alignment coaching, and deep control.",
        icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <BadgeCheck className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
    default:
      return {
        family: classFormat.name,
        level: "BEGINNER FRIENDLY",
        teaser:
          "The signature Physique 57 workout combines precise, controlled movements, isometric holds and targeted strength exercises to sculpt, tone and strengthen the entire body, all set to energising music.",
        detail:
          "Barre 57 is the cornerstone format, rooted in Interval Overload with sculpting, toning, lengthening, upbeat music, and instructor-led precision.",
        bestFor: "All fitness levels, from newcomers to experienced practitioners.",
        expect:
          "Thighs, seat, arms, core, stretch, precise holds, dynamic reps, and modifications.",
        icon: <Dumbbell className="h-4 w-4" aria-hidden="true" />,
        levelIcon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
        image: classFormat.image,
      };
  }
}

function requiresCycleShoeSize(session: SessionDTO): boolean {
  const name = session.name.toLowerCase();
  return name.includes("cycle") || name.includes("spin");
}

const EXCLUDED_CLASS_NAME_KEYWORDS = ["hosted", "physique 57", "p57", "studio juniors"];

function isExcludedClassName(name: string): boolean {
  const lower = name.toLowerCase();
  return EXCLUDED_CLASS_NAME_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function ClassesPage() {
  const { memberId: memberIdStr } = Route.useParams();
  const {
    locationId,
    checkout_session_id: checkoutSessionId,
    paidSessionId,
    paidLocationId,
    classType: initialClassType,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const memberId = Number(memberIdStr);

  const listFn = useServerFn(listSessions);
  const bookFn = useServerFn(bookWithMembership);
  const createCheckoutFn = useServerFn(createNewcomersCheckoutSession);
  const completeCheckoutFn = useServerFn(completeNewcomersCheckoutBooking);
  const saveCustomerFieldsFn = useServerFn(saveCustomerFieldsForMember);
  const completedCheckoutRef = useRef<string | null>(null);
  const activeCheckoutRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  const [sessions, setSessions] = useState<SessionDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [booked, setBooked] = useState<BookedClass | null>(null);
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [customFieldsSession, setCustomFieldsSession] = useState<SessionDTO | null>(null);
  const [customFieldValues, setCustomFieldValues] =
    useState<CustomerFieldValues>(emptyCustomerFieldValues);
  const [customFieldErrors, setCustomFieldErrors] = useState<CustomerFieldErrors>({});
  const [customFieldSubmitError, setCustomFieldSubmitError] = useState<string | null>(null);
  const [customFieldSaving, setCustomFieldSaving] = useState(false);
  const [activeClassType, setActiveClassType] = useState<ClassFormatKey>(() => {
    const allowed = classTypeOptionsForLocation(locationId);
    return initialClassType && allowed.includes(initialClassType) ? initialClassType : allowed[0];
  });
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [dateOffsetDays, setDateOffsetDays] = useState(0);
  const [monthOffsetMonths, setMonthOffsetMonths] = useState(0);

  const currentLoc = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];
  const whatsappPhone = whatsappPhoneForLocationId(currentLoc.id);
  const monthStart = useMemo(
    () => startOfCalendarMonth(addCalendarMonths(new Date(), monthOffsetMonths)),
    [monthOffsetMonths],
  );
  const nextMonthStart = useMemo(() => addCalendarMonths(monthStart, 1), [monthStart]);
  const monthLabel = monthStart.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const monthCalendarWeeks = useMemo(() => buildMonthCalendarWeeks(monthStart), [monthStart]);
  const pageSpanDays = viewMode === "day" ? 1 : 7;
  const monthFetchDaysAhead = Math.max(1, daysUntilDate(nextMonthStart));
  const fetchDaysAhead =
    viewMode === "month"
      ? Math.min(60, monthFetchDaysAhead)
      : Math.min(60, Math.max(pageSpanDays, dateOffsetDays + pageSpanDays));
  const dateStepDays = viewMode === "day" ? 1 : 7;
  const activeDateKey =
    viewMode === "day"
      ? dateKey(addDays(new Date(), dateOffsetDays))
      : viewMode === "week"
        ? selectedDateKey
        : null;
  const windowStartKey =
    viewMode === "month" ? dateKey(monthStart) : dateKey(addDays(new Date(), dateOffsetDays));
  const windowEndKey =
    viewMode === "month"
      ? dateKey(nextMonthStart)
      : dateKey(addDays(new Date(), dateOffsetDays + pageSpanDays));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const allowed = classTypeOptionsForLocation(locationId);
    if (!allowed.includes(activeClassType)) {
      setActiveClassType(allowed[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    let cancel = false;
    setSessions(null);
    setLoadError(null);
    listFn({ data: { locationId, daysAhead: fetchDaysAhead } })
      .then((r) => {
        if (!cancel) setSessions(r.sessions.filter((s) => !isExcludedClassName(s.name)));
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
    if (activeCheckoutRef.current === checkoutSessionId) return;

    const checkoutLocationId = paidLocationId ?? locationId;
    const paidSession =
      sessions?.find((session) => session.id === paidSessionId) ??
      readStoredPaidCheckoutSession(paidSessionId);

    if (!paidSession) return;

    activeCheckoutRef.current = checkoutSessionId;
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
        if (!mountedRef.current || activeCheckoutRef.current !== checkoutSessionId) return;
        completedCheckoutRef.current = checkoutSessionId;
        clearStoredPaidCheckoutSession();
        setBooked({
          session: paidSession,
          location: bookingLocationForId(checkoutLocationId),
        });
        window.history.replaceState(
          window.history.state,
          "",
          buildClearedPaidCheckoutUrl(window.location.href, checkoutLocationId),
        );
      })
      .catch((e) => {
        if (!mountedRef.current || activeCheckoutRef.current !== checkoutSessionId) return;
        setBookErr(e instanceof Error ? e.message : "Paid booking failed");
      })
      .finally(() => {
        if (!mountedRef.current || activeCheckoutRef.current !== checkoutSessionId) return;
        activeCheckoutRef.current = null;
        setBookingId(null);
      });
  }, [
    checkoutSessionId,
    completeCheckoutFn,
    locationId,
    memberId,
    paidLocationId,
    paidSessionId,
    sessions,
  ]);

  function openCustomerFields(session: SessionDTO) {
    setBookErr(null);
    setCustomFieldSubmitError(null);
    setCustomFieldErrors({});
    setCustomFieldValues(emptyCustomerFieldValues);
    setCustomFieldsSession(session);
  }

  function updateCustomerFieldValue(field: keyof CustomerFieldValues, value: string) {
    setCustomFieldValues((current) => ({ ...current, [field]: value }));
    setCustomFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onCustomerFieldsSubmit() {
    const session = customFieldsSession;
    if (!session) return;

    const errors = validateCustomerFieldValues(customFieldValues, {
      requiresShoeSize: requiresCycleShoeSize(session),
    });

    if (Object.keys(errors).length > 0) {
      setCustomFieldErrors(errors);
      return;
    }

    setCustomFieldSaving(true);
    setCustomFieldSubmitError(null);
    try {
      await saveCustomerFieldsFn({
        data: {
          memberId,
          requiresShoeSize: requiresCycleShoeSize(session),
          values: customFieldValues,
        },
      });
      setCustomFieldsSession(null);
      await continueBooking(session);
    } catch (e) {
      setCustomFieldSubmitError(
        e instanceof Error ? e.message : "Could not save profile details before booking.",
      );
    } finally {
      setCustomFieldSaving(false);
    }
  }

  async function continueBooking(s: SessionDTO) {
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
      if (classFormatForSessionName(session.name).key !== activeClassType) return false;
      const sessionKey = dateKey(session.startsAt);
      if (activeDateKey) return sessionKey === activeDateKey;
      return sessionKey >= windowStartKey && sessionKey < windowEndKey;
    });
  }, [activeClassType, activeDateKey, sessions, windowEndKey, windowStartKey]);
  const grouped = useMemo(() => groupByDay(visibleSessions), [visibleSessions]);
  const sessionsByDay = useMemo(() => groupSessionsByDate(visibleSessions), [visibleSessions]);
  const filterClassTypes = useMemo(() => {
    const available = classTypeOptionsForLocation(locationId);
    const priority: ClassFormatKey[] = ["barre-57", "power-cycle"];
    const ordered = [
      ...priority.filter((key) => available.includes(key)),
      ...available.filter((key) => !priority.includes(key)),
    ];
    return ordered;
  }, [locationId]);

  function switchViewMode(mode: ViewMode) {
    setViewMode(mode);
    setSelectedDateKey(null);
    setDateOffsetDays(0);
    setMonthOffsetMonths(0);
  }

  function goPreviousRange() {
    setSelectedDateKey(null);
    if (viewMode === "month") {
      setMonthOffsetMonths((months) => Math.max(0, months - 1));
      return;
    }
    setDateOffsetDays((days) => Math.max(0, days - dateStepDays));
  }

  function goNextRange() {
    setSelectedDateKey(null);
    if (viewMode === "month") {
      setMonthOffsetMonths((months) => months + 1);
      return;
    }
    setDateOffsetDays((days) => days + dateStepDays);
  }

  function showAllClasses() {
    if (viewMode === "day") {
      setViewMode("week");
    }
    setSelectedDateKey(null);
    setDateOffsetDays(0);
    setMonthOffsetMonths(0);
  }

  function jumpToToday() {
    setDateOffsetDays(0);
    setMonthOffsetMonths(0);
    setSelectedDateKey(viewMode === "week" ? dateKey(new Date()) : null);
  }

  if (booked) return <ThankYou booked={booked} onAnother={() => setBooked(null)} />;

  return (
    <div className="min-h-screen bg-[#f4f8ff] text-[#172033]">
      <header className="sticky top-0 z-30 border-b border-[#d9e7fb] bg-white/90 shadow-[0_1px_0_rgb(29_124_242/0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Physique 57" className="h-9 w-auto" />
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#63708a]">
            Member #{memberId}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <section className="mb-8 rounded-[24px] border border-[#d9e7fb] bg-white p-4 shadow-[0_16px_42px_rgb(29_124_242/0.08)] md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6e7c96]">
                {currentLoc.name.split(",")[0]}
              </p>
              <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.03em] text-[#172033]">
                Class schedule
              </h1>
              <div className="mt-1 h-0.5 w-5 rounded-full" style={{ backgroundColor: ACCENT }} />
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-full border border-[#d3e3fb] bg-[#f5f9ff] p-1 shadow-inner shadow-white">
              <button
                type="button"
                onClick={() => switchViewMode("day")}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                  viewMode === "day"
                    ? "bg-[#1d7cf2] text-white shadow-[0_8px_18px_rgb(29_124_242/0.28)]"
                    : "text-[#42526b] hover:bg-white"
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
                    ? "bg-[#1d7cf2] text-white shadow-[0_8px_18px_rgb(29_124_242/0.28)]"
                    : "text-[#42526b] hover:bg-white"
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
                    ? "bg-[#1d7cf2] text-white shadow-[0_8px_18px_rgb(29_124_242/0.28)]"
                    : "text-[#42526b] hover:bg-white"
                }`}
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Month
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-[20px] border border-[#d9e7fb] bg-[#f7faff] p-2">
            <button
              type="button"
              onClick={goPreviousRange}
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d3e3fb] bg-white text-[#2a3b57] shadow-[0_8px_18px_rgb(30_24_70/0.05)] transition hover:border-[#1d7cf2] hover:text-[#1d7cf2] sm:flex"
              aria-label={`Previous ${viewMode}`}
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <div
              className={
                viewMode === "month"
                  ? "flex-1"
                  : `grid flex-1 gap-2 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-4 sm:grid-cols-7"}`
              }
            >
              {viewMode === "month" ? (
                <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-[16px] bg-white px-5 shadow-[0_10px_22px_rgb(29_124_242/0.1)] ring-1 ring-[#deebfd]">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f7f99]">
                      Calendar month
                    </span>
                    <span className="mt-1 block text-2xl font-bold tracking-[-0.04em] text-[#172033]">
                      {monthLabel}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#ebf3ff] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1d7cf2] ring-1 ring-[#d8e8ff]">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {visibleSessions.length} {visibleSessions.length === 1 ? "class" : "classes"}
                  </span>
                </div>
              ) : (
                dateRail.map((item) => {
                  const selected = activeDateKey === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        if (viewMode !== "day") setSelectedDateKey(selected ? null : item.key);
                      }}
                      className={`min-h-[64px] rounded-[18px] px-2 text-center transition ${
                        selected
                          ? "bg-white text-[#1d7cf2] shadow-[0_10px_22px_rgb(29_124_242/0.12)] ring-1 ring-[#d7e8ff]"
                          : "text-[#6f7f99] hover:bg-white/70"
                      }`}
                    >
                      <span className="block text-[11px] font-semibold uppercase leading-none">
                        {item.weekday}
                      </span>
                      <span
                        className={`mt-1 block text-lg font-semibold leading-none ${
                          selected ? "text-[#1d7cf2]" : "text-[#42526b]"
                        }`}
                      >
                        {item.day}
                      </span>
                      <span className="mt-2 flex justify-center gap-1" aria-hidden="true">
                        <span
                          className={`h-1 w-5 rounded-full ${selected ? "bg-[#1d7cf2]" : "bg-[#d0d9e8]"}`}
                        />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <button
              type="button"
              onClick={goNextRange}
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d3e3fb] bg-white text-[#2a3b57] shadow-[0_8px_18px_rgb(30_24_70/0.05)] transition hover:border-[#1d7cf2] hover:text-[#1d7cf2] sm:flex"
              aria-label={`Next ${viewMode}`}
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[auto_auto_1fr_1fr]">
            <button
              type="button"
              onClick={showAllClasses}
              className="h-11 rounded-full border border-[#d3e3fb] bg-white px-4 text-sm font-semibold uppercase text-[#2a3b57] shadow-[0_8px_18px_rgb(30_24_70/0.04)] transition hover:border-[#1d7cf2] hover:text-[#1d7cf2]"
            >
              Show all
            </button>
            <button
              type="button"
              onClick={jumpToToday}
              className="h-11 rounded-full border border-[#d3e3fb] bg-white px-5 text-sm font-semibold uppercase text-[#2a3b57] shadow-[0_8px_18px_rgb(30_24_70/0.04)] transition hover:border-[#1d7cf2] hover:text-[#1d7cf2]"
            >
              Today
            </button>
            <div className="h-11 rounded-full border border-[#d3e3fb] bg-white px-5 shadow-[0_8px_18px_rgb(30_24_70/0.04)]">
              <div className="flex h-full items-center justify-between gap-3 text-sm font-semibold text-[#2a3b57]">
                <span>Instructors</span>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <div className="h-11 rounded-full border border-[#d3e3fb] bg-white px-5 shadow-[0_8px_18px_rgb(30_24_70/0.04)]">
              <div className="flex h-full items-center justify-between gap-3 text-sm font-semibold text-[#2a3b57]">
                <span>{currentLoc.name.split(",")[0]}</span>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5f6f88]">
              Studio
            </span>
            {LOCATIONS.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate({ search: { locationId: l.id }, replace: true })}
                className={`h-9 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  l.id === locationId
                    ? "border-[#1d7cf2] bg-[#1d7cf2] text-white shadow-[0_8px_18px_rgb(29_124_242/0.24)]"
                    : "border-[#d9e7fb] bg-white text-[#52617a] hover:border-[#1d7cf2] hover:text-[#1d7cf2]"
                }`}
              >
                {l.name.split(",")[0]}
              </button>
            ))}

            <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5f6f88]">
              Class type
            </span>
            {filterClassTypes.map((key) => {
              const classFormat = classFormatForKey(key);
              const info = formatInfoForKey(key);
              const selected = key === activeClassType;
              return (
                <div key={key} className="group/tab relative">
                  <button
                    type="button"
                    onClick={() => setActiveClassType(key)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-left transition duration-150 active:scale-95 ${
                      selected
                        ? "border-[#1d7cf2] bg-[#1d7cf2] text-white shadow-[0_8px_18px_rgb(29_124_242/0.24)]"
                        : "border-[#d9e7fb] bg-white text-[#3a4b66] hover:border-[#1d7cf2] hover:text-[#1d7cf2]"
                    }`}
                  >
                    <img
                      src={classFormat.image}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover object-top"
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                      {classFormat.name}
                    </span>
                  </button>
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-30 hidden w-64 rounded-[14px] border border-[#d9e7fb] bg-white p-3 text-left shadow-[0_18px_40px_rgb(29_124_242/0.15)] group-hover/tab:block"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d7cf2]">
                      {info.level}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#4d4b55]">{info.teaser}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {bookErr && (
          <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{bookErr}</p>
        )}

        {loadError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
        )}

        {!sessions &&
          !loadError &&
          (viewMode === "month" ? <MonthCalendarSkeleton /> : <ScheduleSkeleton />)}

        {sessions && viewMode === "month" && (
          <MonthCalendar
            weeks={monthCalendarWeeks}
            sessionsByDay={sessionsByDay}
            bookingId={bookingId}
            onBook={openCustomerFields}
          />
        )}

        {sessions && viewMode !== "month" && sessions.length === 0 && (
          <div className="rounded-[26px] border border-[#dedee5] bg-white p-10 text-center text-[#65636d] shadow-[0_20px_55px_rgb(30_24_70/0.05)]">
            No upcoming classes in this {viewMode} view at this studio.
          </div>
        )}

        {sessions && viewMode !== "month" && sessions.length > 0 && grouped.length === 0 && (
          <div className="rounded-[26px] border border-[#dedee5] bg-white p-10 text-center text-[#65636d] shadow-[0_20px_55px_rgb(30_24_70/0.05)]">
            No classes match this date. Show all classes to browse the full schedule.
          </div>
        )}

        {sessions && viewMode !== "month" && grouped.length > 0 && (
          <div className="space-y-8">
            {grouped.map(({ day, items, relative }) => (
              <section key={day} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="shrink-0 text-sm font-semibold uppercase tracking-[0.12em] text-[#4a5a74]">
                    {relative}
                  </h2>
                  <span className="h-px flex-1 bg-[#dbe7f9]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f7f99]">
                    {items.length} {items.length === 1 ? "class" : "classes"}
                  </span>
                </div>
                <div className="space-y-4">
                  {items.map((s) => (
                    <SessionCard
                      key={s.id}
                      s={s}
                      loading={bookingId === s.id}
                      requiresPayment={isPaidNewcomersClassName(s.name)}
                      onBook={() => openCustomerFields(s)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {customFieldsSession && (
        <CustomerFieldsModal
          session={customFieldsSession}
          values={customFieldValues}
          errors={customFieldErrors}
          submitError={customFieldSubmitError}
          saving={customFieldSaving}
          requiresShoeSize={requiresCycleShoeSize(customFieldsSession)}
          onChange={updateCustomerFieldValue}
          onCancel={() => {
            if (customFieldSaving) return;
            setCustomFieldsSession(null);
            setCustomFieldSubmitError(null);
            setCustomFieldErrors({});
          }}
          onSubmit={onCustomerFieldsSubmit}
        />
      )}

      <Footer />
      <WhatsAppFloat phone={whatsappPhone} />
    </div>
  );
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthCalendar({
  weeks,
  sessionsByDay,
  bookingId,
  onBook,
}: {
  weeks: MonthCalendarWeek[];
  sessionsByDay: Map<string, SessionDTO[]>;
  bookingId: number | null;
  onBook: (session: SessionDTO) => void;
}) {
  const todayKey = dateKey(new Date());

  return (
    <section
      aria-label="Monthly class calendar"
      className="overflow-hidden rounded-[28px] border border-[#d7e6ee] bg-white shadow-[0_20px_55px_rgb(30_24_70/0.06)]"
    >
      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-7 border-b border-[#d9e6ee] bg-[#f5fafd]">
            {WEEKDAY_LABELS.map((day) => (
              <div
                key={day}
                className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#77757f]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weeks.flat().map((calendarDay) => {
              const dayKey = dateKey(calendarDay.date);
              const daySessions = sessionsByDay.get(dayKey) ?? [];
              const isToday = dayKey === todayKey;

              return (
                <div
                  key={dayKey}
                  className={`min-h-[178px] border-b border-r border-[#e2eff5] p-3 [&:nth-child(7n)]:border-r-0 ${
                    calendarDay.inCurrentMonth ? "bg-white" : "bg-[#faf9fc] text-[#aaa6b3]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                        isToday
                          ? "bg-[#1d7cf2] text-white"
                          : calendarDay.inCurrentMonth
                            ? "text-[#202024]"
                            : "text-[#aaa6b3]"
                      }`}
                    >
                      {calendarDay.date.toLocaleDateString("en-IN", {
                        day: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </span>
                    {daySessions.length > 0 && (
                      <span className="rounded-full bg-[#ebf3ff] px-2 py-0.5 text-[10px] font-bold text-[#1d7cf2]">
                        {daySessions.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 max-h-[126px] space-y-1.5 overflow-y-auto pr-1">
                    {daySessions.map((session) => (
                      <MonthCalendarClassChip
                        key={session.id}
                        session={session}
                        loading={bookingId === session.id}
                        onBook={() => onBook(session)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MonthCalendarClassChip({
  session,
  loading,
  onBook,
}: {
  session: SessionDTO;
  loading: boolean;
  onBook: () => void;
}) {
  const start = new Date(session.startsAt);
  const format = formatInfoForSession(session);
  const isFull = session.spotsLeft === 0;

  return (
    <button
      type="button"
      onClick={onBook}
      disabled={loading || isFull}
      className={`block w-full rounded-[10px] border px-2 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d7cf2] ${
        isFull
          ? "border-[#ead7dc] bg-[#fff6f7] text-[#9b5767]"
          : "border-[#d6eaf3] bg-[#f0fafd] text-[#1c3a4a] hover:border-[#1d7cf2] hover:bg-white"
      }`}
      aria-label={`${isFull ? "Full" : "Book"} ${session.name} at ${formatTime(start)}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[#1d7cf2]">{formatTime(start)}</span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[#5c6b78] [&_svg]:h-3 [&_svg]:w-3">
          {format.icon}
          <span className="truncate">{format.family}</span>
        </span>
      </span>
      <span className="mt-1 block truncate text-[11px] font-bold">{session.name}</span>
      <span className="mt-0.5 block truncate text-[10px] text-[#77757f]">
        {isFull ? "Full" : (session.teacherName ?? "Studio Instructor")}
      </span>
    </button>
  );
}

function CustomerFieldsModal({
  session,
  values,
  errors,
  submitError,
  saving,
  requiresShoeSize,
  onChange,
  onCancel,
  onSubmit,
}: {
  session: SessionDTO;
  values: CustomerFieldValues;
  errors: CustomerFieldErrors;
  submitError: string | null;
  saving: boolean;
  requiresShoeSize: boolean;
  onChange: (field: keyof CustomerFieldValues, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const requiresPayment = isPaidNewcomersClassName(session.name);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-6 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[18px] bg-white p-5 shadow-[0_30px_90px_rgb(20_20_35/0.24)] sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d7cf2]">
              Profile details
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#202024]">
              {session.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-10 rounded-full border border-[#e1e1e7] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#5f5d66] disabled:opacity-50"
          >
            Close
          </button>
        </div>

        {submitError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
        )}

        <div className="space-y-6">
          <FieldSection icon={<Target className="h-4 w-4" />} title="Goals">
            <TextField
              label="Fitness Goal"
              value={values.fitnessGoal ?? ""}
              error={errors.fitnessGoal}
              icon={<Target className="h-4 w-4" />}
              placeholder="Add the member's primary goal"
              onChange={(value) => onChange("fitnessGoal", value)}
            />
            <SuggestionChips
              label="Fitness goal suggestions"
              options={FITNESS_GOAL_SUGGESTIONS}
              onSelect={(value) => onChange("fitnessGoal", value)}
            />
          </FieldSection>

          <FieldSection icon={<ShieldCheck className="h-4 w-4" />} title="Health & safety">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Emergency Contact Info"
                value={values.emergencyContactInfo ?? ""}
                error={errors.emergencyContactInfo}
                required
                icon={<Phone className="h-4 w-4" />}
                inputMode="tel"
                pattern="[0-9]*"
                maxLength={15}
                helperText="Numbers only. Include country code if needed."
                onChange={(value) => onChange("emergencyContactInfo", sanitizePhoneNumber(value))}
              />
              <SelectField
                label="Are you currently pregnant?"
                value={values.pregnancyStatus ?? ""}
                error={errors.pregnancyStatus}
                required
                icon={<HeartPulse className="h-4 w-4" />}
                options={[
                  ["No ", "No"],
                  ["Yes", "Yes"],
                ]}
                onChange={(value) => onChange("pregnancyStatus", value)}
              />
              <SelectField
                label="Post Natal"
                value={values.postNatalStatus ?? ""}
                error={errors.postNatalStatus}
                required
                icon={<ShieldCheck className="h-4 w-4" />}
                options={[
                  ["No", "No"],
                  ["Yes", "Yes"],
                ]}
                onChange={(value) => onChange("postNatalStatus", value)}
              />
              <div className="md:col-span-2">
                <TextField
                  label="Medical History"
                  value={values.medicalHistory ?? ""}
                  error={errors.medicalHistory}
                  required
                  multiline
                  icon={<Stethoscope className="h-4 w-4" />}
                  placeholder="Add relevant injuries, restrictions, or 'No concerns'"
                  onChange={(value) => onChange("medicalHistory", value)}
                />
                <SuggestionChips
                  label="Medical history suggestions"
                  options={MEDICAL_HISTORY_SUGGESTIONS}
                  onSelect={(value) => onChange("medicalHistory", value)}
                />
              </div>
            </div>
          </FieldSection>

          <FieldSection icon={<UserRound className="h-4 w-4" />} title="Profile">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="FNF"
                value={values.fnf ?? ""}
                error={errors.fnf}
                icon={<BadgeCheck className="h-4 w-4" />}
                placeholder="Friend or family referral details"
                onChange={(value) => onChange("fnf", value)}
              />
              <SelectField
                label="Gender"
                value={values.gender ?? ""}
                error={errors.gender}
                icon={<UserRound className="h-4 w-4" />}
                options={[
                  ["Male", "Male"],
                  ["Female", "Female"],
                  ["Non-binary", "Non-binary"],
                  ["Prefer not to say", "Prefer not to say"],
                ]}
                onChange={(value) => onChange("gender", value)}
              />
              <SelectField
                label="EU Shoe Size"
                value={values.euShoeSize ?? ""}
                error={errors.euShoeSize}
                required={requiresShoeSize}
                icon={<Footprints className="h-4 w-4" />}
                helperText={requiresShoeSize ? "Required for powerCycle classes." : undefined}
                options={EU_SHOE_SIZE_OPTIONS}
                onChange={(value) => onChange("euShoeSize", value)}
              />
              <SelectField
                label="How did you hear about us?"
                value={values.howDidHear ?? ""}
                error={errors.howDidHear}
                icon={<Sparkles className="h-4 w-4" />}
                options={[
                  ["Yellow Messenger/Whatsapp Enquiry", "Yellow Messenger/Whatsapp Enquiry"],
                  ["Instagram", "Instagram"],
                  ["Google Search", "Google Search"],
                  ["Friend/Family", "Friend/Family"],
                  ["Existing Member", "Existing Member"],
                  ["Walk-in", "Walk-in"],
                  ["Other", "Other"],
                ]}
                onChange={(value) => onChange("howDidHear", value)}
              />
            </div>
          </FieldSection>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-12 rounded-[11px] border border-[#dedee5] px-6 text-sm font-bold text-[#4e4d55] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-[11px] bg-[#1d7cf2] px-6 text-sm font-bold text-white transition hover:bg-[#1669cf] disabled:opacity-50"
          >
            {saving ? "Saving..." : requiresPayment ? "Save & pay" : "Save & book"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[#e2eff5] pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ebf3ff] text-[#1d7cf2] ring-1 ring-[#d8e8ff]">
          {icon}
        </span>
        <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#4b4858]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SuggestionChips({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#cfe6f0] bg-[#f5fafd] px-3 text-xs font-bold text-[#1f6f96] transition hover:border-[#1d7cf2] hover:bg-white hover:text-[#1d7cf2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d7cf2]/30"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {option}
        </button>
      ))}
    </div>
  );
}

function TextField({
  label,
  value,
  error,
  required,
  multiline,
  inputMode,
  icon,
  placeholder,
  pattern,
  maxLength,
  helperText,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: ReactNode;
  placeholder?: string;
  pattern?: string;
  maxLength?: number;
  helperText?: string;
  onChange: (value: string) => void;
}) {
  const id = `customer-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const baseClass =
    "mt-1 w-full rounded-[11px] border bg-white px-3 py-2.5 text-sm font-medium text-[#202024] outline-none transition focus:border-[#1d7cf2] focus:ring-2 focus:ring-[#1d7cf2]/15";

  return (
    <label htmlFor={id} className="block text-sm font-bold text-[#33323a]">
      <span className="inline-flex items-center gap-1.5">
        {icon && <span className="text-[#1d7cf2]">{icon}</span>}
        <span>
          {label}
          {required && <span className="text-red-600"> *</span>}
        </span>
      </span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={`${baseClass} ${error ? "border-red-500" : "border-[#dedee5]"}`}
        />
      ) : (
        <input
          id={id}
          value={value}
          inputMode={inputMode}
          pattern={pattern}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${baseClass} ${error ? "border-red-500" : "border-[#dedee5]"}`}
        />
      )}
      {helperText && !error && (
        <span className="mt-1 block text-xs font-semibold text-[#77757f]">{helperText}</span>
      )}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  value,
  error,
  required,
  options,
  icon,
  helperText,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  options: Array<[string, string]>;
  icon?: ReactNode;
  helperText?: string;
  onChange: (value: string) => void;
}) {
  const id = `customer-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <label htmlFor={id} className="block text-sm font-bold text-[#33323a]">
      <span className="inline-flex items-center gap-1.5">
        {icon && <span className="text-[#1d7cf2]">{icon}</span>}
        <span>
          {label}
          {required && <span className="text-red-600"> *</span>}
        </span>
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 h-11 w-full rounded-[11px] border bg-white px-3 text-sm font-medium text-[#202024] outline-none transition focus:border-[#1d7cf2] focus:ring-2 focus:ring-[#1d7cf2]/15 ${
          error ? "border-red-500" : "border-[#dedee5]"
        }`}
      >
        <option value="">Select</option>
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <span className="mt-1 block text-xs font-semibold text-[#77757f]">{helperText}</span>
      )}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
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
  const priceDisplay = getSchedulePriceDisplay(s.name);

  return (
    <article className="relative grid gap-4 overflow-visible rounded-[22px] border border-[#d9e7fb] bg-white p-4 shadow-[0_10px_28px_rgb(29_124_242/0.08)] transition hover:-translate-y-0.5 hover:border-[#b7d3fa] hover:shadow-[0_18px_40px_rgb(29_124_242/0.12)] md:grid-cols-[154px_minmax(0,1fr)_188px]">
      <div className="flex items-start gap-4 md:block">
        <ClassImageInfoTrigger format={format} durationInMinutes={s.durationInMinutes} />
        <div className="md:hidden">
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#172033]">{s.name}</h3>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="hidden text-[31px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#172033] md:block">
          {s.name}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <img
            src={teacherImage}
            alt={s.teacherName ? `${s.teacherName} instructor thumbnail` : ""}
            className="h-8 w-8 rounded-full border border-white object-cover object-top shadow-[0_6px_14px_rgb(29_124_242/0.16)]"
            aria-hidden={!s.teacherName}
          />
          <span className="font-medium text-[#22314a]">{s.teacherName ?? "Studio Instructor"}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs font-medium text-[#5b6c86]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef5ff] px-3 py-1.5 text-[#1d7cf2] ring-1 ring-[#d9e8ff]">
            {format.icon}
            {format.family}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#5b6c86] [&_svg]:text-[#1d7cf2]">
            {format.levelIcon}
            <span>{format.level}</span>
          </span>
        </div>

        <div className="mt-4 grid gap-2 text-[14px] font-medium text-[#596a86] lg:grid-cols-3">
          <ScheduleMeta icon={<CalendarDays className="h-4 w-4" />} text={dateLabel} />
          <ScheduleMeta
            icon={<Clock3 className="h-4 w-4" />}
            text={`${timeLabel} · ${s.durationInMinutes} min`}
          />
          <ScheduleMeta icon={<MapPin className="h-4 w-4" />} text={s.locationName ?? "Studio"} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#e8eef8] pt-4 md:flex-col md:items-end md:justify-between md:border-l md:border-t-0 md:border-l-[#e8eef8] md:pl-5 md:pt-1">
        <div className="text-right">
          {priceDisplay.originalPriceInCurrency && (
            <p
              className={`relative inline-block text-sm font-bold text-[#8a8791] ${
                priceDisplay.slashOriginalPrice
                  ? "after:absolute after:left-[-5px] after:right-[-5px] after:top-1/2 after:h-[2px] after:-rotate-12 after:rounded-full after:bg-red-500 after:content-['']"
                  : ""
              }`}
            >
              {formatInr(priceDisplay.originalPriceInCurrency)}
            </p>
          )}
          <p className="mt-0.5 text-4xl font-semibold tracking-[-0.05em] text-[#172033]">
            {formatInr(priceDisplay.bookingPriceInCurrency)}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d7cf2]">
            {priceDisplay.label}
          </p>
          {s.spotsLeft != null && (
            <p
              className={`mt-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
                isFull ? "text-red-600" : s.spotsLeft <= 3 ? "text-[#1d7cf2]" : "text-[#75839b]"
              }`}
            >
              {isFull ? "Full" : `${s.spotsLeft} spots left`}
            </p>
          )}
        </div>
        <button
          onClick={onBook}
          disabled={loading || isFull}
          className="h-[50px] min-w-[138px] rounded-[12px] bg-[#1d7cf2] px-6 text-base font-semibold text-white shadow-[0_12px_26px_rgb(29_124_242/0.28)] transition hover:bg-[#1669cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d7cf2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 md:w-full"
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

function ClassImageInfoTrigger({
  format,
  durationInMinutes,
}: {
  format: FormatInfo;
  durationInMinutes: number;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={`${format.family} class details`}
          className="group/img relative h-28 w-28 shrink-0 overflow-hidden rounded-[18px] shadow-[0_10px_24px_rgb(29_124_242/0.16)] outline-none transition focus-visible:ring-2 focus-visible:ring-[#1d7cf2] md:h-full md:min-h-[164px] md:w-full"
        >
          <img
            src={format.image}
            alt={`${format.family} class format`}
            className="h-full w-full object-cover object-top transition duration-300 group-hover/img:scale-105"
          />
          <span className="pointer-events-none absolute inset-0 bg-[#0a1c26]/0 transition group-hover/img:bg-[#0a1c26]/12" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        align="start"
        className="w-[320px] rounded-[16px] border border-[#d9e7fb] bg-white p-4 text-left shadow-[0_18px_40px_rgb(29_124_242/0.16)]"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d7cf2]">
          {format.icon}
          {format.family}
        </span>

        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8992]">
            Results
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#4d4b55]">{format.bestFor}</p>
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8992]">USPs</p>
          <p className="mt-1 text-sm leading-relaxed text-[#4d4b55]">
            {format.teaser} {format.detail}
          </p>
        </div>

        <div className="mt-3 grid gap-1.5 rounded-[12px] bg-[#f5f9ff] p-3 text-xs leading-relaxed text-[#4d4b55]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8992]">Info</p>
          <span>
            <strong className="text-[#232329]">Intensity:</strong> {format.level}
          </span>
          <span>
            <strong className="text-[#232329]">Duration:</strong> {durationInMinutes} min
          </span>
          <span>
            <strong className="text-[#232329]">What to expect:</strong> {format.expect}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ScheduleMeta({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 px-0.5 py-1">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#1d7cf2]">
        {icon}
      </span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="grid animate-pulse gap-5 rounded-[28px] border border-[#d7e6ee] bg-white p-4 shadow-[0_18px_55px_rgb(30_24_70/0.05)] md:grid-cols-[170px_minmax(0,1fr)_205px] md:p-5"
        >
          <div className="h-28 w-28 rounded-[22px] bg-[#eeeeF3] md:h-full md:min-h-[172px] md:w-full" />
          <div>
            <div className="mb-4 h-3 w-16 rounded bg-[#eeeeF3]" />
            <div className="mb-5 h-8 w-3/4 rounded bg-[#eeeeF3]" />
            <div className="mb-4 h-4 w-1/2 rounded bg-[#eeeeF3]" />
            <div className="h-4 w-5/6 rounded bg-[#eeeeF3]" />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#e4e4ea] pt-5 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-6 md:pt-1">
            <div className="h-8 w-24 rounded bg-[#eeeeF3]" />
            <div className="h-12 w-36 rounded-[11px] bg-[#eeeeF3]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthCalendarSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#d7e6ee] bg-white shadow-[0_20px_55px_rgb(30_24_70/0.05)]">
      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-7 border-b border-[#d9e6ee] bg-[#f5fafd]">
            {WEEKDAY_LABELS.map((day) => (
              <div
                key={day}
                className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#77757f]"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid animate-pulse grid-cols-7">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="min-h-[178px] border-b border-r border-[#e2eff5] p-3 [&:nth-child(7n)]:border-r-0"
              >
                <div className="h-7 w-7 rounded-full bg-[#eeeeF3]" />
                <div className="mt-3 space-y-2">
                  <div className="h-9 rounded-[10px] bg-[#eeeeF3]" />
                  <div className="h-9 rounded-[10px] bg-[#eeeeF3]" />
                </div>
              </div>
            ))}
          </div>
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

function daysUntilDate(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
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

function groupSessionsByDate(sessions: SessionDTO[]): Map<string, SessionDTO[]> {
  const buckets = new Map<string, SessionDTO[]>();
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  for (const session of sorted) {
    const key = dateKey(session.startsAt);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(session);
    } else {
      buckets.set(key, [session]);
    }
  }

  return buckets;
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
    return { entryMin: 5, cancelHrs: 12, family: "powerCycle" };
  }
  return { entryMin: 10, cancelHrs: 12, family: "Barre" };
}

function ThankYou({ booked, onAnother }: { booked: BookedClass; onAnother: () => void }) {
  const policy = classPolicy(booked.session.name);
  const whatsappPhone = whatsappPhoneForLocationId(booked.location.id);
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
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hi! I just booked ${booked.session.name} at ${booked.location.name}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="h-12 px-6 rounded-full bg-[#25D366] text-white text-xs uppercase tracking-[0.2em] font-bold flex items-center"
          >
            Message the studio
          </a>
        </div>
      </main>

      <Footer />
      <WhatsAppFloat phone={whatsappPhone} />
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
      className={`policy-card-animate relative overflow-hidden rounded-2xl p-6 border ${
        dark
          ? "bg-foreground text-background border-foreground"
          : "bg-gradient-to-br from-primary/30 to-primary/10 border-primary/40"
      }`}
      style={{ animationDelay: dark ? "140ms" : "0ms" }}
    >
      <div className="flex items-start gap-4">
        <div
          className={`policy-card-icon h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-primary text-foreground" : "bg-foreground text-background"}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p
            className={`policy-card-label inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.25em] font-bold ${dark ? "text-primary" : "text-primary-deep"}`}
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
