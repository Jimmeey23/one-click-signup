import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { kidsWaiverDocument } from "@/lib/legal-content";

export function KidsConsentDocument({
  customerName,
  customerEmail,
}: {
  customerName?: string;
  customerEmail?: string;
}) {
  const safeCustomerName = customerName?.trim() || "Parent/Guardian";
  const safeCustomerEmail = customerEmail?.trim() || "Registered email";
  const [details, ...clauses] = kidsWaiverDocument.sections;

  return (
    <article className="mx-auto w-full max-w-4xl border border-slate-300 bg-white px-5 py-6 text-slate-950 shadow-sm sm:px-8 sm:py-8">
      <header className="flex items-start justify-between gap-5">
        <div>
          <p className="text-lg font-semibold leading-none text-slate-950">Physique 57 Mumbai</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Child booking waiver</p>
        </div>
        <img
          src="/physique57-logo.png"
          alt="Physique 57 India"
          className="h-auto w-20 shrink-0 object-contain sm:w-24"
        />
      </header>

      <h2 className="mt-12 text-center text-3xl font-bold leading-tight text-slate-950">Waiver</h2>

      <section className="mt-9 space-y-1 text-sm leading-5 text-slate-900">
        {details.paragraphs.map((line) => {
          const [label, ...rest] = line.split(": ");
          return (
            <p key={line}>
              <span className="font-bold">{label}: </span>
              {rest.join(": ")}
            </p>
          );
        })}
      </section>

      <section className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase leading-5 text-slate-950">Customer:</p>
          <p className="mt-1 min-h-6 text-lg leading-6 text-slate-950">{safeCustomerName}</p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase leading-5 text-slate-950">Email:</p>
          <p className="mt-1 min-h-6 break-words text-lg leading-6 text-slate-950">
            {safeCustomerEmail}
          </p>
        </div>
      </section>

      <div className="mt-10 space-y-7">
        {clauses.map((section) => (
          <section key={section.title} className="space-y-4">
            <h3 className="sr-only">{section.title}</h3>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="grid grid-cols-[auto_1fr] gap-2 text-base leading-7 text-slate-950"
              >
                <span aria-hidden="true">-&gt;</span>
                <span>{paragraph}</span>
              </p>
            ))}
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        Parent/guardian signature is captured on the Juniors registration form and submitted to
        Momence against this child booking waiver.
      </footer>
    </article>
  );
}

export function KidsConsentModal({
  open,
  onClose,
  customerName,
  customerEmail,
}: {
  open: boolean;
  onClose: () => void;
  customerName?: string;
  customerEmail?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-5 backdrop-blur-sm sm:px-5"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="kids-consent-modal-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[10px] border border-slate-300 bg-white shadow-[0_36px_110px_rgba(15,23,42,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <Scale className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Document Review Copy
                </p>
                <h2 id="kids-consent-modal-title" className="mt-1 text-2xl font-bold text-white">
                  {kidsWaiverDocument.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  {kidsWaiverDocument.subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close consent form"
              onClick={onClose}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 px-3 py-4 sm:px-5">
          <KidsConsentDocument customerName={customerName} customerEmail={customerEmail} />
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              The parent/guardian signature entered on the registration form will be submitted to
              Momence against this waiver.
            </p>
            <Button
              type="button"
              onClick={onClose}
              className="h-11 bg-slate-950 px-5 text-white hover:bg-slate-800"
            >
              I have reviewed this waiver
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}
