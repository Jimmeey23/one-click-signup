import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Accessibility,
  Activity,
  Award,
  BadgeCheck,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Dumbbell,
  FileText,
  Footprints,
  Heart,
  Loader2,
  PenLine,
  PersonStanding,
  Shield,
  Smile,
  Sparkles,
  Table2,
  Target,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import { KidsConsentModal } from "@/components/KidsConsentModal";
import { COUNTRY_CODES } from "@/lib/country-codes";
import { MUMBAI_LOCATIONS, BENGALURU_LOCATIONS } from "@/lib/momence-locations";
import { submitKidsRegistration } from "@/lib/momence.functions";
import type { CustomBatch } from "@/lib/shareable-route";
import {
  JUNIORS_BUILD_AREAS,
  JUNIORS_HERO_IMAGES,
  JUNIORS_LOCATION_IDS,
  JUNIORS_JOURNEY_STEPS,
  JUNIORS_MAX_AGE,
  JUNIORS_MIN_AGE,
  JUNIORS_PARENT_NOTES,
  JUNIORS_PROGRAM_FEATURES,
  JUNIORS_PROGRAM_NAME,
  JUNIORS_PROGRAM_OUTCOMES,
  JUNIORS_USPS,
  juniorsBatchesForLocation,
} from "@/lib/kids-program";
import { cn } from "@/lib/utils";

const ICONS = {
  sparkles: Sparkles,
  shield: Shield,
  award: Award,
  heart: Heart,
  target: Target,
  accessibility: Accessibility,
  footprints: Footprints,
  table: Table2,
  person: PersonStanding,
  dumbbell: Dumbbell,
  activity: Activity,
  zap: Zap,
  smile: Smile,
} as const;

const ALL_LOCATIONS = [...MUMBAI_LOCATIONS, ...BENGALURU_LOCATIONS];

// Only the studios that actually run Juniors classes are selectable; a route may still
// lock the page to another location, which is resolved against the full list.
const JUNIORS_LOCATIONS = ALL_LOCATIONS.filter((location) =>
  JUNIORS_LOCATION_IDS.includes(location.id as number),
);

const CUSTOM_BATCH_ACCENTS = [
  { accent: "bg-sky-50 text-sky-700 ring-1 ring-sky-100", metaAccent: "text-sky-700" },
  {
    accent: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    metaAccent: "text-emerald-700",
  },
  { accent: "bg-rose-50 text-rose-700 ring-1 ring-rose-100", metaAccent: "text-rose-700" },
  { accent: "bg-violet-50 text-violet-700 ring-1 ring-violet-100", metaAccent: "text-violet-700" },
];

const FIELD_GROUP_CLASS = "group/field space-y-2.5";
const FIELD_LABEL_CLASS =
  "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition-colors group-focus-within/field:text-slate-950";
const FIELD_CONTROL_CLASS =
  "h-12 rounded-[15px] border-slate-300/90 bg-white text-[15px] font-medium text-slate-950 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-all placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-slate-950 focus-visible:ring-4 focus-visible:ring-slate-950/10";
const FIELD_ERROR_CLASS = "text-sm font-semibold text-destructive";
const FIELD_INVALID_CLASS = "border-destructive bg-red-50/40 focus-visible:ring-destructive/15";
const SECTION_PANEL_CLASS =
  "rounded-[22px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm ring-1 ring-white/80 sm:p-5";
const SECTION_ICON_CLASS =
  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-4";
const SECTION_TITLE_CLASS = "mt-1 text-xl font-semibold leading-snug text-slate-950";
const SECTION_BADGE_CLASS =
  "w-fit rounded-full border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm";

export type KidsLandingProps = {
  /** Lock the page to one studio - used by shareable routes built for a single centre. */
  lockedLocationId?: number;
  /** Drops the batch chooser from the form entirely. */
  hideBatchSelection?: boolean;
  /** Batches written for this route, used instead of the studio's standard ones. */
  customBatches?: CustomBatch[];
  /** When set, the signup also books this exact session for the child, free of charge. */
  sessionId?: number;
  sessionLabel?: string;
  membershipId?: number;
  heroTitle?: string;
  heroEyebrow?: string;
  heroDescription?: string;
  mobileHeroDescription?: string;
  heroHighlights?: string[];
  heroImages?: string[];
  formTitle?: string;
  formDescription?: string;
  formBadge?: string;
  routeSource?: string;
  utmSource?: string;
  utmCampaign?: string;
};

