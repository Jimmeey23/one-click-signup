import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { termsDocument } from "@/lib/legal-content";

export const Route = createFileRoute("/terms")({
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
  return <LegalPage document={termsDocument} />;
}
