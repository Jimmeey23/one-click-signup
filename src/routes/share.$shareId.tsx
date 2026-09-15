import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decodeShareableRoutePayload } from "@/lib/shareable-route";

export const Route = createFileRoute("/share/$shareId")({
  head: ({ params }) => {
    const decoded = decodeShareableRoutePayload(params.shareId);
    const title = decoded?.eventName
      ? `${decoded.eventName} - Physique 57 India`
      : "Physique 57 India";
    return { meta: [{ title }] };
  },
  component: ShareRoutePage,
});

function ShareRoutePage() {
  const { shareId } = Route.useParams();
  const payload = decodeShareableRoutePayload(shareId);
  const fullUrl = typeof window !== "undefined" ? window.location.href : "";

  if (!payload) {
    return (
      <div className="min-h-screen px-6 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold">This route could not be decoded</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The shared URL looks invalid or incomplete.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link to="/route-builder">Create a new route</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{payload.isKids ? "Kids" : "General"}</Badge>
          <Badge variant="outline">{payload.paymentType}</Badge>
          {payload.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight">{payload.eventName}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {(payload.eventDate || "No date") +
              (payload.eventTime ? ` · ${payload.eventTime}` : "")}
            {" · "}
            {payload.studio || "No studio provided"}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Detail label="Instructor" value={payload.instructorName} />
            <Detail label="Class type" value={payload.classType} />
            <Detail label="Lead source" value={payload.leadSource} />
            <Detail label="Source Id" value={payload.sourceId} />
            <Detail label="UTM source" value={payload.utmSource} />
            <Detail label="UTM campaign" value={payload.utmCampaign} />
            <Detail label="Session link" value={payload.sessionLink || "Add after signup"} />
            <Detail
              label="Class booked on signup"
              value={payload.sessionLabel || "None — signup only"}
            />
            <Detail
              label="Membership"
              value={payload.membershipLabel || "Studio default (free trial)"}
            />
            <Detail
              label="Kids consent"
              value={payload.includeKidsConsent ? "Included" : "Not included"}
            />
            <Detail label="Waiver" value={payload.includeWaiver ? "Included" : "Not included"} />
          </div>

          {payload.otherDetails ? (
            <div className="mt-6 rounded-2xl bg-secondary p-4 text-sm leading-relaxed">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Other key details
              </p>
              <p className="mt-2 whitespace-pre-wrap">{payload.otherDetails}</p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <a
                href={`mailto:?subject=${encodeURIComponent(payload.eventName)}&body=${encodeURIComponent(fullUrl)}`}
              >
                Share via email
              </a>
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(fullUrl);
              }}
            >
              Copy link
            </Button>
            <Button asChild>
              <Link to="/signup/$shareId" params={{ shareId }}>
                Open signup form
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/route-builder">Create another</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}
