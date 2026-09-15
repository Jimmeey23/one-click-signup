import { createFileRoute } from "@tanstack/react-router";
import { KidsLanding } from "@/components/KidsLanding";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "Physique 57 India - Juniors" },
      {
        name: "description",
        content:
          "Physique 57 Juniors: a strength, balance and agility program for young movers aged 9 to 13. Book your child's first session.",
      },
    ],
  }),
  component: KidsRoutePage,
});

function KidsRoutePage() {
  return <KidsLanding routeSource="website kids" />;
}
