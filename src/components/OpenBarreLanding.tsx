import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  FileText,
  TrendingUp,
  Fingerprint,
  Zap,
  Star,
  Trophy,
  UserCheck,
  ListChecks,
  Users,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import {
  signupAndEnroll,
  signupAndEnrollWithoutLead,
  captureLeadPartial,
} from "@/lib/momence.functions";
import { trackSignupStart, trackWaiverSigned, trackBookingComplete } from "@/lib/analytics";
import { getVariant, VARIANT_COPY } from "@/lib/ab-test";
import { MUMBAI_LOCATIONS, BENGALURU_LOCATIONS } from "@/lib/momence-locations";
import { COUNTRY_CODES } from "@/lib/country-codes";
import { parseAttributionFromSearch, type StoredAttribution } from "@/lib/attribution.helpers";
import {
  CLASS_FORMAT_KEYS,
  classFormatKeyForSessionName,
  type ClassFormatKey,
} from "@/lib/class-format-matchers";
import { classFormatForKey, classTypeOptionsForLocation } from "@/lib/class-formats";
import { isPaidNewcomersClassName } from "@/lib/momence-booking.helpers";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { FlippingGallery } from "@/components/FlippingGallery";
import { Footer } from "@/components/Footer";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";

import heroBike from "@/assets/108 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _56A1227.jpg";
import intenseFace from "@/assets/3014 _ Physique57 _ Deliverable 3 _ _56A1625.jpg";
import lunge from "@/assets/120 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _04A1551.jpg";
import kettlebellPink from "@/assets/139 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _56A3173.jpg";
import trainerArm from "@/assets/2100 _ Physique57 _ Trainer Shots _ _04A1735.jpg";
import trainerLunge from "@/assets/2066 _ Physique57 _ Trainer Shots _ _56A2552.jpg";
import groupBarre from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";
import sculptSide from "@/assets/3012 _ Physique57 _ Deliverable 3 _ _56A1619.jpg";
import cycleShot from "@/assets/2115 _ Physique57 _ Trainer Shots _ _56A3035.jpg";
import trainer2 from "@/assets/2060 _ Physique57 _ Trainer Shots _ _56A1865.jpg";
import trainer3 from "@/assets/2062 _ Physique57 _ Trainer Shots _ _56A2470.jpg";
import trainer4 from "@/assets/2133 _ Physique57 _ Trainer Shots _ _56A2005.jpg";
import bengaluruInstructorCollage from "@/assets/images/bengaluru-instructors-candid.png";

const logoUrl = "/physique57-logo-dark.png?v=79daf7";

const HERO_QUOTES = [
  "Meet the workout your body will thank you for.",
  "The class everyone recommends. The results everyone notices.",
  "Where strength meets elegance.",
  "The workout that changes more than your body.",
  "Fall in love with movement again.",
  "Strong never looked this graceful.",
  "Find your strongest self.",
  "The workout worth making time for.",
  "Feel the burn. Love the results.",
  "More than a workout. A transformation.",
  "The barre everyone comes back to.",
  "Confidence starts here.",
  "Move beautifully. Feel incredibly strong.",
  "Because ordinary workouts aren't your style.",
  "Your strongest hour starts now.",
  "Results you can feel. Confidence you can see.",
  "The workout your future self will thank you for.",
  "Elevate your fitness. Redefine your limits.",
  "Train smarter. Stand taller. Shine brighter.",
  "Every pulse. Every shake. Every victory.",
  "Luxury fitness. Extraordinary results.",
  "Discover what your body is capable of.",
  "Join the movement everyone's obsessed with.",
  "Where every class feels like your best one yet.",
  "The workout you'll never want to skip.",
];

const ATTRIBUTION_STORAGE_KEY = "p57_attribution";

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
  landingNote: string;
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
    landingNote:
      "Please review and sign before activating Open Barre. This consent is recorded with your Momence member profile.",
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
    landingNote:
      "Please review and sign before activating your Bengaluru booking. This consent is recorded with your Momence member profile.",
  },
};

type OpenBarreLandingProps = {
  captureLead?: boolean;
  routeSource?: string;
  studioVariant?: StudioVariant;
};

