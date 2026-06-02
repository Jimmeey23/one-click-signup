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
    text: "57 minutes flies by and yet I feel every muscle I didn't know existed. The instructors push you with real precision — this is the most addictive workout in Mumbai.",
  },
  {
    name: "Karan S.",
    meta: "powerCycle · Bandra",
    rating: 5,
    text: "I've tried every studio in town — nothing comes close to the energy here. The music, the lighting, the trainers — it feels like a club and a workout at once.",
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
    text: "Open Barre changed my mornings. I show up sleepy, I leave glowing. Sign your friends up — they'll thank you.",
  },
];

export function ReviewsCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % REVIEWS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const visible = [0, 1, 2].map(
    (offset) => REVIEWS[(idx + offset) % REVIEWS.length],
  );

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {visible.map((r, i) => (
        <article
          key={`${idx}-${i}`}
          className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] animate-fade-in"
        >
          <div className="text-primary-deep text-sm tracking-widest mb-2">
            {"★".repeat(r.rating ?? 5)}
          </div>
          <p className="text-foreground leading-relaxed text-[15px]">
            "{r.text}"
          </p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="font-bold text-sm">{r.name}</p>
            {r.meta && (
              <p className="text-xs text-muted-foreground">{r.meta}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
