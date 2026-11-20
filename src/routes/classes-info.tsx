import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Footer } from "@/components/Footer";
import { CLASS_FORMATS } from "@/lib/class-formats";

const logoUrl = "/physique57-logo.png";

const searchSchema = z.object({
  studio: z.enum(["mumbai", "bengaluru"]).optional(),
});

export const Route = createFileRoute("/classes-info")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Classes - Physique 57 India" },
      {
        name: "description",
        content:
          "Barre 57, powerCycle, Strength Lab, HIIT, Cardio Barre Plus, Back Body Blaze, Recovery and more - explore our 57-minute class formats.",
      },
      { property: "og:title", content: "Classes - Physique 57 India" },
      {
        property: "og:description",
        content:
          "Barre 57, powerCycle, Strength Lab, HIIT, Cardio Barre Plus, Back Body Blaze, Recovery and more.",
      },
    ],
  }),
  component: ClassesInfoPage,
});

const BENGALURU_EXCLUDED_FORMATS = new Set(["power-cycle", "strength-lab"]);

function ClassesInfoPage() {
  const { studio } = Route.useSearch();
  const isBengaluru = studio === "bengaluru";
  const classFormats = isBengaluru
    ? CLASS_FORMATS.filter((c) => !BENGALURU_EXCLUDED_FORMATS.has(c.key))
    : CLASS_FORMATS;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <Link
            to={isBengaluru ? "/bengaluru" : "/"}
            className="inline-flex h-10 px-5 items-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest shadow-lg"
          >
            {isBengaluru ? "Bengaluru Offer" : "Claim Your Trial Class"}
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-foreground text-background">
        <img
          src={classFormats[0]?.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_35%] opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-foreground" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 pt-36 pb-16 lg:pt-44 lg:pb-24">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
            Our classes · {classFormats.length} formats
          </p>
          <h1 className="font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.03em] max-w-3xl text-white">
            {isBengaluru
              ? "Built for Bengaluru in 57 minutes."
              : "Built for results in 57 minutes."}
          </h1>
          <p className="mt-6 max-w-xl text-base md:text-lg text-white/70 leading-relaxed">
            {isBengaluru
              ? "Lavelle Road and Indiranagar focus on Barre-first bookings and Bengaluru-specific introductory offers."
              : "Kemps Corner and Bandra offer the full class mix including Barre 57, powerCycle, and Strength Lab."}
          </p>
          <nav className="mt-10 flex flex-wrap gap-2" aria-label="Jump to a class format">
            {classFormats.map((c) => (
              <a
                key={c.key}
                href={`#${c.key}`}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur transition hover:border-primary hover:text-white"
              >
                {c.name}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-6 py-16 lg:py-24 space-y-8 lg:space-y-14">
        {classFormats.map((c, i) => (
          <article
            id={c.key}
            key={c.key}
            className="scroll-mt-8 grid overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] lg:grid-cols-2"
          >
            <div className={`relative min-h-[260px] sm:min-h-[340px] ${i % 2 ? "lg:order-2" : ""}`}>
              <img
                src={c.image}
                alt={`${c.name} class`}
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
              />
              <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-col p-6 sm:p-8 lg:p-10">
              <span className="self-start rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                {c.intensity}
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl tracking-tight">{c.name}</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">{c.description}</p>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-secondary px-4 py-3">
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Duration
                  </dt>
                  <dd className="mt-1 font-semibold">{c.duration}</dd>
                </div>
                <div className="rounded-xl bg-secondary px-4 py-3">
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Best for
                  </dt>
                  <dd className="mt-1 font-semibold">{c.bestFor}</dd>
                </div>
                <div className="rounded-xl bg-secondary px-4 py-3 sm:col-span-2">
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Equipment
                  </dt>
                  <dd className="mt-1 font-semibold">{c.equipment}</dd>
                </div>
              </dl>
              <Link
                to={isBengaluru ? "/bengaluru" : "/"}
                className="mt-8 self-start inline-flex h-11 items-center rounded-full bg-foreground px-6 text-xs font-bold uppercase tracking-widest text-background transition hover:bg-primary hover:text-primary-foreground"
              >
                Book {c.name}
              </Link>
            </div>
          </article>
        ))}

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
              Class levels & eligibility
            </p>
            <h2 className="font-display text-2xl mb-4">Every BODY, every level.</h2>
            <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <li>
                Classes span three levels - Beginner, Intermediate, and Advanced - so you can match
                a format to your fitness experience and goals.
              </li>
              <li>
                New here? Start with Barre{isBengaluru ? "" : " 57"}
                {isBengaluru ? "" : " or Mat 57"}. Instructors offer modifications and progressions
                in every class, so you're never locked out by level.
              </li>
              <li>
                Pregnant, postpartum, or managing an injury, PCOS, thyroid concerns, or menopause?
                Physique 57's low-impact method is trained for modifications across all of these -
                always inform your instructor before class begins.
              </li>
              <li>
                While Physique 57 is widely popular among women, the method is built for "Every
                BODY" - men are welcome at every class and format.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
              Booking & cancellation
            </p>
            <h2 className="font-display text-2xl mb-4">Simple rules, kept fair.</h2>
            <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <li>
                Book online, through the Physique 57 India app, or by contacting the studio -
                pre-register up to one hour before class starts to secure your spot.
              </li>
              <li>
                Full class? Join the waitlist - spots are offered first-come, first-served as they
                open up.
              </li>
              <li>
                Cancel via email, WhatsApp, or the app within the required notice window, or the
                class is deducted from your package.
              </li>
              <li>
                Unlimited members get up to 2 late cancellations a week before advance booking
                privileges pause for 7 days.
              </li>
              <li>
                All purchases - single classes, packages, and memberships - are non-refundable to
                the original payment method; cancelled-in-time classes are credited back to your
                account instead.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-secondary p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
            Private classes
          </p>
          <h2 className="font-display text-2xl mb-3">Want it one-on-one?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Physique 57 offers 1-on-1 private sessions across barre, powerCycle, and other class
            formats, with scheduling flexibility and real-time coaching built around your goals.
            Virtual private sessions are also available over video call.{" "}
            {isBengaluru
              ? "Bengaluru private classes start at ₹3,925 plus taxes."
              : "In Mumbai, a single studio private class is ₹5,000 plus taxes, and a virtual private class is ₹4,500 plus taxes."}{" "}
            Packages of 10 private classes are available at discounted rates - contact the studio to
            book.
          </p>
        </div>

        {!isBengaluru && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
              Physique 57 Juniors
            </p>
            <h2 className="font-display text-2xl mb-3">
              A kids program, built for growing bodies.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Physique 57 Juniors introduces children aged 8-12 to the method in a safe,
              age-appropriate, and fun way, building strength, flexibility, coordination, and
              confidence across a 12-week semester of 45-minute classes held twice a week at Kemps
              Corner and Bandra. 8-class and 12-class packages are available - contact the studio to
              register.
            </p>
          </div>
        )}
      </section>
      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} />
    </div>
  );
}
