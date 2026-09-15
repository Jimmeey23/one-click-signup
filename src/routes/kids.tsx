import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "Physique 57 India - Kids" },
      {
        name: "description",
        content: "Kids trial and Juniors booking entry point for Physique 57 India.",
      },
    ],
  }),
  component: KidsLanding,
});

function KidsLanding() {
  return <OpenBarreLanding captureLead routeSource="kids" studioVariant="mumbai" isKidsRoute />;
}
