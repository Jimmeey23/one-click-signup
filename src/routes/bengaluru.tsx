import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import bengaluruInstructors from "@/assets/images/bengaluru-instructors-candid.png";

const title = "Physique 57 Bengaluru - Find your next class";
const description =
  "Explore Physique 57 Bengaluru studios, discover upcoming classes, and book the session that fits you.";

const bengaluruHead = () => ({
  meta: [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: bengaluruInstructors },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: bengaluruInstructors },
  ],
});

export const Route = createFileRoute("/bengaluru")({
  head: bengaluruHead,
  component: BengaluruPage,
});

function BengaluruPage() {
  return <OpenBarreLanding studioVariant="bengaluru" routeSource="bengaluru" />;
}
