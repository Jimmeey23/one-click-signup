import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import confetti from "canvas-confetti";
import { ArrowLeft, Check, MapPin, Sparkles, Trophy, Zap } from "lucide-react";
import {
  signupAndEnroll,
  sendSignupLeadCapi,
  captureLeadPartial,
  submitLeadOnly,
} from "@/lib/momence.functions";
import {
  readMetaCookies,
  readRawFbclid,
  setMetaAdvancedMatching,
  trackSignupStart,
  trackWaiverSigned,
} from "@/lib/analytics";
import { getSchedulePriceDisplay, isPaidNewcomersClassName } from "@/lib/momence-booking.helpers";
import { storeRegistrationMeta } from "@/lib/registration-meta.helpers";
import { isValidPhoneNumber, phoneNumberError } from "@/lib/phone-validation";
import { MUMBAI_LOCATIONS, metaGeoForLocationId } from "@/lib/momence-locations";
import { COUNTRY_CODES } from "@/lib/country-codes";
import { parseAttributionFromSearch, trimToMaxLength } from "@/lib/attribution.helpers";
import type { ClassFormatKey } from "@/lib/class-format-matchers";
import { classFormatForKey, classTypeOptionsForLocation } from "@/lib/class-formats";
import { fireDualSideConfetti } from "@/lib/confetti";
import type { SignaturePadHandle } from "@/components/SignaturePad";

const SignaturePad = lazy(() =>
  import("@/components/SignaturePad").then((m) => ({ default: m.SignaturePad })),
);

const XP_PER_STEP = 57;
const ATTRIBUTION_STORAGE_KEY = "p57_attribution";

type Goal = "stronger" | "posture" | "sculpt" | "stress" | "routine";
type Energy = "calm" | "steady" | "sweat";

const GOALS: { id: Goal; label: string; emoji: string }[] = [
  { id: "stronger", label: "Feel stronger", emoji: "💪" },
  { id: "posture", label: "Improve posture", emoji: "🧘" },
  { id: "sculpt", label: "Tone & sculpt", emoji: "✨" },
  { id: "stress", label: "Ease stress", emoji: "🌿" },
  { id: "routine", label: "Get back into a routine", emoji: "🔁" },
];

const ENERGIES: { id: Energy; label: string; hint: string }[] = [
  { id: "calm", label: "Low & controlled", hint: "Precise moves, mindful burn" },
  { id: "steady", label: "Steady burn", hint: "Shake-it-out intensity" },
  { id: "sweat", label: "Max sweat", hint: "Beat-driven, heart pumping" },
];

/** This form is for Supreme HQ, Bandra only: studio, webhook centre and source are fixed. */
const LOCATION = MUMBAI_LOCATIONS.find((l) => l.id === 29821)!;
const WEBHOOK_CENTER = "Supreme HQ, Bandra";
const LEAD_SOURCE = "website";
const WEBSITE_SOURCE_ID = "8082"; // Momence lead source "Website"
const SOURCE_FORM = "find-your-57";
const PARTIAL_LEAD_IDLE_MS = 90_000;

/** Pick the best-fit class format the chosen studio actually runs. */
function recommendFormat(goal: Goal, energy: Energy, locationId: number): ClassFormatKey {
  const allowed = classTypeOptionsForLocation(locationId);
  const prefs: ClassFormatKey[] =
    energy === "sweat"
      ? ["power-cycle", "strength-lab", "barre-57"]
      : goal === "stronger"
        ? ["strength-lab", "barre-57"]
        : ["barre-57"];
  return prefs.find((k) => allowed.includes(k)) ?? allowed[0];
}

function readStoredAttribution(): Record<string, string | undefined> {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string | undefined>) : {};
  } catch {
    return {};
  }
}

function persistAttribution() {
  try {
    const parsed = parseAttributionFromSearch(window.location.search);
    if (Object.keys(parsed).length === 0) return;
    sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        utmMedium: parsed.utmMedium ?? "find-your-57",
        referrer: document.referrer || undefined,
        landingPage: window.location.href,
      }),
    );
  } catch {
    /* storage unavailable */
  }
}

