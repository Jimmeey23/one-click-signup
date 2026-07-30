import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Footer } from "@/components/Footer";
import { BENGALURU_LOCATIONS, MUMBAI_LOCATIONS } from "@/lib/momence-locations";

const logoUrl = "/physique57-logo.png";

const searchSchema = z.object({
  studio: z.enum(["mumbai", "bengaluru"]).optional(),
});

export const Route = createFileRoute("/contact")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Contact - Physique 57 India" },
      { name: "description", content: "Visit Kemps Corner or Bandra, or reach us by phone, email or WhatsApp." },
      { property: "og:title", content: "Contact - Physique 57 India" },
      { property: "og:description", content: "Visit Kemps Corner or Bandra, or reach us by phone, email or WhatsApp." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { studio } = Route.useSearch();
  const isBengaluru = studio === "bengaluru";
  const studios = isBengaluru ? BENGALURU_LOCATIONS : MUMBAI_LOCATIONS;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5"><Link to="/"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link></div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">Get in touch</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-4">
          {isBengaluru ? "Come move with us in Bengaluru." : "Come move with us."}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground mb-10">
          {isBengaluru
            ? "Visit our Bengaluru studios, or reach the team directly for class guidance, booking help, and first-visit questions."
            : "Visit our Mumbai and Bengaluru studios, or reach the team directly for class guidance, booking help, and first-visit questions."}
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {studios.map((s) => (
            <div key={s.name} className="bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
              <iframe title={`Map of ${s.name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(s.name)}&output=embed`} className="w-full h-64 border-0" loading="lazy" />
              <div className="p-6">
                <h2 className="font-display text-3xl mb-2">{s.name}</h2>
                <p className="text-sm text-muted-foreground">{s.address}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <a className="text-primary-deep underline" href={`tel:+91${s.phone.replace(/\s/g, "")}`}>
                    +91 {s.phone}
                  </a>
                  <a className="text-primary-deep underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`} target="_blank" rel="noreferrer">Get directions</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {isBengaluru ? (
            <InfoCard
              title="Email"
              body="info@physique57bengaluru.com"
              href="mailto:info@physique57bengaluru.com"
            />
          ) : (
            <InfoCard
              title="Email"
              body="info@physique57india.com"
              href="mailto:info@physique57india.com"
            />
          )}
          <InfoCard title="Phone" body="+91 97696 65757" href="tel:+919769665757" />
          <InfoCard title="WhatsApp" body="Chat with us" href="https://wa.me/919769665757" />
        </div>
      </section>
      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} />
    </div>
  );
}

function InfoCard({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block bg-secondary rounded-2xl p-6 hover:bg-accent transition">
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary-deep font-bold mb-2">{title}</p>
      <p className="font-display text-2xl">{body}</p>
    </a>
  );
}
