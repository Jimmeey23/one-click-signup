import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import confetti from "canvas-confetti";
import { LOCATIONS } from "@/lib/momence-locations";
import { listSessions, bookWithMembership, type SessionDTO } from "@/lib/momence-sessions.functions";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Footer } from "@/components/Footer";

const searchSchema = z.object({
  locationId: z.coerce.number().int().positive().default(LOCATIONS[0].id),
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

function ClassesPage() {
  const { memberId: memberIdStr } = Route.useParams();
  const { locationId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const memberId = Number(memberIdStr);

  const listFn = useServerFn(listSessions);
  const bookFn = useServerFn(bookWithMembership);

  const [sessions, setSessions] = useState<SessionDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [booked, setBooked] = useState<BookedClass | null>(null);
  const [bookErr, setBookErr] = useState<string | null>(null);

  const currentLoc = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];

  useEffect(() => {
    let cancel = false;
    setSessions(null);
    setLoadError(null);
    listFn({ data: { locationId, daysAhead: 14 } })
      .then((r) => {
        if (!cancel) setSessions(r.sessions);
      })
      .catch((e) => {
        if (!cancel)
          setLoadError(e instanceof Error ? e.message : "Failed to load schedule");
      });
    return () => {
      cancel = true;
    };
  }, [locationId, listFn]);

  async function onBook(s: SessionDTO) {
    setBookErr(null);
    setBookingId(s.id);
    try {
      await bookFn({ data: { memberId, sessionId: s.id, homeLocationId: locationId } });
      const mapsQ =
        currentLoc.name === "Kwality House, Kemps Corner"
          ? "Physique 57 India Kwality House Kemps Corner Mumbai"
          : "Physique 57 India Supreme HQ Bandra Mumbai";
      setBooked({ session: s, location: { id: currentLoc.id, name: currentLoc.name, mapsQ } });
    } catch (e) {
      setBookErr(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBookingId(null);
    }
  }

  if (booked) return <ThankYou booked={booked} onAnother={() => setBooked(null)} />;

  const grouped = useMemo(() => groupByDay(sessions ?? []), [sessions]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Physique 57" className="h-9 w-auto" />
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Member #{memberId}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-primary-deep font-bold mb-3">
              You're in. Open Barre membership active.
            </p>
            <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Book your first class
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg">
              Live schedule from{" "}
              <span className="text-foreground font-semibold">{currentLoc.name}</span>.
              Your Open Barre membership covers it.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {LOCATIONS.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate({ search: { locationId: l.id }, replace: true })}
                className={`px-4 h-10 rounded-full text-xs font-bold uppercase tracking-[0.15em] border transition ${
                  l.id === locationId
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-input hover:bg-accent"
                }`}
              >
                {l.name.split(",")[0]}
              </button>
            ))}
          </div>
        </div>

        {bookErr && (
          <p className="mb-4 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
            {bookErr}
          </p>
        )}

        {loadError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
            {loadError}
          </p>
        )}

        {!sessions && !loadError && <ScheduleSkeleton />}

        {sessions && sessions.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground">
            No upcoming classes in the next 14 days at this studio.
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="space-y-10">
            {grouped.map(({ day, items }) => (
              <section key={day}>
                <h2 className="font-display text-2xl mb-4 flex items-center gap-3">
                  <span>{day}</span>
                  <span className="flex-1 h-px bg-border" />
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((s) => (
                    <SessionCard
                      key={s.id}
                      s={s}
                      loading={bookingId === s.id}
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
  onBook,
}: {
  s: SessionDTO;
  loading: boolean;
  onBook: () => void;
}) {
  const start = new Date(s.startsAt);
  const time = start.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  const isFull = s.spotsLeft === 0;
  return (
    <article className="bg-card border border-border rounded-2xl p-5 flex flex-col shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary-deep font-bold">
            {time} · {s.durationInMinutes} min
          </p>
          <h3 className="font-display text-2xl leading-tight mt-1">{s.name}</h3>
          {s.teacherName && (
            <p className="text-xs text-muted-foreground mt-1">with {s.teacherName}</p>
          )}
        </div>
        {s.spotsLeft != null && (
          <span
            className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${
              isFull
                ? "bg-destructive/10 text-destructive"
                : s.spotsLeft <= 3
                ? "bg-primary/20 text-primary-deep"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {isFull ? "Full" : `${s.spotsLeft} left`}
          </span>
        )}
      </div>
      <button
        onClick={onBook}
        disabled={loading || isFull}
        className="mt-5 h-11 rounded-md bg-foreground text-background text-xs uppercase tracking-[0.15em] font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {loading ? "Booking…" : isFull ? "Class full" : "Book this class"}
      </button>
    </article>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded mb-3" />
          <div className="h-6 w-3/4 bg-muted rounded mb-2" />
          <div className="h-3 w-1/2 bg-muted rounded mb-6" />
          <div className="h-10 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

function groupByDay(sessions: SessionDTO[]) {
  const buckets = new Map<string, SessionDTO[]>();
  for (const s of sessions) {
    const d = new Date(s.startsAt);
    const day = d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day)!.push(s);
  }
  return Array.from(buckets.entries()).map(([day, items]) => ({ day, items }));
}

// ============= Thank-you screen =============

function classPolicy(name: string): { entryMin: number; cancelHrs: number; family: string } {
  const n = name.toLowerCase();
  if (n.includes("cycle") || n.includes("spin")) {
    return { entryMin: 5, cancelHrs: 6, family: "powerCycle" };
  }
  return { entryMin: 10, cancelHrs: 4, family: "Barre" };
}

function ThankYou({
  booked,
  onAnother,
}: {
  booked: BookedClass;
  onAnother: () => void;
}) {
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

  useEffect(() => {
    const fire = (origin: { x: number; y: number }) =>
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        origin,
        colors: ["#7FD3F7", "#2A8DBF", "#ffffff", "#FFD166"],
      });
    fire({ x: 0.2, y: 0.3 });
    fire({ x: 0.8, y: 0.3 });
    const t = setTimeout(() => fire({ x: 0.5, y: 0.4 }), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><img src={logoUrl} alt="Physique 57" className="h-9 w-auto" /></Link>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary-deep font-bold mb-3">You're booked</p>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">See you at the barre.</h1>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-card)]">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary-deep font-bold mb-3">Your class</p>
            <h2 className="font-display text-3xl">{booked.session.name}</h2>
            {booked.session.teacherName && (
              <p className="text-sm text-muted-foreground mt-1">with {booked.session.teacherName}</p>
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
        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-primary text-foreground" : "bg-foreground text-background"}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className={`text-[10px] uppercase tracking-[0.25em] font-bold ${dark ? "text-primary" : "text-primary-deep"}`}>{family} · {title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-5xl leading-none">{valueBig}</span>
            <span className={`text-xs uppercase tracking-widest ${dark ? "text-background/60" : "text-muted-foreground"}`}>{valueLabel}</span>
          </div>
          <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-background/80" : "text-foreground/80"}`}>{body}</p>
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
  );
}
function XCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
  );
}