type Errors = Record<string, string>;

export function KidsLanding({
  lockedLocationId,
  hideBatchSelection = false,
  customBatches,
  sessionId,
  sessionLabel,
  membershipId,
  heroTitle = "Strong Foundations Start Here",
  heroEyebrow = `For ages ${JUNIORS_MIN_AGE}-${JUNIORS_MAX_AGE}`,
  heroDescription = "Led by experts, the Physique 57 Kids Strength & Agility Program builds strength, balance, mobility, coordination, and athletic power.",
  mobileHeroDescription = "Build strength. Improve balance. Boost confidence.",
  heroHighlights = ["Posture", "Strength", "Confidence"],
  heroImages = JUNIORS_HERO_IMAGES,
  formTitle = "Plan your child's first session",
  formDescription = "Tell us where you would like to visit and which Juniors class works best for your child.",
  formBadge = "P57 Juniors",
  routeSource = "kids",
  utmSource,
  utmCampaign,
}: KidsLandingProps) {
  const register = useServerFn(submitKidsRegistration);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryIso: "IN",
    phone: "",
    locationId: lockedLocationId ? String(lockedLocationId) : "",
    childName: "",
    childAge: "",
    childDateOfBirth: "",
    batch: "",
    signatureName: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [success, setSuccess] = useState<{ booked: boolean } | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const signatureNameTouchedRef = useRef(false);

  const locationId = Number(form.locationId) || 0;
  const location = ALL_LOCATIONS.find((item) => item.id === locationId);
  const lockedLocation = lockedLocationId
    ? ALL_LOCATIONS.find((item) => item.id === lockedLocationId)
    : undefined;
  const batches = useMemo(() => {
    if (customBatches?.length) {
      // A route's own batches have no studio palette of their own, so cycle the standard
      // accents to keep the cards distinguishable.
      return customBatches.map((batch, index) => {
        const accent = CUSTOM_BATCH_ACCENTS[index % CUSTOM_BATCH_ACCENTS.length];
        return {
          value: [batch.days, batch.time, batch.instructors].filter(Boolean).join(" - "),
          days: batch.days,
          time: batch.time,
          instructors: batch.instructors,
          studio: location?.name.split(",")[0] ?? "",
          note: batch.note,
          ...accent,
        };
      });
    }
    return juniorsBatchesForLocation(locationId);
  }, [customBatches, locationId, location]);
  const country = COUNTRY_CODES.find((item) => item.iso === form.countryIso) ?? COUNTRY_CODES[0];
  // A route that books a specific session has already decided the class, so the batch
  // question would only contradict it.
  const showBatchPicker = !hideBatchSelection && !sessionId;

  useEffect(() => {
    if (heroImages.length < 2) return;
    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    if (!consentOpen) return;
    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConsentOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [consentOpen]);

  // The signature name is the parent's own name, so fill it in for them - until they
  // edit it themselves, after which their version wins.
  useEffect(() => {
    if (signatureNameTouchedRef.current) return;
    const parentName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    setForm((current) =>
      current.signatureName === parentName ? current : { ...current, signatureName: parentName },
    );
  }, [form.firstName, form.lastName]);

  function update(field: keyof typeof form, value: string | boolean) {
    if (field === "signatureName") signatureNameTouchedRef.current = true;
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "locationId" ? { batch: "" } : {}),
    }));
    setErrors((current) => ({
      ...current,
      [field]: "",
      ...(field === "locationId" ? { batch: "" } : {}),
    }));
  }

  function validate(): Errors {
    const next: Errors = {};
    const age = Number.parseInt(form.childAge, 10);

    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email";
    if (form.phone.replace(/[^0-9]/g, "").length < 6) next.phone = "Enter a valid phone number";
    if (!locationId) next.locationId = "Select a center";
    if (!form.childName.trim()) next.childName = "Child name is required";
    if (!form.childAge.trim()) next.childAge = "Child age is required";
    else if (!/^\d+$/.test(form.childAge.trim())) next.childAge = "Enter age as a whole number";
    else if (age < JUNIORS_MIN_AGE || age > JUNIORS_MAX_AGE)
      next.childAge = `Child age must be between ${JUNIORS_MIN_AGE} and ${JUNIORS_MAX_AGE}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.childDateOfBirth.trim()))
      next.childDateOfBirth = "Child date of birth is required";
    if (showBatchPicker && !form.batch)
      next.batch = locationId ? "Select a batch preference" : "Select a center first";
    if (form.signatureName.trim().length < 2)
      next.signatureName = "Enter the parent/guardian signature name";
    if (!sigRef.current?.toRealSignature())
      next.signatureRealSignature = "Add the parent/guardian signature";
    if (!form.acceptedTerms) next.acceptedTerms = "Accept the waiver and terms";

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const realSignature = sigRef.current?.toRealSignature();
    if (!realSignature) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const params = new URLSearchParams(
        typeof window === "undefined" ? "" : window.location.search,
      );
      const result = await register({
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          countryCode: country.dial,
          phoneNumber: form.phone.trim(),
          homeLocationId: locationId,
          childName: form.childName.trim(),
          childAge: form.childAge.trim(),
          childDateOfBirth: form.childDateOfBirth.trim(),
          batch: showBatchPicker ? form.batch : sessionLabel || "",
          signatureName: form.signatureName.trim(),
          signatureRealSignature: realSignature,
          waiverAccepted: true,
          ...(sessionId ? { sessionId } : {}),
          ...(membershipId ? { membershipId } : {}),
          utmSource: utmSource ?? params.get("utm_source") ?? undefined,
          utmMedium: routeSource,
          utmCampaign: utmCampaign ?? params.get("utm_campaign") ?? undefined,
          referrer: typeof document === "undefined" ? undefined : document.referrer || undefined,
          landingPage: typeof window === "undefined" ? undefined : window.location.href,
        },
      });

      if (!result.leadCaptured && !result.booked) {
        setStatus({
          text: result.leadError || "Submission failed. Please try again.",
          tone: "error",
        });
        return;
      }

      if (result.bookingError) {
        // The lead landed, so this is a partial success: say so rather than claiming a seat
        // that was never booked.
        setStatus({
          text: `Request received. We could not confirm the class automatically (${result.bookingError}), so our team will complete the booking for you.`,
          tone: "success",
        });
      }

      setSuccess({ booked: result.booked });
      sigRef.current?.clear();
      setHasSignature(false);
    } catch (error) {
      setStatus({
        text: error instanceof Error ? error.message : "An error occurred. Please try again.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isFormValid = Boolean(
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    locationId &&
    form.childName.trim() &&
    form.childAge.trim() &&
    form.childDateOfBirth.trim() &&
    (!showBatchPicker || form.batch) &&
    form.signatureName.trim().length >= 2 &&
    hasSignature &&
    form.acceptedTerms,
  );

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-950">
            {success.booked ? "Your child's place is booked" : "Request received"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
            {success.booked
              ? `${form.childName || "Your child"} is confirmed for ${sessionLabel || "the session"}. We have emailed the details to you.`
              : `Our team will contact you shortly to confirm the ${JUNIORS_PROGRAM_NAME} batch details.`}
          </p>
          {status ? <p className="mt-4 text-sm leading-6 text-slate-600">{status.text}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen overflow-x-hidden bg-slate-50 lg:fixed lg:inset-0 lg:h-[100dvh] lg:overflow-hidden">
        <div className="min-h-screen lg:min-h-0">
          <aside className="relative hidden overflow-hidden bg-slate-950 lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:h-[100dvh] lg:w-[42vw]">
            {heroImages.map((image, index) => (
              <img
                key={image}
                src={image}
                alt="Young movers at a Physique 57 Juniors barre session"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000",
                  index === heroIndex ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/10" />
            <div className="absolute inset-x-0 bottom-0 z-30 p-10 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">
                {heroEyebrow}
              </p>
              <h1 className="mt-2 max-w-md text-5xl font-bold leading-tight">{heroTitle}</h1>
              <p className="mt-4 max-w-md text-base leading-7 text-white/80">{heroDescription}</p>
              <div className="mt-8 grid max-w-md grid-cols-3 gap-3 text-xs font-semibold uppercase tracking-wide text-white/80">
                {heroHighlights.slice(0, 3).map((highlight) => (
                  <div key={highlight} className="border-l border-white/30 pl-3">
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50 px-3 py-6 sm:px-6 lg:ml-[42vw] lg:h-[100dvh] lg:min-h-0 lg:w-[58vw] lg:overflow-y-auto lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-4xl space-y-7">
              <div className="relative overflow-hidden rounded-2xl bg-slate-950 lg:hidden">
                <img
                  src={heroImages[heroIndex]}
                  alt="Young movers at a Physique 57 Juniors barre session"
                  className="h-80 w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                    {heroEyebrow}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold leading-tight">{heroTitle}</h1>
                  <p className="mt-2 text-sm leading-6 text-white/80">{mobileHeroDescription}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_34px_90px_rgba(15,23,42,0.13)]">
                <div className="bg-slate-950 text-white">
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-7 sm:py-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                        P57 Juniors
                      </p>
                      <h2 className="mt-2 max-w-xl text-[1.7rem] font-bold leading-[1.1] sm:text-3xl">
                        {formTitle}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                        {formDescription}
                      </p>
                      {sessionLabel ? (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
                          <CalendarCheck2 className="h-4 w-4" />
                          {sessionLabel}
                        </p>
                      ) : null}
                    </div>
                    <div className="w-fit rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white sm:text-[11px]">
                      {formBadge}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px bg-slate-800 sm:grid-cols-5">
                    {JUNIORS_PROGRAM_OUTCOMES.map((outcome, index) => {
                      const Icon = ICONS[outcome.icon];
                      return (
                        <div
                          key={outcome.title}
                          className={cn(
                            "flex min-h-[92px] flex-col items-center justify-center bg-slate-950 px-2.5 py-3 text-center sm:min-h-[112px]",
                            index > 2 && "hidden sm:flex",
                          )}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20 sm:h-11 sm:w-11">
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <p className="mt-2.5 text-[10px] font-extrabold uppercase tracking-[0.13em] leading-4 text-white/90 sm:text-[12px]">
                            {outcome.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-3 sm:p-4 lg:p-5">
                  <div className={SECTION_PANEL_CLASS}>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            SECTION_ICON_CLASS,
                            "border-sky-100 text-sky-700 ring-sky-50",
                          )}
                        >
                          <UserRoundCheck className="h-5 w-5 stroke-[1.8]" />
                        </div>
                        <h3 className={SECTION_TITLE_CLASS}>Contact for confirmation</h3>
                      </div>
                      <p className={cn(SECTION_BADGE_CLASS, "border-sky-100 text-sky-700")}>
                        Parent Details
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                      <TextField
                        id="firstName"
                        label="Parent/guardian first name"
                        value={form.firstName}
                        onChange={(value) => update("firstName", value)}
                        placeholder="Asha"
                        error={errors.firstName}
                      />
                      <TextField
                        id="lastName"
                        label="Parent/guardian last name"
                        value={form.lastName}
                        onChange={(value) => update("lastName", value)}
                        placeholder="Shah"
                        error={errors.lastName}
                      />
                      <TextField
                        id="email"
                        type="email"
                        label="Email"
                        value={form.email}
                        onChange={(value) => update("email", value)}
                        placeholder="asha@example.com"
                        error={errors.email}
                      />
                      <div className={FIELD_GROUP_CLASS}>
                        <Label htmlFor="phone" className={FIELD_LABEL_CLASS}>
                          Parent/guardian phone <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                          <Select
                            value={form.countryIso}
                            onValueChange={(value) => update("countryIso", value)}
                          >
                            <SelectTrigger className={FIELD_CONTROL_CLASS}>
                              <SelectValue>{country.dial}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRY_CODES.map((item) => (
                                <SelectItem key={item.iso} value={item.iso}>
                                  {item.flag} {item.dial} {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="phone"
                            value={form.phone}
                            onChange={(event) => update("phone", event.target.value)}
                            placeholder="98765 43210"
                            className={cn(FIELD_CONTROL_CLASS, errors.phone && FIELD_INVALID_CLASS)}
                          />
                        </div>
                        {errors.phone ? <p className={FIELD_ERROR_CLASS}>{errors.phone}</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className={SECTION_PANEL_CLASS}>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            SECTION_ICON_CLASS,
                            "border-violet-100 text-violet-700 ring-violet-50",
                          )}
                        >
                          <BadgeCheck className="h-5 w-5 stroke-[1.8]" />
                        </div>
                        <h3 className={SECTION_TITLE_CLASS}>Choose the right starting point</h3>
                      </div>
                      <p className={cn(SECTION_BADGE_CLASS, "border-violet-100 text-violet-700")}>
                        Child &amp; Session
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-3">
                      <div className={FIELD_GROUP_CLASS}>
                        <Label htmlFor="studio" className={FIELD_LABEL_CLASS}>
                          Center <span className="text-destructive">*</span>
                        </Label>
                        {lockedLocation ? (
                          <Input
                            id="studio"
                            value={lockedLocation.name}
                            readOnly
                            aria-readonly="true"
                            className={cn(
                              FIELD_CONTROL_CLASS,
                              "cursor-default bg-slate-100 text-slate-700",
                            )}
                          />
                        ) : (
                          <Select
                            value={form.locationId}
                            onValueChange={(value) => update("locationId", value)}
                          >
                            <SelectTrigger
                              id="studio"
                              className={cn(
                                FIELD_CONTROL_CLASS,
                                errors.locationId && FIELD_INVALID_CLASS,
                              )}
                            >
                              <SelectValue placeholder="Select center" />
                            </SelectTrigger>
                            <SelectContent>
                              {JUNIORS_LOCATIONS.map((item) => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                  <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">{item.city}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {errors.locationId ? (
                          <p className={FIELD_ERROR_CLASS}>{errors.locationId}</p>
                        ) : null}
                      </div>

                      <TextField
                        id="childName"
                        label="Child name"
                        value={form.childName}
                        onChange={(value) => update("childName", value)}
                        placeholder="Riya"
                        error={errors.childName}
                      />
                      <TextField
                        id="childAge"
                        type="number"
                        label="Child age"
                        value={form.childAge}
                        onChange={(value) => update("childAge", value)}
                        placeholder="10"
                        error={errors.childAge}
                      />
                      <TextField
                        id="childDateOfBirth"
                        type="date"
                        label="Child date of birth"
                        value={form.childDateOfBirth}
                        onChange={(value) => update("childDateOfBirth", value)}
                        error={errors.childDateOfBirth}
                      />
                    </div>
                  </div>

                  {showBatchPicker ? (
                    <div className={SECTION_PANEL_CLASS}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              SECTION_ICON_CLASS,
                              "border-emerald-100 text-emerald-700 ring-emerald-50",
                            )}
                          >
                            <CalendarCheck2 className="h-5 w-5 stroke-[1.8]" />
                          </div>
                          <div>
                            <h3 className={SECTION_TITLE_CLASS}>Select a class batch</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              Choose a center to see the available Juniors classes.
                            </p>
                          </div>
                        </div>
                        <p
                          className={cn(SECTION_BADGE_CLASS, "border-emerald-100 text-emerald-700")}
                        >
                          Batch Preference
                        </p>
                      </div>

                      {errors.batch ? (
                        <p className={cn(FIELD_ERROR_CLASS, "mt-3")}>{errors.batch}</p>
                      ) : null}

                      <div className="grid gap-2 pt-3">
                        {batches.length ? (
                          batches.map((batch) => {
                            const isSelected = form.batch === batch.value;
                            return (
                              <button
                                key={batch.value}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => update("batch", batch.value)}
                                className={cn(
                                  "group min-w-0 rounded-[16px] border bg-white px-3.5 py-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50/80 sm:px-4",
                                  isSelected
                                    ? "border-slate-950 bg-slate-50/70 ring-2 ring-slate-950/10"
                                    : "border-slate-200/90",
                                )}
                              >
                                <div className="flex min-w-0 items-start gap-3">
                                  <div
                                    className={cn(
                                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm",
                                      batch.accent,
                                    )}
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                                        {batch.studio}
                                      </span>
                                      {isSelected ? (
                                        <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                                          Selected
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="mt-2 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                      <h4 className="break-words text-sm font-semibold leading-snug text-slate-950 sm:text-base">
                                        {batch.days}
                                      </h4>
                                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                                        <Clock className={cn("h-3.5 w-3.5", batch.metaAccent)} />
                                        {batch.time}
                                      </span>
                                    </div>
                                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600 sm:text-sm">
                                      <span className="inline-flex min-w-0 items-center gap-1.5">
                                        <Users
                                          className={cn(
                                            "h-3.5 w-3.5 flex-shrink-0",
                                            batch.metaAccent,
                                          )}
                                        />
                                        {batch.instructors}
                                      </span>
                                      <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                                      <span className="min-w-0 text-slate-500">{batch.note}</span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-[18px] border border-dashed border-slate-300 bg-white/70 p-4 text-sm leading-6 text-slate-600">
                            Select a center and we will show the available Juniors classes.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className={cn(SECTION_PANEL_CLASS, "bg-white")}>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            SECTION_ICON_CLASS,
                            "border-amber-100 text-amber-700 ring-amber-50",
                          )}
                        >
                          <FileText className="h-5 w-5 stroke-[1.8]" />
                        </div>
                        <div>
                          <h3 className={SECTION_TITLE_CLASS}>Consent and parent signature</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Review the Juniors consent form, then sign so the consent can be
                            recorded on the Momence member profile.
                          </p>
                        </div>
                      </div>
                      <p className={cn(SECTION_BADGE_CLASS, "border-amber-100 text-amber-700")}>
                        Required
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
                      <p>
                        Parent/guardian confirms capacity to consent, health declaration, release
                        and indemnity, personal information consent, and class policies for{" "}
                        {JUNIORS_PROGRAM_NAME}.{" "}
                        <button
                          type="button"
                          onClick={() => setConsentOpen(true)}
                          className="font-bold text-slate-950 underline underline-offset-4"
                        >
                          Juniors consent form
                        </button>
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4">
                      <TextField
                        id="signatureName"
                        label="Parent/guardian signature name"
                        value={form.signatureName}
                        onChange={(value) => update("signatureName", value)}
                        placeholder="Asha Shah"
                        error={errors.signatureName}
                      />

                      <div className={FIELD_GROUP_CLASS}>
                        <div className="flex items-center gap-2 text-slate-700">
                          <PenLine className="h-4 w-4" />
                          <Label className={FIELD_LABEL_CLASS}>
                            Parent/guardian drawn signature{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                        </div>
                        <div
                          onPointerUp={() => {
                            const signed = !(sigRef.current?.isEmpty() ?? true);
                            setHasSignature(signed);
                            if (signed) {
                              setErrors((current) => ({ ...current, signatureRealSignature: "" }));
                            }
                          }}
                        >
                          <SignaturePad ref={sigRef} label="Signature" />
                        </div>
                        {errors.signatureRealSignature ? (
                          <p className={FIELD_ERROR_CLASS}>{errors.signatureRealSignature}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-800">
                        <Checkbox
                          id="kidsAcceptedTerms"
                          checked={form.acceptedTerms}
                          onCheckedChange={(checked) => update("acceptedTerms", Boolean(checked))}
                          className={cn("mt-0.5", errors.acceptedTerms && "border-destructive")}
                        />
                        <Label
                          htmlFor="kidsAcceptedTerms"
                          className="text-sm font-normal leading-6"
                        >
                          I have read, signed, and accept the{" "}
                          <button
                            type="button"
                            onClick={() => setConsentOpen(true)}
                            className="font-bold text-slate-950 underline underline-offset-4"
                          >
                            Juniors consent form
                          </button>{" "}
                          and consent to be contacted about {JUNIORS_PROGRAM_NAME}.{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                      </div>
                      {errors.acceptedTerms ? (
                        <p className={FIELD_ERROR_CLASS}>{errors.acceptedTerms}</p>
                      ) : null}
                    </div>
                  </div>

                  {status ? (
                    <div
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm",
                        status.tone === "error"
                          ? "border-red-300 bg-red-50 text-red-800"
                          : "border-slate-300 bg-slate-50 text-slate-800",
                      )}
                    >
                      {status.text}
                    </div>
                  ) : null}

                  <Button
                    id="kids-submit-button"
                    type="submit"
                    disabled={submitting || !isFormValid}
                    className="h-14 w-full rounded-[16px] bg-slate-950 text-base font-bold text-white shadow-[0_20px_42px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : sessionId ? (
                      "Book this Juniors class"
                    ) : (
                      "Submit Juniors Request"
                    )}
                  </Button>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-3 py-4 sm:px-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {JUNIORS_PROGRAM_FEATURES.map((feature) => {
                        const Icon = ICONS[feature.icon];
                        return (
                          <div
                            key={feature.title}
                            className="flex min-w-0 items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                                feature.accent,
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <p className="min-w-0 text-sm font-semibold leading-snug text-slate-800">
                              {feature.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </form>
              </div>

              <section className="space-y-6 pb-10">
                <div className="px-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <Sparkles className="h-4 w-4 text-slate-800" />
                    <span className="text-sm font-semibold text-slate-950">
                      Signature Movement Intelligence
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-bold text-slate-950">
                    Inside The Juniors Method
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                    The Juniors experience carries the same Physique 57 promise: precise movement,
                    premium instruction, low-impact intensity, and a community-led studio journey.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {JUNIORS_USPS.map((item) => {
                    const Icon = ICONS[item.icon];
                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
                      >
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl shadow-md",
                            item.accent,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    );
                  })}
                </div>

                <section className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] sm:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        What Young Movers Build
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-950">
                        Strength that feels composed, not rushed
                      </h3>
                    </div>
                    <div className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Low impact
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {JUNIORS_BUILD_AREAS.map((item) => {
                      const Icon = ICONS[item.icon];
                      return (
                        <div
                          key={item.title}
                          className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4"
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-2xl",
                              item.accent,
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <h4 className="mt-4 text-base font-bold text-slate-950">{item.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-[26px] bg-slate-950 p-5 text-white shadow-[0_26px_80px_rgba(15,23,42,0.22)] sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
                      First Session Flow
                    </p>
                    <h3 className="mt-2 text-2xl font-bold">
                      A warm, confident start at the barre
                    </h3>
                    <div className="mt-5 space-y-3">
                      {JUNIORS_JOURNEY_STEPS.map((step, index) => (
                        <div
                          key={step}
                          className="flex gap-3 rounded-[18px] border border-white/10 bg-white/10 p-4"
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-6 text-white/80">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.09)] sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                      Good To Know
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">
                      Helpful notes before you book
                    </h3>
                    <div className="mt-5 space-y-3">
                      {JUNIORS_PARENT_NOTES.map((note) => (
                        <div
                          key={note}
                          className="flex gap-3 rounded-[16px] bg-slate-50 p-3 shadow-sm"
                        >
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-700" />
                          <p className="text-sm leading-6 text-slate-700">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </section>
            </div>
          </section>
        </div>
      </main>

      <KidsConsentModal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        customerName={(form.signatureName || `${form.firstName} ${form.lastName}`).trim()}
        customerEmail={form.email}
      />
    </>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) {
  return (
    <div className={FIELD_GROUP_CLASS}>
      <Label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FIELD_CONTROL_CLASS, error && FIELD_INVALID_CLASS)}
      />
      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}
