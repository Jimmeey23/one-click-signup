/**
 * Turns an event name into the path a route is shared at: "Battle School" -> battle-school,
 * "Ayesha Mehta" -> ayesha-mehta.
 */
export function slugifyRouteName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Paths the app already serves. A route may not take one of these, or it would shadow a
// real page - the studio's own /kids and /contact must keep working.
export const RESERVED_SLUGS = new Set([
  "about",
  "bengaluru",
  "classes",
  "classes-info",
  "contact",
  "faq",
  "influencers",
  "kids",
  "privacy",
  "route-builder",
  "schedule",
  "share",
  "signup",
  "skip-lead",
  "terms",
  "waiver",
  "api",
  "assets",
  "p57-assets",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
