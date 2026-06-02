import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { signupAndEnroll } from "@/lib/momence.functions";
import { LOCATIONS } from "@/lib/momence-locations";
import { COUNTRY_CODES } from "@/lib/country-codes";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Physique 57 India — Your First Open Barre Is On Us" },
      { name: "description", content: "Activate your complimentary Open Barre membership and book your first 57-minute class at Kemps Corner or Bandra." },
      { property: "og:title", content: "Physique 57 India — Your First Open Barre Is On Us" },
      { property: "og:description", content: "Activate your complimentary Open Barre membership and book your first 57-minute class in Mumbai." },
      { property: "og:image", content: groupBarre },
      { name: "twitter:image", content: groupBarre },
    ],
  }),
  component: Landing,
});

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  homeLocationId: number;
  waiverAccepted: boolean;
  signatureName: string;
};

function Landing() {
  const navigate = useNavigate();
  const signup = useServerFn(signupAndEnroll);
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const [signed, setSigned] = useState(false); // tracks if sig pad has ink
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    phoneNumber: "",
    homeLocationId: LOCATIONS[0].id as number,
    waiverAccepted: false,
    signatureName: "",
  });

  const valid = useMemo(
    () =>
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(form.email) &&
      form.phoneNumber.replace(/[^0-9]/g, "").length >= 6 &&
      form.waiverAccepted &&
      form.signatureName.trim().length >= 2,
    [form],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("Please draw your signature in the box above to consent to the waiver.");
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(window.location.search);
    const signatureDataUrl = sigRef.current.toDataURL() ?? undefined;

    try {
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
          signatureDataUrl,
          signatures: [],
          utmSource: params.get("utm_source") ?? undefined,
          utmMedium: params.get("utm_medium") ?? undefined,
          utmCampaign: params.get("utm_campaign") ?? undefined,
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
          landingPage: typeof window !== "undefined" ? window.location.href : undefined,
        },
      });
      navigate({
        to: "/classes/$memberId",
        params: { memberId: String(result.memberId) },
        search: { locationId: result.homeLocationId },
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

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${groupBarre})` }} aria-hidden />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,10,15,0.92) 0%, rgba(8,10,15,0.75) 55%, rgba(8,10,15,0.55) 100%)" }} aria-hidden />
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start text-white">
          <div className="pt-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary font-bold mb-6">Mumbai · Bengaluru · Delhi</p>
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
              Your first<br />
              <em className="italic text-primary">Open Barre</em><br />
              is on us.
            </h1>
            <p className="mt-8 max-w-md text-base md:text-lg text-white/75 leading-relaxed">
              57 minutes. Full-body sculpt. A community of women & men redefining strong. Sign up below and we'll activate your complimentary membership instantly.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <Stat n="57" label="minutes" />
              <Stat n="2" label="studios" />
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
          />
        </div>
      </section>

      {/* MARQUEE */}
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

      {/* WHY PHYSIQUE 57 */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-4">The Physique 57 Method</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">Engineered to <em className="italic">reshape</em> you in 57 minutes.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Feature img={trainerLunge} tag="Sculpt" title="Isometric holds + dynamic reps" body="Tiny, precise movements that sculpt deep muscle — the Physique 57 signature." />
          <Feature img={lunge} tag="Burn" title="Interval-style class structure" body="Sequenced segments hit every muscle group with zero downtime, no impact." />
          <Feature img={trainerArm} tag="Recover" title="Stretch to lengthen, every class" body="We finish long and lean — every session ends with deep stretching to reset." />
        </div>
      </section>

      {/* FLIPPING IMAGE STRIP */}
      <FlippingGallery
        slots={[
          [heroBike, trainer2, cycleShot],
          [intenseFace, trainer3, sculptSide],
          [kettlebellPink, trainer4, trainerLunge],
          [sculptSide, trainerArm, heroBike],
        ]}
      />

      {/* REVIEWS */}
      <section className="bg-secondary py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">Loved by Mumbai</p>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight">What our community says</h2>
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
          <Link to="/about" className="hover:text-primary transition">About</Link>
          <Link to="/classes-info" className="hover:text-primary transition">Classes</Link>
          <Link to="/faq" className="hover:text-primary transition">FAQ</Link>
          <Link to="/contact" className="hover:text-primary transition">Contact</Link>
        </nav>
        <a href="#signup" className="hidden sm:inline-flex h-10 px-5 items-center rounded-full bg-white/10 text-white border border-white/25 backdrop-blur-md text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition">
          Claim Open Barre
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

function Feature({ img, tag, title, body }: { img: string; tag: string; title: string; body: string }) {
  return (
    <article className="group bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] flex flex-col">
      <div className="aspect-[4/3] bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]" style={{ backgroundImage: `url(${img})` }} aria-hidden />
      <div className="p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary-deep font-bold mb-2">{tag}</p>
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
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  valid: boolean;
  sigRef: React.MutableRefObject<SignaturePadHandle | null>;
  onSignChange: (signed: boolean) => void;
}) {
  return (
    <div id="signup" className="bg-background text-foreground rounded-2xl p-7 md:p-8 shadow-[var(--shadow-elegant)] border border-white/10">
      <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">Activate your trial</h2>
      <p className="text-sm text-muted-foreground mt-1">Takes 60 seconds. No card required.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
          <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
        </div>
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Mobile number *</label>
          <div className="flex gap-2">
            <select
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
              className="h-11 px-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[7rem]"
              aria-label="Country code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.iso} value={c.dial}>{c.flag} {c.dial} {c.iso}</option>
              ))}
            </select>
            <input
              type="tel" inputMode="numeric" required value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="98765 43210"
              className="flex-1 h-11 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Preferred studio</label>
          <select
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.homeLocationId}
            onChange={(e) => setForm({ ...form, homeLocationId: Number(e.target.value) })}
          >
            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        {/* Waiver + signature */}
        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">Liability waiver & consent</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-h-24 overflow-auto pr-1">
            I voluntarily participate in Physique 57 India classes and assume all risks of injury. I confirm I am physically fit to participate, and I release Physique 57 India, its instructors and affiliates from any liability arising from my participation. I consent to receive class-related communications and agree to the <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
          <input
            type="text"
            value={form.signatureName}
            onChange={(e) => setForm({ ...form, signatureName: e.target.value })}
            placeholder="Type your full legal name"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Full legal name"
          />
          <div onPointerUp={() => onSignChange(!(sigRef.current?.isEmpty() ?? true))}>
            <SignaturePad ref={sigRef} label="Draw your signature" />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.waiverAccepted}
              onChange={(e) => setForm({ ...form, waiverAccepted: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-[color:var(--primary)]"
            />
            <span className="text-xs text-foreground leading-relaxed">
              I have read & accept the waiver and Physique 57 India's terms.
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
          {loading ? "Activating membership…" : "Activate Open Barre"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type} required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
