import { Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import type { LegalDocument } from "@/lib/legal-content";

const logoUrl = "/Physique57-800x600-1.jpg";

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <div className="min-h-screen bg-[#f5f5f2] text-foreground">
      <header className="border-b border-[#d9d9d2] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-10 w-auto" />
          </Link>
        </div>
      </header>
      <LegalDocumentArticle document={document} />
      <Footer />
    </div>
  );
}

export function LegalDocumentArticle({ document }: { document: LegalDocument }) {
  return (
    <article className="mx-auto max-w-4xl px-5 py-10 md:px-6 md:py-14">
      <div className="border border-[#d5d5ce] bg-white shadow-[0_24px_80px_-60px_rgb(0_0_0/0.55)]">
        <header className="border-b border-[#d5d5ce] px-6 py-7 md:px-10 md:py-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#6a6970]">
            Legal document
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight md:text-6xl">
            {document.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {document.subtitle}
          </p>
          <dl className="mt-6 grid gap-3 border-t border-[#e5e5df] pt-5 text-xs md:grid-cols-3">
            <div>
              <dt className="font-bold uppercase tracking-[0.18em] text-[#74727c]">Updated</dt>
              <dd className="mt-1 text-[#242329]">{document.updated}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.18em] text-[#74727c]">Entity</dt>
              <dd className="mt-1 text-[#242329]">AMP Fitness LLP</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.18em] text-[#74727c]">Jurisdiction</dt>
              <dd className="mt-1 text-[#242329]">Mumbai, India</dd>
            </div>
          </dl>
        </header>

        <div className="divide-y divide-[#e5e5df]">
          {document.sections.map((section, index) => (
            <section
              key={`${section.title ?? "section"}-${index}`}
              className="grid gap-4 px-6 py-7 md:grid-cols-[5rem_1fr] md:px-10"
            >
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#77757f]">
                Section {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                {section.title && (
                  <h2 className="font-display text-2xl leading-tight md:text-3xl">
                    {section.title}
                  </h2>
                )}
                <div className="mt-4 space-y-4 text-sm leading-7 text-[#34333a]">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-[#d5d5ce] bg-[#fbfbf8] px-6 py-5 text-xs leading-relaxed text-[#5f5d66] md:px-10">
          This page is provided for review before booking or membership activation. By signing the
          waiver during registration, the member acknowledges that the signature is given freely and
          knowingly.
        </footer>
      </div>
    </article>
  );
}
