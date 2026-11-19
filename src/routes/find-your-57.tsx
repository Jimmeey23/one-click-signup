import { createFileRoute } from "@tanstack/react-router";
import { FindYour57Quiz } from "@/components/FindYour57Quiz";

const title = "Find your 57 - Physique 57 India";
const description = "4 taps. Your match, your studio, your free class.";

export const Route = createFileRoute("/find-your-57")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: FindYour57Quiz,
});
