import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LegalPage } from "@/components/LegalPage";
import { bengaluruTermsDocument, termsDocument } from "@/lib/legal-content";

const searchSchema = z.object({
  studio: z.enum(["mumbai", "bengaluru"]).optional(),
});

export const Route = createFileRoute("/terms")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Terms and Conditions - Physique 57 India" },
      {
        name: "description",
        content:
          "Terms and Conditions for Physique 57 India bookings, memberships, and studio use.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { studio } = Route.useSearch();
  const isBengaluru = studio === "bengaluru";
  return (
    <LegalPage
      document={isBengaluru ? bengaluruTermsDocument : termsDocument}
      studioVariant={isBengaluru ? "bengaluru" : "mumbai"}
    />
  );
}
