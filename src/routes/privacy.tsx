import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { privacyDocument } from "@/lib/legal-content";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Physique 57 India" },
      {
        name: "description",
        content: "Privacy Policy and personal information consent terms for Physique 57 India.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage document={privacyDocument} />;
}
