import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Physique 57 India" },
      { name: "description", content: "Everything you need to know before your first Physique 57 class." },
      { property: "og:title", content: "FAQ — Physique 57 India" },
      { property: "og:description", content: "Everything you need to know before your first Physique 57 class." },
    ],
  }),
  component: FAQPage,
});

const FAQS = [
  { q: "What should I bring to my first class?", a: "Comfortable workout clothes, grippy socks (we sell them at the studio), a water bottle and a towel. Everything else is provided." },
  { q: "How early should I arrive?", a: "Please arrive 10–15 minutes before class so we can set you up. Late entry is restricted (Barre: 10 min, powerCycle: 5 min)." },
  { q: "Do I need any prior experience?", a: "No. Open Barre is designed for first-timers. Our instructors adapt every move to your level." },
  { q: "What's the cancellation policy?", a: "Cancel at least 4 hours before class to avoid a late-cancel fee. For powerCycle the window is 6 hours." },
  { q: "Is there parking at the studios?", a: "Yes — both Kemps Corner and Bandra studios have paid parking nearby." },
  { q: "Can I freeze or pause my membership?", a: "Yes. Memberships can be frozen for up to 30 days per year. Speak to the front desk." },
];

function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5"><Link to="/"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link></div>
      </header>
      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">FAQ</p>
        <h1 className="font-display text-5xl md:text-6xl mb-10">Before you book.</h1>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <Footer />
    </div>
  );
}
