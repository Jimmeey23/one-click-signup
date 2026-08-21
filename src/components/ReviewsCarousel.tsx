import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";

type Review = {
  name: string;
  text: string;
  meta?: string;
  rating?: number;
  profileImage?: string | null;
};

type MomenceReview = {
  id: number;
  comment: string;
  grade: number;
  reviewerName: string;
  reviewerProfileImage?: string | null;
  sessionName?: string | null;
  teacherFullName?: string | null;
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

function initialFor(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

const VISIBLE_DESKTOP = 3;
const BENGALURU_REVIEWS_URL =
  "https://api.momence.com/host-plugins/host/33905/reviews?pageSize=12&page=0&isFullLastNameVisible=false&isTextOnlyEnabled=true&isSessionAndTeacherInfoEnabled=true&s=959604fd4a03ccec0aaf901acf989c81a4ce3ab9a7e4e4325f0dc469ac918f94";

export function ReviewsCarousel({
  studioVariant = "mumbai",
}: {
  studioVariant?: "mumbai" | "bengaluru";
}) {
  const [bengaluruReviews, setBengaluruReviews] = useState<Review[]>([]);
  const [reviewsFailed, setReviewsFailed] = useState(false);
  const reviews = studioVariant === "bengaluru" ? bengaluruReviews : REVIEWS;
  const isBengaluru = studioVariant === "bengaluru";
  // Extra copies of the deck appended so the track always has cards to slide in from the right.
  const track = [...reviews, ...reviews.slice(0, VISIBLE_DESKTOP)];
  const [step, setStep] = useState(0);
  const [animated, setAnimated] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (studioVariant !== "bengaluru") return;
    const controller = new AbortController();
    fetch(BENGALURU_REVIEWS_URL, {
      headers: { "x-origin": window.location.origin },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Momence reviews failed (${response.status})`);
        return response.json() as Promise<{ payload?: MomenceReview[] }>;
      })
      .then(({ payload = [] }) => {
        setBengaluruReviews(
          payload.map((review) => ({
            name: review.reviewerName,
            text: review.comment,
            meta: [review.sessionName, review.teacherFullName?.trim()]
              .filter(Boolean)
              .join(" · "),
            rating: review.grade,
            profileImage: review.reviewerProfileImage,
          })),
        );
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setReviewsFailed(true);
      });
    return () => controller.abort();
  }, [studioVariant]);

  useEffect(() => {
    if (reviews.length === 0) return;
    const t = setInterval(() => setStep((s) => s + 1), 4500);
    return () => clearInterval(t);
  }, [reviews.length]);

  function handleTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== trackRef.current || event.propertyName !== "transform") return;
    if (step < reviews.length) return;
    // Loop seamlessly: jump back to the equivalent frame with no transition, then re-enable it.
    setAnimated(false);
    setStep((s) => s % reviews.length);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
  }

  if (studioVariant === "bengaluru" && reviews.length === 0) {
    return reviewsFailed ? (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Reviews are temporarily unavailable. Please try again shortly.
      </p>
    ) : (
      <div className="grid gap-4 md:grid-cols-3" aria-label="Loading member reviews">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-52 animate-pulse rounded-[1.5rem] border border-border/80 bg-card"
          />
        ))}
      </div>
    );
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
            className={`group w-full shrink-0 basis-full md:basis-1/3 ${
              isBengaluru ? "px-1.5 sm:px-2.5" : "px-2"
            }`}
            aria-hidden={i < step || i >= step + VISIBLE_DESKTOP}
          >
            <div
              className={`relative flex h-full min-h-[220px] flex-col overflow-hidden p-5 transition duration-300 ease-out hover:-translate-y-0.5 ${
                isBengaluru
                  ? "rounded-[1.4rem] border border-black/[0.06] bg-white/95 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.32)] ring-1 ring-white/80 hover:border-primary/30 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)]"
                  : "rounded-[1.35rem] border border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.05] shadow-[0_14px_38px_-30px_rgba(15,23,42,0.42)] hover:border-primary/35 hover:shadow-[0_20px_45px_-30px_rgba(15,23,42,0.46)]"
              }`}
            >
              <span
                className={`absolute top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                  isBengaluru ? "inset-x-5 via-primary-deep/80" : "inset-x-8 via-primary/70"
                }`}
                aria-hidden="true"
              />

              <div className="flex items-center justify-between gap-4">
                <div
                  className={`flex items-center ${
                    isBengaluru
                      ? "gap-1.5 rounded-full border border-[#e5a900]/15 bg-[#e5a900]/[0.07] px-2.5 py-1"
                      : "gap-1"
                  }`}
                  aria-label={`${r.rating ?? 5} out of 5 stars`}
                >
                  {isBengaluru && (
                    <span className="text-[11px] font-bold tabular-nums text-[#9a7200]">
                      {(r.rating ?? 5).toFixed(1)}
                    </span>
                  )}
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`${isBengaluru ? "h-3 w-3" : "h-3.5 w-3.5"} ${
                        starIdx < (r.rating ?? 5)
                          ? "fill-[#E5A900] text-[#E5A900]"
                          : "fill-border text-border"
                      }`}
                    />
                ))}
                </div>
                <span
                  className={
                    isBengaluru
                      ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.12]"
                      : undefined
                  }
                >
                  <Quote
                    className={`${isBengaluru ? "h-4 w-4" : "h-5 w-5"} fill-primary/10 text-primary-deep/45`}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
              </div>

              <blockquote className="mt-3.5 flex-1">
                <p
                  className={`text-sm leading-6 ${
                    isBengaluru
                      ? "font-medium tracking-[-0.01em] text-foreground/80"
                      : "text-foreground/85"
                  }`}
                >
                  “{r.text}”
                </p>
              </blockquote>

              <div
                className={`mt-4 flex items-center gap-2.5 border-t pt-3.5 ${
                  isBengaluru ? "border-black/[0.06]" : "border-border/65"
                }`}
              >
                {r.profileImage ? (
                  <img
                    src={r.profileImage}
                    alt=""
                    className={`h-9 w-9 shrink-0 rounded-full object-cover ${
                      isBengaluru
                        ? "ring-2 ring-primary/15"
                        : "ring-1 ring-border"
                    }`}
                    loading="lazy"
                  />
                ) : (
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-primary/10 ${
                      isBengaluru
                        ? "bg-gradient-to-br from-primary-deep to-[#176f91] text-white"
                        : "bg-foreground text-background"
                    }`}
                    aria-hidden="true"
                  >
                    {initialFor(r.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
                    {r.name}
                  </p>
                  {r.meta && (
                    <p
                      className={`mt-0.5 truncate text-[11px] text-muted-foreground ${
                        isBengaluru ? "font-medium" : "uppercase tracking-[0.08em]"
                      }`}
                    >
                      {r.meta}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