export function OpenBarreLanding({
  captureLead = true,
  routeSource = "landing",
  studioVariant = "mumbai",
}: OpenBarreLandingProps) {
  const signupWithLead = useServerFn(signupAndEnroll);
  const signupWithoutLead = useServerFn(signupAndEnrollWithoutLead);
  const submitPartialLead = useServerFn(captureLeadPartial);
  const signup = captureLead ? signupWithLead : signupWithoutLead;
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const [signed, setSigned] = useState(false);
  const [studioSelected, setStudioSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiverFailed, setWaiverFailed] = useState(false);
  const [schedulePreviewLocationId, setSchedulePreviewLocationId] = useState(22116);
  const [heroQuote, setHeroQuote] = useState(HERO_QUOTES[0]);
  const [variant] = useState(() => getVariant());
  const variantCopy = VARIANT_COPY[variant];
  const signupStartedRef = useRef(false);
  const waiverSignedTrackedRef = useRef(false);
  const partialCapturedRef = useRef(false);
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
  const LOCATIONS = isBengaluru ? BENGALURU_LOCATIONS : MUMBAI_LOCATIONS;

  useEffect(() => {
    setHeroQuote(
      variantCopy.headline || HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)],
    );
  }, [variantCopy.headline]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistAttributionIfPresent(routeSource);

    const params = new URLSearchParams(window.location.search);
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
  }, [form.homeLocationId]);

  useEffect(() => {
    if (signupStartedRef.current) return;
    if (form.firstName || form.lastName || form.email || form.phoneNumber) {
      signupStartedRef.current = true;
      trackSignupStart({ variant });
    }
  }, [form.firstName, form.lastName, form.email, form.phoneNumber, variant]);

  useEffect(() => {
    if (partialCapturedRef.current || !captureLead) return;
    const emailValid = /\S+@\S+\.\S+/.test(form.email);
    const phoneValid = form.phoneNumber.replace(/[^0-9]/g, "").length >= 6;
    if (!form.firstName.trim() || !emailValid || !phoneValid) return;

    partialCapturedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const stored = readStoredAttribution();

    submitPartialLead({
      data: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        countryCode: form.countryCode,
        phoneNumber: form.phoneNumber.trim(),
        homeLocationId: form.homeLocationId || undefined,
        utmSource: params.get("utm_source") ?? stored.utmSource,
        utmMedium: params.get("utm_medium") ?? stored.utmMedium ?? routeSource,
        utmCampaign: params.get("utm_campaign") ?? stored.utmCampaign,
        utmTerm: params.get("utm_term") ?? stored.utmTerm,
        utmContent: params.get("utm_content") ?? stored.utmContent,
        gclid: params.get("gclid") ?? stored.gclid,
        fbclid: params.get("fbclid") ?? stored.fbclid,
        referrer: stored.referrer ?? document.referrer,
        landingPage: stored.landingPage ?? window.location.href,
        abVariant: isBengaluru ? "bengaluru" : variant,
        classType: form.classType,
        whatsappConsent: form.whatsappConsent,
        whatsappConsentAt: form.whatsappConsentAt ?? undefined,
      },
    }).catch((e) => console.debug("[debug:signup] partial lead capture failed", e));
  }, [
    form.firstName,
    form.lastName,
    form.email,
    form.phoneNumber,
    form.homeLocationId,
    form.countryCode,
    form.whatsappConsent,
    captureLead,
    variant,
    routeSource,
    submitPartialLead,
    isBengaluru,
  ]);

  function handleSignChange(isSigned: boolean) {
    setSigned(isSigned);
    if (isSigned && !waiverSignedTrackedRef.current) {
      waiverSignedTrackedRef.current = true;
      trackWaiverSigned({ variant });
    }
  }

  function handleViewSchedule(locationId: number) {
    setSchedulePreviewLocationId(locationId);
    window.requestAnimationFrame(() => {
      document.getElementById("bengaluru-schedule-content")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const valid = useMemo(
    () =>
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(form.email) &&
      form.countryCode.trim().length > 0 &&
      form.phoneNumber.replace(/[^0-9]/g, "").length >= 6 &&
      LOCATIONS.some((l) => l.id === form.homeLocationId) &&
      form.waiverAccepted &&
      form.signatureName.trim().length >= 2,
    [form],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      console.warn("[debug:signup] submit blocked - form invalid", {
        firstName: form.firstName.trim().length > 0,
        lastName: form.lastName.trim().length > 0,
        email: /\S+@\S+\.\S+/.test(form.email),
        countryCode: form.countryCode.trim().length > 0,
        phoneNumber: form.phoneNumber.replace(/[^0-9]/g, "").length >= 6,
        homeLocationId: LOCATIONS.some((l) => l.id === form.homeLocationId),
        waiverAndSignature: form.waiverAccepted && form.signatureName.trim().length >= 2,
      });
      return;
    }

    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("Please add your signature in the box above to consent to the waiver.");
      return;
    }
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
      const trackingPayload = captureLead
        ? {
            utmSource: params.get("utm_source") ?? stored.utmSource ?? undefined,
            utmMedium: params.get("utm_medium") ?? stored.utmMedium ?? routeSource,
            utmCampaign: params.get("utm_campaign") ?? stored.utmCampaign ?? undefined,
            utmTerm: params.get("utm_term") ?? stored.utmTerm ?? undefined,
            utmContent: params.get("utm_content") ?? stored.utmContent ?? undefined,
            gclid: params.get("gclid") ?? stored.gclid ?? undefined,
            fbclid: params.get("fbclid") ?? stored.fbclid ?? undefined,
            referrer:
              stored.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined),
            landingPage:
              stored.landingPage ??
              (typeof window !== "undefined" ? window.location.href : undefined),
            abVariant: isBengaluru ? "bengaluru" : variant,
          }
        : { abVariant: variant };
      console.debug("[debug:signup] calling signup server fn", { captureLead });
      const result = await signup({
        data: {
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
          ...trackingPayload,
        },
      });
      console.debug("[debug:signup] signup result", result);
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
      trackBookingComplete({ variant, homeLocationId: form.homeLocationId });
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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header studioVariant={studioVariant} />
        <div className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="max-w-md text-center space-y-4">
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">
              Thank you for your interest!
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              A member from our team will reach out to you shortly.
            </p>
          </div>
        </div>
        <Footer studioVariant={studioVariant} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header studioVariant={studioVariant} />

      <section className="hero-shell relative overflow-hidden">
        <div
          className="hero-image absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${groupBarre})` }}
          aria-hidden
        />
        <div
          className="hero-glow absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div className="hero-grid absolute inset-0 opacity-20" aria-hidden />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,10,15,0.92) 0%, rgba(8,10,15,0.75) 55%, rgba(8,10,15,0.55) 100%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 pt-32 pb-16 lg:pt-36 lg:pb-24 grid lg:grid-cols-[0.88fr_1.12fr] gap-12 lg:gap-16 items-start text-white">
          <div className="pt-2 lg:sticky lg:top-32">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-7 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" />
              {studioConfig.heroLocationLine}
            </p>
            <h1 className="max-w-xl font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.94] tracking-[-0.035em] text-balance">
              {heroQuote}
            </h1>
            <p className="mt-7 max-w-lg text-base md:text-lg text-white/72 leading-relaxed text-pretty">
              {studioConfig.description}
            </p>
            <div className="mt-9 grid grid-cols-3 gap-3 max-w-lg border-t border-white/15 pt-7">
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
            valid={valid && signed}
            sigRef={sigRef}
            onSignChange={handleSignChange}
            studioSelected={studioSelected}
            onStudioSelectedChange={setStudioSelected}
            ctaLabel={isBengaluru ? studioConfig.signupCta : variantCopy.ctaLabel}
            studioVariant={studioVariant}
            onViewSchedule={handleViewSchedule}
          />
        </div>
      </section>

      <section className="bg-foreground text-background overflow-hidden py-5 border-y border-white/10">
        <div className="flex gap-12 animate-marquee whitespace-nowrap font-display text-3xl md:text-4xl italic">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12 items-center">
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
      </section>

      <section className="section-wash max-w-7xl mx-auto px-5 sm:px-6 py-20 lg:py-28">
        <div className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-4">
            The Physique 57 Method & Key Benefits
          </p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
            Engineered to <em className="italic">reshape</em> you in 57 minutes.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            The proven advantages that make Physique 57 India the preferred choice for fast, visible
            results and sustainable transformation.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            img={trainerLunge}
            tag="Sculpt"
            title="Isometric holds + dynamic reps"
            body="Tiny, precise movements that sculpt deep muscle - the Physique 57 signature."
          />
          <Feature
            img={lunge}
            tag="Burn"
            title="Interval-style class structure"
            body="Sequenced segments hit every muscle group with zero downtime, no impact."
          />
          <Feature
            img={trainerArm}
            tag="Recover"
            title="Stretch to lengthen, every class"
            body="We finish long and lean - every session ends with deep stretching to reset."
          />
        </div>

        <KeyBenefitsGrid />
      </section>

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

      <WhatHappensNext />

      {isBengaluru && <BengaluruInstructors />}

      <StudioLocations studioVariant={studioVariant} onViewSchedule={handleViewSchedule} />

      {isBengaluru && (
        <BengaluruSchedulePreview
          locationId={schedulePreviewLocationId}
          onLocationChange={setSchedulePreviewLocationId}
        />
      )}

      <section className="bg-secondary py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
                Loved by {isBengaluru ? "Bengaluru" : "Mumbai"}
              </p>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight">
                What our community says
              </h2>
            </div>
          </div>
          <ReviewsCarousel studioVariant={studioVariant} />
        </div>
      </section>

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
    <section className="bg-foreground text-background py-20 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-10 lg:gap-16 items-end mb-11">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-primary font-bold mb-4">
              Your Bengaluru team
            </p>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight">
              Meet your <em className="italic text-primary">instructors.</em>
            </h2>
          </div>
          <p className="max-w-2xl text-sm md:text-base leading-relaxed text-white/62 lg:justify-self-end">
            Expert guidance, thoughtful corrections, and the kind of energy that keeps you coming
            back. Get to know the instructors who bring the Physique 57 Method to life in Bengaluru.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {BENGALURU_INSTRUCTORS.map((instructor, index) => (
            <article
              key={instructor.name}
              className="group min-w-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.055] shadow-[0_18px_55px_rgba(0,0,0,0.18)]"
            >
              <div className="relative aspect-square overflow-hidden bg-white">
                <div
                  role="img"
                  aria-label={`${instructor.name}, Physique 57 Bengaluru ${instructor.role.toLowerCase()}`}
                  className="absolute inset-0 bg-no-repeat transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                  style={{
                    backgroundImage: `url(${bengaluruInstructorCollage})`,
                    backgroundSize: instructor.backgroundSize,
                    backgroundPosition: instructor.backgroundPosition,
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
                <span className="absolute left-4 bottom-3 text-[9px] font-bold uppercase tracking-[0.24em] text-white/75">
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
                <p className="mt-3 text-[13px] leading-relaxed text-white/58">{instructor.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Header({ studioVariant }: { studioVariant: StudioVariant }) {
  const isBengaluru = studioVariant === "bengaluru";
  return (
    <header className="absolute top-0 inset-x-0 z-20 border-b border-white/10 bg-black/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoUrl} alt="Physique 57" className="brand-logo h-10 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/70 font-bold">
          <Link to="/about" className="hover:text-primary transition">
            About
          </Link>
          <Link
            to="/classes-info"
            search={isBengaluru ? { studio: "bengaluru" } : undefined}
            className="hover:text-primary transition"
          >
            Classes
          </Link>
          <Link
            to="/faq"
            search={isBengaluru ? { studio: "bengaluru" } : undefined}
            className="hover:text-primary transition"
          >
            FAQ
          </Link>
          <Link
            to="/contact"
            search={isBengaluru ? { studio: "bengaluru" } : undefined}
            className="hover:text-primary transition"
          >
            Contact
          </Link>
        </nav>
        <a
          href="#signup"
          className="hidden sm:inline-flex h-11 px-6 items-center rounded-full bg-primary text-foreground border border-primary/60 text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_8px_30px_rgba(127,211,247,0.22)] hover:-translate-y-0.5 hover:bg-white transition duration-200"
        >
          Claim Your Trial Class
        </a>
      </div>
    </header>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="font-display text-4xl text-primary leading-none tracking-tight">{n}</div>
      <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
        {label}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-2 w-2 rounded-full bg-primary shrink-0" />;
}

function Feature({
  img,
  tag,
  title,
  body,
}: {
  img: string;
  tag: string;
  title: string;
  body: string;
}) {
  return (
    <article className="feature-card group bg-card border border-border/80 rounded-[1.5rem] overflow-hidden shadow-[var(--shadow-card)] flex flex-col">
      <div
        className="aspect-[4/3] bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
        style={{ backgroundImage: `url(${img})` }}
        aria-hidden
      />
      <div className="p-6 md:p-7">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary-deep font-bold mb-2">
          {tag}
        </p>
        <h3 className="font-bold text-xl leading-tight tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{body}</p>
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
    <div className="mt-14 pt-14 border-t border-border">
      <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-6">
        Key Benefits
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {KEY_BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary-deep">
              <benefit.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-bold text-base leading-tight tracking-tight">
              {benefit.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{benefit.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const NEXT_STEPS = [
  {
    n: "03",
    title: "You receive a guided confirmation",
    body: "You hear back with the best-fit option, next steps, and booking details needed to secure your first class.",
  },
  {
    n: "04",
    title: "We help you prepare",
    body: "You'll know what to wear, when to arrive, and what to expect so your first visit feels effortless.",
  },
  {
    n: "05",
    title: "Arrive ready for your first session",
    body: "Walk in with clarity, confidence, and a format that suits your schedule, goals, and energy.",
  },
  {
    n: "06",
    title: "Feel the signature finish",
    body: "Expect expert coaching, boutique energy, and the unmistakable shake that makes the method memorable from class one.",
  },
];

function WhatHappensNext() {
  return (
    <section className="bg-secondary py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-4">
            Your First Visit
          </p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
            What Happens <em className="italic">Next</em>.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            From your first click to your first shake, every step is designed to feel curated,
            clear, and high-touch.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {NEXT_STEPS.map((step) => (
            <div key={step.n} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="font-display text-4xl text-primary-deep leading-none">{step.n}</span>
              <h3 className="mt-3 font-bold text-lg leading-tight tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
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

function StudioLocations({
  studioVariant,
  onViewSchedule,
}: {
  studioVariant: StudioVariant;
  onViewSchedule: (locationId: number) => void;
}) {
  const STUDIOS = studioVariant === "bengaluru" ? BENGALURU_STUDIOS : MUMBAI_STUDIOS;
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
      <div className="max-w-2xl mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-4">
          Studio Locations
        </p>
        <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
          Choose Your <em className="italic">Studio</em>.
        </h2>
        <p className="mt-5 text-base text-muted-foreground leading-relaxed">
          Each location carries the same Physique 57 method, with its own neighborhood energy and
          format mix.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STUDIOS.map((studio) => (
          <div
            key={studio.name}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]"
          >
            <div className="h-56 w-full bg-secondary">
              <iframe
                title={`Map to ${studio.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(studio.address)}&output=embed`}
                className="h-full w-full border-0 grayscale-[0.2]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="p-7">
              <h3 className="font-display text-2xl tracking-tight">{studio.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{studio.neighborhood}</p>

              <dl className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="h-4 w-4 mt-0.5 shrink-0 text-primary-deep"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                      Location
                    </dt>
                    <dd className="text-sm">{studio.location}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary-deep" aria-hidden="true" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                      Phone
                    </dt>
                    <dd className="text-sm">
                      <a
                        href={`tel:+91${studio.phone.replace(/\s/g, "")}`}
                        className="hover:text-primary-deep transition"
                      >
                        {studio.phone}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary-deep" aria-hidden="true" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                      Hours
                    </dt>
                    <dd className="text-sm">{studio.hours}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText
                    className="h-4 w-4 mt-0.5 shrink-0 text-primary-deep"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                      Address
                    </dt>
                    <dd className="text-sm">{studio.address}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                {"id" in studio && typeof studio.id === "number" && (
                  <button
                    type="button"
                    onClick={() => onViewSchedule(studio.id as number)}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-[0.15em] text-background transition hover:opacity-90"
                  >
                    View Schedule
                  </button>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-xs font-bold uppercase tracking-[0.15em] text-foreground transition hover:border-primary-deep"
                >
                  Directions
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const BENGALURU_SCHEDULE_CENTERS = [
  { id: 22116, name: "Kenkere House", area: "Lavelle Road" },
  { id: 36372, name: "The Studio - By Copper & Cloves", area: "Indiranagar" },
  { id: 287883, name: "Plash Pilates", area: "Sadashivnagar" },
] as const;

function BengaluruSchedulePreview({
  locationId,
  onLocationChange,
}: {
  locationId: number;
  onLocationChange: (locationId: number) => void;
}) {
  function scheduleDocumentFor(centerId: number) {
    const locationIds = centerId === 287883 ? "[287883,36372]" : `[${centerId}]`;
    const tagIds = centerId === 287883 ? "[383332]" : "[]";
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; background: transparent; color-scheme: light; }
      #ribbon-schedule { min-height: 0; }
    </style>
  </head>
  <body>
    <div id="ribbon-schedule"></div>
    <script
      async
      type="module"
      host_id="33905"
      teacher_ids="[]"
      location_ids="${locationIds}"
      tag_ids="${tagIds}"
      hide_tags="true"
      default_filter="show-all"
      locale="en"
      lock_timezone="Asia/Kolkata"
      src="https://momence.com/plugin/host-schedule/host-schedule.js"
    ><\/script>
  </body>
</html>`;
  }

  return (
    <section
      id="bengaluru-schedule"
      className="border-y border-border bg-background py-12 lg:py-16"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-deep">
            Live Schedule
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">
            Find your next class.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Preview live availability by center. You’ll return here after creating your member
            profile to see rates and complete checkout.
          </p>
        </div>

        <div
          className="mt-8 grid gap-2.5 sm:grid-cols-3"
          role="tablist"
          aria-label="Schedule center"
        >
          {BENGALURU_SCHEDULE_CENTERS.map((center) => {
            const selected = center.id === locationId;
            return (
              <button
                key={center.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onLocationChange(center.id)}
                className={`rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected
                    ? "border-primary-deep bg-primary/12 shadow-sm"
                    : "border-border bg-card hover:border-primary/70"
                }`}
              >
                <span className="block text-sm font-bold text-foreground">{center.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{center.area}</span>
              </button>
            );
          })}
        </div>

        <div id="bengaluru-schedule-content" className="mt-5 scroll-mt-4">
          {BENGALURU_SCHEDULE_CENTERS.map((center) => {
            const selected = center.id === locationId;
            return (
              <iframe
                key={center.id}
                title={`${center.name} class schedule`}
                srcDoc={scheduleDocumentFor(center.id)}
                hidden={!selected}
                aria-hidden={!selected}
                className="h-[900px] w-full border-0 bg-transparent md:h-[1050px]"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SignupCard({
  form,
  setForm,
  onSubmit,
  loading,
  error,
  valid,
  sigRef,
  onSignChange,
  studioSelected,
  onStudioSelectedChange,
  ctaLabel,
  studioVariant,
  onViewSchedule,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  valid: boolean;
  sigRef: React.MutableRefObject<SignaturePadHandle | null>;
  onSignChange: (signed: boolean) => void;
  studioSelected: boolean;
  onStudioSelectedChange: (selected: boolean) => void;
  ctaLabel: string;
  studioVariant: StudioVariant;
  onViewSchedule: (locationId: number) => void;
}) {
  const [hoveredClassType, setHoveredClassType] = useState<ClassFormatKey | null>(null);
  const [descriptionClassType, setDescriptionClassType] = useState<ClassFormatKey | null>(null);
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBengaluru = studioVariant === "bengaluru";
  const LOCATIONS = isBengaluru ? BENGALURU_LOCATIONS : MUMBAI_LOCATIONS;

  function clearHoverDelay() {
    if (!hoverDelayRef.current) return;
    clearTimeout(hoverDelayRef.current);
    hoverDelayRef.current = null;
  }

  function startDescriptionDelay(classType: ClassFormatKey) {
    clearHoverDelay();
    setHoveredClassType(classType);
    hoverDelayRef.current = setTimeout(() => {
      setDescriptionClassType(classType);
    }, 2000);
  }

  function hideDescription(classType: ClassFormatKey) {
    if (hoveredClassType === classType) {
      setHoveredClassType(null);
    }
    if (descriptionClassType === classType) {
      setDescriptionClassType(null);
    }
    clearHoverDelay();
  }

  useEffect(() => {
    return () => clearHoverDelay();
  }, []);

  return (
    <div
      id="signup"
      className="signup-card w-full bg-background/95 text-foreground rounded-[1.75rem] p-6 sm:p-7 md:p-9 shadow-[var(--shadow-form)] border border-white/60 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">
            Activate your trial
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Takes 60 seconds. No card required.
          </p>
        </div>
        {!isBengaluru && (
          <span className="hidden sm:inline-flex shrink-0 rounded-full bg-primary/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary-deep">
            Complimentary
          </span>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First name"
              value={form.firstName}
              onChange={(v) => setForm((prev) => ({ ...prev, firstName: v }))}
              required
              name="given-name"
              autoComplete="given-name"
            />
            <Field
              label="Last name"
              value={form.lastName}
              onChange={(v) => setForm((prev) => ({ ...prev, lastName: v }))}
              required
              name="family-name"
              autoComplete="family-name"
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
          />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              Mobile number *
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
                className="h-11 rounded-lg border border-input bg-background px-3 text-center text-xl focus:outline-none focus:ring-2 focus:ring-ring min-w-[4.25rem]"
                aria-label="Country dialing code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.iso} value={c.iso} title={`${c.name} ${c.dial}`}>
                    {c.flag}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                name="tel-national"
                autoComplete="tel-national"
                required
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                placeholder="98765 43210"
                className="flex-1 h-11 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <label className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
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
              Yes, send me class reminders and updates on WhatsApp at the number above. I can reply
              STOP anytime to opt out.
            </span>
          </label>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              Preferred studio *
            </label>
            {isBengaluru ? (
              <div
                className="grid gap-2.5 sm:grid-cols-3"
                role="radiogroup"
                aria-label="Preferred studio"
              >
                {LOCATIONS.map((location) => {
                  const selected = form.homeLocationId === location.id;
                  const cardCopy =
                    location.id === 22116
                      ? { name: "Kenkere House", area: "Lavelle Road" }
                      : location.id === 36372
                        ? { name: "The Studio - By Copper & Cloves", area: "Indiranagar" }
                        : { name: "Plash Pilates", area: "Sadashivnagar" };
                  return (
                    <button
                      key={location.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, homeLocationId: location.id }));
                        onStudioSelectedChange(true);
                      }}
                      className={`group relative min-h-24 overflow-hidden rounded-2xl border p-4 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selected
                          ? "border-primary-deep bg-gradient-to-br from-primary/[0.16] to-background shadow-[0_10px_28px_rgba(64,170,215,0.16)] ring-1 ring-primary/15"
                          : "border-border/80 bg-background shadow-[0_8px_22px_-20px_rgba(15,23,42,0.5)] hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/[0.04] hover:shadow-[0_14px_30px_-22px_rgba(15,23,42,0.5)]"
                      }`}
                    >
                      <span
                        className={`absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition ${
                          selected ? "via-primary-deep" : "via-transparent"
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl transition ${
                          selected
                            ? "bg-primary-deep text-white shadow-sm"
                            : "bg-secondary text-primary-deep group-hover:bg-primary/20"
                        }`}
                      >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {selected && (
                        <span className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                      <span className="block text-xs font-semibold leading-snug tracking-[-0.01em] text-foreground">
                        {cardCopy.name}
                      </span>
                      <span className="mt-1.5 block text-[10px] font-medium uppercase leading-snug tracking-[0.08em] text-muted-foreground">
                        {cardCopy.area}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <select
                required
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.homeLocationId}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    homeLocationId: Number(e.target.value),
                  }));
                  onStudioSelectedChange(true);
                }}
              >
                <option value={0} disabled>
                  -- Select studio --
                </option>
                {LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
            {isBengaluru && form.homeLocationId > 0 && (
              <button
                type="button"
                onClick={() => onViewSchedule(form.homeLocationId)}
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-deep underline decoration-primary/40 underline-offset-4 transition hover:text-foreground"
              >
                View selected center schedule
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>

          {studioSelected && !isBengaluru && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                Class type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {classTypeOptionsForLocation(form.homeLocationId).map((key) => {
                  const classFormat = classFormatForKey(key);
                  const selected = form.classType === key;
                  const showDescription =
                    (hoveredClassType === key || descriptionClassType === key) &&
                    descriptionClassType === key;
                  return (
                    <div key={key} className="group relative">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, classType: key }))}
                        onMouseEnter={() => startDescriptionDelay(key)}
                        onMouseLeave={() => hideDescription(key)}
                        onFocus={() => setDescriptionClassType(key)}
                        onBlur={() => hideDescription(key)}
                        aria-pressed={selected}
                        className={`group/card flex w-full flex-col overflow-hidden rounded-xl border text-center transition shadow-sm ${
                          selected
                            ? "border-primary-deep bg-[#f8f5ff] ring-2 ring-primary-deep shadow-md"
                            : "border-input bg-background hover:border-[#c8bef4] hover:shadow-md"
                        }`}
                      >
                        <div className="w-full overflow-hidden">
                          <img
                            src={classFormat.image}
                            alt=""
                            className="h-52 w-full object-cover object-top transition-transform duration-500 group-hover/card:scale-105"
                          />
                        </div>
                        <span className="px-2 py-2.5 text-xs font-semibold text-foreground">
                          {classFormat.name}
                        </span>
                      </button>

                      {showDescription && (
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 w-56 -translate-x-1/2 rounded-md border border-border bg-background px-3 py-2 text-left text-[11px] leading-relaxed text-muted-foreground shadow-[var(--shadow-card)]"
                        >
                          {classFormat.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3.5">
          <p className="text-xs text-muted-foreground leading-relaxed -mt-1">
            Please review and sign before activating Open Barre. This consent is recorded with your
            Momence member profile.
          </p>

          <details className="group/waiver rounded-lg border border-border bg-background open:pb-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-foreground">
              <span>View full waiver details</span>
              <span className="text-muted-foreground transition group-open/waiver:rotate-180">
                ▾
              </span>
            </summary>
            <div className="space-y-3 px-3.5">
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

          <input
            type="text"
            required
            value={form.signatureName}
            placeholder="Type your full legal name"
            readOnly
            className="w-full h-10 px-3 rounded-lg border border-input bg-secondary/60 text-foreground text-sm cursor-default focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Full legal name"
          />
          <div onPointerUp={() => onSignChange(!(sigRef.current?.isEmpty() ?? true))}>
            <SignaturePad ref={sigRef} label=" signature *" />
          </div>
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border bg-background p-3 transition hover:border-primary/50">
            <input
              type="checkbox"
              required
              checked={form.waiverAccepted}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, waiverAccepted: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--primary)]"
            />
            <span className="text-xs text-foreground leading-relaxed">
              I have read, signed, and accept the waiver and Physique 57 India&apos;s privacy terms.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !valid}
          className="w-full h-13 rounded-full bg-foreground text-background font-bold uppercase tracking-[0.15em] text-xs shadow-[0_12px_28px_rgba(10,14,20,0.18)] hover:-translate-y-0.5 hover:bg-primary hover:text-foreground transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading
            ? "Activating membership…"
            : !isBengaluru && isPaidNewcomersClassName(form.classType)
              ? "Book My Trial Class"
              : ctaLabel}
        </button>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  name?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        required={required}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.currentTarget.value)}
        onAnimationStart={(e) => {
          if (e.animationName === "p57-autofill-detected") {
            onChange(e.currentTarget.value);
          }
        }}
        className="autofill-watch w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function ConsentLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 text-xs leading-relaxed text-foreground">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-deep" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
