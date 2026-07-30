import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LegalPage } from "@/components/LegalPage";
import { privacyDocument } from "@/lib/legal-content";

const searchSchema = z.object({
  studio: z.enum(["mumbai", "bengaluru"]).optional(),
});

export const Route = createFileRoute("/privacy")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Privacy Policy - Physique 57 India" },
      {
        name: "description",
        content: "Privacy Policy and personal information consent terms for Physique 57 India.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { studio } = Route.useSearch();
  const isBengaluru = studio === "bengaluru";
  return (
    <LegalPage
      document={privacyDocument}
      studioVariant={isBengaluru ? "bengaluru" : "mumbai"}
    />
  );
}
