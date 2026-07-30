import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  Bike,
  CalendarCheck,
  CircleHelp,
  Clock3,
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

const logoUrl = "/physique57-logo.png";

const searchSchema = z.object({
  studio: z.enum(["mumbai", "bengaluru"]).optional(),
});

export const Route = createFileRoute("/faq")({
  validateSearch: searchSchema,
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
        content: "Everything to know before booking your Physique 57 India classes.",
      },
    ],
  }),
  component: FAQPage,
});

const MUMBAI_FAQS = [
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
    q: "What is the cancellation policy?",
    a: "Studio Class cancellations must be made via email, WhatsApp, or the Physique 57 app at least 12 hours before the scheduled class start time. Late cancellations may deduct the class from the applicable package or affect booking privileges.",
    icon: CalendarCheck,
  },
  {
    q: "How early should I arrive?",
    a: "Arrive before the scheduled start time so there is enough time for check-in and setup.",
    icon: Clock3,
  },
  {
    q: "What should I bring?",
    a: "Bring water, grip socks if you prefer them, and arrive in comfortable activewear that lets you move freely.",
    icon: ShieldCheck,
  },
];

const BENGALURU_FAQS = [
  {
    q: "What is Barre?",
    a: "Barre is the signature Physique 57 workout with precise, controlled movements, isometric holds, and targeted strength exercises to sculpt, tone, and strengthen the whole body.",
    icon: Sparkles,
  },
  {
    q: "Is Barre suitable for beginners?",
    a: "Yes. The Barre format is suitable for all fitness levels, with modifications available so first-time members can ease in confidently.",
    icon: CircleHelp,
  },
  {
    q: "What should I wear or bring?",
    a: "Wear comfortable activewear and bring water. Grip socks can help if you like extra stability during class.",
    icon: ShieldCheck,
  },
  {
    q: "How early should I arrive?",
    a: "Arrive before class so there is enough time for check-in, studio guidance, and a calm start.",
    icon: Clock3,
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellation rules follow the studio booking policy and should be checked before confirming your class.",
    icon: CalendarCheck,
  },
];

const PAGE_COPY = {
  mumbai: {
    title: "Before you book.",
    eyebrow: "FAQ",
    summary:
      "Answers are curated from the Physique 57 India brand book and studio policy content so the public FAQ matches the actual class formats and booking rules.",
  },
  bengaluru: {
    title: "Before you book Bengaluru Barre.",
    eyebrow: "Bengaluru FAQ",
    summary:
      "Clear answers for Bengaluru members: Barre-only classes, first-class pricing, and the essentials you need before you visit.",
  },
} as const;

function FAQPage() {
  const { studio } = Route.useSearch();
  const isBengaluru = studio === "bengaluru";
  const faqs = isBengaluru ? BENGALURU_FAQS : MUMBAI_FAQS;
  const copy = PAGE_COPY[studio ?? "mumbai"];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#faf8ff_0%,#ffffff_28%,#ffffff_100%)] text-foreground">
      <header className="border-b border-[#ececf1]/80 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-10 w-auto" />
          </Link>
          <Link
            to={isBengaluru ? "/bengaluru" : "/"}
            className="inline-flex h-10 items-center rounded-full border border-[#e4ddff] bg-white px-4 text-xs font-bold uppercase tracking-widest text-primary-deep shadow-sm hover:bg-[#f7f3ff] transition"
          >
            {isBengaluru ? "Back to Bengaluru" : "Back to home"}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-14 md:py-[4.5rem]">
        <div className="mb-12 grid gap-8 rounded-[2rem] border border-[#ececf1] bg-white p-8 md:grid-cols-[0.8fr_1.2fr] md:items-end md:p-10 shadow-[0_20px_60px_-36px_rgb(0_0_0/0.35)]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-deep font-bold mb-3">
              {copy.eyebrow}
            </p>
            <h1 className="font-display text-5xl md:text-6xl tracking-tight">{copy.title}</h1>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:justify-self-end md:text-base">
            {copy.summary}
          </p>
        </div>

        <div className="grid gap-4">
          {faqs.map((f, i) => {
            const Icon = f.icon;
            return (
              <AccordionItem
                key={f.q}
                value={`f${i}`}
                className="overflow-hidden rounded-[1.35rem] border border-[#e6e0f7] bg-white px-5 shadow-[0_18px_50px_-34px_rgb(39_23_84/0.55)]"
              >
                <AccordionTrigger className="gap-4 py-6 text-left text-base font-semibold hover:no-underline md:text-lg">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4efff] text-[#6732f5] shadow-inner shadow-white/50">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>{f.q}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-0 text-sm leading-7 text-muted-foreground md:pl-[3.5rem] md:text-[0.98rem]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </div>
      </main>
      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} />
    </div>
  );
}
