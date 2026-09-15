import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { classTypeOptionsForStudio } from "@/lib/class-formats";
import { buildShareableRouteUrl, type ShareableRoutePayload } from "@/lib/shareable-route";

const DEFAULT_FORM: ShareableRoutePayload = {
  eventName: "",
  eventDate: "",
  eventTime: "",
  instructorName: "",
  classType: "Barre 57",
  studio: "",
  paymentType: "paid",
  sessionLink: "",
  isKids: false,
  includeKidsConsent: false,
  includeWaiver: false,
  leadSource: "",
  sourceId: "",
  tags: [],
  utmSource: "",
  utmCampaign: "",
  otherDetails: "",
  heroImageMode: "preset",
  heroImagePreset: "hero-1",
  heroImageUrl: "",
};

const HERO_PRESETS = [
  { id: "hero-1", label: "Barre group" },
  { id: "hero-2", label: "Trainer portrait" },
  { id: "hero-3", label: "Strength studio" },
  { id: "hero-4", label: "Cycle close-up" },
];

const STUDIO_OPTIONS = ["Kwality House, Kemps Corner", "Supreme Headquarters, Bandra", "Lavelle Road", "Indiranagar"];

const LEAD_SOURCE_OPTIONS = ["website paid", "website kids", "influencer marketing", "campaign", "manual"];

const PRESETS: Array<{ label: string; value: Partial<ShareableRoutePayload>; description: string }> = [
  {
    label: "Kids class",
    description: "Pre-fills consent and waiver fields for a juniors-style route.",
    value: {
      isKids: true,
      includeKidsConsent: true,
      includeWaiver: true,
      classType: "Juniors",
      leadSource: "website kids",
      sourceId: "kids-program",
      tags: ["kids", "waiver", "consent"],
    },
  },
  {
    label: "Influencer event",
    description: "Best for creator-led trials and campaign tracking.",
    value: {
      leadSource: "influencer marketing",
      sourceId: "influencer-campaign",
      utmSource: "instagram",
      utmCampaign: "creator-launch",
      paymentType: "free",
      tags: ["influencer", "campaign"],
    },
  },
  {
    label: "Paid class",
    description: "A generic paid booking route with standard trial metadata.",
    value: {
      paymentType: "paid",
      leadSource: "website paid",
      sourceId: "paid-signup",
      tags: ["trial", "paid"],
    },
  },
];

export const Route = createFileRoute("/route-builder")({
  head: () => ({
    meta: [
      { title: "Route Builder - Physique 57 India" },
      {
        name: "description",
        content: "Create a shareable event route with key booking details and tracking metadata.",
      },
    ],
  }),
  component: RouteBuilderPage,
});

function RouteBuilderPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ShareableRoutePayload>(DEFAULT_FORM);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const tagsPreview = useMemo(() => form.tags.join(", "), [form.tags]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const shareUrl = buildShareableRouteUrl({
      ...form,
      tags: String(tagsPreview || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    setGeneratedUrl(shareUrl);
    setCopied(false);
    await navigate({ to: shareUrl });
  }

  function applyPreset(preset: Partial<ShareableRoutePayload>) {
    setForm((current) => ({
      ...current,
      ...preset,
      tags: preset.tags ?? current.tags,
      includeKidsConsent: preset.isKids ? true : current.includeKidsConsent,
      includeWaiver: preset.isKids ? true : current.includeWaiver,
    }));
  }

  async function copyUrl() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(new URL(generatedUrl, window.location.origin).toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#ffffff_100%)] px-6 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[28px] border border-border bg-card/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary">Shareable route generator</Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Build a shareable booking route</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Fill in the event details below and we’ll generate a unique, shareable route with the
                right tracking fields, consent flags, and session link baked in.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
              Routes are encoded into the URL itself, so they can be copied and shared anywhere.
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.value)}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <p className="text-sm font-semibold">{preset.label}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </section>

        <form onSubmit={handleSubmit} className="grid gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name of event / host / class">
              <Input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} required />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required />
            </Field>
            <Field label="Time">
              <Input type="time" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} required />
            </Field>
            <Field label="Trainer / instructor">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.instructorName}
                onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                required
              >
                <option value="">Select trainer</option>
                {TRAINER_OPTIONS.map((trainer) => (
                  <option key={trainer} value={trainer}>{trainer}</option>
                ))}
              </select>
            </Field>
            <Field label="Class type">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.classType} onChange={(e) => setForm({ ...form, classType: e.target.value })} required>
                {(form.studio ? classTypeOptionsForStudio(form.studio) : ["barre-57"]).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </Field>
            <Field label="Studio">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.studio} onChange={(e) => setForm({ ...form, studio: e.target.value })} required>
                <option value="">Select studio</option>
                {STUDIO_OPTIONS.map((studio) => (
                  <option key={studio} value={studio}>{studio}</option>
                ))}
              </select>
            </Field>
            <Field label="Paid / free">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value === "free" ? "free" : "paid" })} required>
                <option value="paid">paid</option>
                <option value="free">free</option>
              </select>
            </Field>
            <Field label="Session link to add after signup">
              <Input value={form.sessionLink} onChange={(e) => setForm({ ...form, sessionLink: e.target.value })} />
            </Field>
            <Field label="Lead source">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value })}>
                <option value="">Select lead source</option>
                {LEAD_SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
            </Field>
            <Field label="Source Id">
              <Input value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })} />
            </Field>
            <Field label="UTM source">
              <Input value={form.utmSource} onChange={(e) => setForm({ ...form, utmSource: e.target.value })} />
            </Field>
            <Field label="UTM campaign">
              <Input value={form.utmCampaign} onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })} />
            </Field>
          </div>

          <Field label="Tags, comma separated">
            <Input value={tagsPreview} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hero image">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.heroImageMode} onChange={(e) => setForm({ ...form, heroImageMode: e.target.value === "upload" ? "upload" : "preset" })}>
                <option value="preset">Choose preset</option>
                <option value="upload">Upload your own</option>
              </select>
            </Field>
            {form.heroImageMode === "preset" ? (
              <Field label="Preset hero">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.heroImagePreset} onChange={(e) => setForm({ ...form, heroImagePreset: e.target.value, heroImageUrl: "" })}>
                  {HERO_PRESETS.map((hero) => <option key={hero.id} value={hero.id}>{hero.label}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Upload hero image">
                <Input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const dataUrl = await fileToDataUrl(file)
                  setForm({ ...form, heroImageUrl: dataUrl, heroImagePreset: "", heroImageMode: "upload" })
                }} />
              </Field>
            )}
          </div>

          <Field label="Other key details">
            <Textarea value={form.otherDetails} onChange={(e) => setForm({ ...form, otherDetails: e.target.value })} rows={5} />
          </Field>

          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={form.isKids} onChange={(e) => setForm({ ...form, isKids: e.target.checked, includeKidsConsent: e.target.checked, includeWaiver: e.target.checked })} />
            Is Kids
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.includeKidsConsent} onChange={(e) => setForm({ ...form, includeKidsConsent: e.target.checked })} disabled={!form.isKids} />
              Include kids consent
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.includeWaiver} onChange={(e) => setForm({ ...form, includeWaiver: e.target.checked })} />
              Include waiver
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">Generate route</Button>
            {generatedUrl ? (
              <Button type="button" variant="secondary" onClick={copyUrl}>
                {copied ? "Copied" : "Copy generated URL"}
              </Button>
            ) : null}
          </div>
        </form>

        {generatedUrl ? (
          <div className="rounded-2xl border border-border bg-secondary p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Generated route</p>
                <Link className="mt-2 block break-all text-primary underline" to={generatedUrl}>
                  {generatedUrl}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">
                  This opens the permanent signup route for the selected class and preserves the prefilled setup.
                </p>
              </div>
              <Button type="button" variant="outline" asChild>
                <a href={generatedUrl} target="_blank" rel="noreferrer">
                  Open route
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

  function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
