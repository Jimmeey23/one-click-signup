import { useEffect, useState } from "react";

type Review = {
  name: string;
  text: string;
  meta?: string;
  rating?: number;
};

const REVIEWS: Review[] = [
  {
    name: "Aanya M.",
    meta: "Barre 57 · Kemps Corner",
    rating: 5,
    text: "57 minutes flies by and yet I feel every muscle I didn't know existed. The instructors push you with real precision - this is the most addictive workout in Mumbai.",
  },
  {
    name: "Karan S.",
    meta: "powerCycle · Bandra",
    rating: 5,
    text: "I've tried every studio in town - nothing comes close to the energy here. The music, the lighting, the trainers - it feels like a club and a workout at once.",
  },
  {
    name: "Priya R.",
    meta: "Cardio Barre · Kemps Corner",
    rating: 5,
    text: "I am stronger, leaner and so much more flexible in 8 weeks. The community is genuinely lovely and supportive. Best decision I made this year.",
  },
  {
    name: "Sneha K.",
    meta: "Mat 57 · Bandra",
    rating: 5,
    text: "Low impact but kicks my butt every single class. I've finally found a routine I actually look forward to.",
  },
  {
    name: "Rohan D.",
    meta: "Strength Lab · Kemps Corner",
    rating: 5,
    text: "Smart programming, great coaches, immaculate studio. The 57-minute format is the right amount of intense and time-efficient.",
  },
  {
    name: "Tanya G.",
    meta: "Barre 57 · Bandra",
    rating: 5,
    text: "Open Barre changed my mornings. I show up sleepy, I leave glowing. Sign your friends up - they'll thank you.",
  },
];

export function ReviewsCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % REVIEWS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const visible = [0, 1, 2].map((offset) => REVIEWS[(idx + offset) % REVIEWS.length]);

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {visible.map((r, i) => (
        <article
          key={`${idx}-${i}`}
          className="bg-card rounded-lg p-6 border border-border shadow-[var(--shadow-card)] animate-fade-in"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Member review
              </p>
              {r.meta && <p className="mt-1 text-sm font-semibold text-foreground">{r.meta}</p>}
            </div>
            <div className="rounded-md bg-[#fff7df] px-2.5 py-1 text-xs font-bold text-[#9d6b00]">
              {(r.rating ?? 5).toFixed(1)}
            </div>
          </div>
          <div
            className="mt-4 text-sm tracking-[0.18em] text-[#d8a016]"
            aria-label={`${r.rating ?? 5} out of 5 stars`}
          >
            {"★".repeat(r.rating ?? 5)}
          </div>
          <p className="mt-3 text-foreground leading-relaxed text-[15px]">"{r.text}"</p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="font-bold text-sm">{r.name}</p>
            <span className="h-1.5 w-10 rounded-full bg-[#d73b2f]" aria-hidden="true" />
          </div>
        </article>
      ))}
    </div>
  );
}
