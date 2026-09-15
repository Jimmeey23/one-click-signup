import { KidsLanding } from "@/components/KidsLanding";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import type { ShareableRoutePayload } from "@/lib/shareable-route";

/**
 * Renders a route built in the Route Builder. Shared by the encoded /signup/<token> link
 * and the readable /<slug> link so the two can never drift apart.
 */
export function ShareableRouteLanding({ payload }: { payload: ShareableRoutePayload }) {
  if (payload.isKids) {
    return (
      <KidsLanding
        lockedLocationId={payload.homeLocationId || undefined}
        hideBatchSelection={!payload.includeBatches}
        customBatches={payload.customBatches.length ? payload.customBatches : undefined}
        sessionId={payload.sessionId || undefined}
        sessionLabel={payload.sessionLabel || undefined}
        membershipId={payload.membershipId || undefined}
        heroTitle={payload.eventName || undefined}
        formTitle={payload.eventName ? `Book ${payload.eventName}` : undefined}
        formDescription={payload.otherDetails || undefined}
        heroImages={payload.heroImageUrl ? [payload.heroImageUrl] : undefined}
        routeSource={payload.leadSource || "kids"}
        utmSource={payload.utmSource || undefined}
        utmCampaign={payload.utmCampaign || undefined}
      />
    );
  }

  const params = new URLSearchParams();
  if (payload.eventName) params.set("eventName", payload.eventName);
  if (payload.classType) params.set("classType", payload.classType);
  if (payload.homeLocationId) params.set("homeLocationId", String(payload.homeLocationId));
  else if (payload.studio) params.set("center", payload.studio);
  if (payload.leadSource) params.set("utm_medium", payload.leadSource);
  if (payload.utmSource) params.set("utm_source", payload.utmSource);
  if (payload.utmCampaign) params.set("utm_campaign", payload.utmCampaign);
  if (payload.includeWaiver) params.set("waiverAccepted", "true");

  return (
    <OpenBarreLanding
      captureLead={payload.paymentType !== "free"}
      routeSource={payload.leadSource || "signup-builder"}
      studioVariant={payload.studioVariant}
      heroImageUrl={payload.heroImageUrl || undefined}
      initialSearch={params.toString()}
      routeMembershipId={payload.membershipId || undefined}
      routeSessionId={payload.sessionId || undefined}
    />
  );
}
