import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import groupBarre from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";

const landingHead = () => ({
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
    { property: "og:image", content: groupBarre },
    { name: "twitter:image", content: groupBarre },
  ],
});

export const Route = createFileRoute("/")({
  head: landingHead,
  component: OpenBarreLanding,
});