function newId(prefix: string) {
  return typeof window !== "undefined" && window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const STEPS = ["goal", "energy", "match", "details", "waiver"] as const;
type Step = (typeof STEPS)[number];

/**
 * leadOnly: the /find-your-57-lead variant. Same quiz and tracking, but submitting only
 * sends the lead webhook to Momence - no member, no waiver signing, no class booking,
 * and no signature pad.
 */
export function FindYour57Quiz({ leadOnly = false }: { leadOnly?: boolean } = {}) {
  const sendLeadOnly = useServerFn(submitLeadOnly);
  const [leadSent, setLeadSent] = useState(false);
  const signup = useServerFn(signupAndEnroll);
  const sendLeadCapi = useServerFn(sendSignupLeadCapi);
  const submitPartialLead = useServerFn(captureLeadPartial);
  const partialCapturedRef = useRef(false);
  const signupStartedRef = useRef(false);
  const waiverTrackedRef = useRef(false);
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const leadEventId = useRef(newId("lead"));
  const registrationEventId = useRef(newId("reg"));

  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryIso, setCountryIso] = useState("IN");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    persistAttribution();
  }, []);

  const stepIndex = STEPS.indexOf(step);
  const xp = stepIndex * XP_PER_STEP;
  const progress = Math.round((stepIndex / STEPS.length) * 100);

  const location = LOCATION;
  const format = useMemo(
    () => (goal && energy ? classFormatForKey(recommendFormat(goal, energy, LOCATION.id)) : null),
    [goal, energy],
  );
  const isPaidFormat = format ? isPaidNewcomersClassName(format.name) : false;
  const price = format ? getSchedulePriceDisplay(format.name, LOCATION.id) : null;
  const quizAnswers = useMemo(
    () => ({
      ...(goal ? { goal } : {}),
      ...(energy ? { energy } : {}),
      ...(format ? { match: format.key } : {}),
    }),
    [goal, energy, format],
  );

  function trackingFields() {
    const params = new URLSearchParams(window.location.search);
    const stored = readStoredAttribution();
    const fbclid = readRawFbclid(window.location.search) ?? stored.fbclid;
    const metaCookies = readMetaCookies(fbclid);
    return {
      metaCookies,
      fields: {
        utmSource: params.get("utm_source") ?? stored.utmSource,
        utmMedium: params.get("utm_medium") ?? stored.utmMedium ?? SOURCE_FORM,
        utmCampaign: params.get("utm_campaign") ?? stored.utmCampaign,
        utmTerm: params.get("utm_term") ?? stored.utmTerm,
        utmContent: params.get("utm_content") ?? stored.utmContent,
        gclid: params.get("gclid") ?? stored.gclid,
        fbclid,
        referrer: trimToMaxLength(stored.referrer ?? document.referrer),
        landingPage: trimToMaxLength(stored.landingPage ?? window.location.href),
        abVariant: SOURCE_FORM,
        sourceId: WEBSITE_SOURCE_ID,
        center: WEBHOOK_CENTER,
        leadSource: LEAD_SOURCE,
        sourceForm: SOURCE_FORM,
        quizAnswers,
        fbp: metaCookies.fbp,
        fbc: metaCookies.fbc,
      },
    };
  }

  // Abandoned-signup capture, same rules as the main form: once, never after submit.
  const firePartialLeadRef = useRef<() => void>(() => {});
  firePartialLeadRef.current = () => {
    if (partialCapturedRef.current || signupStartedRef.current) return;
    if (!firstName.trim() || !/\S+@\S+\.\S+/.test(email)) return;
    if (phone.replace(/[^0-9]/g, "").length < 6) return;
    partialCapturedRef.current = true;
    const { fields } = trackingFields();
    submitPartialLead({
      data: {
        ...fields,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        countryCode,
        phoneNumber: phone.trim(),
        homeLocationId: LOCATION.id,
        classType: format?.key,
        whatsappConsent,
        whatsappConsentAt: whatsappConsent ? new Date().toISOString() : undefined,
        metaEventId: leadEventId.current,
      },
    }).catch((e) => console.debug("[debug:quiz] partial lead failed", e));
  };

  useEffect(() => {
    const send = () => firePartialLeadRef.current();
    const onHidden = () => document.visibilityState === "hidden" && send();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", send);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", send);
    };
  }, []);

  useEffect(() => {
    if (partialCapturedRef.current) return;
    const t = setTimeout(() => firePartialLeadRef.current(), PARTIAL_LEAD_IDLE_MS);
    return () => clearTimeout(t);
  }, [firstName, lastName, email, phone, countryCode]);

  useEffect(() => {
    if (!firstName && !email && !phone) return;
    setMetaAdvancedMatching({
      email: email.includes("@") ? email : undefined,
      phone: phone.replace(/[^0-9]/g, "").length >= 6 ? `${countryCode}${phone}` : undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  }, [firstName, lastName, email, phone, countryCode]);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (step === "match") fireDualSideConfetti(confetti);
    // Each level swaps the card's height; bring its top back into view so the new
    // question / match image is not left above the fold.
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    if (rect.top < 72 || rect.top > window.innerHeight * 0.4) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const detailsValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    isValidPhoneNumber(phone, countryCode);
  const phoneErr = phone ? phoneNumberError(phone, countryCode) : null;

  function back() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  }

  async function submitLead() {
    if (!format) return;
    if (!waiverAccepted) {
      setError("Please accept the terms and privacy policy to continue.");
      return;
    }
    signupStartedRef.current = true;
    setLoading(true);
    setError(null);
    const { metaCookies, fields } = trackingFields();
    const fullPhone = `${countryCode}${phone.trim()}`;
    try {
      const result = await sendLeadOnly({
        data: {
          ...fields,
          sourceForm: `${SOURCE_FORM}-lead`,
          abVariant: `${SOURCE_FORM}-lead`,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          countryCode,
          phoneNumber: phone.trim(),
          homeLocationId: LOCATION.id,
          classType: format.key,
          // No waiver is shown or signed on this route; the checkbox covers terms/privacy only.
          waiverAccepted: false,
          whatsappConsent,
          whatsappConsentAt: whatsappConsent ? new Date().toISOString() : undefined,
          metaEventId: leadEventId.current,
        },
      });
      if (result.leadError) {
        console.warn("[debug:quiz-lead] lead webhook failed:", result.leadError);
      }
      // Lead pixel + CAPI share one event id, same as the main form. A repeat already sent.
      if (!result.repeat) {
        setMetaAdvancedMatching({
          email: email.trim(),
          phone: fullPhone,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          countryIso,
          ...metaGeoForLocationId(LOCATION.id),
        });
        trackSignupStart({ variant: "a", content_name: format.key }, leadEventId.current);
        sendLeadCapi({
          data: {
            eventId: leadEventId.current,
            email: email.trim(),
            phone: fullPhone,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            classType: format.key,
            countryIso,
            locationId: LOCATION.id,
            landingPage: trimToMaxLength(window.location.href),
            fbp: metaCookies.fbp,
            fbc: metaCookies.fbc,
          },
        }).catch(() => {});
      }
      setLeadSent(true);
      fireDualSideConfetti(confetti);
    } catch (e) {
      signupStartedRef.current = false;
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!format || !location) return;
    const signatureRealSignature = sigRef.current?.toRealSignature() ?? undefined;
    if (!waiverAccepted || !signatureRealSignature) {
      setError("Please accept the waiver and sign in the box.");
      return;
    }
    signupStartedRef.current = true;
    setLoading(true);
    setError(null);
    const { metaCookies, fields } = trackingFields();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const fullPhone = `${countryCode}${phone.trim()}`;
    try {
      const result = await signup({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          countryCode,
          phoneNumber: phone.trim(),
          homeLocationId: location.id,
          waiverAccepted: true,
          signatureName: fullName,
          signatureRealSignature,
          classType: format.key,
          whatsappConsent,
          whatsappConsentAt: whatsappConsent ? new Date().toISOString() : undefined,
          ...fields,
          leadEventId: leadEventId.current,
        },
      });

      if (!result.repeat) {
        setMetaAdvancedMatching({
          email: email.trim(),
          phone: fullPhone,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          externalId: String(result.memberId),
          countryIso,
          ...metaGeoForLocationId(location.id),
        });
        trackSignupStart({ variant: "a", content_name: format.key }, leadEventId.current);
        sendLeadCapi({
          data: {
            eventId: leadEventId.current,
            memberId: result.memberId,
            email: email.trim(),
            phone: fullPhone,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            classType: format.key,
            countryIso,
            locationId: location.id,
            landingPage: trimToMaxLength(window.location.href),
            fbp: metaCookies.fbp,
            fbc: metaCookies.fbc,
          },
        }).catch(() => {});
        storeRegistrationMeta({
          eventId: registrationEventId.current,
          memberId: result.memberId,
          email: email.trim(),
          phone: fullPhone,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          classType: format.key,
          variant: "a",
          countryIso,
          fbp: metaCookies.fbp,
          fbc: metaCookies.fbc,
          landingPage: window.location.href,
        });
      }
      if (!result.enrolled) {
        setError(
          result.enrollError ??
            "Your membership could not be activated. Please contact the studio team.",
        );
        return;
      }
      // quick=1 tells the schedule page to skip the extra profile fields and book straight away.
      const search = new URLSearchParams({
        locationId: String(location.id),
        classType: format.key,
        quick: "1",
      });
      window.location.assign(`/classes/${encodeURIComponent(String(result.memberId))}?${search}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={cardRef}
      id="signup"
      className="scroll-mt-28 rounded-[28px] border border-white/15 bg-[rgba(8,10,15,0.82)] p-5 sm:p-7 text-white shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">
          Supreme HQ, Bandra · 4 taps to your class
        </p>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
          <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span>{xp} XP</span>
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-2 rounded-full bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50">
          <span>
            Level {stepIndex + 1} / {STEPS.length}
          </span>
          {stepIndex > 0 && !leadSent && (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden /> Back
            </button>
          )}
        </div>
      </div>

      <main key={step} className="pt-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {step === "goal" && (
          <Question title="What do you want your body to do for you?" kicker="Find your 57">
            {GOALS.map((g) => (
              <Choice
                key={g.id}
                selected={goal === g.id}
                onClick={() => {
                  setGoal(g.id);
                  setStep("energy");
                }}
              >
                <span className="text-2xl" aria-hidden>
                  {g.emoji}
                </span>
                <span>{g.label}</span>
              </Choice>
            ))}
          </Question>
        )}

        {step === "energy" && (
          <Question title="Pick your energy." kicker="+57 XP unlocked">
            {ENERGIES.map((e) => (
              <Choice
                key={e.id}
                selected={energy === e.id}
                onClick={() => {
                  setEnergy(e.id);
                  setStep("match");
                }}
              >
                <span className="flex flex-col text-left">
                  <span>{e.label}</span>
                  <span className="text-xs text-white/55 font-normal">{e.hint}</span>
                </span>
              </Choice>
            ))}
          </Question>
        )}

        {step === "match" && format && location && (
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary font-bold">
              <Trophy className="h-4 w-4" aria-hidden /> It's a match
            </div>
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10">
              {/* Fixed aspect + upper-centre focus keeps faces and bikes in frame at every width. */}
              <img
                src={format.image}
                alt={`${format.name} class at Physique 57`}
                className="aspect-[16/9] w-full object-cover object-[center_35%]"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h2 className="font-display text-4xl sm:text-5xl leading-none tracking-tight">
                  {format.name}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                    {format.intensity}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                    {format.duration}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                    <MapPin className="h-3 w-3" aria-hidden /> {location.name}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/75 leading-relaxed line-clamp-3">
              {format.bestFor}. {format.description}
            </p>
            <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary font-semibold">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              {isPaidFormat && price
                ? `${price.label}: ₹${price.bookingPriceInCurrency} + GST, paid securely when you book`
                : "Your first class is on us"}
            </p>
            <PrimaryButton onClick={() => setStep("details")}>
              {isPaidFormat ? "Claim my intro offer" : "Claim my free class"}
            </PrimaryButton>
          </div>
        )}

        {step === "details" && (
          <Question title="Who's claiming the spot?" kicker="Final boss: 2 quick screens">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                value={firstName}
                onChange={setFirstName}
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <label className="block">
                <span className="text-xs text-white/60">Code</span>
                <select
                  value={countryIso}
                  onChange={(e) => {
                    const c = COUNTRY_CODES.find((x) => x.iso === e.target.value);
                    if (c) {
                      setCountryIso(c.iso);
                      setCountryCode(c.dial);
                    }
                  }}
                  className="mt-1 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-white"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.iso} value={c.iso} className="text-black">
                      {c.iso} {c.dial}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel-national"
              />
            </div>
            {phoneErr && <p className="text-xs text-red-300">{phoneErr}</p>}
            <label className="flex items-start gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-0.5"
              />
              Send my booking confirmation and class updates on WhatsApp.
            </label>
            <PrimaryButton disabled={!detailsValid} onClick={() => setStep("waiver")}>
              Continue
            </PrimaryButton>
          </Question>
        )}

        {leadSent && format && (
          <div className="text-center py-6">
            <Trophy className="mx-auto h-12 w-12 text-primary" aria-hidden />
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-primary font-bold">
              Level complete · {STEPS.length * XP_PER_STEP} XP
            </p>
            <h2 className="mt-2 font-display text-4xl tracking-tight">
              You're on the list, {firstName.trim() || "friend"}!
            </h2>
            <p className="mt-4 text-sm text-white/75 leading-relaxed">
              Our Supreme HQ, Bandra team will reach out shortly
              {whatsappConsent ? " on WhatsApp" : ""} to book your first {format.name} class.
            </p>
          </div>
        )}

        {step === "waiver" && !leadSent && (
          <Question
            title={leadOnly ? "One last tap." : "Sign & unlock your class."}
            kicker="Last level"
          >
            <label className="flex items-start gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={waiverAccepted}
                onChange={(e) => {
                  setWaiverAccepted(e.target.checked);
                  if (e.target.checked && !leadOnly && !waiverTrackedRef.current) {
                    waiverTrackedRef.current = true;
                    trackWaiverSigned({ variant: SOURCE_FORM });
                  }
                }}
                className="mt-1"
              />
              {leadOnly ? (
                <span>
                  I accept the{" "}
                  <Link to="/terms" target="_blank" className="underline text-primary">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" target="_blank" className="underline text-primary">
                    privacy policy
                  </Link>
                  .
                </span>
              ) : (
                <span>
                  I accept the{" "}
                  <Link to="/waiver" target="_blank" className="underline text-primary">
                    waiver
                  </Link>
                  ,{" "}
                  <Link to="/terms" target="_blank" className="underline text-primary">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" target="_blank" className="underline text-primary">
                    privacy policy
                  </Link>
                  .
                </span>
              )}
            </label>
            {!leadOnly && (
              <div className="rounded-xl bg-white p-2 text-foreground">
                <Suspense fallback={<div className="h-32" />}>
                  <SignaturePad
                    ref={(h) => {
                      sigRef.current = h;
                    }}
                    label="Sign here"
                  />
                </Suspense>
                <div className="flex justify-between px-1 pt-1 text-xs">
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      sigRef.current?.clear();
                      setSigned(false);
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setSigned(!(sigRef.current?.isEmpty() ?? true))}
                  >
                    Done signing
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <PrimaryButton
              disabled={!waiverAccepted || loading}
              onClick={() => {
                if (leadOnly) {
                  void submitLead();
                  return;
                }
                if (sigRef.current?.isEmpty() ?? true) {
                  setError("Please sign in the box above.");
                  return;
                }
                setSigned(true);
                void submit();
              }}
            >
              {loading
                ? "Unlocking…"
                : leadOnly
                  ? "Claim my spot"
                  : isPaidFormat
                    ? "Pick my class & pay"
                    : "Pick my class time"}
            </PrimaryButton>
          </Question>
        )}
      </main>
    </div>
  );
}

function Question({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">{kicker}</p>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-tight tracking-tight">
        {title}
      </h2>
      <div className="mt-6 space-y-3">{children}</div>
    </section>
  );
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl border px-5 py-4 text-base font-semibold transition active:scale-[0.98] ${selected ? "border-primary bg-primary/15" : "border-white/15 bg-white/5 hover:border-white/40"}`}
    >
      {children}
      {selected && <Check className="ml-auto h-5 w-5 text-primary" aria-hidden />}
    </button>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-6 w-full rounded-full bg-primary px-6 py-4 text-base font-bold text-primary-foreground disabled:opacity-40 transition active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/60">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-primary"
      />
    </label>
  );
}
