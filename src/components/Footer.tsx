import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const logoUrl = "/physique57-logo-dark.png?v=79daf7";

export function Footer({ studioVariant = "mumbai" }: { studioVariant?: "mumbai" | "bengaluru" }) {
  const isBengaluru = studioVariant === "bengaluru";
  const studioSearch = isBengaluru ? { studio: "bengaluru" as const } : undefined;
  const contactEmail = isBengaluru ? "info@physique57bengaluru.com" : "info@physique57india.com";
  const studios = isBengaluru
    ? ["Lavelle Road", "Indiranagar", "Plash Pilates"]
    : ["Kemps Corner", "Bandra"];

  return (
    <footer className="relative overflow-hidden bg-[#090d12] text-white">
      <div
        className="pointer-events-none absolute -right-24 -top-36 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:py-12">
        <div className="grid gap-9 border-b border-white/10 pb-9 md:grid-cols-[1.15fr_0.85fr_1fr] md:gap-10">
          <div className="max-w-sm">
            <div className="flex items-center justify-between gap-5">
              <img src={logoUrl} alt="Physique 57" className="brand-logo h-9 w-auto" />
              <div className="flex gap-2 md:hidden">
                <Social href="https://www.instagram.com/physique57india/" label="Instagram">
                  <InstagramIcon />
                </Social>
                <Social href="https://www.facebook.com/physique57india" label="Facebook">
                  <FacebookIcon />
                </Social>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
              The signature 57-minute method for strength, posture and lasting transformation.
            </p>
            <a
              href="#signup"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b1117] transition duration-200 hover:-translate-y-0.5 hover:bg-white"
            >
              Book your first class
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div>
            <FooterHeading>Explore</FooterHeading>
            <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-3">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/about" search={studioSearch}>
                About
              </FooterLink>
              <FooterLink to="/classes-info" search={studioSearch}>
                Classes
              </FooterLink>
              <FooterLink to="/faq" search={studioSearch}>
                FAQ
              </FooterLink>
              <FooterLink to="/contact" search={studioSearch}>
                Contact
              </FooterLink>
            </nav>

            <div className="mt-7 hidden gap-2 md:flex">
              <Social href="https://www.instagram.com/physique57india/" label="Instagram">
                <InstagramIcon />
              </Social>
              <Social href="https://www.facebook.com/physique57india" label="Facebook">
                <FacebookIcon />
              </Social>
              <Social href="https://wa.me/919769665757" label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </Social>
            </div>
          </div>

          <div>
            <FooterHeading>{isBengaluru ? "Bengaluru" : "Mumbai"}</FooterHeading>
            <div className="mb-5 flex flex-wrap gap-2">
              {studios.map((studio) => (
                <span
                  key={studio}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75"
                >
                  <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
                  {studio}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              <ContactLink href={`mailto:${contactEmail}`} icon={Mail}>
                {contactEmail}
              </ContactLink>
              <ContactLink href="tel:+919769665757" icon={Phone}>
                +91 97696 65757
              </ContactLink>
              <ContactLink href="https://wa.me/919769665757" icon={MessageCircle} external>
                Chat on WhatsApp
              </ContactLink>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-[11px] text-white/38 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Physique 57 India · Licensed by Physique 57, Inc.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <FooterLink to="/terms" search={studioSearch}>
              Terms
            </FooterLink>
            <FooterLink to="/waiver" search={studioSearch}>
              Waiver
            </FooterLink>
            <FooterLink to="/privacy" search={studioSearch}>
              Privacy
            </FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Social({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary hover:text-[#0b1117]"
    >
      {children}
    </a>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
      {children}
    </p>
  );
}

function FooterLink({
  to,
  search,
  children,
}: {
  to: string;
  search?: { studio: "bengaluru" };
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to as never}
      search={search as never}
      className="w-fit text-sm text-white/58 transition hover:text-primary"
    >
      {children}
    </Link>
  );
}

function ContactLink({
  href,
  icon: Icon,
  children,
  external = false,
}: {
  href: string;
  icon: typeof Mail;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex w-fit items-center gap-2.5 text-sm text-white/58 transition hover:text-white"
    >
      <Icon
        className="h-3.5 w-3.5 text-primary/80 transition group-hover:text-primary"
        aria-hidden="true"
      />
      <span>{children}</span>
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.84c0-2.52 1.5-3.92 3.78-3.92 1.1 0 2.24.2 2.24.2v2.47h-1.27c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.8 8.44-4.95 8.44-9.94z" />
    </svg>
  );
}
