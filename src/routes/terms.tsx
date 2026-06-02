import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Physique 57 India" },
      { name: "description", content: "Terms of Service for Physique 57 India." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5"><Link to="/"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link></div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-16 space-y-4 leading-relaxed">
        <h1 className="font-display text-5xl mb-6">Terms of Service</h1>
        <p>By using Physique 57 India's services, classes, and digital platforms, you agree to abide by these Terms of Service.</p>
        <h2 className="font-display text-2xl mt-8 mb-3">Membership</h2>
        <p>All memberships are non-transferable. Memberships may be paused for up to 30 days per year with prior notice.</p>
        <h2 className="font-display text-2xl mt-8 mb-3">Bookings & Cancellations</h2>
        <p>Bookings must be cancelled at least 4 hours prior to class (6 hours for powerCycle). Late cancellations and no-shows may incur a fee.</p>
        <h2 className="font-display text-2xl mt-8 mb-3">Liability</h2>
        <p>You acknowledge that participation in fitness classes carries inherent risk. By signing our waiver, you assume full responsibility for any injury.</p>
        <h2 className="font-display text-2xl mt-8 mb-3">Conduct</h2>
        <p>We expect all members to treat staff, instructors and fellow members with respect.</p>
      </article>
      <Footer />
    </div>
  );
}
