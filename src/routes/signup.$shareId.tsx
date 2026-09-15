import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import { decodeShareableRoutePayload } from "@/lib/shareable-route";

export const Route = createFileRoute("/signup/$shareId")({
  component: SignupRoutePage,
});

function SignupRoutePage() {
  const { shareId } = Route.useParams();
  const payload = decodeShareableRoutePayload(shareId);

  if (!payload) {
    return <div className="p-8 text-sm text-muted-foreground">Invalid signup route.</div>;
  }

  const params = new URLSearchParams();
  if (payload.eventName) params.set("eventName", payload.eventName);
  if (payload.classType) params.set("classType", payload.classType);
  if (payload.studio) params.set("center", payload.studio);
  if (payload.leadSource) params.set("utm_medium", payload.leadSource);
  if (payload.utmSource) params.set("utm_source", payload.utmSource);
  if (payload.utmCampaign) params.set("utm_campaign", payload.utmCampaign);
  if (payload.isKids) params.set("isKids", "true");
  if (payload.includeKidsConsent) params.set("kidsConsent", "true");
  if (payload.includeWaiver) params.set("waiverAccepted", "true");

  return (
    <OpenBarreLanding
      captureLead={payload.paymentType !== "free"}
      routeSource={payload.isKids ? "kids" : payload.leadSource || "signup-builder"}
      studioVariant="mumbai"
      heroImageUrl={payload.heroImageUrl || undefined}
      heroImageFallback={payload.heroImagePreset || undefined}
      initialSearch={params.toString()}
      isKidsRoute={payload.isKids}
    />
  );
}
