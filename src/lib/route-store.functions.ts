import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { decodeShareableRoutePayload, type ShareableRoutePayload } from "./shareable-route";
import { isReservedSlug } from "./route-slug";

const TABLE = "shareable_routes";

type ShareableRouteRow = {
  slug: string;
  payload: unknown;
  event_name: string;
};

// PostgREST is called directly rather than through supabase-js: the SDK builds a Realtime
// client on construction, which throws on Node 20 for want of a native WebSocket. The
// publishable key is used either way, so the table's row-level policies still apply - a
// public read, a validated insert, and no update or delete at all.
function routeStoreConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

async function routeStoreFetch(path: string, init?: RequestInit) {
  const config = routeStoreConfig();
  if (!config) {
    throw new Error("The route store is not configured (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).");
  }
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

const SaveInput = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  token: z.string().min(4).max(8000),
  eventName: z.string().max(200).default(""),
});

export type SaveNamedRouteResult = {
  saved: boolean;
  slug: string;
  /** The slug is already published; the caller should try another name. */
  taken: boolean;
  error: string | null;
};

function routeStoreMessage(status: number, body: string): string {
  if (status === 404 || /relation .* does not exist/i.test(body)) {
    return "The shareable_routes table does not exist yet. Apply the migration in supabase/migrations.";
  }
  if (status === 401 || status === 403) {
    return "The route store rejected the key. Check the insert policy on shareable_routes.";
  }
  try {
    const parsed = JSON.parse(body) as { message?: string; hint?: string };
    return parsed.message || parsed.hint || `Route store error ${status}`;
  } catch {
    return `Route store error ${status}`;
  }
}

/**
 * Publishes a route at a readable path. The encoded token is stored alongside so the
 * pretty path and the /signup/<token> link always resolve to exactly the same route.
 */
export const saveNamedRoute = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveInput.parse(input))
  .handler(async ({ data }): Promise<SaveNamedRouteResult> => {
    if (isReservedSlug(data.slug)) {
      return {
        saved: false,
        slug: data.slug,
        taken: true,
        error: `/${data.slug} is a page on the site already.`,
      };
    }

    try {
      const response = await routeStoreFetch(TABLE, {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          slug: data.slug,
          payload: { token: data.token },
          event_name: data.eventName,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          saved: false,
          slug: data.slug,
          taken: response.status === 409 || /duplicate key|already exists/i.test(body),
          error: routeStoreMessage(response.status, body),
        };
      }
      return { saved: true, slug: data.slug, taken: false, error: null };
    } catch (error) {
      return {
        saved: false,
        slug: data.slug,
        taken: false,
        error: error instanceof Error ? error.message : "Could not reach the route store",
      };
    }
  });

const LoadInput = z.object({ slug: z.string().trim().min(1).max(60) });

export type LoadNamedRouteResult = {
  found: boolean;
  token: string | null;
  payload: ShareableRoutePayload | null;
};

export const loadNamedRoute = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LoadInput.parse(input))
  .handler(async ({ data }): Promise<LoadNamedRouteResult> => {
    try {
      const response = await routeStoreFetch(
        `${TABLE}?slug=eq.${encodeURIComponent(data.slug)}&select=slug,payload,event_name&limit=1`,
      );
      if (!response.ok) return { found: false, token: null, payload: null };

      const rows = (await response.json()) as ShareableRouteRow[];
      const row = rows[0];
      if (!row) return { found: false, token: null, payload: null };

      const token = (row.payload as { token?: string } | null)?.token ?? null;
      if (!token) return { found: false, token: null, payload: null };

      return { found: true, token, payload: decodeShareableRoutePayload(token) };
    } catch {
      return { found: false, token: null, payload: null };
    }
  });

const AvailabilityInput = z.object({ slug: z.string().trim().min(1).max(60) });

export const checkSlugAvailable = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AvailabilityInput.parse(input))
  .handler(async ({ data }): Promise<{ available: boolean; reason: string | null }> => {
    if (isReservedSlug(data.slug)) {
      return { available: false, reason: `/${data.slug} is a page on the site already.` };
    }
    try {
      const response = await routeStoreFetch(
        `${TABLE}?slug=eq.${encodeURIComponent(data.slug)}&select=slug&limit=1`,
      );
      if (!response.ok) return { available: true, reason: null };
      const rows = (await response.json()) as Array<{ slug: string }>;
      return rows.length
        ? {
            available: false,
            reason: `/${data.slug} is taken. This route will publish at /${data.slug}-2.`,
          }
        : { available: true, reason: null };
    } catch {
      // Availability is a convenience; a store that cannot be reached must not block the
      // builder, and the save itself reports the real error.
      return { available: true, reason: null };
    }
  });
