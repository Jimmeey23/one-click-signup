import { createFileRoute } from "@tanstack/react-router";
import { ShareableRouteLanding } from "@/components/ShareableRouteLanding";
import { decodeShareableRoutePayload } from "@/lib/shareable-route";

export const Route = createFileRoute("/signup/$shareId")({
  head: ({ params }) => {
    const decoded = decodeShareableRoutePayload(params.shareId);
    const title = decoded?.eventName
      ? `${decoded.eventName} - Physique 57 India`
      : "Physique 57 India";
    return { meta: [{ title }] };
  },
  component: SignupRoutePage,
});

function SignupRoutePage() {
  const { shareId } = Route.useParams();
  const payload = decodeShareableRoutePayload(shareId);

  if (!payload) {
    return <div className="p-8 text-sm text-muted-foreground">Invalid signup route.</div>;
  }

  return <ShareableRouteLanding payload={payload} />;
}
