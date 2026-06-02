import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

import barre from "@/assets/2066 _ Physique57 _ Trainer Shots _ _56A2552.jpg";
import lunge from "@/assets/120 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _04A1551.jpg";
import sculpt from "@/assets/3012 _ Physique57 _ Deliverable 3 _ _56A1619.jpg";
import cycle from "@/assets/2115 _ Physique57 _ Trainer Shots _ _56A3035.jpg";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/classes-info")({
  head: () => ({
    meta: [
      { title: "Classes — Physique 57 India" },
      { name: "description", content: "Open Barre, powerCycle, Strength Lab, Cardio Barre, Mat 57 and HIIT — explore our 57-minute class formats." },
      { property: "og:title", content: "Classes — Physique 57 India" },
      { property: "og:description", content: "Open Barre, powerCycle, Strength Lab, Cardio Barre, Mat 57 and HIIT." },
    ],
  }),
  component: ClassesInfoPage,
});

const CLASSES = [
  { name: "Barre 57", img: barre, desc: "The signature interval-style barre workout. 57 minutes to sculpt, lengthen and strengthen every muscle." },
  { name: "powerCycle", img: cycle, desc: "Rhythm-based indoor cycling with full-body conditioning. Cardio that doesn't feel like cardio." },
  { name: "Cardio Barre", img: lunge, desc: "Higher-intensity barre with dance-inspired sequences. Sweat, smile, repeat." },
  { name: "Mat 57", img: sculpt, desc: "Pilates-inspired floor work that builds core strength and serious flexibility." },
];

function ClassesInfoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link>
          <Link to="/" className="hidden sm:inline-flex h-10 px-5 items-center rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest">Claim Open Barre</Link>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">Our classes</p>
        <h1 className="font-display text-5xl md:text-6xl mb-10">Built for results in 57 minutes.</h1>
        <div className="grid md:grid-cols-2 gap-6">
          {CLASSES.map((c) => (
            <article key={c.name} className="bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
              <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${c.img})` }} aria-hidden />
              <div className="p-6">
                <h2 className="font-display text-3xl">{c.name}</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">{c.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
