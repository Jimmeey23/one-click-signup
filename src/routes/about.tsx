import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

import group from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";
import trainer from "@/assets/2100 _ Physique57 _ Trainer Shots _ _04A1735.jpg";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Physique 57 India" },
      { name: "description", content: "The story of Physique 57 India - the legendary 57-minute barre method now in Mumbai." },
      { property: "og:title", content: "About - Physique 57 India" },
      { property: "og:description", content: "The story of Physique 57 India - the legendary 57-minute barre method now in Mumbai." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link>
          <Link to="/" className="hidden sm:inline-flex h-10 px-5 items-center rounded-full bg-white/10 text-white border border-white/25 backdrop-blur-md text-xs font-bold uppercase tracking-widest">Claim Your Trial Class</Link>
        </div>
      </header>
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${group})` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-end pb-14 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary font-bold mb-4">Our Story</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
              A 57‑minute revolution<br/><em className="italic text-primary">made in NYC,</em> lived in Mumbai.
            </h1>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 space-y-6 text-lg leading-relaxed">
        <p>Physique 57 was born in New York in 2006, founded by Tanya Becker and Jennifer Maanavi as a science-backed reinvention of the classic barre workout. The result: a 57-minute, full-body, interval-style class that sculpts, lengthens and strengthens like nothing else.</p>
        <p>Today, our studios in Mumbai bring that same uncompromising standard to India - same choreography, same teacher certification, same obsession with form and progression.</p>
        <div className="grid md:grid-cols-3 gap-6 pt-6">
          {[
            { n: "10M+", l: "classes taught globally" },
            { n: "57", l: "minutes per class" },
            { n: "2", l: "Mumbai studios" },
          ].map((s) => (
            <div key={s.l} className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="font-display text-5xl text-primary-deep">{s.n}</div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <img src={trainer} alt="Trainer" className="rounded-2xl object-cover aspect-[4/5] w-full" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">Our promise</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight">Show up. We'll change how you move.</h2>
            <p className="text-muted-foreground mt-5 leading-relaxed">Whether your goal is to feel stronger, lose weight, build flexibility, or simply find a community that makes you smile - you'll find it in 57 minutes a day.</p>
            <Link to="/" className="inline-block mt-7 px-6 h-12 rounded-full bg-foreground text-background text-xs uppercase tracking-[0.2em] font-bold leading-[3rem]">Claim your free class</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
