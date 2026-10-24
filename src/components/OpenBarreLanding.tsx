import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useId, useRef, useState, lazy, Suspense } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Fingerprint,
  ListChecks,
  Loader2,
  Lock,
  MapPin,
  Navigation,
  Phone,
  Star,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import {
  signupAndEnroll,
  signupAndEnrollWithoutLead,
  signupEnrollAndBookRoute,
  captureLeadPartial,
  sendSignupLeadCapi,
} from "@/lib/momence.functions";
import {
  trackSignupStart,
  trackWaiverSigned,
  setMetaAdvancedMatching,
  readMetaCookies,
  readRawFbclid,
} from "@/lib/analytics";
import { storeRegistrationMeta } from "@/lib/registration-meta.helpers";
import { isValidPhoneNumber, phoneNumberError } from "@/lib/phone-validation";
import { getVariant, VARIANT_COPY } from "@/lib/ab-test";
import {
  MUMBAI_LOCATIONS,
  BENGALURU_LOCATIONS,
  metaGeoForLocationId,
} from "@/lib/momence-locations";
import { COUNTRY_CODES } from "@/lib/country-codes";
import {
  parseAttributionFromSearch,
  trimToMaxLength,
  type StoredAttribution,
} from "@/lib/attribution.helpers";
import {
  CLASS_FORMAT_KEYS,
  classFormatKeyForSessionName,
  type ClassFormatKey,
} from "@/lib/class-format-matchers";
import { classFormatForKey, classTypeOptionsForLocation } from "@/lib/class-formats";
import { cn } from "@/lib/utils";
import { isPaidNewcomersClassName } from "@/lib/momence-booking.helpers";
import { eventDetailLine, type RouteEvent } from "@/lib/route-event";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { FlippingGallery } from "@/components/FlippingGallery";
import { Footer } from "@/components/Footer";
import type { SignaturePadHandle } from "@/components/SignaturePad";
const SignaturePad = lazy(() =>
  import("@/components/SignaturePad").then((module) => ({ default: module.SignaturePad })),
);

import heroBike from "@/assets/108 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _56A1227.webp";
import intenseFace from "@/assets/3014 _ Physique57 _ Deliverable 3 _ _56A1625.webp";
import lunge from "@/assets/120 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _04A1551.webp";
import kettlebellPink from "@/assets/139 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _56A3173.webp";
import trainerArm from "@/assets/2100 _ Physique57 _ Trainer Shots _ _04A1735.webp";
import trainerLunge from "@/assets/2066 _ Physique57 _ Trainer Shots _ _56A2552.webp";
import groupBarre from "@/assets/landing-group-barre.webp";
import groupBarreMobile from "@/assets/landing-group-barre-mobile.webp";
import sculptSide from "@/assets/3012 _ Physique57 _ Deliverable 3 _ _56A1619.webp";
import cycleShot from "@/assets/2115 _ Physique57 _ Trainer Shots _ _56A3035.webp";
import trainer2 from "@/assets/2060 _ Physique57 _ Trainer Shots _ _56A1865.webp";
import trainer3 from "@/assets/2062 _ Physique57 _ Trainer Shots _ _56A2470.webp";
import trainer4 from "@/assets/2133 _ Physique57 _ Trainer Shots _ _56A2005.webp";
import bengaluruInstructorCollage from "@/assets/images/bengaluru-instructors-candid.webp";

const logoUrl = "/physique57-logo-small.webp";

const HERO_HEADLINE = "Meet the workout your body will thank you for.";

const ATTRIBUTION_STORAGE_KEY = "p57_attribution";

/**
 * How long a half-filled form can sit untouched before the lead is treated as abandoned
 * and sent. Long enough that someone reading the waiver or picking a class is not counted
 * as gone, short enough that a lead is not lost to a browser that closes without warning.
 */
const PARTIAL_LEAD_IDLE_MS = 90_000;

/**
 * Stands in for the studio's hero copy on a paid route. The standard line promises the
 * first class is complimentary, which is not true of an event someone is paying for.
 */
const PAID_EVENT_DESCRIPTION =
  "Reserve your place below. Sign up takes 60 seconds, and payment is taken at checkout.";

// Captures UTMs into sessionStorage on the first hit so attribution survives if
// the visitor navigates around the site before finishing the signup form -
// window.location.search alone is gone the moment they leave this URL.
function persistAttributionIfPresent(routeSource: string) {
  if (typeof window === "undefined") return;
  const parsed = parseAttributionFromSearch(window.location.search);
  if (Object.keys(parsed).length === 0) return;

  const attribution: StoredAttribution = {
    ...parsed,
    utmMedium: parsed.utmMedium ?? routeSource,
    referrer: document.referrer || undefined,
    landingPage: window.location.href,
  };
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage unavailable (private mode quota) - attribution just won't persist
  }
}

function readStoredAttribution(): StoredAttribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAttribution) : {};
  } catch {
    return {};
  }
}

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  countryIso: string;
  countryCode: string;
  phoneNumber: string;
  homeLocationId: number;
  waiverAccepted: boolean;
  whatsappConsent: boolean;
  whatsappConsentAt: string | null;
  signatureName: string;
  classType: ClassFormatKey;
};

type StudioVariant = "mumbai" | "bengaluru";
type StudioConfig = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  heroLocationLine: string;
  statLabel: string;
  signupCta: string;
};

const STUDIO_CONFIG: Record<StudioVariant, StudioConfig> = {
  mumbai: {
    title: "Physique 57 India - Discover the workout everyone talks about.",
    description:
      "Your first Barre 57 class is complimentary. Sculpt, strengthen, and energize your body in just 57 minutes. Sign up below to get started.",
    ogTitle: "Physique 57 India - Discover the workout everyone talks about.",
    ogDescription:
      "Activate your complimentary Open Barre membership and book your first 57-minute class in Mumbai.",
    heroLocationLine: "Mumbai · Bengaluru",
    statLabel: "studios",
    signupCta: "Claim Your Trial Class",
  },
  bengaluru: {
    title: "Physique 57 Bengaluru - Find your next class",
    description:
      "Discover the Physique 57 Method across Bengaluru. Choose your studio, explore upcoming classes, and book the session that fits you.",
    ogTitle: "Physique 57 Bengaluru - Find your next class",
    ogDescription:
      "Explore Physique 57 Bengaluru studios, discover upcoming classes, and book the session that fits you.",
    heroLocationLine: "Bengaluru",
    statLabel: "formats",
    signupCta: "Book Your Trial Class",
  },
};

type OpenBarreLandingProps = {
  captureLead?: boolean;
  routeSource?: string;
  studioVariant?: StudioVariant;
  heroImageUrl?: string;
  heroImageFallback?: string;
  initialSearch?: string;
  isKidsRoute?: boolean;
  /** Set by a shareable route that names its own membership / class to book into. */
  routeMembershipId?: number;
  routeSessionId?: number;
  /** Momence lead source id for this route, sent with the lead webhook. */
  routeSourceId?: string;
  /**
   * The event a Route Builder link was made for. When set, the page leads with the event
   * rather than the studio's standard trial copy. Absent on the main landing and on the
   * standing pages, which keep the copy they have always had.
   */
  routeEvent?: RouteEvent;
};

