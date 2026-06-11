import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "./index";

export const Route = createFileRoute("/skip-lead")({
  head: () => ({
    meta: [
      { title: "Physique 57 India - Discover the workout everyone talks about." },
      {
        name: "description",
        content:
          "Your first Barre 57 class is complimentary. Sculpt, strengthen, and energize your body in just 57 minutes. Sign up below to get started.",
      },
      {
        property: "og:title",
        content: "Physique 57 India - Discover the workout everyone talks about.",
      },
      {
        property: "og:description",
        content:
          "Activate your complimentary Open Barre membership and book your first 57-minute class in Mumbai.",
      },
    ],
  }),
  component: SkipLeadLanding,
});

function SkipLeadLanding() {
  return <OpenBarreLanding captureLead={false} />;
}
