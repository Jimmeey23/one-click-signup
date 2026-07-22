import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, FileText } from "lucide-react";
import { signupAndEnroll, signupAndEnrollWithoutLead } from "@/lib/momence.functions";
import { LOCATIONS } from "@/lib/momence-locations";
import { COUNTRY_CODES } from "@/lib/country-codes";
import {
  CLASS_FORMAT_KEYS,
  classFormatKeyForSessionName,
  type ClassFormatKey,
} from "@/lib/class-format-matchers";
import { classFormatForKey, classTypeOptionsForLocation } from "@/lib/class-formats";
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

const logoUrl = "/Physique57-800x600-1.jpg";

const TEST_MEMBER_ID = import.meta.env.VITE_TEST_MEMBER_ID ?? "999999";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  countryIso: string;
  countryCode: string;
  phoneNumber: string;
  homeLocationId: number;
  waiverAccepted: boolean;
  signatureName: string;
  classType: ClassFormatKey;
};

export function OpenBarreLanding({ captureLead = true }: { captureLead?: boolean }) {
  const navigate = useNavigate();
  const signupWithLead = useServerFn(signupAndEnroll);
  const signupWithoutLead = useServerFn(signupAndEnrollWithoutLead);
  const signup = captureLead ? signupWithLead : signupWithoutLead;
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const [signed, setSigned] = useState(false);
  const [studioSelected, setStudioSelected] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    countryIso: "IN",
    countryCode: "+91",
    phoneNumber: "",
    homeLocationId: 0,
    waiverAccepted: false,
    signatureName: "",
    classType: "barre-57",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

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
    const countryIso = params.get("countryIso") || params.get("country_iso") || params.get("country");
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
        loc.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(normalized),
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
  }, []);

  useEffect(() => {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    setForm((prev) => (prev.signatureName === fullName ? prev : { ...prev, signatureName: fullName }));
  }, [form.firstName, form.lastName]);

  useEffect(() => {
    const allowed = classTypeOptionsForLocation(form.homeLocationId);
    if (!allowed.includes(form.classType)) {
      setForm((prev) => ({ ...prev, classType: allowed[0] }));
    }
  }, [form.homeLocationId]);

  const valid = useMemo(
    () =>
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(form.email) &&
      form.countryCode.trim().length > 0 &&
      form.phoneNumber.replace(/[^0-9]/g, "").length >= 6 &&
      LOCATIONS.some((l) => l.id === form.homeLocationId) &&
      (testMode || (form.waiverAccepted && form.signatureName.trim().length >= 2)),
    [form, testMode],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    if (testMode) {
      navigate({
        to: "/classes/$memberId",
        params: { memberId: TEST_MEMBER_ID },
        search: { locationId: form.homeLocationId, classType: form.classType },
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
      const trackingPayload = captureLead
        ? {
            utmSource: params.get("utm_source") ?? undefined,
            utmMedium: params.get("utm_medium") ?? undefined,
            utmCampaign: params.get("utm_campaign") ?? undefined,
            referrer: typeof document !== "undefined" ? document.referrer : undefined,
            landingPage: typeof window !== "undefined" ? window.location.href : undefined,
          }
        : {};
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
          ...trackingPayload,
        },
      });
      if (!result.enrolled) {
        setError(
          "Open Barre membership could not be activated. Please contact the studio team before booking your first class.",
        );
        return;
      }
      navigate({
        to: "/classes/$memberId",
        params: { memberId: String(result.memberId) },
        search: { locationId: result.homeLocationId, classType: form.classType },
      });
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${groupBarre})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,10,15,0.92) 0%, rgba(8,10,15,0.75) 55%, rgba(8,10,15,0.55) 100%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[0.9fr_1.25fr] gap-12 lg:gap-14 items-start text-white">
          <div className="pt-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary font-bold mb-6">
              Mumbai · Bengaluru
            </p>
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
              Discover the workout
              <br />
              <em className="italic text-primary">Everyone</em>
              <br />
              talks about.
            </h1>
            <p className="mt-8 max-w-md text-base md:text-lg text-white/75 leading-relaxed">
              Your first Barre 57 class is complimentary. Sculpt, strengthen, and energize your body
              in just 57 minutes. Sign up below to get started.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <Stat n="57" label="minutes" />
              <Stat n="3" label="studios" />
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
            onSignChange={setSigned}
            studioSelected={studioSelected}
            onStudioSelectedChange={setStudioSelected}
            testMode={testMode}
            onTestModeChange={setTestMode}
          />
        </div>
      </section>

      <section className="bg-foreground text-background overflow-hidden py-6 border-y border-border/20">
        <div className="flex gap-12 animate-marquee whitespace-nowrap font-display text-3xl md:text-4xl italic">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12 items-center">
              <Dot /> <span>Barre 57</span>
              <Dot /> <span>FIT</span>
              <Dot /> <span>Strength Lab</span>
              <Dot /> <span>Mat 57</span>
              <Dot /> <span>HIIT</span>
              <Dot /> <span>powerCycle</span>
              <Dot /> <span>Cardio Barre</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-4">
            The Physique 57 Method
          </p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
            Engineered to <em className="italic">reshape</em> you in 57 minutes.
          </h2>
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
      </section>

      <FlippingGallery
        slots={[
          [heroBike, trainer2, cycleShot],
          [intenseFace, trainer3, sculptSide],
          [kettlebellPink, trainer4, trainerLunge],
          [sculptSide, trainerArm, heroBike],
        ]}
      />

      <section className="bg-secondary py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
                Loved by Mumbai
              </p>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight">
                What our community says
              </h2>
            </div>
          </div>
          <ReviewsCarousel />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="absolute top-0 inset-x-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoUrl} alt="Physique 57" className="h-10 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/70 font-bold">
          <Link to="/about" className="hover:text-primary transition">
            About
          </Link>
          <Link to="/classes-info" className="hover:text-primary transition">
            Classes
          </Link>
          <Link to="/faq" className="hover:text-primary transition">
            FAQ
          </Link>
          <Link to="/contact" className="hover:text-primary transition">
            Contact
          </Link>
        </nav>
        <a
          href="#signup"
          className="hidden sm:inline-flex h-10 px-5 items-center rounded-full bg-white/10 text-white border border-white/25 backdrop-blur-md text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition"
        >
          Claim Your Trial Class
        </a>
      </div>
    </header>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl text-primary leading-none">{n}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/60">{label}</div>
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
    <article className="group bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] flex flex-col">
      <div
        className="aspect-[4/3] bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
        style={{ backgroundImage: `url(${img})` }}
        aria-hidden
      />
      <div className="p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary-deep font-bold mb-2">
          {tag}
        </p>
        <h3 className="font-bold text-xl leading-tight tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{body}</p>
      </div>
    </article>
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
  testMode,
  onTestModeChange,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  valid: boolean;
  sigRef: React.MutableRefObject<SignaturePadHandle | null>;
  onSignChange: (signed: boolean) => void;
  studioSelected: boolean;
  onStudioSelectedChange: (selected: boolean) => void;
  testMode: boolean;
  onTestModeChange: (testMode: boolean) => void;
}) {
  const [hoveredClassType, setHoveredClassType] = useState<ClassFormatKey | null>(null);
  const [descriptionClassType, setDescriptionClassType] = useState<ClassFormatKey | null>(null);
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      className="w-full bg-background text-foreground rounded-2xl p-7 md:p-8 shadow-[var(--shadow-elegant)] border border-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">
            Activate your trial
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Takes 60 seconds. No card required.</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => onTestModeChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-[color:var(--primary)]"
          />
          Test mode
        </label>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(v) => setForm({ ...form, firstName: v })}
            required
          />
          <Field
            label="Last name"
            value={form.lastName}
            onChange={(v) => setForm({ ...form, lastName: v })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            required
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
                  setForm({ ...form, countryIso: selected.iso, countryCode: selected.dial });
                }}
                className="h-11 rounded-md border border-input bg-background px-3 text-center text-xl focus:outline-none focus:ring-2 focus:ring-ring min-w-[4.25rem]"
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
                required
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="98765 43210"
                className="flex-1 h-11 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            Preferred studio *
          </label>
          <select
            required
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.homeLocationId}
            onChange={(e) => {
              setForm({ ...form, homeLocationId: Number(e.target.value) });
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
        </div>

        {studioSelected && (
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
                      onClick={() => setForm({ ...form, classType: key })}
                      onMouseEnter={() => startDescriptionDelay(key)}
                      onMouseLeave={() => hideDescription(key)}
                      onFocus={() => setDescriptionClassType(key)}
                      onBlur={() => hideDescription(key)}
                      aria-pressed={selected}
                      className={`flex w-full flex-col items-center gap-2 rounded-lg border p-2.5 text-center transition ${
                        selected
                          ? "border-primary-deep bg-[#f8f5ff] ring-2 ring-primary-deep"
                          : "border-input bg-background hover:border-[#c8bef4]"
                      }`}
                    >
                      <img
                        src={classFormat.image}
                        alt=""
                        className="h-24 w-full rounded-md object-cover object-top"
                      />
                      <span className="text-xs font-semibold text-foreground">{classFormat.name}</span>
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

        <div className="rounded-xl border border-[#cfcfd7] bg-[#fbfbf8] p-4 space-y-4 shadow-[0_18px_50px_-35px_rgb(0_0_0/0.45)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                  Liability waiver & consent agreement
                </p>
                <span className="rounded-full border border-[#b9bac3] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#55535d]">
                  Required
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Please review and sign before activating Open Barre. This consent is recorded with
                your Momence member profile.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#d8d8df] bg-white p-4 space-y-3">
            <ConsentLine>
              I voluntarily participate in Physique 57 India classes and assume all risks of injury.
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

          <input
            type="text"
            required
            value={form.signatureName}
            onChange={(e) => setForm({ ...form, signatureName: e.target.value })}
            placeholder="Type your full legal name"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              onChange={(e) => setForm({ ...form, waiverAccepted: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--primary)]"
            />
            <span className="text-xs text-foreground leading-relaxed">
              I have read, signed, and accept the waiver and Physique 57 India's privacy terms.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !valid}
          className="w-full h-12 rounded-md bg-foreground text-background font-bold uppercase tracking-[0.15em] text-xs hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Activating membership…" : "Activate Your Trial"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
