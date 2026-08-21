import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

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

const AVATAR_COLORS = ["#1a73e8", "#d93025", "#f9ab00", "#188038", "#8430ce", "#e37400"];

function avatarColorFor(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initialFor(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

const VISIBLE_DESKTOP = 3;
const BENGALURU_EXCLUDED_METAS = ["powerCycle", "Strength Lab"];
const BENGALURU_REVIEWS = REVIEWS.filter(
  (r) => !BENGALURU_EXCLUDED_METAS.some((excluded) => r.meta?.includes(excluded)),
);

export function ReviewsCarousel({
  studioVariant = "mumbai",
}: {
  studioVariant?: "mumbai" | "bengaluru";
}) {
  const reviews = studioVariant === "bengaluru" ? BENGALURU_REVIEWS : REVIEWS;
  // Extra copies of the deck appended so the track always has cards to slide in from the right.
  const track = [...reviews, ...reviews.slice(0, VISIBLE_DESKTOP)];
  const [step, setStep] = useState(0);
  const [animated, setAnimated] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => s + 1), 4500);
    return () => clearInterval(t);
  }, []);

  function handleTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== trackRef.current || event.propertyName !== "transform") return;
    if (step < reviews.length) return;
    // Loop seamlessly: jump back to the equivalent frame with no transition, then re-enable it.
    setAnimated(false);
    setStep((s) => s % reviews.length);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
  }

  return (
    <div className="overflow-hidden">
      <div
        ref={trackRef}
        onTransitionEnd={handleTransitionEnd}
        className="flex [--n:1] md:[--n:3]"
        style={{
          transform: `translateX(calc(${step} * (-100% / var(--n))))`,
          transition: animated ? "transform 700ms cubic-bezier(0.65,0,0.35,1)" : "none",
        }}
      >
        {track.map((r, i) => (
          <article
            key={i}
            className="group w-full shrink-0 basis-full px-2 md:basis-1/3"
            aria-hidden={i < step || i >= step + VISIBLE_DESKTOP}
          >
            <div className="h-full rounded-[1.5rem] border border-border/80 bg-card p-6 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white ring-4 ring-primary/10"
                  style={{ backgroundColor: avatarColorFor(r.name) }}
                  aria-hidden="true"
                >
                  {initialFor(r.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#202124]">{r.name}</p>
                  {r.meta && <p className="truncate text-xs text-[#70757a]">{r.meta}</p>}
                </div>
              </div>

              <div
                className="mt-2.5 flex items-center gap-0.5"
                aria-label={`${r.rating ?? 5} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, starIdx) => (
                  <Star
                    key={starIdx}
                    className={`h-3.5 w-3.5 ${
                      starIdx < (r.rating ?? 5)
                        ? "fill-[#fbbc04] text-[#fbbc04]"
                        : "fill-[#e8eaed] text-[#e8eaed]"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-3 text-sm leading-6 text-[#3c4043]">{r.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
