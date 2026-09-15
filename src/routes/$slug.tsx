import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ShareableRouteLanding } from "@/components/ShareableRouteLanding";
import { loadNamedRoute } from "@/lib/route-store.functions";
import type { ShareableRoutePayload } from "@/lib/shareable-route";

/**
 * A route published from the Route Builder under its own name, e.g. /battle-school. Static
 * pages such as /kids and /contact rank above this one, so they keep working.
 */
export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const result = await loadNamedRoute({ data: { slug: params.slug } });
    if (!result.found || !result.payload) throw notFound();
    return { payload: result.payload };
  },
  head: ({ loaderData }) => {
    const eventName = (loaderData as { payload?: ShareableRoutePayload } | undefined)?.payload
      ?.eventName;
    return {
      meta: [{ title: eventName ? `${eventName} - Physique 57 India` : "Physique 57 India" }],
    };
  },
  notFoundComponent: RouteNotFound,
  component: NamedRoutePage,
});

function NamedRoutePage() {
  const { payload } = Route.useLoaderData();
  return <ShareableRouteLanding payload={payload} />;
}

function RouteNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">No route at /{slug}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This link may have been renamed or removed. Check the link, or book from the main
          schedule.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Go to Physique 57
        </Link>
      </div>
    </div>
  );
}
