import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { decodeShareableRoutePayload, type ShareableRoutePayload } from "./shareable-route";
import { isReservedSlug } from "./route-slug";

// The generated Database types carry no tables yet, so the table is addressed by name and
// the row shape is asserted here instead of inferred.
type ShareableRouteRow = {
  slug: string;
  payload: unknown;
  event_name: string;
};

const TABLE = "shareable_routes";

// The generated Database type is still empty (no migrations had been applied when it was
// produced), so the typed client refuses an unknown table name. Address this one table
// through an untyped view of the same client and assert the row shape locally.
type UntypedFrom = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => { maybeSingle: <T>() => Promise<{ data: T | null; error: { message: string } | null }> };
    };
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
};

// Reads go through the publishable key and the table's public select policy, so a shared
// link opens with the keys the app already has. Only publishing needs the service role.
const routeReader = supabase as unknown as UntypedFrom;
const routeWriter = supabaseAdmin as unknown as UntypedFrom;

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
  error: string | null;
};

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
        error: `/${data.slug} is a page on the site already.`,
      };
    }

    try {
      const { error } = await routeWriter.from(TABLE).upsert(
        {
          slug: data.slug,
          payload: { token: data.token },
          event_name: data.eventName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      );

      if (error) {
        return { saved: false, slug: data.slug, error: error.message };
      }
      return { saved: true, slug: data.slug, error: null };
    } catch (error) {
      return {
        saved: false,
        slug: data.slug,
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
      const { data: row, error } = await routeReader
        .from(TABLE)
        .select("slug, payload, event_name")
        .eq("slug", data.slug)
        .maybeSingle<ShareableRouteRow>();

      if (error || !row) return { found: false, token: null, payload: null };

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
      const { data: row } = await routeReader
        .from(TABLE)
        .select("slug")
        .eq("slug", data.slug)
        .maybeSingle<{ slug: string }>();
      return row
        ? { available: false, reason: `/${data.slug} is already in use. Saving will replace it.` }
        : { available: true, reason: null };
    } catch {
      // Availability is a convenience; a store that cannot be reached must not block the
      // builder, and the save itself reports the real error.
      return { available: true, reason: null };
    }
  });