export function OpenBarreLanding({
  captureLead = true,
  routeSource = "landing",
  studioVariant = "mumbai",
  heroImageUrl,
  heroImageFallback,
  initialSearch,
  isKidsRoute = false,
  routeMembershipId,
  routeSessionId,
  routeSourceId,
  routeEvent,
}: OpenBarreLandingProps) {
  const signupWithLead = useServerFn(signupAndEnroll);
  const signupWithoutLead = useServerFn(signupAndEnrollWithoutLead);
  const submitPartialLead = useServerFn(captureLeadPartial);
  const sendLeadCapiFn = useServerFn(sendSignupLeadCapi);
  const enrollForRoute = useServerFn(signupEnrollAndBookRoute);
  // A route built in the Route Builder decides its own membership and class; the plain
  // landing keeps the default Open Barre enrolment.
  const usesRouteEnrollment = Boolean(routeMembershipId || routeSessionId);
  const signup = captureLead ? signupWithLead : signupWithoutLead;
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const [signed, setSigned] = useState(false);
  const [studioSelected, setStudioSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiverFailed, setWaiverFailed] = useState(false);
  const heroQuote = HERO_HEADLINE;
  // Match the server's first render before reading browser-only A/B storage.
  // Changing the CTA during hydration causes React error #418 for variant B.
  const [variant, setVariant] = useState<"a" | "b">("a");
  const variantCopy = VARIANT_COPY[variant];
  const waiverSignedTrackedRef = useRef(false);
  const partialCapturedRef = useRef(false);
  // Set the moment a real submit starts, so a member who is midway through signing up is
  // never also recorded as an abandoned lead.
  const signupStartedRef = useRef(false);
  const leadEventIdRef = useRef<string>(
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  );
  const registrationEventIdRef = useRef<string>(
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `reg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  );
  // Set once this page has sent Lead to Meta. A retry here after a failed Open Barre
  // activation comes back as a repeat, but its CompleteRegistration has not fired yet.
  const leadSentRef = useRef(false);
  // Set once this page has queued CompleteRegistration, so going Back and sending the form
  // again can never queue a second one.
  const registrationStoredRef = useRef(false);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    countryIso: "IN",
    countryCode: "+91",
    phoneNumber: "",
    homeLocationId: 0,
    waiverAccepted: false,
    whatsappConsent: false,
    whatsappConsentAt: null,
    signatureName: "",
    classType: "barre-57",
  });

  const isBengaluru = studioVariant === "bengaluru";
  const studioConfig = STUDIO_CONFIG[studioVariant];
  const routeEventDetail = routeEvent ? eventDetailLine(routeEvent) : null;
  const LOCATIONS = isBengaluru ? BENGALURU_LOCATIONS : MUMBAI_LOCATIONS;

  useEffect(() => {
    setVariant(getVariant());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistAttributionIfPresent(routeSource);

    const params = new URLSearchParams(initialSearch || window.location.search);
    const updates: Partial<FormState> = {};

    const firstName = params.get("firstName") || params.get("first_name") || params.get("fname");
    if (firstName) updates.firstName = firstName;

    const lastName = params.get("lastName") || params.get("last_name") || params.get("lname");
    if (lastName) updates.lastName = lastName;

    const email = params.get("email");
    if (email) updates.email = email;

    const phoneNumber =
      params.get("phoneNumber") || params.get("phone_number") || params.get("phone");
    if (phoneNumber) updates.phoneNumber = phoneNumber;

    const countryCode = params.get("countryCode") || params.get("country_code");
    const countryIso =
      params.get("countryIso") || params.get("country_iso") || params.get("country");
    const dial = params.get("dial");

    if (dial) {
      updates.countryCode = dial.startsWith("+") ? dial : `+${dial}`;
    } else if (countryCode) {
      updates.countryCode = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
    }

    if (countryIso) {
      const found = COUNTRY_CODES.find((c) => c.iso === countryIso.toUpperCase());
      if (found) {
        updates.countryIso = found.iso;
        if (!countryCode && !dial) {
          updates.countryCode = found.dial;
        }
      }
    }

    const locationId =
      params.get("homeLocationId") || params.get("location_id") || params.get("locationId");
    if (locationId) {
      const locId = Number(locationId);
      if (Number.isFinite(locId)) {
        updates.homeLocationId = locId;
        setStudioSelected(true);
      }
    }

    const center = params.get("center");
    if (center && !locationId) {
      const normalized = center.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matched = LOCATIONS.find((loc) =>
        loc.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .includes(normalized),
      );
      if (matched) {
        updates.homeLocationId = matched.id as number;
        setStudioSelected(true);
      }
    }

    const waiverAccepted = params.get("waiverAccepted") || params.get("waiver_accepted");
    if (waiverAccepted !== null) {
      updates.waiverAccepted = ["true", "1", "yes"].includes(waiverAccepted.toLowerCase());
    }

    const classType = params.get("classType") || params.get("class_type") || params.get("class");
    if (classType) {
      const detected = classFormatKeyForSessionName(classType);
      if (detected && CLASS_FORMAT_KEYS.includes(detected)) {
        updates.classType = detected;
      }
    }

    if (Object.keys(updates).length > 0) {
      setForm((prev) => ({ ...prev, ...updates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    setForm((prev) =>
      prev.signatureName === fullName ? prev : { ...prev, signatureName: fullName },
    );
  }, [form.firstName, form.lastName]);

  useEffect(() => {
    const allowed = classTypeOptionsForLocation(form.homeLocationId);
    if (!allowed.includes(form.classType)) {
      setForm((prev) => ({ ...prev, classType: allowed[0] }));
    }
  }, [form.classType, form.homeLocationId]);

  // Re-run on every change rather than once: firing only on the first keystroke sent the
  // pixel a match payload of just a partial first name, and never updated it once the
  // email and phone were actually filled in. fbq("init", ...) merges each call's fields.
  useEffect(() => {
    if (!form.firstName && !form.lastName && !form.email && !form.phoneNumber) return;
    setMetaAdvancedMatching({
      email: form.email.includes("@") ? form.email : undefined,
      phone:
        form.phoneNumber.replace(/[^0-9]/g, "").length >= 6
          ? `${form.countryCode}${form.phoneNumber}`
          : undefined,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
    });
  }, [form.firstName, form.lastName, form.email, form.phoneNumber, form.countryCode]);

  // The abandoned-signup capture. It runs at most once, guarded by partialCapturedRef, and
  // never after the member has submitted - by then the completed record is the real one.
  //
  // Waiting for the studio keeps the brand-wide fallback centre out of the lead, but it
  // cannot be a hard requirement: someone who types their details and leaves without ever
  // picking a studio is exactly the lead worth chasing. So the studio is what we wait for,
  // not what we insist on - the visitor leaving, or going quiet, sends it regardless.
  const firePartialLead = useCallback(
    (reason: "studio-selected" | "leaving" | "idle") => {
      if (partialCapturedRef.current || signupStartedRef.current || !captureLead) return;
      const emailValid = /\S+@\S+\.\S+/.test(form.email);
      const phoneValid = form.phoneNumber.replace(/[^0-9]/g, "").length >= 6;
      if (!form.firstName.trim() || !emailValid || !phoneValid) return;

      partialCapturedRef.current = true;
      console.debug("[debug:signup] partial lead capture", {
        reason,
        homeLocationId: form.homeLocationId,
      });
      const params = new URLSearchParams(window.location.search);
      const stored = readStoredAttribution();
      const metaCookies = readMetaCookies(readRawFbclid(window.location.search) ?? stored.fbclid);

      submitPartialLead({
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          countryCode: form.countryCode,
          phoneNumber: form.phoneNumber.trim(),
          // Left off when they never picked one, so the server records the studio as
          // unknown rather than guessing at it.
          homeLocationId: form.homeLocationId || undefined,
          utmSource: params.get("utm_source") ?? stored.utmSource,
          utmMedium: params.get("utm_medium") ?? stored.utmMedium ?? routeSource,
          utmCampaign: params.get("utm_campaign") ?? stored.utmCampaign,
          utmTerm: params.get("utm_term") ?? stored.utmTerm,
          utmContent: params.get("utm_content") ?? stored.utmContent,
          gclid: params.get("gclid") ?? stored.gclid,
          fbclid: readRawFbclid(window.location.search) ?? stored.fbclid,
          referrer: trimToMaxLength(stored.referrer ?? document.referrer),
          landingPage: trimToMaxLength(stored.landingPage ?? window.location.href),
          abVariant: isBengaluru ? "bengaluru" : variant,
          classType: form.classType,
          ...(routeSourceId ? { sourceId: routeSourceId } : {}),
          whatsappConsent: form.whatsappConsent,
          whatsappConsentAt: form.whatsappConsentAt ?? undefined,
          fbp: metaCookies.fbp,
          fbc: metaCookies.fbc,
          metaEventId: leadEventIdRef.current,
        },
      }).catch((e) => console.debug("[debug:signup] partial lead capture failed", e));
    },
    [captureLead, form, isBengaluru, routeSource, routeSourceId, submitPartialLead, variant],
  );

  // Listeners and timers read this so they always send the details as they stand now,
  // rather than whatever they were when the listener was attached.
  const firePartialLeadRef = useRef(firePartialLead);
  useEffect(() => {
    firePartialLeadRef.current = firePartialLead;
  }, [firePartialLead]);

  // The happy path: contact details plus a real studio, sent as soon as both are there.
  useEffect(() => {
    if (!LOCATIONS.some((l) => l.id === form.homeLocationId)) return;
    firePartialLead("studio-selected");
  }, [LOCATIONS, firePartialLead, form.homeLocationId]);

  // They are leaving. visibilitychange fires while the page is still alive, which pagehide
  // does not reliably do on mobile, so it is the one that usually gets the request away.
  useEffect(() => {
    const send = () => firePartialLeadRef.current("leaving");
    const onHidden = () => {
      if (document.visibilityState === "hidden") send();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", send);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", send);
    };
  }, []);

  // Gone quiet with the form half-filled. Sending early costs nothing: if they come back
  // and finish, the completed submission prunes this partial row away.
  useEffect(() => {
    if (partialCapturedRef.current) return;
    const timer = setTimeout(() => firePartialLeadRef.current("idle"), PARTIAL_LEAD_IDLE_MS);
    return () => clearTimeout(timer);
  }, [form.firstName, form.lastName, form.email, form.phoneNumber, form.countryCode]);

  function handleSignChange(isSigned: boolean) {
    setSigned(isSigned);
    if (isSigned && !waiverSignedTrackedRef.current) {
      waiverSignedTrackedRef.current = true;
      trackWaiverSigned({ variant });
    }
  }

  const valid = useMemo(
    () =>
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(form.email) &&
      form.countryCode.trim().length > 0 &&
      isValidPhoneNumber(form.phoneNumber, form.countryCode) &&
      LOCATIONS.some((l) => l.id === form.homeLocationId) &&
      form.waiverAccepted &&
      form.signatureName.trim().length >= 2,
    [form, LOCATIONS],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      console.warn("[debug:signup] submit blocked - form invalid", {
        firstName: form.firstName.trim().length > 0,
        lastName: form.lastName.trim().length > 0,
        email: /\S+@\S+\.\S+/.test(form.email),
        countryCode: form.countryCode.trim().length > 0,
        phoneNumber: isValidPhoneNumber(form.phoneNumber, form.countryCode),
        homeLocationId: LOCATIONS.some((l) => l.id === form.homeLocationId),
        waiverAndSignature: form.waiverAccepted && form.signatureName.trim().length >= 2,
      });
      return;
    }

    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("Please add your signature in the box above to consent to the waiver.");
      return;
    }
    signupStartedRef.current = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(window.location.search);
    const signatureRealSignature = sigRef.current.toRealSignature() ?? undefined;
    if (!signatureRealSignature) {
      setError("Please add your signature in the box above to consent to the waiver.");
      setLoading(false);
      return;
    }

    try {
      const stored = readStoredAttribution();
      const metaCookies = readMetaCookies(readRawFbclid(window.location.search) ?? stored.fbclid);
      const trackingPayload = captureLead
        ? {
            utmSource: params.get("utm_source") ?? stored.utmSource ?? undefined,
            utmMedium: params.get("utm_medium") ?? stored.utmMedium ?? routeSource,
            utmCampaign: params.get("utm_campaign") ?? stored.utmCampaign ?? undefined,
            utmTerm: params.get("utm_term") ?? stored.utmTerm ?? undefined,
            utmContent: params.get("utm_content") ?? stored.utmContent ?? undefined,
            gclid: params.get("gclid") ?? stored.gclid ?? undefined,
            fbclid: readRawFbclid(window.location.search) ?? stored.fbclid ?? undefined,
            referrer:
              stored.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined),
            landingPage: trimToMaxLength(
              stored.landingPage ??
                (typeof window !== "undefined" ? window.location.href : undefined),
            ),
            abVariant: isBengaluru ? "bengaluru" : variant,
            ...(routeSourceId ? { sourceId: routeSourceId } : {}),
          }
        : { abVariant: variant };
      console.debug("[debug:signup] calling signup server fn", { captureLead });
      const signupPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        countryCode: form.countryCode,
        phoneNumber: form.phoneNumber.trim(),
        homeLocationId: form.homeLocationId,
        waiverAccepted: true,
        signatureName: form.signatureName.trim(),
        signatureRealSignature,
        classType: form.classType,
        whatsappConsent: form.whatsappConsent,
        whatsappConsentAt: form.whatsappConsentAt ?? undefined,
        fbp: metaCookies.fbp,
        fbc: metaCookies.fbc,
        leadEventId: leadEventIdRef.current,
        ...trackingPayload,
      };
      const result = usesRouteEnrollment
        ? await enrollForRoute({
            data: {
              ...signupPayload,
              ...(routeMembershipId ? { membershipId: routeMembershipId } : {}),
              ...(routeSessionId ? { sessionId: routeSessionId } : {}),
            },
          }).then((routeResult) => ({
            memberId: routeResult.memberId,
            // A paid route does not grant the membership here - the member pays on the
            // schedule page - so treat it as enrolled enough to continue.
            enrolled: routeResult.membershipGranted || routeResult.paymentRequired,
            enrollError: routeResult.bookingError,
            leadError: routeResult.leadError,
            repeat: routeResult.repeat,
          }))
        : await signup({ data: signupPayload });
      console.debug("[debug:signup] signup result", result);
      // A repeat of a send stored shortly before (sent twice, or refilled after a reload)
      // already reached Meta the first time, so it sends nothing again.
      //
      // Lead fires here - pixel and Conversions API side by side, one shared event_id,
      // before the enrollment check so a failed Open Barre activation can never send one
      // without the other. Advanced matching is refreshed first so the pixel event
      // carries external_id (the member id) as a dedup key alongside fbp/event_id.
      if (!result.repeat) {
        setMetaAdvancedMatching({
          email: form.email.trim(),
          phone: `${form.countryCode}${form.phoneNumber}`,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          externalId: String(result.memberId),
          countryIso: form.countryIso,
          ...metaGeoForLocationId(form.homeLocationId),
        });
        trackSignupStart({ variant, content_name: form.classType }, leadEventIdRef.current);
        sendLeadCapiFn({
          data: {
            eventId: leadEventIdRef.current,
            memberId: result.memberId,
            email: form.email.trim(),
            phone: `${form.countryCode}${form.phoneNumber}`,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            classType: form.classType,
            countryIso: form.countryIso,
            locationId: form.homeLocationId,
            landingPage: trimToMaxLength(window.location.href),
            fbp: metaCookies.fbp,
            fbc: metaCookies.fbc,
          },
        }).catch((e3) => console.debug("[debug:signup] Lead CAPI failed", e3));
        leadSentRef.current = true;
      }
      if (result.leadError) {
        console.warn("[debug:signup] lead capture failed silently:", result.leadError);
      }
      if (!result.enrolled) {
        console.error("[debug:signup] enrollment failed:", result.enrollError);
        setError(
          result.enrollError ??
            "Open Barre membership could not be activated. Please contact the studio team before booking your first class.",
        );
        return;
      }
      // Keep the selected booking location here. In particular, Plash members use
      // Lavelle as their Momence home location but must still see Plash sessions.
      const scheduleSearch = new URLSearchParams({
        locationId: String(form.homeLocationId),
        classType: form.classType,
      });
      // CompleteRegistration fires once the member actually books a class, not here -
      // see storeRegistrationMeta / classes.$memberId.tsx. Not for a repeat either, unless
      // it is this page retrying after a failed Open Barre activation: that one's Lead went
      // out on the first attempt and its CompleteRegistration has not.
      if (leadSentRef.current && !registrationStoredRef.current) {
        registrationStoredRef.current = true;
        storeRegistrationMeta({
          eventId: registrationEventIdRef.current,
          memberId: result.memberId,
          email: form.email.trim(),
          phone: `${form.countryCode}${form.phoneNumber}`,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          classType: form.classType,
          variant,
          countryIso: form.countryIso,
          fbp: metaCookies.fbp,
          fbc: metaCookies.fbc,
          landingPage: window.location.href,
        });
      }
      window.location.assign(
        `/classes/${encodeURIComponent(String(result.memberId))}?${scheduleSearch.toString()}`,
      );
    } catch (e2) {
      console.error("[debug:signup] signup threw:", e2);
      const message = e2 instanceof Error ? e2.message : "Signup failed";
      if (message.includes("Waiver and policy consent could not be recorded")) {
        setWaiverFailed(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (waiverFailed) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header studioVariant={studioVariant} />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="max-w-md text-center">
            <span className="p57-icon-tile mx-auto">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="p57-title mt-6">Thank you for your interest.</h1>
            <p className="p57-lede mx-auto mt-4 text-center">
              A member of our team will reach out to you shortly to complete your registration.
            </p>
            <a href="tel:+919769665757" className="p57-btn p57-btn--dark mt-8">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call the studio
            </a>
          </div>
        </div>
        <Footer studioVariant={studioVariant} />
      </div>
    );
  }

  const isPaidRoute = Boolean(routeEvent?.paid);
  const heroFacts = isPaidRoute
    ? ["Paid class", "60-second signup", "All levels welcome"]
    : ["57-minute class", "No card required", "Beginner friendly"];

  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <Header studioVariant={studioVariant} paid={isPaidRoute} />

      <section className="hero-shell overflow-hidden">
        <img
          className="hero-image absolute inset-0 h-full w-full object-cover object-center"
          src={heroImageUrl || groupBarre}
          srcSet={heroImageUrl ? undefined : `${groupBarreMobile} 768w, ${groupBarre} 1800w`}
          sizes="100vw"
          alt=""
          width={1800}
          height={1016}
          fetchPriority="low"
          decoding="async"
        />
        <div
          className="hero-glow absolute -left-40 top-16 h-[30rem] w-[30rem] rounded-full opacity-70"
          aria-hidden
        />
        <div className="hero-grid absolute inset-0 opacity-[0.16]" aria-hidden />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(102deg, rgba(5,9,13,0.96) 0%, rgba(5,9,13,0.88) 42%, rgba(5,9,13,0.55) 100%)",
          }}
          aria-hidden
        />

        <div className="p57-shell relative grid items-start gap-10 pb-16 pt-10 text-white sm:pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:pb-24 lg:pt-16">
          <div className="lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p57-chip p57-chip--invert">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]"
                  aria-hidden="true"
                />
                {routeEvent?.studio || studioConfig.heroLocationLine}
              </span>
              {routeEvent && (
                <span className="p57-chip p57-chip--invert">
                  {routeEvent.paid ? "Paid class" : "Complimentary"}
                </span>
              )}
            </div>

            <h1 className="mt-6 max-w-[15ch] text-[clamp(2.65rem,5.4vw,4.75rem)] font-normal leading-[0.94] tracking-[-0.035em] text-balance">
              {routeEvent?.name ||
                (heroImageFallback ? `${heroImageFallback} · ${heroQuote}` : heroQuote)}
            </h1>

            {routeEventDetail && (
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                {routeEventDetail}
              </p>
            )}

            <p className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-white/70 sm:text-[1.05rem]">
              {routeEvent?.paid ? PAID_EVENT_DESCRIPTION : studioConfig.description}
            </p>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
              {heroFacts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
                >
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} aria-hidden="true" />
                  {fact}
                </li>
              ))}
            </ul>

            <div className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6">
              <Stat n="57" label="minutes" />
              <Stat n={isBengaluru ? "8" : "3"} label={studioConfig.statLabel} />
              <Stat n="∞" label="energy" />
            </div>
          </div>

          <SignupCard
            form={form}
            setForm={setForm}
            onSubmit={onSubmit}
            loading={loading}
            error={error}
            valid={valid}
            signed={signed}
            sigRef={sigRef}
            onSignChange={handleSignChange}
            studioSelected={studioSelected}
            onStudioSelectedChange={setStudioSelected}
            ctaLabel={
              routeEvent?.paid
                ? "Book My Place"
                : isBengaluru
                  ? studioConfig.signupCta
                  : variantCopy.ctaLabel
            }
            studioVariant={studioVariant}
            isKidsRoute={isKidsRoute}
            routeEvent={routeEvent}
            routeEventDetail={routeEventDetail}
          />
        </div>
      </section>

      {routeEvent?.details?.trim() && (
        <section className="border-b border-border bg-secondary" aria-label="About this event">
          <div className="p57-shell grid gap-6 py-12 lg:grid-cols-[0.55fr_1.45fr] lg:gap-12 lg:py-14">
            <div>
              <p className="p57-eyebrow">About this event</p>
              {routeEventDetail && (
                <p className="mt-3 text-sm font-semibold text-foreground">{routeEventDetail}</p>
              )}
            </div>
            <p className="max-w-3xl whitespace-pre-line text-[0.95rem] leading-relaxed text-muted-foreground">
              {routeEvent.details.trim()}
            </p>
          </div>
        </section>
      )}

      <section
        className="overflow-hidden border-y border-white/10 bg-[#070c11] py-4 text-white"
        aria-label="Class formats"
      >
        <div className="marquee-mask flex">
          <div className="animate-marquee flex whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <div
                key={groupIndex}
                className="flex items-center gap-8 pr-8 font-display text-2xl italic text-white/85 md:text-3xl"
                aria-hidden={groupIndex === 1 ? true : undefined}
              >
                <Dot /> <span>Barre 57</span>
                <Dot /> <span>FIT</span>
                {!isBengaluru && (
                  <>
                    <Dot /> <span>Strength Lab</span>
                  </>
                )}
                <Dot /> <span>Mat 57</span>
                <Dot /> <span>HIIT</span>
                {!isBengaluru && (
                  <>
                    <Dot /> <span>powerCycle</span>
                  </>
                )}
                <Dot /> <span>Cardio Barre</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="p57-section bg-background" aria-labelledby="method-heading">
        <div className="p57-shell grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="p57-eyebrow">The Physique 57 Method</p>
            <h2 id="method-heading" className="p57-title mt-5">
              Engineered to <em>reshape</em> you in 57 minutes.
            </h2>
            <p className="p57-lede mt-5">
              The proven advantages that make Physique 57 India the preferred choice for fast,
              visible results and sustainable transformation.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="p57-chip p57-chip--accent">Low impact</span>
              <span className="p57-chip">Every level</span>
              <span className="p57-chip">Expert coached</span>
            </div>
            <Link to="/classes-info" className="p57-btn p57-btn--outline mt-9">
              Explore every class
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card shadow-[var(--shadow-card)]">
            {METHOD_PILLARS.map((pillar, index) => (
              <Feature key={pillar.title} {...pillar} index={index} />
            ))}
          </div>
        </div>

        <div className="p57-shell">
          <KeyBenefitsGrid />
        </div>
      </section>

      <section className="bg-[#070c11]" aria-labelledby="gallery-heading">
        <div className="p57-shell flex flex-wrap items-end justify-between gap-6 py-12 lg:py-16">
          <div>
            <p className="p57-eyebrow p57-eyebrow--invert">Inside the studio</p>
            <h2 id="gallery-heading" className="p57-title p57-title--sm p57-title--invert mt-4">
              A room built for <em>momentum</em>.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/55">
            Warm lighting, precision coaching, and a community that shows up. This is what a
            57-minute class looks like.
          </p>
        </div>
        <FlippingGallery
          slots={
            isBengaluru
              ? [
                  [groupBarre, trainer2, trainerLunge],
                  [intenseFace, trainer3, sculptSide],
                  [kettlebellPink, trainer4, lunge],
                  [sculptSide, trainerArm, groupBarre],
                ]
              : [
                  [heroBike, trainer2, cycleShot],
                  [intenseFace, trainer3, sculptSide],
                  [kettlebellPink, trainer4, trainerLunge],
                  [sculptSide, trainerArm, heroBike],
                ]
          }
        />
      </section>

      <WhatHappensNext />

      {isBengaluru && <BengaluruInstructors />}

      <StudioLocations studioVariant={studioVariant} />

      <section className="p57-section bg-secondary" aria-labelledby="reviews-heading">
        <div className="p57-shell">
          <SectionHeading
            eyebrow={`Loved by ${isBengaluru ? "Bengaluru" : "Mumbai"}`}
            title={
              <>
                What our <em>community</em> says
              </>
            }
            headingId="reviews-heading"
            description="Real members, real classes, real results - in the studio and long after."
          />
          <div className="mt-10">
            <ReviewsCarousel studioVariant={studioVariant} />
          </div>
        </div>
      </section>

      <ClosingCta
        studioVariant={studioVariant}
        ctaLabel={studioConfig.signupCta}
        paid={isPaidRoute}
      />

      <Footer studioVariant={studioVariant} />
    </div>
  );
}

const BENGALURU_INSTRUCTORS = [
  {
    name: "Chaitanya",
    role: "Studio Instructor",
    backgroundSize: "300% auto",
    backgroundPosition: "0% 0%",
    bio: "Upbeat energy meets precise cueing, helping every newcomer feel confident while keeping each sequence focused and intentional.",
  },
  {
    name: "Siddharth",
    role: "Studio Instructor",
    backgroundSize: "300% auto",
    backgroundPosition: "50% 0%",
    bio: "Clear direction and steady encouragement create a strong, approachable session where form always comes first.",
  },
  {
    name: "Pushyank",
    role: "Head Trainer",
    backgroundSize: "300% auto",
    backgroundPosition: "100% 0%",
    bio: "Focused coaching and energising momentum make every class challenging, supportive, and deeply rewarding.",
  },
  {
    name: "Kajol",
    role: "Senior Instructor",
    backgroundSize: "200% auto",
    backgroundPosition: "0% 100%",
    bio: "Warm, welcoming instruction and thoughtful progressions help you find your strength at your own pace.",
  },
  {
    name: "Shruti",
    role: "Senior Instructor",
    backgroundSize: "200% auto",
    backgroundPosition: "100% 100%",
    bio: "Attentive alignment cues and calm encouragement bring intention, control, and confidence to every movement.",
  },
] as const;

function BengaluruInstructors() {
  return (
    <section
      className="bg-[#070c11] py-[var(--section-y)] text-white"
      aria-labelledby="coaches-heading"
    >
      <div className="p57-shell">
        <div className="grid items-end gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="p57-eyebrow p57-eyebrow--invert">Your Bengaluru team</p>
            <h2 id="coaches-heading" className="p57-title p57-title--invert mt-5">
              Meet your <em>instructors</em>.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/55 lg:justify-self-end">
            Expert guidance, thoughtful corrections, and the kind of energy that keeps you coming
            back. Get to know the instructors who bring the Physique 57 Method to life in Bengaluru.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {BENGALURU_INSTRUCTORS.map((instructor, index) => (
            <article
              key={instructor.name}
              className="group overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/[0.045]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <LazyBackground
                  src={bengaluruInstructorCollage}
                  role="img"
                  aria-label={`${instructor.name}, Physique 57 Bengaluru ${instructor.role.toLowerCase()}`}
                  className="absolute inset-0 bg-no-repeat transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]"
                  style={{
                    backgroundSize: instructor.backgroundSize,
                    backgroundPosition: instructor.backgroundPosition,
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="absolute bottom-3 left-4 text-[9px] font-bold uppercase tracking-[0.24em] text-white/75">
                  0{index + 1}
                </span>
              </div>
              <div className="p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary/85">
                  {instructor.role}
                </p>
                <h3 className="mt-2 font-display text-2xl tracking-tight text-white">
                  {instructor.name}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-white/55">{instructor.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Header({ studioVariant, paid = false }: { studioVariant: StudioVariant; paid?: boolean }) {
  const isBengaluru = studioVariant === "bengaluru";
  const ctaLabel = paid ? "Reserve a place" : isBengaluru ? "Book a class" : "Claim your trial";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070c11] text-white">
      <div className="p57-shell flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Physique 57 home">
          <img
            width={108}
            height={80}
            src={logoUrl}
            alt="Physique 57"
            className="brand-logo h-9 w-auto"
          />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-[11px] font-bold uppercase tracking-[0.18em] text-white/65 md:flex"
        >
          {[
            { to: "/about", label: "About" },
            { to: "/classes-info", label: "Classes" },
            { to: "/faq", label: "FAQ" },
            { to: "/contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={isBengaluru ? { studio: "bengaluru" } : undefined}
              className="relative py-1 transition-colors hover:text-white after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-[width] after:duration-200 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="tel:+919769665757"
            className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/65 transition-colors hover:text-white lg:flex"
          >
            <Phone className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            97696 65757
          </a>
          <a
            href="#signup"
            className="p57-btn p57-btn--brand h-10 min-h-10 px-4 text-[10px] sm:px-5 sm:text-[11px]"
          >
            {ctaLabel}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>

          <details className="group relative md:hidden">
            <summary className="p57-btn p57-btn--outline-invert flex h-10 min-h-10 cursor-pointer list-none items-center px-3.5 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1218] p-2 shadow-2xl">
              <nav aria-label="Mobile" className="flex flex-col">
                {[
                  { to: "/about", label: "About" },
                  { to: "/classes-info", label: "Classes" },
                  { to: "/faq", label: "FAQ" },
                  { to: "/contact", label: "Contact" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    search={isBengaluru ? { studio: "bengaluru" } : undefined}
                    className="rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href="#signup"
                  className="mt-1 rounded-xl bg-primary px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#08131a]"
                >
                  {ctaLabel}
                </a>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="font-display text-[2rem] leading-none tracking-tight text-primary sm:text-[2.35rem]">
        {n}
      </div>
      <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">
        {label}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  headingId,
  tone = "light",
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  headingId?: string;
  tone?: "light" | "dark";
  actions?: React.ReactNode;
}) {
  const invert = tone === "dark";
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className={cn("p57-eyebrow", invert && "p57-eyebrow--invert")}>{eyebrow}</p>
        <h2 id={headingId} className={cn("p57-title mt-5", invert && "p57-title--invert")}>
          {title}
        </h2>
        {description && (
          <p className={cn("p57-lede mt-4", invert && "p57-lede--invert")}>{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0 pb-1">{actions}</div>}
    </div>
  );
}

const METHOD_PILLARS = [
  {
    img: trainerLunge,
    tag: "Sculpt",
    title: "Isometric holds plus dynamic reps",
    body: "Tiny, precise movements that sculpt deep muscle - the Physique 57 signature.",
  },
  {
    img: lunge,
    tag: "Burn",
    title: "Interval-style class structure",
    body: "Sequenced segments hit every muscle group with zero downtime, no impact.",
  },
  {
    img: trainerArm,
    tag: "Recover",
    title: "Stretch to lengthen, every class",
    body: "We finish long and lean - every session ends with deep stretching to reset.",
  },
];

function Feature({
  img,
  tag,
  title,
  body,
  index,
}: {
  img: string;
  tag: string;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <article className="group grid items-center gap-5 border-b border-border p-4 last:border-b-0 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-7 sm:p-5 lg:p-6">
      <LazyBackground
        src={img}
        className="aspect-[16/10] w-full rounded-2xl bg-cover bg-center transition-transform duration-700 motion-safe:group-hover:scale-[1.015] sm:aspect-[4/3]"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.26em] text-primary-deep">
          <span aria-hidden="true">0{index + 1}</span>
          <span className="h-px w-6 bg-primary-deep/40" aria-hidden="true" />
          {tag}
        </p>
        <h3 className="mt-2.5 font-display text-[1.55rem] leading-tight tracking-tight sm:text-[1.75rem]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </article>
  );
}

const KEY_BENEFITS = [
  {
    icon: TrendingUp,
    title: "Proven, Visible Results in Weeks",
    body: "Physique 57 is known for delivering fast, visible transformation - leaner arms, lifted glutes, stronger core, and improved posture - within just a few weeks.",
  },
  {
    icon: Fingerprint,
    title: "Proprietary, Globally Proven Method",
    body: "This signature method was developed in New York and refined over years, giving members a system that feels premium, polished, and internationally trusted.",
  },
  {
    icon: Zap,
    title: "High-Intensity Yet Low-Impact",
    body: "The workout deeply fatigues muscles without putting stress on joints, making it intense enough for results and sustainable enough for long-term consistency.",
  },
  {
    icon: Star,
    title: "Celebrity-Endorsed and Loved",
    body: "The brand's strong aspirational value comes from its premium reputation and longstanding association with visible, physique-focused results.",
  },
  {
    icon: Trophy,
    title: "Award-Winning Fitness Method",
    body: "Global recognition and premium studio positioning reinforce the method's credibility, quality, and consistency across locations.",
  },
  {
    icon: UserCheck,
    title: "Expert-Led, Hands-On Coaching",
    body: "Highly trained & certified instructors actively correct form, guide alignment, and ensure every movement is effective and safe.",
  },
  {
    icon: ListChecks,
    title: "Structured, Progressive Programming",
    body: "Each class follows a designed structure that builds strength, endurance, and control over time - no random workouts, just consistent progress.",
  },
  {
    icon: Users,
    title: "Strong Community and Accountability",
    body: "A supportive boutique environment helps members stay motivated, consistent, and emotionally connected to their fitness routine.",
  },
];

function KeyBenefitsGrid() {
  return (
    <div className="mt-14 border-t border-border pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="p57-eyebrow">Key benefits</p>
        <p className="text-sm text-muted-foreground">Eight reasons members keep coming back.</p>
      </div>
      <div className="mt-7 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {KEY_BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="bg-card p-6 transition-colors duration-200 hover:bg-secondary"
          >
            <span className="p57-icon-tile">
              <benefit.icon className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-[0.95rem] font-bold leading-snug tracking-tight">
              {benefit.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{benefit.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const NEXT_STEPS = [
  {
    n: "01",
    title: "Share your details",
    body: "Tell us who you are and where you would like to train. It takes 60 seconds, and no card is required.",
  },
  {
    n: "02",
    title: "We confirm your first class",
    body: "Our studio team matches you to the right format and time, then sends your confirmation and next steps.",
  },
  {
    n: "03",
    title: "We help you prepare",
    body: "You will know what to wear, when to arrive, and what to expect so your first visit feels effortless.",
  },
  {
    n: "04",
    title: "Arrive ready for your first session",
    body: "Walk in with clarity, confidence, and a format that suits your schedule, goals, and energy.",
  },
];

function WhatHappensNext() {
  return (
    <section className="p57-section bg-secondary" aria-labelledby="next-heading">
      <div className="p57-shell">
        <SectionHeading
          eyebrow="Your first visit"
          title={
            <>
              What happens <em>next</em>.
            </>
          }
          headingId="next-heading"
          description="From your first click to your first shake, every step is designed to feel curated, clear, and high-touch."
        />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NEXT_STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-[10px] font-bold tracking-normal text-background">
                  {step.n}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-[0.98rem] font-bold leading-snug tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const MUMBAI_STUDIOS = [
  {
    name: "Kwality House, Kemps Corner",
    neighborhood: "Grant Road, Mumbai",
    location: "Kemps Corner",
    phone: "97696 65757",
    hours: "Mon-Sat: 6:00 AM - 9:00 PM | Sun: 7:00 AM - 7:00 PM",
    address: "Kwality House, August Kranti Rd, below Kemps Corner, Grant Road, Mumbai 400036",
  },
  {
    name: "Supreme HQ, Bandra",
    neighborhood: "Bandra West, Mumbai",
    location: "Bandra West",
    phone: "97696 65757",
    hours: "Mon-Sat: 6:00 AM - 9:00 PM | Sun: 7:00 AM - 7:00 PM",
    address:
      "203, Supreme Headquarters, Junction of 14th & 33rd Rd, opposite Monkey Bar, Bandra West, Mumbai 400050",
  },
];

const BENGALURU_STUDIOS = [
  {
    id: 22116,
    name: "Lavelle Road, Bengaluru",
    neighborhood: "Shanthala Nagar, Bengaluru",
    location: "Lavelle Road",
    phone: "97696 65757",
    hours: "Daily: 6:00 AM - 8:30 PM",
    address:
      "1st Floor, Kenkere House, Vittal Mallya Rd, above Raymonds, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001",
  },
  {
    id: 36372,
    name: "Indiranagar, Bengaluru",
    neighborhood: "Domlur, Bengaluru",
    location: "Indiranagar",
    phone: "97696 65757",
    hours: "Daily: 6:00 AM - 8:00 PM",
    address:
      "4th Floor, 167, 2nd Stage, 2nd Cross, Shankarnag Rd, Domlur, Bengaluru, Karnataka 560071",
  },
  {
    id: 287883,
    name: "Plash Pilates, Sadashivnagar",
    neighborhood: "Vyalikaval, Bengaluru",
    location: "Sadashivnagar",
    phone: "97696 65757",
    hours: "See the live schedule for current class timings",
    address:
      "72/14, 2nd Main Rd, next to namdharis fresh, Vyalikaval, Kodandarampura, Malleshwaram, Bengaluru, Karnataka 560003",
  },
];

function StudioLocations({ studioVariant }: { studioVariant: StudioVariant }) {
  const STUDIOS = studioVariant === "bengaluru" ? BENGALURU_STUDIOS : MUMBAI_STUDIOS;
  const directionsHref = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section className="p57-section bg-background" aria-labelledby="studios-heading">
      <div className="p57-shell">
        <SectionHeading
          eyebrow="Studio locations"
          title={
            <>
              Choose your <em>studio</em>.
            </>
          }
          headingId="studios-heading"
          description="Each location carries the same Physique 57 method, with its own neighborhood energy and format mix."
          actions={
            <a href="#signup" className="p57-btn p57-btn--dark hidden sm:inline-flex">
              Reserve your spot
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          }
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STUDIOS.map((studio) => (
            <article
              key={studio.name}
              className="p57-card p57-card--interactive flex flex-col overflow-hidden"
            >
              <StudioMap address={studio.address} name={studio.name} />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-[1.45rem] leading-tight tracking-tight">
                      {studio.location}
                    </h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">{studio.neighborhood}</p>
                  </div>
                  <a
                    href={directionsHref(studio.address)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Get directions to ${studio.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary-deep transition hover:border-primary-deep hover:bg-primary/10"
                  >
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                <dl className="mt-5 space-y-3.5 border-t border-border pt-5 text-[13px]">
                  <div className="flex gap-3">
                    <dt className="sr-only">Address</dt>
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep"
                      aria-hidden="true"
                    />
                    <dd className="leading-relaxed text-muted-foreground">{studio.address}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="sr-only">Hours</dt>
                    <Clock
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep"
                      aria-hidden="true"
                    />
                    <dd className="leading-relaxed text-muted-foreground">{studio.hours}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="sr-only">Phone</dt>
                    <Phone
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep"
                      aria-hidden="true"
                    />
                    <dd>
                      <a
                        href={`tel:+91${studio.phone.replace(/\s/g, "")}`}
                        className="font-medium text-foreground transition-colors hover:text-primary-deep"
                      >
                        {studio.phone}
                      </a>
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex gap-2">
                  <a
                    href={directionsHref(studio.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="p57-btn p57-btn--outline h-10 min-h-10 text-[10px]"
                  >
                    Directions
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <a href="#signup" className="p57-btn p57-btn--dark h-10 min-h-10 text-[10px]">
                    Book here
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudioMap({ address, name }: { address: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
      {loaded ? (
        <iframe
          title={`Map to ${name}`}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="map-placeholder group absolute inset-0 flex flex-col items-center justify-center gap-2.5"
          aria-label={`Load map for ${name}`}
        >
          <span
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(9,14,20,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(9,14,20,0.06) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
            aria-hidden="true"
          />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-deep shadow-[var(--shadow-card)] transition group-hover:scale-105">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/70">
            Load map
          </span>
        </button>
      )}
    </div>
  );
}

function ClosingCta({
  studioVariant,
  ctaLabel,
  paid = false,
}: {
  studioVariant: StudioVariant;
  ctaLabel: string;
  paid?: boolean;
}) {
  const isBengaluru = studioVariant === "bengaluru";
  return (
    <section
      className="relative overflow-hidden bg-[#070c11] text-white"
      aria-labelledby="cta-heading"
    >
      <div className="hero-grid absolute inset-0 opacity-25" aria-hidden />
      <div className="relative p57-shell py-[var(--section-y)] text-center">
        <p className="p57-eyebrow p57-eyebrow--invert">Your first class is on us</p>
        <h2 id="cta-heading" className="p57-title p57-title--invert mx-auto mt-5 max-w-3xl">
          57 minutes that change how you <em>train</em>.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[0.95rem] leading-relaxed text-white/60">
          Tell us where you would like to train and we will take care of the rest - your first
          class, your coach, and everything you need before you arrive.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#signup" className="p57-btn p57-btn--brand p57-btn--lg">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a href="tel:+919769665757" className="p57-btn p57-btn--outline-invert p57-btn--lg">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {isBengaluru ? "Talk to Bengaluru" : "Talk to the studio"}
          </a>
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
          {paid ? "Secure checkout · Places are limited" : "No card required · Cancel anytime"}
        </p>
      </div>
    </section>
  );
}

const STUDIO_CARD_COPY: Record<number, { name: string; area: string }> = {
  9030: { name: "Kwality House", area: "Kemps Corner" },
  29821: { name: "Supreme HQ", area: "Bandra West" },
  22116: { name: "Kenkere House", area: "Lavelle Road" },
  36372: { name: "Copper & Cloves", area: "Indiranagar" },
  287883: { name: "Plash Pilates", area: "Sadashivnagar" },
};

const SIGNUP_STEPS = [
  { id: "details", label: "Details" },
  { id: "studio", label: "Studio" },
  { id: "waiver", label: "Waiver" },
] as const;

function SignupProgress({ completed }: { completed: boolean[] }) {
  const activeIndex = completed.findIndex((done) => !done);
  return (
    <ol className="signup-steps" aria-label="Signup progress">
      {SIGNUP_STEPS.map((step, index) => {
        const done = completed[index] === true;
        const state = done ? "done" : index === activeIndex ? "active" : "todo";
        return (
          <li key={step.id} className="signup-step" data-state={state}>
            <span className="signup-step__marker" aria-hidden="true">
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
            </span>
            <span className="signup-step__label">
              {step.label}
              {done && <span className="sr-only"> complete</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function FormPanel({
  index,
  title,
  hint,
  done,
  children,
}: {
  index: number;
  title: string;
  hint?: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="form-panel" aria-label={title}>
      <div className="form-panel__head">
        <span className="form-panel__index" aria-hidden="true">
          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index}
        </span>
        <div className="min-w-0">
          <h3 className="form-panel__title">{title}</h3>
          {hint ? <p className="form-panel__hint">{hint}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function StudioPicker({
  locations,
  value,
  onChange,
}: {
  locations: ReadonlyArray<{ id: number; name: string }>;
  value: number;
  onChange: (id: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Preferred studio"
      className={cn("grid gap-2.5", locations.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2")}
    >
      {locations.map((location) => {
        const selected = value === location.id;
        const copy = STUDIO_CARD_COPY[location.id] ?? { name: location.name, area: "" };
        return (
          <button
            key={location.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(location.id)}
            className="studio-option"
          >
            <span className="flex items-center gap-2 pr-4">
              <span className="studio-option__icon">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="studio-option__name">{copy.name}</span>
            </span>
            {copy.area && <span className="studio-option__area">{copy.area}</span>}
            {selected && (
              <span className="studio-option__tick">
                <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ClassFormatPicker({
  options,
  value,
  onChange,
}: {
  options: ClassFormatKey[];
  value: ClassFormatKey;
  onChange: (key: ClassFormatKey) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Class format">
      {options.map((key) => {
        const format = classFormatForKey(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className="format-option"
          >
            <span className="format-option__media">
              <img
                src={format.image}
                alt=""
                width={240}
                height={300}
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="format-option__name">{format.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SignupCard({
  form,
  setForm,
  onSubmit,
  loading,
  error,
  valid,
  signed,
  sigRef,
  onSignChange,
  studioSelected,
  onStudioSelectedChange,
  ctaLabel,
  studioVariant,
  isKidsRoute = false,
  routeEvent,
  routeEventDetail,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  valid: boolean;
  signed: boolean;
  sigRef: React.MutableRefObject<SignaturePadHandle | null>;
  onSignChange: (signed: boolean) => void;
  studioSelected: boolean;
  onStudioSelectedChange: (selected: boolean) => void;
  ctaLabel: string;
  studioVariant: StudioVariant;
  isKidsRoute?: boolean;
  routeEvent?: RouteEvent;
  /** Pre-formatted by the page so the card and the hero can never disagree. */
  routeEventDetail?: string | null;
}) {
  const isBengaluru = studioVariant === "bengaluru";
  const LOCATIONS = isBengaluru ? BENGALURU_LOCATIONS : MUMBAI_LOCATIONS;
  const detailsComplete =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    isValidPhoneNumber(form.phoneNumber, form.countryCode);
  const studioComplete = LOCATIONS.some((location) => location.id === form.homeLocationId);
  const waiverComplete = form.waiverAccepted && signed && form.signatureName.trim().length >= 2;
  const selectedFormat = classFormatForKey(form.classType);
  const formatOptions = classTypeOptionsForLocation(form.homeLocationId);
  const submitLabel = loading
    ? "Activating membership…"
    : !isBengaluru && isPaidNewcomersClassName(form.classType)
      ? "Book My Trial Class"
      : ctaLabel;
  const isComplimentary = routeEvent ? !routeEvent.paid : !isBengaluru;
  const phoneError = phoneNumberError(form.phoneNumber, form.countryCode);

  return (
    <div id="signup" className="signup-card scroll-mt-24">
      <div className="signup-card__head">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="p57-eyebrow p57-eyebrow--bare text-[0.6rem] tracking-[0.24em]">
              {isComplimentary ? "Open Barre · Complimentary" : "Reserve your place"}
            </p>
            <h2 className="mt-3 font-display text-[1.85rem] leading-[1.06] tracking-tight sm:text-[2.15rem]">
              {routeEvent?.name
                ? `Book ${routeEvent.name}`
                : isKidsRoute
                  ? "Book a Juniors class"
                  : "Activate your trial"}
            </h2>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              {routeEvent
                ? // The when-and-with-whom line if the route gave one, so the card stands on
                  // its own for anyone who scrolled past the hero.
                  (routeEventDetail ?? "Takes 60 seconds. Your place is held once you submit.")
                : isKidsRoute
                  ? "Kids-specific signup with consent and waiver support."
                  : "Takes 60 seconds. No card required."}
            </p>
          </div>
          {isComplimentary && (
            <span className="hidden shrink-0 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-primary-deep sm:inline-flex">
              Free
            </span>
          )}
        </div>

        <div className="mt-5">
          <SignupProgress completed={[detailsComplete, studioComplete, waiverComplete]} />
        </div>
      </div>

      <form onSubmit={onSubmit} className="signup-form">
        <FormPanel
          index={1}
          title="Your details"
          hint="Where your confirmation and class details go."
          done={detailsComplete}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First name"
              value={form.firstName}
              onChange={(v) => setForm((prev) => ({ ...prev, firstName: v }))}
              required
              name="given-name"
              autoComplete="given-name"
              placeholder="Asha"
            />
            <Field
              label="Last name"
              value={form.lastName}
              onChange={(v) => setForm((prev) => ({ ...prev, lastName: v }))}
              required
              name="family-name"
              autoComplete="family-name"
              placeholder="Shah"
            />
          </div>

          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((prev) => ({ ...prev, email: v }))}
            required
            name="email"
            autoComplete="email"
            placeholder="you@email.com"
          />

          <div className="field">
            <label htmlFor="signup-phone" className="p57-label">
              Mobile number <span className="p57-label__req">*</span>
            </label>
            <div className="flex gap-2">
              <select
                required
                value={form.countryIso}
                onChange={(e) => {
                  const selected = COUNTRY_CODES.find((c) => c.iso === e.target.value);
                  if (!selected) return;
                  setForm((prev) => ({
                    ...prev,
                    countryIso: selected.iso,
                    countryCode: selected.dial,
                  }));
                }}
                className="p57-input p57-input--code"
                aria-label="Country dialing code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.iso} value={c.iso} title={`${c.name} ${c.dial}`}>
                    {c.flag}
                  </option>
                ))}
              </select>
              <input
                id="signup-phone"
                type="tel"
                inputMode="numeric"
                aria-label="Phone number"
                name="tel-national"
                autoComplete="tel-national"
                required
                value={form.phoneNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="98765 43210"
                aria-invalid={phoneError != null}
                aria-describedby={phoneError ? "signup-phone-error" : undefined}
                className="p57-input p57-input--grow"
              />
            </div>
            {phoneError ? (
              <p id="signup-phone-error" className="text-[11px] font-medium text-destructive">
                {phoneError}
              </p>
            ) : null}
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.whatsappConsent}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((prev) => ({
                  ...prev,
                  whatsappConsent: checked,
                  whatsappConsentAt: checked ? new Date().toISOString() : null,
                }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-input"
            />
            <span>
              Send me class reminders and updates on WhatsApp at the number above. I can reply STOP
              anytime to opt out.
            </span>
          </label>
        </FormPanel>

        <FormPanel
          index={2}
          title="Studio and format"
          hint="Pick where you would like to train and how you want to start."
          done={studioComplete}
        >
          <StudioPicker
            locations={LOCATIONS}
            value={form.homeLocationId}
            onChange={(id) => {
              setForm((prev) => ({ ...prev, homeLocationId: id }));
              onStudioSelectedChange(true);
            }}
          />

          {studioSelected && !isBengaluru && (
            <div className="space-y-2.5 pt-1">
              <p className="p57-label">Class format</p>
              <ClassFormatPicker
                options={formatOptions}
                value={form.classType}
                onChange={(key) => setForm((prev) => ({ ...prev, classType: key }))}
              />
              <div className="rounded-xl border border-border bg-white p-3">
                <p className="text-[11px] font-semibold text-foreground">
                  {selectedFormat.duration} · {selectedFormat.intensity}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Best for {selectedFormat.bestFor.toLowerCase()}.
                </p>
              </div>
            </div>
          )}
        </FormPanel>

        <FormPanel
          index={3}
          title="Waiver and signature"
          hint="Review and sign before activating Open Barre. Your consent is recorded with your Momence member profile."
          done={waiverComplete}
        >
          <details className="consent-box">
            <summary>
              <span>View full waiver details</span>
              <ChevronDown className="consent-box__chevron h-4 w-4" aria-hidden="true" />
            </summary>
            <div className="space-y-3 p-3.5">
              <ConsentLine>
                I voluntarily participate in Physique 57 India classes and assume all risks of
                injury.
              </ConsentLine>
              <ConsentLine>
                I confirm I am physically fit to participate, and I release Physique 57 India, its
                instructors and affiliates from liability arising from my participation.
              </ConsentLine>
              <ConsentLine>
                I consent to receive class-related communications and agree to the{" "}
                <Link
                  to="/waiver"
                  className="font-semibold text-primary-deep underline underline-offset-2"
                >
                  Waiver
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-semibold text-primary-deep underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                .
              </ConsentLine>
            </div>
          </details>

          <div className="field">
            <label htmlFor="signup-signature-name" className="p57-label">
              Full legal name <span className="p57-label__req">*</span>
            </label>
            <input
              id="signup-signature-name"
              type="text"
              required
              value={form.signatureName}
              placeholder="Type your full legal name"
              readOnly
              className="p57-input"
              aria-label="Full legal name"
            />
          </div>

          <div onPointerUp={() => onSignChange(!(sigRef.current?.isEmpty() ?? true))}>
            <DeferredSignaturePad sigRef={sigRef} />
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              required
              checked={form.waiverAccepted}
              onChange={(e) => setForm((prev) => ({ ...prev, waiverAccepted: e.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              I have read, signed, and accept the waiver and Physique 57 India&apos;s privacy terms.
            </span>
          </label>
        </FormPanel>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-[12px] leading-relaxed text-destructive"
          >
            <CircleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <div className="space-y-3 pt-1">
          <button type="submit" disabled={loading || !valid} className="signup-submit">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {submitLabel}
              </span>
            ) : (
              submitLabel
            )}
          </button>
          <p className="signup-note">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Secure signup · We only use your details for this booking.
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  name,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="p57-label">
        {label}
        {required ? <span className="p57-label__req"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.currentTarget.value)}
        onAnimationStart={(e) => {
          if (e.animationName === "p57-autofill-detected") {
            onChange(e.currentTarget.value);
          }
        }}
        className="p57-input autofill-watch"
      />
    </div>
  );
}

function ConsentLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 text-[12px] leading-relaxed text-foreground">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-deep" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// Preserve collage cropping while keeping below-the-fold photos out of the initial request waterfall.
function LazyBackground({ src, style, ...props }: React.ComponentProps<"div"> & { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      {...props}
      ref={ref}
      style={{ ...style, backgroundImage: ready ? `url(${src})` : undefined }}
      aria-busy={ready ? undefined : true}
    />
  );
}

function DeferredSignaturePad({
  sigRef,
}: {
  sigRef: React.MutableRefObject<SignaturePadHandle | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const placeholder = (
    <div>
      <p className="p57-label mb-1.5">Signature *</p>
      <div
        className="h-32 rounded-[var(--radius-control)] border border-input bg-white"
        role="status"
        aria-label="Signature pad loading"
      />
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Sign above with your finger, trackpad, stylus, or mouse.
      </p>
    </div>
  );
  return (
    <div ref={ref}>
      {ready ? (
        <Suspense fallback={placeholder}>
          <SignaturePad ref={sigRef} label="Signature *" />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
