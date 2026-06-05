import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Physique 57 India" },
      { name: "description", content: "Visit Kemps Corner or Bandra, or reach us by phone, email or WhatsApp." },
      { property: "og:title", content: "Contact — Physique 57 India" },
      { property: "og:description", content: "Visit Kemps Corner or Bandra, or reach us by phone, email or WhatsApp." },
    ],
  }),
  component: ContactPage,
});

const STUDIOS = [
  { name: "Kemps Corner", address: "Kwality House, 1st Floor, August Kranti Marg, Kemps Corner, Mumbai 400036", phone: "+91 90040 01057", mapsQ: "Physique 57 India Kwality House Kemps Corner Mumbai" },
  { name: "Bandra", address: "Supreme HQ, Off Linking Road, Bandra West, Mumbai 400050", phone: "+91 90040 01057", mapsQ: "Physique 57 India Supreme HQ Bandra Mumbai" },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5"><Link to="/"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link></div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">Get in touch</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-10">Come move with us.</h1>
        <div className="grid md:grid-cols-2 gap-8">
          {STUDIOS.map((s) => (
            <div key={s.name} className="bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
              <iframe title={`Map of ${s.name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(s.mapsQ)}&output=embed`} className="w-full h-64 border-0" loading="lazy" />
              <div className="p-6">
                <h2 className="font-display text-3xl mb-2">{s.name}</h2>
                <p className="text-sm text-muted-foreground">{s.address}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <a className="text-primary-deep underline" href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
                  <a className="text-primary-deep underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapsQ)}`} target="_blank" rel="noreferrer">Get directions</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <InfoCard title="Email" body="info@physique57india.com" href="mailto:info@physique57india.com" />
          <InfoCard title="Phone" body="+91 97690 72866" href="tel:+919769072866" />
          <InfoCard title="WhatsApp" body="Chat with us" href="https://wa.me/919769072866" />
        </div>
      </section>
      <Footer />
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
