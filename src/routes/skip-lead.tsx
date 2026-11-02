import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";

export const Route = createFileRoute("/skip-lead")({
  head: () => ({
    meta: [
      { title: "Physique 57 India - Discover the workout everyone talks about." },
      {
        name: "description",
        content:
          "Sculpt, strengthen, and energize your body in just 57 minutes. Sign up below to get started.",
      },
      {
        property: "og:title",
        content: "Physique 57 India - Discover the workout everyone talks about.",
      },
      {
        property: "og:description",
        content:
          "Book your first 57-minute Barre 57 class at Physique 57 in Mumbai.",
      },
    ],
  }),
  component: SkipLeadLanding,
});

function SkipLeadLanding() {
  return <OpenBarreLanding captureLead={false} routeSource="skip-lead" />;
}
