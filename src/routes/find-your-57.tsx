import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import { FindYour57Quiz } from "@/components/FindYour57Quiz";
import groupBarre from "@/assets/landing-group-barre.webp";

const title = "Find your 57 - Physique 57 India";
const description = "4 taps. Your match, your studio, your free class.";

export const Route = createFileRoute("/find-your-57")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: groupBarre },
      { name: "twitter:image", content: groupBarre },
    ],
  }),
  component: FindYour57Page,
});

function FindYour57Page() {
  return (
    <OpenBarreLanding
      studioVariant="mumbai"
      routeSource="find-your-57"
      // The quiz does its own signup; the landing's partial-lead capture has no fields to watch.
      captureLead={false}
      heroHeadline="Find your 57."
      heroDescription="Answer 4 quick taps and we'll match you to your perfect class, studio and free first session."
      signupSlot={<FindYour57Quiz />}
    />
  );
}
