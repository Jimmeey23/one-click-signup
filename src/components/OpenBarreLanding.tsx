import { Link, useNavigate } from "@tanstack/react-router";
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

const logoUrl = "/physique57-logo.png";

const TEST_MEMBER_ID = import.meta.env.VITE_TEST_MEMBER_ID ?? "999999";

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
  const [heroQuote, setHeroQuote] = useState(HERO_QUOTES[0]);
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
    setHeroQuote(HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)]);
  }, []);

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
    if (!valid) {
      console.warn("[debug:signup] submit blocked - form invalid", {
        firstName: form.firstName.trim().length > 0,
        lastName: form.lastName.trim().length > 0,
        email: /\S+@\S+\.\S+/.test(form.email),
        countryCode: form.countryCode.trim().length > 0,
        phoneNumber: form.phoneNumber.replace(/[^0-9]/g, "").length >= 6,
        homeLocationId: LOCATIONS.some((l) => l.id === form.homeLocationId),
        waiverAndSignature: testMode || (form.waiverAccepted && form.signatureName.trim().length >= 2),
      });
      return;
    }

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
      navigate({
        to: "/classes/$memberId",
        params: { memberId: String(result.memberId) },
        search: { locationId: result.homeLocationId, classType: form.classType },
      });
    } catch (e2) {
      console.error("[debug:signup] signup threw:", e2);
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
            <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.05] tracking-tight">
              {heroQuote}
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
            The Physique 57 Method & Key Benefits
          </p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
            Engineered to <em className="italic">reshape</em> you in 57 minutes.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            The proven advantages that make Physique 57 India the preferred choice for fast,
            visible results and sustainable transformation.
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
        slots={[
          [heroBike, trainer2, cycleShot],
          [intenseFace, trainer3, sculptSide],
          [kettlebellPink, trainer4, trainerLunge],
          [sculptSide, trainerArm, heroBike],
        ]}
      />

      <WhatHappensNext />

      <StudioLocations />

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
          <img src={logoUrl} alt="Physique 57" className="h-10 w-auto brightness-0 invert" />
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
    n: "01",
    title: "Tell us what suits you",
    body: "Share your preferred studio and the format you want to begin with.",
  },
  {
    n: "02",
    title: "We review your preferences",
    body: "The studio team checks your selected location and preferred format to shape the best first recommendation.",
  },
  {
    n: "03",
    title: "You receive a guided confirmation",
    body: "You hear back with the best-fit option, next steps, and booking details needed to secure your first class.",
  },
  {
    n: "04",
    title: "We help you prepare",
    body: "You'll know what to wear, when to arrive, and what to expect so your first visit feels stress-free.",
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

const STUDIOS = [
  {
    name: "Kwality House, Kemps Corner",
    neighborhood: "Grant Road, Mumbai",
    location: "Kemps Corner",
    phone: "097696 65757",
    hours: "Mon-Sat: 6:00 AM - 9:00 PM | Sun: 7:00 AM - 7:00 PM",
    address: "Kwality House, August Kranti Rd, below Kemps Corner, Grant Road, Mumbai 400036",
  },
  {
    name: "Supreme HQ, Bandra",
    neighborhood: "Bandra West, Mumbai",
    location: "Bandra West",
    phone: "097696 65757",
    hours: "Mon-Sat: 6:00 AM - 9:00 PM | Sun: 7:00 AM - 7:00 PM",
    address: "203, Supreme Headquarters, Junction of 14th & 33rd Rd, opposite Monkey Bar, Bandra West, Mumbai 400050",
  },
];

function StudioLocations() {
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
      <div className="grid md:grid-cols-2 gap-6">
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
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary-deep" aria-hidden="true" />
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
                <FileText className="h-4 w-4 mt-0.5 shrink-0 text-primary-deep" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                    Address
                  </dt>
                  <dd className="text-sm">{studio.address}</dd>
                </div>
              </div>
            </dl>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-[0.15em] text-background hover:opacity-90 transition"
            >
              Get Directions
            </a>
            </div>
          </div>
        ))}
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
        <label className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 cursor-pointer">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => onTestModeChange(e.target.checked)}
            className="h-3 w-3 accent-[color:var(--primary)]"
          />
          Test
        </label>
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        <FormStep n={1} title="Your details">
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
                required
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="98765 43210"
                className="flex-1 h-11 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </FormStep>

        <FormStep n={2} title="Studio & class">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              Preferred studio *
            </label>
            <select
              required
              className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                            className="h-36 w-full object-cover object-top transition-transform duration-500 group-hover/card:scale-105"
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
        </FormStep>

        <FormStep n={3} title="Waiver & signature" badge="Required">
          <p className="text-xs text-muted-foreground leading-relaxed -mt-1">
            Please review and sign before activating Open Barre. This consent is recorded with
            your Momence member profile.
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
            onChange={(e) => setForm({ ...form, signatureName: e.target.value })}
            placeholder="Type your full legal name"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
        </FormStep>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !valid}
          className="w-full h-12 rounded-full bg-foreground text-background font-bold uppercase tracking-[0.15em] text-xs hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Activating membership…" : "Activate Your Trial"}
        </button>
      </form>
    </div>
  );
}

function FormStep({
  n,
  title,
  badge,
  children,
}: {
  n: number;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-deep text-[11px] font-bold text-white">
          {n}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
          {title}
        </p>
        {badge && (
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {children}
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
