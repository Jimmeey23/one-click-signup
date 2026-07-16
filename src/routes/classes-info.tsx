import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { CLASS_FORMATS } from "@/lib/class-formats";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/classes-info")({
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
            Claim Your Free Class
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
          {CLASS_FORMATS.map((c) => (
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
