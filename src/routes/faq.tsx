import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  CalendarCheck,
  CircleHelp,
  Clock3,
  Dumbbell,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ - Physique 57 India" },
      {
        name: "description",
        content: "Brand-book-aligned answers before your first Physique 57 India class.",
      },
      { property: "og:title", content: "FAQ - Physique 57 India" },
      {
        property: "og:description",
        content: "Everything to know before booking Barre 57, powerCycle, FIT, or StrengthLab.",
      },
    ],
  }),
  component: FAQPage,
});

const FAQS = [
  {
    q: "What is Barre 57?",
    a: "The signature Physique 57 workout combines precise, controlled movements, isometric holds and targeted strength exercises to sculpt, tone and strengthen the entire body, all set to energising music.",
    icon: Sparkles,
  },
  {
    q: "Is Barre 57 suitable for beginners?",
    a: "Yes. The brand book defines Barre 57 as suitable for all fitness levels, from newcomers to experienced practitioners, with modifications available to accommodate different levels.",
    icon: CircleHelp,
  },
  {
    q: "What should I expect in powerCycle?",
    a: "powerCycle is rhythm-driven indoor cycling. Expect music-led cadence, resistance cues, cardio interval blocks, Stages SC3 bikes, and real-time riding metrics such as wattage, RPM, and distance. The format stays focused on pedaling mechanics and does not include weights or core work on the bike.",
    icon: Bike,
  },
  {
    q: "What should I wear or bring for powerCycle?",
    a: "Wear form-fitting activewear and bring water and socks. Studio-provided SPD cycling shoes may be used, and hard-sole sneakers are accepted as an alternative.",
    icon: Bike,
  },
  {
    q: "How early should I arrive?",
    a: "Arrive before the scheduled start time so there is enough time for check-in and setup. For powerCycle, new riders with fewer than 10 classes should arrive 15 minutes early for a safety briefing and custom bike fit.",
    icon: Clock3,
  },
  {
    q: "What is the late-entry policy?",
    a: "Late entry is strict to protect class safety and instructor flow. Members are ordinarily not permitted entry after 10 minutes from the scheduled class start time. Express-format classes do not allow entry once class has commenced. powerCycle entry is subject to studio discretion and operational feasibility.",
    icon: ShieldCheck,
  },
  {
    q: "What is the cancellation policy?",
    a: "Studio Class cancellations must be made via email, WhatsApp, or the Physique 57 app at least 12 hours before the scheduled class start time. Late cancellations may deduct the class from the applicable package or affect booking privileges.",
    icon: CalendarCheck,
  },
  {
    q: "Is StrengthLab beginner friendly?",
    a: "No. The brand book positions StrengthLab as an advanced strength format. It is recommended for clients who have completed at least 25 FIT classes or have two or more months of consistent external weight training experience.",
    icon: Dumbbell,
  },
  {
    q: "How is FIT different from StrengthLab?",
    a: "FIT is a 50-minute functional interval class combining strength-based intervals, endurance work, heavy weights, and core conditioning. StrengthLab is a 57-minute circuit-based strength class focused on heavier weights, specific repetition counts, progressive overload, and power, upper-body, lower-body, and core circuits.",
    icon: Dumbbell,
  },
  {
    q: "Will powerCycle bulk up my legs?",
    a: "No. The brand book explains that powerCycle uses interval training with resistance to build lean, strong muscle fibers rather than bulk.",
    icon: Bike,
  },
];

function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="border-b border-[#ececf1]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-10 w-auto" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-14 md:py-[4.5rem]">
        <div className="mb-10 grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
              FAQ
            </p>
            <h1 className="font-display text-5xl md:text-6xl tracking-tight">Before you book.</h1>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:justify-self-end">
            Answers are curated from the Physique 57 India brand book and studio policy content so
            the public FAQ matches the actual class formats and booking rules.
          </p>
        </div>

        <Accordion type="single" collapsible className="grid gap-3">
          {FAQS.map((f, i) => {
            const Icon = f.icon;
            return (
              <AccordionItem
                key={f.q}
                value={`f${i}`}
                className="rounded-lg border border-[#e1e1e7] bg-white px-5 shadow-[0_10px_34px_-28px_rgb(0_0_0/0.5)]"
              >
                <AccordionTrigger className="gap-4 py-5 text-left text-base font-semibold hover:no-underline">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4efff] text-[#6732f5]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>{f.q}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-0 text-sm leading-7 text-muted-foreground md:pl-[3.25rem]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}
