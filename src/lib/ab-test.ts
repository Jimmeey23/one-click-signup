// Landing page headline/CTA A/B split. Variant is assigned once per browser
// (persisted in localStorage) so a returning visitor always sees the same
// copy, and can be forced with ?variant=a / ?variant=b for QA.

export type Variant = "a" | "b";

const STORAGE_KEY = "p57_variant";

export function getVariant(): Variant {
  if (typeof window === "undefined") return "a";

  const forced = new URLSearchParams(window.location.search).get("variant");
  if (forced === "a" || forced === "b") return forced;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "a" || stored === "b") return stored;

    const assigned: Variant = Math.random() < 0.5 ? "a" : "b";
    window.localStorage.setItem(STORAGE_KEY, assigned);
    return assigned;
  } catch {
    return "a";
  }
}

export const VARIANT_COPY: Record<Variant, { headline: string; ctaLabel: string }> = {
  a: {
    headline: "", // falls back to the rotating HERO_QUOTES pool
    ctaLabel: "Activate Your Trial",
  },
  b: {
    headline: "",
    ctaLabel: "Claim My Trial Class",
  },
};
