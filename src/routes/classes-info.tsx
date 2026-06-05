import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

import barre from "@/assets/2140 _ Physique57 _ Trainer Shots _ _56A2072.jpg";
import fit from "@/assets/2115 _ Physique57 _ Trainer Shots _ _56A3035.jpg";
import strength from "@/assets/2094 _ Physique57 _ Trainer Shots _ _04A1305.jpg";
import sculpt from "@/assets/2087 _ Physique57 _ Trainer Shots _ _56A2974.jpg";
import cardio from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";
import hiit from "@/assets/3014 _ Physique57 _ Deliverable 3 _ _56A1625.jpg";
import recovery from "@/assets/3010 _ Physique57 _ Deliverable 3 _ _56A1587.jpg";
import cycle from "@/assets/107 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _56A1196.jpg";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/classes-info")({
  head: () => ({
    meta: [
      { title: "Classes — Physique 57 India" },
      {
        name: "description",
        content:
          "Barre 57, powerCycle, StrengthLab, HIIT, Cardio Barre Plus, Back Body Blaze, Recovery and more — explore our 57-minute class formats.",
      },
      { property: "og:title", content: "Classes — Physique 57 India" },
      {
        property: "og:description",
        content:
          "Barre 57, powerCycle, StrengthLab, HIIT, Cardio Barre Plus, Back Body Blaze, Recovery and more.",
      },
    ],
  }),
  component: ClassesInfoPage,
});

const CLASSES = [
  {
    name: "Barre 57",
    img: barre,
    intensity: "Moderate to high, with modifications",
    bestFor: "All fitness levels",
    desc: "The signature Physique 57 format: ballet-inspired movement, isometric holds, targeted strength work, sculpting, toning, lengthening, and upbeat music.",
  },
  {
    name: "powerCycle",
    img: cycle,
    intensity: "Open level, rider controlled",
    bestFor: "Low-impact cardio and endurance",
    desc: "Rhythm-driven indoor cycling built on cadence, resistance, cardio interval blocks, and real-time riding metrics.",
  },
  {
    name: "Studio FIT",
    img: fit,
    intensity: "High intensity",
    bestFor: "Strength-based interval training",
    desc: "A 50-minute functional interval class combining strength work, endurance blocks, heavy weights, and core conditioning.",
  },
  {
    name: "Cardio Barre",
    img: cardio,
    intensity: "Intermediate to advanced",
    bestFor: "Sweat-forward barre",
    desc: "Traditional barre precision meets faster cardiovascular sequences, dynamic intervals, and active recovery.",
  },
  {
    name: "Cardio Barre Plus",
    img: hiit,
    intensity: "Advanced cardio barre",
    bestFor: "A stronger sweat-forward barre challenge",
    desc: "A more athletic Cardio Barre progression with longer burn blocks, quicker transitions, and elevated heart-rate intervals while keeping Physique 57 precision.",
  },
  {
    name: "HIIT",
    img: hiit,
    intensity: "High intensity",
    bestFor: "Cardio intervals and athletic conditioning",
    desc: "A compact, high-output session alternating cardio bursts, strength drills, active recovery, and core work for a powerful full-body burn.",
  },
  {
    name: "Mat 57",
    img: sculpt,
    intensity: "Moderate to high",
    bestFor: "Core, posture, flexibility",
    desc: "Pilates-inspired floor work that brings Physique 57 sculpting techniques to the mat with posture, balance, and alignment.",
  },
  {
    name: "StrengthLab",
    img: strength,
    intensity: "Advanced strength",
    bestFor: "Experienced strength trainees",
    desc: "A 57-minute circuit-based strength format using heavier weights, specific repetition counts, progressive overload, and power work.",
  },
  {
    name: "Back Body Blaze",
    img: strength,
    intensity: "Advanced posterior-chain strength",
    bestFor: "Back, glutes, hamstrings, posture, and power",
    desc: "A focused strength format targeting the back body with controlled resistance, glute and hamstring work, posture-focused pulls, and core stability.",
  },
  {
    name: "Recovery",
    img: recovery,
    intensity: "Low intensity restorative",
    bestFor: "Mobility, flexibility, reset, and active recovery",
    desc: "A slower session built around breath, lengthening, mobility, assisted stretch patterns, and restorative movement to help the body reset between stronger classes.",
  },
];

function ClassesInfoPage() {
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
            Claim Open Barre
          </Link>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
          Our classes
        </p>
        <h1 className="font-display text-5xl md:text-6xl mb-10">
          Built for results in 57 minutes.
        </h1>
        <div className="grid md:grid-cols-2 gap-6">
          {CLASSES.map((c) => (
            <article
              key={c.name}
              className="bg-card border border-border rounded-lg overflow-hidden shadow-[var(--shadow-card)]"
            >
              <div
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${c.img})` }}
                aria-hidden
              />
              <div className="p-6">
                <h2 className="font-display text-3xl">{c.name}</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">{c.desc}</p>
                <div className="mt-5 grid gap-2 text-xs">
                  <p className="rounded-md bg-secondary px-3 py-2">
                    <span className="font-bold text-foreground">Intensity:</span> {c.intensity}
                  </p>
                  <p className="rounded-md bg-secondary px-3 py-2">
                    <span className="font-bold text-foreground">Best for:</span> {c.bestFor}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
