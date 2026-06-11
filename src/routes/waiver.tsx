import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { LegalDocumentArticle } from "@/components/LegalPage";
import { membershipWaiverDocument, waiverDocument } from "@/lib/legal-content";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/waiver")({
  head: () => ({
    meta: [
      { title: "Waiver - Physique 57 India" },
      {
        name: "description",
        content: "Waiver and membership waiver terms for Physique 57 India.",
      },
    ],
  }),
  component: WaiverPage,
});

function WaiverPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] text-foreground">
      <header className="border-b border-[#d9d9d2] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-10 w-auto" />
          </Link>
        </div>
      </header>
      <LegalDocumentArticle document={waiverDocument} />
      <div className="border-t border-[#d9d9d2]">
        <LegalDocumentArticle document={membershipWaiverDocument} />
      </div>
      <Footer />
    </div>
  );
}
