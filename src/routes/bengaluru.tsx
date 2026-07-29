import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import groupBarre from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";

const bengaluruHead = () => ({
  meta: [
    { title: "Physique 57 Bengaluru - First class 50% off" },
    {
      name: "description",
      content:
        "Book your first Barre class in Bengaluru at 50% off. Sign up below to get started.",
    },
    {
      property: "og:title",
      content: "Physique 57 Bengaluru - First class 50% off",
    },
    {
      property: "og:description",
      content:
        "Sign up for Bengaluru studios and claim 50% off your first Barre class.",
    },
    { property: "og:image", content: groupBarre },
    { name: "twitter:image", content: groupBarre },
  ],
});

export const Route = createFileRoute("/bengaluru")({
  head: bengaluruHead,
  component: () => <OpenBarreLanding studioVariant="bengaluru" routeSource="bengaluru" />,
});
