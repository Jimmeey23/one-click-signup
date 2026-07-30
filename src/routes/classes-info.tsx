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
          "Barre 57, powerCycle, StrengthLab, HIIT, Cardio Barre Plus, Back Body Blaze, Recovery and more - explore our 57-minute class formats.",
      },
      { property: "og:title", content: "Classes - Physique 57 India" },
      {
        property: "og:description",
        content:
          "Barre 57, powerCycle, StrengthLab, HIIT, Cardio Barre Plus, Back Body Blaze, Recovery and more.",
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
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-10 w-auto" />
          </Link>
          <Link
            to="/"
            className="hidden sm:inline-flex h-10 px-5 items-center rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest"
          >
            {isBengaluru ? "Bengaluru Offer" : "Claim Your Trial Class"}
          </Link>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
          Our classes
        </p>
        <h1 className="font-display text-5xl md:text-6xl mb-10">
          {isBengaluru ? "Built for Bengaluru in 57 minutes." : "Built for results in 57 minutes."}
        </h1>
        <div className="mb-10 grid gap-4 rounded-2xl border border-border bg-secondary p-6 md:grid-cols-2">
          {isBengaluru ? (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary-deep font-bold mb-2">
                Bengaluru studios
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lavelle Road and Indiranagar focus on Barre-first bookings and Bengaluru-specific
                introductory offers.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary-deep font-bold mb-2">
                Mumbai studios
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kemps Corner and Bandra offer the full class mix including Barre 57, powerCycle,
                and StrengthLab.
              </p>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {classFormats.map((c) => (
            <article
              key={c.name}
              className="bg-card border border-border rounded-lg overflow-hidden shadow-[var(--shadow-card)]"
            >
              <div
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${c.image})` }}
                aria-hidden
              />
              <div className="p-6">
                <h2 className="font-display text-3xl">{c.name}</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">{c.description}</p>
                <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2">
                  <p className="rounded-md bg-secondary px-3 py-2">
                    <span className="font-bold text-foreground">Duration:</span> {c.duration}
                  </p>
                  <p className="rounded-md bg-secondary px-3 py-2">
                    <span className="font-bold text-foreground">Level:</span> {c.intensity}
                  </p>
                  <p className="rounded-md bg-secondary px-3 py-2 sm:col-span-2">
                    <span className="font-bold text-foreground">Best for:</span> {c.bestFor}
                  </p>
                  <p className="rounded-md bg-secondary px-3 py-2 sm:col-span-2">
                    <span className="font-bold text-foreground">Equipment:</span> {c.equipment}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
              Class levels & eligibility
            </p>
            <h2 className="font-display text-2xl mb-4">Every BODY, every level.</h2>
            <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <li>
                Classes span three levels - Beginner, Intermediate, and Advanced - so you can
                match a format to your fitness experience and goals.
              </li>
              <li>
                New here? Start with Barre{isBengaluru ? "" : " 57"}
                {isBengaluru ? "" : " or Mat 57"}. Instructors offer modifications and
                progressions in every class, so you're never locked out by level.
              </li>
              <li>
                Pregnant, postpartum, or managing an injury, PCOS, thyroid concerns, or
                menopause? Physique 57's low-impact method is trained for modifications across
                all of these - always inform your instructor before class begins.
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
            Packages of 10 private classes are available at discounted rates - contact the studio
            to book.
          </p>
        </div>

        {!isBengaluru && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
              Physique 57 Juniors
            </p>
            <h2 className="font-display text-2xl mb-3">A kids program, built for growing bodies.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Physique 57 Juniors introduces children aged 7-9 and 9-12 to the method in a safe,
              age-appropriate, and fun way, building strength, flexibility, coordination, and
              confidence across a 12-week semester of 45-minute classes held twice a week at
              Kemps Corner and Bandra. 8-class and 12-class packages are available - contact the
              studio to register.
            </p>
          </div>
        )}
      </section>
      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} />
    </div>
  );
}
