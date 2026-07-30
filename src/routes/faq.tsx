import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Baby,
  Bike,
  BookOpen,
  CalendarCheck,
  CircleHelp,
  Clock3,
  Dumbbell,
  Flame,
  GraduationCap,
  HeartPulse,
  MapPin,
  MessageCircle,
  Phone,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
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

type FaqEntry = { q: string; a: string; icon: LucideIcon };
type FaqCategory = { title: string; icon: LucideIcon; items: FaqEntry[] };

const MUMBAI_CATEGORIES: FaqCategory[] = [
  {
    title: "Brand & Legacy",
    icon: BookOpen,
    items: [
      {
        q: "What is Physique 57 and where did it come from?",
        a: "Physique 57 is a boutique barre fitness brand founded in New York City in 2006 by Jennifer Vaughan Maanavi and Tanya Becker, reinventing the legendary Lotte Berk Method for a new generation. The studio debuted at 24 W. 57th Street in Manhattan, which is how the brand got its name.",
        icon: BookOpen,
      },
      {
        q: "When did Physique 57 come to Mumbai?",
        a: "Physique 57 India launched in Mumbai in January 2017, with the studio officially opening in April 2018, making it India's first barre workout studio.",
        icon: MapPin,
      },
      {
        q: "What awards has Physique 57 India won?",
        a: 'Physique 57 India was recognised in the Vogue Beauty Awards as one of the "6 Best Brands in the Beauty Business" in 2022, and has been featured across Vogue India, Architectural Digest, GQ India, and Grazia.',
        icon: Award,
      },
      {
        q: "What is the brand's philosophy?",
        a: '"Workout because you love your body, not because you hate it." Physique 57 exists to sculpt bodies and change lives through a welcoming, science-backed method - for every fitness level.',
        icon: Sparkles,
      },
    ],
  },
  {
    title: "The Method",
    icon: Flame,
    items: [
      {
        q: "What is the Physique 57 method?",
        a: "A barre-based workout blending cardio, strength, and stretching using a ballet barre, light weights, and resistance bands to sculpt and tone the entire body in 57 minutes.",
        icon: Flame,
      },
      {
        q: "What is Interval Overload?",
        a: "Physique 57's proprietary, scientifically proven technique - isometric, repetitive movements taken to fatigue, immediately followed by a deep stretch for relief and recovery. It's repeated across every muscle group each class.",
        icon: Repeat,
      },
      {
        q: "Do I need any dance or barre experience?",
        a: "No. The barre is used purely as a fitness apparatus, not a ballet tool - zero dance background is required. Every movement is taught from scratch by your instructor.",
        icon: CircleHelp,
      },
      {
        q: "Is Physique 57 a low-impact workout?",
        a: "Yes. There's no jumping or high-impact movement, so it's easy on joints, while isometric holds and resistance still work muscles deeply for a genuinely high-intensity effect.",
        icon: ShieldCheck,
      },
      {
        q: "Why are classes 57 minutes long?",
        a: "Long enough for a complete, effective full-body workout, and short enough to fit a real schedule - every minute is choreographed with a purpose, right down to the final stretch.",
        icon: Timer,
      },
    ],
  },
  {
    title: "Classes & Formats",
    icon: Dumbbell,
    items: [
      {
        q: "What class formats are offered in Mumbai?",
        a: "Barre 57, Cardio Barre, Cardio Barre Plus, Studio FIT, HIIT, Mat 57, StrengthLab, Back Body Blaze, Recovery, and powerCycle - a full spread across cardio, strength, and recovery formats.",
        icon: Dumbbell,
      },
      {
        q: "What is Barre 57?",
        a: "The signature fundamental barre class and the cornerstone of the Physique 57 experience - muscle-defining arm work, intense thigh and seat sequences, waist-chiselling ab work, and fluid stretches, all in 57 minutes.",
        icon: Sparkles,
      },
      {
        q: "What is powerCycle?",
        a: "Physique 57's rhythm-driven indoor cycling class on state-of-the-art bikes, mapping the beat of the music to the pedal stroke. It tracks your watts, RPM, and distance for measurable progress.",
        icon: Bike,
      },
      {
        q: "Is there a class for children?",
        a: "Yes - Physique 57 Juniors runs at the Kemps Corner and Bandra studios for two age groups (7-9 and 9-12 years), with 45-minute classes twice a week across a 12-week semester.",
        icon: Baby,
      },
      {
        q: "What's the best class to start with?",
        a: "Barre 57 is the ideal first class - it teaches the foundational barre moves and the Interval Overload method that every other format builds on. Mat 57 and Recovery are gentle alternatives if you'd rather ease in.",
        icon: Star,
      },
    ],
  },
  {
    title: "Trainers, Safety & Results",
    icon: GraduationCap,
    items: [
      {
        q: "How are Physique 57 instructors trained?",
        a: "Instructors go through one of the most rigorous training programmes in Indian fitness - competitive auditions, intensive choreography training, and technical critiques, certified over 3 months directly by the brand's team.",
        icon: GraduationCap,
      },
      {
        q: "Can instructors modify for injuries or pregnancy?",
        a: "Yes. Instructors are trained to provide modifications for spinal, knee, shoulder, and joint concerns, as well as prenatal and postnatal adaptations, from the very first class.",
        icon: HeartPulse,
      },
      {
        q: "How quickly will I see results?",
        a: "Most clients notice visible changes within 8 classes. A 2010 Adelphi University Human Performance Laboratory study found significant body composition improvements in participants training four times a week over a month.",
        icon: TrendingUp,
      },
      {
        q: "Is the method scientifically validated?",
        a: "Yes - the Adelphi University training study evaluated the Physique 57 method directly, confirming meaningful gains in fitness and body composition within just weeks of consistent attendance.",
        icon: Award,
      },
      {
        q: "How often should I attend to see results?",
        a: "We recommend 3-4 classes a week. Even on consecutive days, the built-in stretching helps recovery, so there's no need to worry about overtraining.",
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: "Getting Started & Community",
    icon: MessageCircle,
    items: [
      {
        q: "What is the Newcomers offer in Mumbai?",
        a: "First-time members can book the Newcomers 2-for-1 package - two classes for the price of one - a great way to try the method before committing to a larger package.",
        icon: Sparkles,
      },
      {
        q: "What is the cancellation policy?",
        a: "Cancellations must be made via email, WhatsApp, or the Physique 57 app at least 12 hours before the scheduled class start time. Late cancellations may deduct the class from your package.",
        icon: CalendarCheck,
      },
      {
        q: "How early should I arrive?",
        a: "Arrive before the scheduled start time so there's enough time for check-in and setup - instructors like to greet you before class begins.",
        icon: Clock3,
      },
      {
        q: "What should I bring?",
        a: "Bring water, grip socks if you prefer them, and comfortable activewear that lets you move freely. All other equipment is provided at the studio.",
        icon: ShieldCheck,
      },
      {
        q: "How do I stay connected with the studio?",
        a: "Follow @physique57india on Instagram and Facebook, and subscribe to the newsletter for class updates, offers, and events like Self Care Saturday.",
        icon: MessageCircle,
      },
      {
        q: "How can I contact the studio?",
        a: "Email info@physique57india.com, call or WhatsApp +91 97696 65757, or visit one of the Mumbai studios directly - the team is always happy to help.",
        icon: Phone,
      },
    ],
  },
];

const BENGALURU_CATEGORIES: FaqCategory[] = [
  {
    title: "Brand & Legacy",
    icon: BookOpen,
    items: [
      {
        q: "What is Physique 57 and where did it come from?",
        a: "Physique 57 is a boutique barre fitness brand founded in New York City in 2006 by Jennifer Vaughan Maanavi and Tanya Becker, reinventing the legendary Lotte Berk Method for a new generation. The studio debuted at 24 W. 57th Street in Manhattan, which is how the brand got its name.",
        icon: BookOpen,
      },
      {
        q: "When did Physique 57 come to Bengaluru?",
        a: "Physique 57 expanded to Bengaluru in 2021, bringing India's first barre workout format to the city across the Lavelle Road and Indiranagar studios.",
        icon: MapPin,
      },
      {
        q: "What awards has Physique 57 India won?",
        a: 'Physique 57 India was recognised in the Vogue Beauty Awards as one of the "6 Best Brands in the Beauty Business" in 2022, and has been featured across Vogue India, Architectural Digest, GQ India, and Grazia.',
        icon: Award,
      },
      {
        q: "What is the brand's philosophy?",
        a: '"Workout because you love your body, not because you hate it." Physique 57 exists to sculpt bodies and change lives through a welcoming, science-backed method - for every fitness level.',
        icon: Sparkles,
      },
    ],
  },
  {
    title: "The Method",
    icon: Flame,
    items: [
      {
        q: "What is the Physique 57 method?",
        a: "A barre-based workout blending cardio, strength, and stretching using a ballet barre, light weights, and resistance bands to sculpt and tone the entire body in 57 minutes.",
        icon: Flame,
      },
      {
        q: "What is Interval Overload?",
        a: "Physique 57's proprietary, scientifically proven technique - isometric, repetitive movements taken to fatigue, immediately followed by a deep stretch for relief and recovery. It's repeated across every muscle group each class.",
        icon: Repeat,
      },
      {
        q: "Do I need any dance or barre experience?",
        a: "No. The barre is used purely as a fitness apparatus, not a ballet tool - zero dance background is required. Every movement is taught from scratch by your instructor.",
        icon: CircleHelp,
      },
      {
        q: "Is Physique 57 a low-impact workout?",
        a: "Yes. There's no jumping or high-impact movement, so it's easy on joints, while isometric holds and resistance still work muscles deeply for a genuinely high-intensity effect.",
        icon: ShieldCheck,
      },
      {
        q: "Why are classes 57 minutes long?",
        a: "Long enough for a complete, effective full-body workout, and short enough to fit a real schedule - every minute is choreographed with a purpose, right down to the final stretch.",
        icon: Timer,
      },
    ],
  },
  {
    title: "Classes & Formats",
    icon: Dumbbell,
    items: [
      {
        q: "What class formats are offered in Bengaluru?",
        a: "Bengaluru studios are Barre-first - every class is built around Physique 57's signature Barre format, so every booking gives you the full sculpting, toning method from your very first visit.",
        icon: Dumbbell,
      },
      {
        q: "What is Barre?",
        a: "Barre is the signature Physique 57 workout with precise, controlled movements, isometric holds, and targeted strength exercises to sculpt, tone, and strengthen the whole body - no dance experience required.",
        icon: Sparkles,
      },
      {
        q: "Is Bengaluru Barre-only?",
        a: "Yes, for now - Lavelle Road and Indiranagar both focus on Barre-first bookings, giving new members a consistent, deep introduction to the method before other formats roll out.",
        icon: CircleHelp,
      },
      {
        q: "What's the best class to start with?",
        a: 'Your first Barre class doubles as your introduction to the Interval Overload method - instructors will walk you through every position, so there\'s no separate "beginner" class needed.',
        icon: Star,
      },
    ],
  },
  {
    title: "Trainers, Safety & Results",
    icon: GraduationCap,
    items: [
      {
        q: "How are Physique 57 instructors trained?",
        a: "Instructors go through one of the most rigorous training programmes in Indian fitness - competitive auditions, intensive choreography training, and technical critiques, certified over 3 months directly by the brand's team.",
        icon: GraduationCap,
      },
      {
        q: "Can instructors modify for injuries or pregnancy?",
        a: "Yes. Instructors are trained to provide modifications for spinal, knee, shoulder, and joint concerns, as well as prenatal and postnatal adaptations, from the very first class.",
        icon: HeartPulse,
      },
      {
        q: "How quickly will I see results?",
        a: "Most clients notice visible changes within 8 classes. A 2010 Adelphi University Human Performance Laboratory study found significant body composition improvements in participants training four times a week over a month.",
        icon: TrendingUp,
      },
      {
        q: "Is the method scientifically validated?",
        a: "Yes - the Adelphi University training study evaluated the Physique 57 method directly, confirming meaningful gains in fitness and body composition within just weeks of consistent attendance.",
        icon: Award,
      },
      {
        q: "How often should I attend to see results?",
        a: "We recommend 3-4 classes a week. Even on consecutive days, the built-in stretching helps recovery, so there's no need to worry about overtraining.",
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: "Getting Started & Community",
    icon: MessageCircle,
    items: [
      {
        q: "What is the Bengaluru intro offer?",
        a: "New members get 50% off their first class at Lavelle Road, or the Copper + Cloves single-class package at Indiranagar - the easiest way to feel the method before booking a full package.",
        icon: Sparkles,
      },
      {
        q: "What is the cancellation policy?",
        a: "Cancellation rules follow the studio's standard booking policy - check the app or ask the front desk to confirm the notice window before your class.",
        icon: CalendarCheck,
      },
      {
        q: "How early should I arrive?",
        a: "Arrive before class starts so there's time for check-in, studio guidance, and a calm start - especially important for your very first Barre class.",
        icon: Clock3,
      },
      {
        q: "What should I bring?",
        a: "Wear comfortable activewear and bring water. Grip socks can help if you like extra stability during class; everything else is provided at the studio.",
        icon: ShieldCheck,
      },
      {
        q: "How do I stay connected with the studio?",
        a: "Follow @physique57india on Instagram and Facebook, and subscribe to the newsletter for class updates, offers, and studio events.",
        icon: MessageCircle,
      },
      {
        q: "How can I contact the studio?",
        a: "Email info@physique57bengaluru.com, call or WhatsApp +91 97696 65757, or visit Lavelle Road or Indiranagar directly - the team is always happy to help.",
        icon: Phone,
      },
    ],
  },
];

const PAGE_COPY = {
  mumbai: {
    title: "Before you book.",
    eyebrow: "FAQ",
    summary:
      "Browse our FAQs to get all your doubts cleared before you book—so you know exactly what to expect from your class.",
  },
  bengaluru: {
    title: "Before you book Bengaluru",
    eyebrow: "Bengaluru FAQ",
    summary:
      "Browse our FAQs to get all your doubts cleared before you book—so you know exactly what to expect from your class.",
  },
} as const;

function FAQPage() {
  const { studio } = Route.useSearch();
  const isBengaluru = studio === "bengaluru";
  const categories = isBengaluru ? BENGALURU_CATEGORIES : MUMBAI_CATEGORIES;
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
        <div className="mb-14 grid gap-8 rounded-[2rem] border border-[#ececf1] bg-white p-8 md:grid-cols-[0.8fr_1.2fr] md:items-end md:p-10 shadow-[0_20px_60px_-36px_rgb(0_0_0/0.35)]">
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

        <Accordion type="single" collapsible className="space-y-14">
          {categories.map((category, categoryIndex) => {
            const CategoryIcon = category.icon;
            return (
              <section key={category.title}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6732f5] to-[#a78bfa] text-white shadow-[0_8px_20px_-8px_rgb(103_50_245/0.65)]">
                    <CategoryIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-primary-deep">
                    {category.title}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#e6e0f7] to-transparent" />
                </div>

                <div className="grid gap-4">
                  {category.items.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <AccordionItem
                        key={f.q}
                        value={`${categoryIndex}-${i}`}
                        style={{ animationDelay: `${i * 60}ms` }}
                        className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-both overflow-hidden rounded-[1.35rem] border border-[#e6e0f7] bg-white shadow-[0_18px_50px_-34px_rgb(39_23_84/0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c8bef4] hover:shadow-[0_24px_60px_-30px_rgb(39_23_84/0.55)] data-[state=open]:border-[#6732f5]/50 data-[state=open]:shadow-[0_24px_60px_-28px_rgb(103_50_245/0.4)]"
                      >
                        <AccordionTrigger className="w-full justify-start gap-4 bg-[#f9f7fe] px-5 py-5 text-left text-base font-semibold transition-colors duration-300 hover:bg-[#f2ecfd] hover:no-underline group-data-[state=open]:bg-[#f2ecfd] md:text-lg [&>svg]:ml-auto">
                          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#6732f5] shadow-inner shadow-white/50 transition-all duration-300 group-hover:scale-105 group-data-[state=open]:scale-105 group-data-[state=open]:bg-[#6732f5] group-data-[state=open]:text-white group-data-[state=open]:shadow-[0_8px_18px_-6px_rgb(103_50_245/0.6)]">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="text-left">{f.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="bg-white pb-6 pl-0 pt-5 text-sm leading-7 text-muted-foreground md:pl-[3.5rem] md:pr-5 md:text-[0.98rem]">
                          <span className="block pl-5 md:pl-0">{f.a}</span>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </Accordion>
      </main>
      <Footer studioVariant={isBengaluru ? "bengaluru" : "mumbai"} />
    </div>
  );
}
