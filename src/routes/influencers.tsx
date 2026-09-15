import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";

export const Route = createFileRoute("/influencers")({
  head: () => ({
    meta: [
      { title: "Physique 57 India - Influencers" },
      {
        name: "description",
        content: "Influencer lead entry point for Physique 57 India bookings and partnerships.",
      },
    ],
  }),
  component: InfluencerLanding,
});

function InfluencerLanding() {
  return <OpenBarreLanding captureLead routeSource="influencers" studioVariant="mumbai" />;
}
