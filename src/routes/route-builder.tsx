import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { classFormatForKey, classTypeOptionsForLocation } from "@/lib/class-formats";
import { listSessions, type SessionDTO } from "@/lib/momence-sessions.functions";
import { membershipOptionsForLocation } from "@/lib/membership-catalog";
import { MUMBAI_LOCATIONS, BENGALURU_LOCATIONS } from "@/lib/momence-locations";
import { encodeShareableRoutePayload, type ShareableRoutePayload } from "@/lib/shareable-route";

const ALL_LOCATIONS = [
  ...MUMBAI_LOCATIONS.map((l) => ({
    id: l.id as number,
    name: l.name as string,
    variant: "mumbai" as const,
  })),
  ...BENGALURU_LOCATIONS.map((l) => ({
    id: l.id as number,
    name: l.name as string,
    variant: "bengaluru" as const,
  })),
];

const DEFAULT_LOCATION = ALL_LOCATIONS[0];

const DEFAULT_FORM: ShareableRoutePayload = {
  eventName: "",
  eventDate: "",
  eventTime: "",
  instructorName: "",
  classType: classTypeOptionsForLocation(DEFAULT_LOCATION.id)[0],
  studio: DEFAULT_LOCATION.name,
  studioVariant: DEFAULT_LOCATION.variant,
  homeLocationId: DEFAULT_LOCATION.id,
  paymentType: "paid",
  sessionLink: "",
  isKids: false,
  sessionId: 0,
  sessionLabel: "",
  membershipId: 0,
  membershipLabel: "",
  includeKidsConsent: false,
  includeWaiver: false,
  leadSource: "",
  sourceId: "",
  tags: [],
  utmSource: "",
  utmCampaign: "",
  otherDetails: "",
  heroImagePreset: "hero-barre",
  heroImageUrl:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
};

const HERO_PRESETS = [
  {
    id: "hero-barre",
    label: "Barre group",
    url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "hero-strength",
    label: "Strength studio",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "hero-cycle",
    label: "Cycle close-up",
    url: "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "hero-kids",
    label: "Kids / juniors",
    url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80",
  },
  { id: "hero-custom", label: "Custom image URL", url: "" },
];

const LEAD_SOURCE_OPTIONS = [
  "website paid",
  "website kids",
  "influencer marketing",
  "campaign",
  "manual",
];

