import { Link } from "@tanstack/react-router";

const logoUrl = "/Physique57-800x600-1.jpg";

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <img src={logoUrl} alt="Physique 57" className="h-12 w-auto" />
            <p className="mt-4 text-sm text-background/60 max-w-xs leading-relaxed">
              The legendary 57-minute barre-based workout - now in Mumbai.
            </p>
            <div className="mt-5 flex gap-3">
              <Social href="https://www.instagram.com/physique57india/" label="Instagram">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </Social>
              <Social href="https://www.facebook.com/physique57india" label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.84c0-2.52 1.5-3.92 3.78-3.92 1.1 0 2.24.2 2.24.2v2.47h-1.27c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.8 8.44-4.95 8.44-9.94z" />
                </svg>
              </Social>
              <Social href="https://wa.me/919769072866" label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.99 3.617 3.969-1.576zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.017-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.486.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
                </svg>
              </Social>
            </div>
          </div>

          <FooterCol title="Explore">
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/classes-info">Classes</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </FooterCol>

          <FooterCol title="Studios">
            <li className="text-sm text-background/70 leading-relaxed">
              <span className="block text-background font-semibold">Kemps Corner</span>
              Kwality House, 1st Floor, August Kranti Marg, Mumbai
            </li>
            <li className="text-sm text-background/70 leading-relaxed mt-3">
              <span className="block text-background font-semibold">Bandra</span>
              Supreme HQ, Off Linking Road, Bandra West, Mumbai
            </li>
          </FooterCol>

          <FooterCol title="Get in touch">
            <li>
              <a
                href="mailto:info@physique57india.com"
                className="text-sm text-background/70 hover:text-primary transition"
              >
                info@physique57india.com
              </a>
            </li>
            <li>
              <a
                href="tel:+919769072866"
                className="text-sm text-background/70 hover:text-primary transition"
              >
                +91 +91 9769072866
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/919769072866"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-background/70 hover:text-primary transition"
              >
                WhatsApp us
              </a>
            </li>
            <FooterLink to="/terms" itemClassName="pt-3">
              Terms of Service
            </FooterLink>
            <FooterLink to="/waiver">Waiver</FooterLink>
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 pt-6 border-t border-background/10 flex flex-col md:flex-row justify-between gap-3 text-xs text-background/40">
          <p>© {new Date().getFullYear()} Physique 57 India. All rights reserved.</p>
          <p>Licensed by Physique 57, Inc. (New York)</p>
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
      className="h-9 w-9 rounded-full bg-background/10 hover:bg-primary hover:text-foreground text-background flex items-center justify-center transition"
    >
      {children}
    </a>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-4">{title}</p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  children,
  itemClassName,
}: {
  to: string;
  children: React.ReactNode;
  itemClassName?: string;
}) {
  return (
    <li className={itemClassName}>
      <Link to={to as never} className="text-sm text-background/70 hover:text-primary transition">
        {children}
      </Link>
    </li>
  );
}
