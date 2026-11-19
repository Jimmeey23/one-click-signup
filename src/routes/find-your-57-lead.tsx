import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import { FindYour57Quiz } from "@/components/FindYour57Quiz";
import groupBarre from "@/assets/landing-group-barre.webp";

const title = "Find your 57 - Physique 57 India";
const description = "4 taps to your perfect class at Physique 57 Supreme HQ, Bandra.";

export const Route = createFileRoute("/find-your-57-lead")({
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
  component: FindYour57LeadPage,
});

function FindYour57LeadPage() {
  return (
    <OpenBarreLanding
      studioVariant="mumbai"
      routeSource="find-your-57-lead"
      // The quiz does its own signup; the landing's partial-lead capture has no fields to watch.
      captureLead={false}
      heroHeadline="4 taps to your perfect workout."
      heroDescription="Answer a few quick taps and we'll match you to your perfect class at Supreme HQ, Bandra - our team will reach out to book you in."
      signupSlot={<FindYour57Quiz leadOnly />}
    />
  );
}
