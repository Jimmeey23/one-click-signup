import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Footer } from "@/components/Footer";

import group from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";
import trainer from "@/assets/2100 _ Physique57 _ Trainer Shots _ _04A1735.jpg";

const logoUrl = "/physique57-logo.png";

const searchSchema = z.object({
  studio: z.enum(["mumbai", "bengaluru"]).optional(),
});

export const Route = createFileRoute("/about")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "About - Physique 57 India" },
      { name: "description", content: "The story of Physique 57 India - the legendary 57-minute barre method now in Mumbai and Bengaluru." },
      { property: "og:title", content: "About - Physique 57 India" },
      { property: "og:description", content: "The story of Physique 57 India - the legendary 57-minute barre method now in Mumbai and Bengaluru." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { studio } = Route.useSearch();
  const isBengaluru = studio === "bengaluru";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link>
          <Link
            to={isBengaluru ? "/bengaluru" : "/"}
            className="hidden sm:inline-flex h-10 px-5 items-center rounded-full bg-white/10 text-white border border-white/25 backdrop-blur-md text-xs font-bold uppercase tracking-widest"
          >
            Claim Your Trial Class
          </Link>
        </div>
      </header>
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${group})` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-end pb-14 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary font-bold mb-4">Our Story</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
              A 57‑minute revolution<br/><em className="italic text-primary">made in NYC,</em>{" "}
              lived in {isBengaluru ? "Bengaluru." : "Mumbai."}
            </h1>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 space-y-6 text-lg leading-relaxed">
        <p>
          Physique 57 is a boutique barre fitness brand founded in New York City in 2006 by
          Jennifer Vaughan Maanavi and Tanya Becker, reinventing the legendary Lotte Berk Method
          for a new generation. The studio debuted at 24 W. 57th Street in Manhattan - which is
          how the brand got its name.
        </p>
        <p>
          {isBengaluru
            ? "Physique 57 expanded to Bengaluru in 2021, bringing that same 57-minute, full-body, interval-style method to the city across the Lavelle Road and Indiranagar studios - same choreography, same teacher certification, same obsession with form and progression."
            : "Physique 57 India launched in Mumbai in January 2017, with the studio officially opening in April 2018, making it India's first barre workout studio - and today our Kemps Corner and Bandra studios still hold that same uncompromising standard: same choreography, same teacher certification, same obsession with form and progression."}
        </p>
        <p>
          Physique 57 India was recognised in the Vogue Beauty Awards as one of the "6 Best
          Brands in the Beauty Business" in 2022, and has been featured across Vogue India,
          Architectural Digest, GQ India, and Grazia. Our philosophy is simple: workout because
          you love your body, not because you hate it.
        </p>
        <div className="grid md:grid-cols-3 gap-6 pt-6">
          {(isBengaluru
            ? [
                { n: "2021", l: "Physique 57 arrives in Bengaluru" },
                { n: "57", l: "minutes per class" },
                { n: "2", l: "Bengaluru studios" },
              ]
            : [
                { n: "2017", l: "Physique 57 arrives in Mumbai" },
                { n: "57", l: "minutes per class" },
                { n: "2", l: "Mumbai studios" },
              ]
          ).map((s) => (
            <div key={s.l} className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="font-display text-5xl text-primary-deep">{s.n}</div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20 space-y-5 text-base leading-relaxed text-muted-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold">The method</p>
        <h2 className="font-display text-3xl md:text-4xl text-foreground tracking-tight -mt-1">
          Interval Overload, explained.
        </h2>
        <p>
          Every Physique 57 class is built on Interval Overload - our proprietary training
          technique. It works a targeted muscle group to the point of fatigue through repetitive,
          isometric-style movements, then immediately follows with a deep stretch for relief and
          recovery. This cycle repeats across every muscle group, class after class, maximising
          results within a single 57-minute session.
        </p>
        <p>
          Classes are exactly 57 minutes long for a reason: long enough for a complete, effective
          full-body workout, short enough to fit a real schedule. There's no jumping or
          high-impact movement, so it's easy on your joints, while isometric holds and resistance
          still work muscles deeply for a genuinely high-intensity effect - no dance or barre
          background required, ever.
        </p>
      </section>

      <section className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <img src={trainer} alt="Trainer" className="rounded-2xl object-cover aspect-[4/5] w-full" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">Our trainers</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight">
              Trained to coach every body, safely.
            </h2>
            <p className="text-muted-foreground mt-5 leading-relaxed">
              Our instructors go through one of the most rigorous training programmes in Indian
              fitness - competitive auditions, intensive choreography training, and technical
              critiques, certified over 3 months directly by the brand's team. They're trained to
              modify for spinal, knee, shoulder, wrist, ankle, and foot concerns, persistent lower
              back pain, and prenatal and postnatal adaptations, from your very first class.
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Most clients notice visible changes within 8 classes - and while Physique 57 is
              widely popular among women, the method is built for "Every BODY." Group classes
              add a proven edge too: the Kohler Effect means performance improves when we work
              alongside others chasing the same goal.
            </p>
            <Link
              to={isBengaluru ? "/bengaluru" : "/"}
              className="inline-block mt-7 px-6 h-12 rounded-full bg-foreground text-background text-xs uppercase tracking-[0.2em] font-bold leading-[3rem]"
            >
              Claim your {isBengaluru ? "trial" : "free"} class
            </Link>
          </div>
        </div>
      </section>

      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} />
    </div>
  );
}
