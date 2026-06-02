import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Physique 57 India" },
      { name: "description", content: "Privacy Policy for Physique 57 India." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5"><Link to="/"><img src={logoUrl} alt="Physique 57" className="h-10 w-auto" /></Link></div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-16 space-y-4 leading-relaxed">
        <h1 className="font-display text-5xl mb-6">Privacy Policy</h1>
        <p>Physique 57 India respects your privacy. This policy explains what we collect and how we use it.</p>
        <h2 className="font-display text-2xl mt-8 mb-3">Information we collect</h2>
        <p>Name, email, phone number, signed waivers, class bookings and payment information necessary to deliver our services.</p>
        <h2 className="font-display text-2xl mt-8 mb-3">How we use it</h2>
        <p>To create your account, manage your memberships and bookings, process payments, and send class-related communications. We do not sell your data.</p>
        <h2 className="font-display text-2xl mt-8 mb-3">Your rights</h2>
        <p>You may request a copy or deletion of your data at any time by emailing hello@physique57india.com.</p>
      </article>
      <Footer />
    </div>
  );
}