const PRESETS: Array<{
  label: string;
  value: Partial<ShareableRoutePayload>;
  description: string;
}> = [
  {
    label: "Kids class",
    description: "Pre-fills consent and waiver fields for a juniors-style route.",
    value: {
      isKids: true,
      includeKidsConsent: true,
      includeWaiver: true,
      leadSource: "website kids",
      sourceId: "kids-program",
      heroImagePreset: "hero-kids",
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

// Vercel and most CDNs reject request lines past ~14KB, and the whole payload rides in the
// path segment. Keep a hard ceiling so a long "other details" note can never produce a URL
// that 431s only once it is shared.
const MAX_SHARE_ID_LENGTH = 6000;

function formatSessionLabel(session: SessionDTO) {
  const starts = new Date(session.startsAt);
  const when = starts.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return [session.name, when, session.teacherName].filter(Boolean).join(" · ");
}

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
  const fetchSessions = useServerFn(listSessions);
  const [form, setForm] = useState<ShareableRoutePayload>(DEFAULT_FORM);
  const [tagsInput, setTagsInput] = useState("");
  const [shareId, setShareId] = useState("");
  const [copied, setCopied] = useState<"share" | "signup" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [customMembershipId, setCustomMembershipId] = useState("");

  const membershipOptions = useMemo(
    () => membershipOptionsForLocation(form.homeLocationId),
    [form.homeLocationId],
  );

  // Trainer names come from the same schedule fetch that powers the class picker, so the
  // list can only ever offer people who actually teach at the chosen studio.
  const trainers = useMemo(
    () =>
      Array.from(
        new Set(sessions.map((s) => s.teacherName).filter((n): n is string => Boolean(n))),
      ).sort(),
    [sessions],
  );
  const trainersLoading = sessionsLoading;

  const classTypeOptions = useMemo(
    () => classTypeOptionsForLocation(form.homeLocationId),
    [form.homeLocationId],
  );

  // Class formats differ per studio; drop a selection the new studio does not run.
  useEffect(() => {
    if (!classTypeOptions.includes(form.classType as never)) {
      setForm((current) => ({ ...current, classType: classTypeOptions[0] }));
    }
  }, [classTypeOptions, form.classType]);

  useEffect(() => {
    let cancelled = false;
    setSessionsLoading(true);
    setSessionsError(null);
    fetchSessions({ data: { locationId: form.homeLocationId, daysAhead: 30 } })
      .then((res) => {
        if (!cancelled) setSessions(res.sessions);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSessions([]);
        setSessionsError(
          error instanceof Error ? error.message : "Could not load the studio schedule",
        );
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSessions, form.homeLocationId]);

  // A session, trainer or membership from the previous studio must not survive a studio
  // change - each of them is scoped to one location.
  useEffect(() => {
    setForm((current) => ({
      ...current,
      sessionId: 0,
      sessionLabel: "",
      membershipId: 0,
      membershipLabel: "",
    }));
    setCustomMembershipId("");
  }, [form.homeLocationId]);

  const shareUrl = shareId ? `/share/${shareId}` : "";
  const signupUrl = shareId ? `/signup/${shareId}` : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: ShareableRoutePayload = {
      ...form,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const encoded = encodeShareableRoutePayload(payload);
    if (encoded.length > MAX_SHARE_ID_LENGTH) {
      setError(
        "This route encodes to a URL that is too long to share reliably. Shorten the other-details note or use a shorter hero image URL.",
      );
      setShareId("");
      return;
    }

    setError(null);
    setShareId(encoded);
    setCopied(null);
  }

  function applyPreset(preset: Partial<ShareableRoutePayload>) {
    setForm((current) => {
      const next = {
        ...current,
        ...preset,
        includeKidsConsent: preset.isKids ? true : current.includeKidsConsent,
        includeWaiver: preset.isKids ? true : current.includeWaiver,
      };
      // A preset only names a hero id; keep the actual image in step with it.
      const hero = HERO_PRESETS.find((h) => h.id === next.heroImagePreset);
      if (hero && hero.url) next.heroImageUrl = hero.url;
      return next;
    });
    if (preset.tags) setTagsInput(preset.tags.join(", "));
  }

  function selectLocation(locationId: number) {
    const location = ALL_LOCATIONS.find((l) => l.id === locationId) ?? DEFAULT_LOCATION;
    setForm((current) => ({
      ...current,
      homeLocationId: location.id,
      studio: location.name,
      studioVariant: location.variant,
      instructorName: "",
    }));
  }

  function selectSession(sessionId: number) {
    const session = sessions.find((item) => item.id === sessionId);
    setForm((current) => ({
      ...current,
      sessionId: session ? session.id : 0,
      sessionLabel: session ? formatSessionLabel(session) : "",
      // Keep the rest of the route consistent with the class that was actually picked.
      instructorName: session?.teacherName ?? current.instructorName,
      eventDate: session ? session.startsAt.slice(0, 10) : current.eventDate,
      eventTime: session
        ? new Date(session.startsAt).toTimeString().slice(0, 5)
        : current.eventTime,
    }));
  }

  function selectMembership(value: string) {
    if (value === "custom") {
      setForm((current) => ({ ...current, membershipId: 0, membershipLabel: "Custom membership" }));
      return;
    }
    if (value === "") {
      setForm((current) => ({ ...current, membershipId: 0, membershipLabel: "" }));
      setCustomMembershipId("");
      return;
    }
    const option = membershipOptions.find((item) => item.key === value);
    setCustomMembershipId("");
    setForm((current) => ({
      ...current,
      membershipId: option?.membershipId ?? 0,
      membershipLabel: option?.label ?? "",
      paymentType: option?.free === false ? "paid" : current.paymentType,
    }));
  }

  function selectHeroPreset(presetId: string) {
    const preset = HERO_PRESETS.find((h) => h.id === presetId);
    setForm((current) => ({
      ...current,
      heroImagePreset: presetId,
      heroImageUrl:
        preset && preset.url ? preset.url : presetId === "hero-custom" ? current.heroImageUrl : "",
    }));
  }

  async function copyUrl(path: string, which: "share" | "signup") {
    await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
    setCopied(which);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#ffffff_100%)] px-6 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[28px] border border-border bg-card/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary">Shareable route generator</Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Build a shareable booking route
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Fill in the event details below and we’ll generate a unique, shareable route with
                the right tracking fields, consent flags, and session link baked in.
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

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name of event / host / class">
              <Input
                value={form.eventName}
                onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                required
              />
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                required
              />
            </Field>
            <Field label="Time">
              <Input
                type="time"
                value={form.eventTime}
                onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                required
              />
            </Field>
            <Field label="Studio">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={String(form.homeLocationId)}
                onChange={(e) => selectLocation(Number(e.target.value))}
                required
              >
                {ALL_LOCATIONS.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={
                trainersLoading
                  ? "Trainer / instructor (loading schedule…)"
                  : "Trainer / instructor"
              }
            >
              <Input
                list="route-builder-trainers"
                value={form.instructorName}
                onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                placeholder={trainers.length ? "Pick or type a name" : "Type a name"}
                required
              />
              <datalist id="route-builder-trainers">
                {trainers.map((trainer) => (
                  <option key={trainer} value={trainer} />
                ))}
              </datalist>
            </Field>
            <Field label="Class type">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.classType}
                onChange={(e) => setForm({ ...form, classType: e.target.value })}
                required
              >
                {classTypeOptions.map((key) => (
                  <option key={key} value={key}>
                    {classFormatForKey(key).name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Paid / free">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.paymentType}
                onChange={(e) =>
                  setForm({ ...form, paymentType: e.target.value === "free" ? "free" : "paid" })
                }
                required
              >
                <option value="paid">paid</option>
                <option value="free">free</option>
              </select>
            </Field>
            <Field label="Session link to add after signup">
              <Input
                value={form.sessionLink}
                onChange={(e) => setForm({ ...form, sessionLink: e.target.value })}
              />
            </Field>
            <Field label="Lead source">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.leadSource}
                onChange={(e) => setForm({ ...form, leadSource: e.target.value })}
              >
                <option value="">Select lead source</option>
                {LEAD_SOURCE_OPTIONS.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source Id">
              <Input
                value={form.sourceId}
                onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
              />
            </Field>
            <Field label="UTM source">
              <Input
                value={form.utmSource}
                onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
              />
            </Field>
            <Field label="UTM campaign">
              <Input
                value={form.utmCampaign}
                onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-5 rounded-2xl border border-border bg-secondary/40 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="text-sm font-semibold">Enrolment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick the class the member is booked into after signing up, and the membership the
                booking is made against. Leave the class empty to collect the signup without
                booking.
              </p>
            </div>

            <Field
              label={
                sessionsLoading
                  ? "Class to book after signup (loading schedule…)"
                  : "Class to book after signup"
              }
            >
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.sessionId ? String(form.sessionId) : ""}
                onChange={(e) => selectSession(Number(e.target.value))}
                disabled={sessionsLoading || sessions.length === 0}
              >
                <option value="">No class — collect the signup only</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {formatSessionLabel(session)}
                    {session.spotsLeft !== null ? ` — ${session.spotsLeft} left` : ""}
                  </option>
                ))}
              </select>
              {sessionsError ? (
                <p className="text-xs text-destructive">{sessionsError}</p>
              ) : !sessionsLoading && sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No upcoming sessions were returned for this studio in the next 30 days.
                </p>
              ) : null}
            </Field>

            <Field label="Membership used for the booking">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={
                  form.membershipLabel === "Custom membership"
                    ? "custom"
                    : (membershipOptions.find((option) => option.membershipId === form.membershipId)
                        ?.key ?? "")
                }
                onChange={(e) => selectMembership(e.target.value)}
              >
                <option value="">Studio default (free trial membership)</option>
                {membershipOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">Custom membership id…</option>
              </select>
              {form.membershipLabel === "Custom membership" ? (
                <Input
                  className="mt-2"
                  inputMode="numeric"
                  placeholder="Momence membership id"
                  value={customMembershipId}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^0-9]/g, "");
                    setCustomMembershipId(next);
                    setForm((current) => ({ ...current, membershipId: Number(next) || 0 }));
                  }}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {membershipOptions.find((option) => option.membershipId === form.membershipId)
                    ?.description ??
                    "Members are put on the studio's own free trial membership before booking."}
                </p>
              )}
            </Field>

            {form.sessionId && !form.membershipId ? (
              <p className="text-xs text-muted-foreground md:col-span-2">
                The studio default membership will be granted free of charge, then used to book{" "}
                {form.sessionLabel}.
              </p>
            ) : null}
          </div>

          <Field label="Tags, comma separated">
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hero image">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.heroImagePreset}
                onChange={(e) => selectHeroPreset(e.target.value)}
              >
                {HERO_PRESETS.map((hero) => (
                  <option key={hero.id} value={hero.id}>
                    {hero.label}
                  </option>
                ))}
              </select>
            </Field>
            {form.heroImagePreset === "hero-custom" ? (
              <Field label="Hero image URL">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={form.heroImageUrl}
                  onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                />
              </Field>
            ) : (
              <Field label="Hero preview">
                <img
                  src={form.heroImageUrl}
                  alt=""
                  className="h-24 w-full rounded-md object-cover"
                />
              </Field>
            )}
          </div>

          <Field label="Other key details">
            <Textarea
              value={form.otherDetails}
              onChange={(e) => setForm({ ...form, otherDetails: e.target.value })}
              rows={5}
            />
          </Field>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.isKids}
              onChange={(e) =>
                setForm({
                  ...form,
                  isKids: e.target.checked,
                  includeKidsConsent: e.target.checked,
                  includeWaiver: e.target.checked || form.includeWaiver,
                })
              }
            />
            Is Kids
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.includeKidsConsent}
                onChange={(e) => setForm({ ...form, includeKidsConsent: e.target.checked })}
                disabled={!form.isKids}
              />
              Include kids consent
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.includeWaiver}
                onChange={(e) => setForm({ ...form, includeWaiver: e.target.checked })}
              />
              Include waiver
            </label>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit">Generate route</Button>
            {shareId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate({ to: "/share/$shareId", params: { shareId } })}
              >
                Preview share page
              </Button>
            ) : null}
          </div>
        </form>

        {shareId ? (
          <div className="rounded-2xl border border-border bg-secondary p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Generated routes
            </p>
            <div className="mt-4 grid gap-4">
              <GeneratedLink
                title="Share page"
                description="A summary of the event with copy/share actions, linking through to signup."
                to="/share/$shareId"
                shareId={shareId}
                href={shareUrl}
                copied={copied === "share"}
                onCopy={() => copyUrl(shareUrl, "share")}
              />
              <GeneratedLink
                title="Direct signup"
                description="Opens the signup form with the studio, class type, consent and tracking prefilled."
                to="/signup/$shareId"
                shareId={shareId}
                href={signupUrl}
                copied={copied === "signup"}
                onCopy={() => copyUrl(signupUrl, "signup")}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GeneratedLink({
  title,
  description,
  to,
  shareId,
  href,
  copied,
  onCopy,
}: {
  title: string;
  description: string;
  to: "/share/$shareId" | "/signup/$shareId";
  shareId: string;
  href: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <Link
            className="mt-2 block break-all text-xs text-primary underline"
            to={to}
            params={{ shareId }}
          >
            {href}
          </Link>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCopy}>
            {copied ? "Copied" : "Copy URL"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={href} target="_blank" rel="noreferrer">
              Open
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
