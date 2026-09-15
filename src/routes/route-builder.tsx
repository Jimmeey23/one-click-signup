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

function formatPassWhen(date: string, time: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(time ? { hour: "numeric" as const, minute: "2-digit" as const } : {}),
  });
}

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

  // Steps are marked done from the fields they actually contain, so the rail reports
  // real progress rather than how far the page has been scrolled.
  const steps = [
    {
      id: "event",
      title: "Event",
      done: Boolean(form.eventName && form.eventDate && form.eventTime),
    },
    {
      id: "enrolment",
      title: "Enrolment",
      done: Boolean(form.homeLocationId && form.instructorName),
    },
    {
      id: "tracking",
      title: "Tracking",
      done: Boolean(form.leadSource || form.utmSource || tagsInput),
    },
    {
      id: "presentation",
      title: "Presentation",
      done: Boolean(form.otherDetails || form.heroImagePreset !== DEFAULT_FORM.heroImagePreset),
    },
  ];

  return (
    <div className="rb">
      <style>{RB_CSS}</style>

      <header className="rb-top">
        <div className="rb-top-inner">
          <span className="rb-wordmark">Physique 57</span>
          <span className="rb-top-sep" aria-hidden="true" />
          <h1 className="rb-top-title">Route builder</h1>
          <p className="rb-top-note">
            Build a signup link with the class, membership and tracking already decided.
          </p>
        </div>
      </header>

      <div className="rb-body">
        <aside className="rb-rail">
          <div className={`rb-pass ${shareId ? "is-issued" : ""}`}>
            <div className="rb-pass-stub">
              <div className="rb-pass-head">
                <span className="rb-pass-brand">Physique 57</span>
                <span className="rb-pass-kind">{form.isKids ? "Juniors" : "Studio"}</span>
              </div>

              <p className="rb-pass-title" key={form.eventName}>
                {form.eventName || "Untitled route"}
              </p>

              <dl className="rb-pass-grid">
                <PassField label="Studio" value={form.studio} />
                <PassField label="When" value={formatPassWhen(form.eventDate, form.eventTime)} />
                <PassField label="Class" value={classFormatForKey(form.classType as never)?.name} />
                <PassField label="Trainer" value={form.instructorName} />
                <PassField
                  label="Books into"
                  value={form.sessionLabel || "Nothing — signup only"}
                  wide
                />
                <PassField
                  label="Membership"
                  value={form.membershipLabel || "Studio default, free"}
                  wide
                />
              </dl>

              <div className="rb-pass-foot">
                <span className={`rb-chip ${form.paymentType === "free" ? "is-free" : "is-paid"}`}>
                  {form.paymentType === "free" ? "Free" : "Paid"}
                </span>
                {form.includeWaiver ? <span className="rb-chip">Waiver</span> : null}
                {form.includeKidsConsent ? <span className="rb-chip">Consent</span> : null}
                {tagsInput
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  // The waiver and consent flags already have their own chips above.
                  .filter(
                    (tag) =>
                      !["waiver", "consent", "kids", "paid", "free"].includes(tag.toLowerCase()),
                  )
                  .slice(0, 3)
                  .map((tag) => (
                    <span key={tag} className="rb-chip is-quiet">
                      {tag}
                    </span>
                  ))}
              </div>
            </div>

            <div className="rb-perf" aria-hidden="true" />

            <div className="rb-pass-tear">
              {shareId ? (
                <>
                  <p className="rb-tear-label">Signup link</p>
                  <p className="rb-tear-url">{signupUrl}</p>
                </>
              ) : (
                <p className="rb-tear-empty">The link appears here once the route is generated.</p>
              )}
            </div>
          </div>

          <ol className="rb-steps">
            {steps.map((step, index) => (
              <li key={step.id} className={`rb-step ${step.done ? "is-done" : ""}`}>
                <span className="rb-step-no">{index + 1}</span>
                <span className="rb-step-title">{step.title}</span>
              </li>
            ))}
          </ol>
        </aside>

        <main className="rb-sheet">
          <section className="rb-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.value)}
                className="rb-preset"
              >
                <span className="rb-preset-label">{preset.label}</span>
                <span className="rb-preset-desc">{preset.description}</span>
              </button>
            ))}
          </section>

          <form onSubmit={handleSubmit} className="rb-form">
            <Step index={1} title="Event" hint="What is being run, and when.">
              <div className="rb-grid">
                <Field label="Name of event, host or class">
                  <Input
                    value={form.eventName}
                    onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                    placeholder="Juniors open house"
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
                <Field label="Session link to add after signup">
                  <Input
                    value={form.sessionLink}
                    onChange={(e) => setForm({ ...form, sessionLink: e.target.value })}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </Step>

            <Step
              index={2}
              title="Enrolment"
              hint="Where the class runs, who teaches it, and what the member is put on."
            >
              <div className="rb-grid">
                <Field label="Studio">
                  <select
                    className="rb-select"
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
                  label={trainersLoading ? "Trainer (loading schedule)" : "Trainer"}
                  hint={trainers.length ? `${trainers.length} teaching here` : undefined}
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
                    className="rb-select"
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

                <Field label="Price">
                  <select
                    className="rb-select"
                    value={form.paymentType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentType: e.target.value === "free" ? "free" : "paid",
                      })
                    }
                    required
                  >
                    <option value="paid">Paid</option>
                    <option value="free">Free</option>
                  </select>
                </Field>

                <Field
                  label={sessionsLoading ? "Class to book (loading schedule)" : "Class to book"}
                  hint="Leave empty to collect the signup without booking."
                  wide
                >
                  <select
                    className="rb-select"
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
                    <p className="rb-note is-bad">{sessionsError}</p>
                  ) : !sessionsLoading && sessions.length === 0 ? (
                    <p className="rb-note">No classes are scheduled here in the next 30 days.</p>
                  ) : null}
                </Field>

                <Field label="Membership used for the booking" wide>
                  <select
                    className="rb-select"
                    value={
                      form.membershipLabel === "Custom membership"
                        ? "custom"
                        : (membershipOptions.find(
                            (option) => option.membershipId === form.membershipId,
                          )?.key ?? "")
                    }
                    onChange={(e) => selectMembership(e.target.value)}
                  >
                    <option value="">Studio default, granted free</option>
                    {membershipOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                    <option value="custom">Custom membership id</option>
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
                    <p className="rb-note">
                      {membershipOptions.find((option) => option.membershipId === form.membershipId)
                        ?.description ??
                        "Members are put on this studio's own free trial membership before booking."}
                    </p>
                  )}
                </Field>
              </div>

              <div className="rb-switches">
                <Switch
                  checked={form.isKids}
                  onChange={(checked) =>
                    setForm({
                      ...form,
                      isKids: checked,
                      includeKidsConsent: checked,
                      includeWaiver: checked || form.includeWaiver,
                    })
                  }
                  label="Juniors route"
                  hint="Opens the Juniors form with parent and child fields."
                />
                <Switch
                  checked={form.includeKidsConsent}
                  disabled={!form.isKids}
                  onChange={(checked) => setForm({ ...form, includeKidsConsent: checked })}
                  label="Kids consent"
                  hint="Parent signs the child booking waiver."
                />
                <Switch
                  checked={form.includeWaiver}
                  onChange={(checked) => setForm({ ...form, includeWaiver: checked })}
                  label="Waiver"
                  hint="Records the standard waiver on signup."
                />
              </div>
            </Step>

            <Step index={3} title="Tracking" hint="How this route reports back in Momence.">
              <div className="rb-grid">
                <Field label="Lead source">
                  <select
                    className="rb-select"
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
                <Field label="Source id">
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
                <Field label="Tags" hint="Separate with commas." wide>
                  <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
                </Field>
              </div>
            </Step>

            <Step index={4} title="Presentation" hint="What the person opening the link sees.">
              <div className="rb-heroes">
                {HERO_PRESETS.map((hero) => (
                  <button
                    key={hero.id}
                    type="button"
                    aria-pressed={form.heroImagePreset === hero.id}
                    onClick={() => selectHeroPreset(hero.id)}
                    className={`rb-hero ${form.heroImagePreset === hero.id ? "is-on" : ""}`}
                  >
                    {hero.url ? (
                      <img src={hero.url} alt="" loading="lazy" />
                    ) : (
                      <span className="rb-hero-custom">Custom</span>
                    )}
                    <span className="rb-hero-label">{hero.label}</span>
                  </button>
                ))}
              </div>

              {form.heroImagePreset === "hero-custom" ? (
                <Field label="Hero image URL">
                  <Input
                    type="url"
                    placeholder="https://"
                    value={form.heroImageUrl}
                    onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                  />
                </Field>
              ) : null}

              <Field label="Other key details" hint="Shown on the share page.">
                <Textarea
                  value={form.otherDetails}
                  onChange={(e) => setForm({ ...form, otherDetails: e.target.value })}
                  rows={4}
                />
              </Field>
            </Step>

            {error ? <p className="rb-error">{error}</p> : null}

            <div className="rb-actions">
              <button type="submit" className="rb-generate">
                {shareId ? "Regenerate route" : "Generate route"}
              </button>
              {shareId ? (
                <button
                  type="button"
                  className="rb-ghost"
                  onClick={() => navigate({ to: "/share/$shareId", params: { shareId } })}
                >
                  Preview share page
                </button>
              ) : null}
            </div>
          </form>

          {shareId ? (
            <section className="rb-issued" aria-live="polite">
              <h2 className="rb-issued-title">Route issued</h2>
              <GeneratedLink
                title="Share page"
                description="A summary of the event with copy and share actions."
                to="/share/$shareId"
                shareId={shareId}
                href={shareUrl}
                copied={copied === "share"}
                onCopy={() => copyUrl(shareUrl, "share")}
              />
              <GeneratedLink
                title="Direct signup"
                description="Opens the form with studio, class, membership and tracking prefilled."
                to="/signup/$shareId"
                shareId={shareId}
                href={signupUrl}
                copied={copied === "signup"}
                onCopy={() => copyUrl(signupUrl, "signup")}
              />
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function PassField({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={`rb-pass-field ${wide ? "is-wide" : ""}`}>
      <dt>{label}</dt>
      <dd key={value || "empty"} className={value ? "" : "is-empty"}>
        {value || "—"}
      </dd>
    </div>
  );
}

function Step({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="rb-stepblock">
      <div className="rb-stepblock-head">
        <span className="rb-stepblock-no">{index}</span>
        <div>
          <h2 className="rb-stepblock-title">{title}</h2>
          <p className="rb-stepblock-hint">{hint}</p>
        </div>
      </div>
      <div className="rb-stepblock-body">{children}</div>
    </section>
  );
}

function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`rb-switch ${checked ? "is-on" : ""}`}
    >
      <span className="rb-switch-track" aria-hidden="true">
        <span className="rb-switch-knob" />
      </span>
      <span className="rb-switch-text">
        <span className="rb-switch-label">{label}</span>
        <span className="rb-switch-hint">{hint}</span>
      </span>
    </button>
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
    <div className="rb-link">
      <div className="rb-link-text">
        <p className="rb-link-title">{title}</p>
        <p className="rb-link-desc">{description}</p>
        <Link className="rb-link-url" to={to} params={{ shareId }}>
          {href}
        </Link>
      </div>
      <div className="rb-link-actions">
        <button type="button" className="rb-ghost" onClick={onCopy}>
          {copied ? "Copied" : "Copy link"}
        </button>
        <a className="rb-ghost" href={href} target="_blank" rel="noreferrer">
          Open
        </a>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`rb-field ${wide ? "is-wide" : ""}`}>
      <Label className="rb-label">{label}</Label>
      {children}
      {hint ? <p className="rb-note">{hint}</p> : null}
    </div>
  );
}

// Scoped to .rb so the builder can carry its own workspace palette without leaking into
// the customer-facing pages that share this app's tokens.
const RB_CSS = `
.rb {
  --ink: #101114;
  --ink-2: #1a1d23;
  --ink-line: #2b2f37;
  --paper: #f2f3f5;
  --card: #ffffff;
  --rule: #dcdee3;
  --text: #16181d;
  --mute: #6d707a;
  --cyan: #7fd3f7;
  --cyan-deep: #0e7ea8;

  min-height: 100vh;
  background: var(--paper);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.rb-top {
  border-bottom: 1px solid var(--rule);
  background: var(--card);
}
.rb-top-inner {
  margin: 0 auto;
  max-width: 1280px;
  padding: 22px 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
}
.rb-wordmark {
  font-family: "Instrument Serif", ui-serif, Georgia, serif;
  font-size: 19px;
  letter-spacing: 0.01em;
}
.rb-top-sep {
  width: 1px;
  height: 18px;
  background: var(--rule);
}
.rb-top-title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin: 0;
}
.rb-top-note {
  margin: 0;
  color: var(--mute);
  font-size: 14px;
  flex-basis: 100%;
  max-width: 60ch;
}

.rb-body {
  margin: 0 auto;
  max-width: 1280px;
  padding: 28px 24px 72px;
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 1040px) {
  .rb-body {
    grid-template-columns: 372px minmax(0, 1fr);
    align-items: start;
  }
  .rb-rail {
    position: sticky;
    top: 28px;
  }
}

/* --- the pass ------------------------------------------------------------- */

.rb-pass {
  background: var(--ink);
  color: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px -28px rgba(16, 17, 20, 0.7);
}
.rb-pass-stub { padding: 22px 22px 18px; }
.rb-pass-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ink-line);
}
.rb-pass-brand {
  font-family: "Instrument Serif", ui-serif, Georgia, serif;
  font-size: 17px;
}
.rb-pass-kind {
  font-size: 12px;
  color: var(--cyan);
}
.rb-pass-title {
  font-family: "Instrument Serif", ui-serif, Georgia, serif;
  font-size: 32px;
  line-height: 1.1;
  margin: 16px 0 18px;
  animation: rb-settle 320ms ease-out;
}
.rb-pass-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
  margin: 0;
}
.rb-pass-field.is-wide { grid-column: 1 / -1; }
.rb-pass-field dt {
  font-size: 10px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #8a8f9a;
  margin-bottom: 4px;
}
.rb-pass-field dd {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
  animation: rb-settle 260ms ease-out;
}
.rb-pass-field dd.is-empty { color: #4d525c; }
.rb-pass-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--ink-line);
}
.rb-chip {
  border: 1px solid var(--ink-line);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11.5px;
  color: #c9ccd3;
}
.rb-chip.is-free { border-color: rgba(127, 211, 247, 0.5); color: var(--cyan); }
.rb-chip.is-paid { border-color: #3a3f48; color: #e6e8ec; }
.rb-chip.is-quiet { color: #858992; }

.rb-perf {
  position: relative;
  height: 18px;
  background: var(--ink);
}
.rb-perf::before {
  content: "";
  position: absolute;
  inset: 50% 18px auto;
  border-top: 1px dashed #3a3f48;
}
.rb-perf::after {
  content: "";
  position: absolute;
  top: 50%;
  left: -9px;
  right: -9px;
  height: 18px;
  transform: translateY(-50%);
  background:
    radial-gradient(circle at 9px 50%, var(--paper) 9px, transparent 9px) left / 50% 100% no-repeat,
    radial-gradient(circle at calc(100% - 9px) 50%, var(--paper) 9px, transparent 9px) right / 50% 100% no-repeat;
}

.rb-pass-tear {
  background: var(--ink-2);
  padding: 16px 22px 20px;
  min-height: 74px;
}
.rb-tear-label {
  margin: 0 0 6px;
  font-size: 10px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #8a8f9a;
}
.rb-tear-url {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--cyan);
  word-break: break-all;
  /* The encoded payload runs to hundreds of characters; the stub shows enough to
     recognise the link, and the full URL is copied from the buttons below. */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rb-tear-empty {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #6b707a;
  max-width: 34ch;
}
/* The one orchestrated moment: issuing a route tears the stub and pushes the link out. */
.rb-pass.is-issued .rb-pass-tear { animation: rb-tear 520ms cubic-bezier(0.2, 0.9, 0.2, 1); }
.rb-pass.is-issued .rb-perf::before { border-top-color: var(--cyan-deep); }

.rb-steps {
  list-style: none;
  margin: 22px 0 0;
  padding: 0;
  display: grid;
  gap: 2px;
}
.rb-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--mute);
}
.rb-step-no {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 1px solid var(--rule);
  border-radius: 50%;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
}
.rb-step.is-done { color: var(--text); }
.rb-step.is-done .rb-step-no {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--cyan);
}

/* --- worksheet ------------------------------------------------------------ */

.rb-presets {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  margin-bottom: 26px;
}
.rb-preset {
  text-align: left;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 12px;
  padding: 14px 15px;
  cursor: pointer;
  transition: border-color 160ms ease, transform 160ms ease;
}
.rb-preset:hover { border-color: #b9bdc6; transform: translateY(-1px); }
.rb-preset:focus-visible { outline: 2px solid var(--cyan-deep); outline-offset: 2px; }
.rb-preset-label { display: block; font-size: 14px; font-weight: 600; }
.rb-preset-desc { display: block; margin-top: 5px; font-size: 13px; line-height: 1.5; color: var(--mute); }

.rb-form { display: grid; gap: 0; }

.rb-stepblock {
  border-top: 1px solid var(--rule);
  padding: 26px 0;
}
.rb-stepblock:first-child { border-top: none; padding-top: 4px; }
.rb-stepblock-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 18px; }
.rb-stepblock-no {
  font-family: "Instrument Serif", ui-serif, Georgia, serif;
  font-size: 26px;
  line-height: 1;
  color: var(--cyan-deep);
  width: 26px;
  flex: none;
  text-align: right;
}
.rb-stepblock-title { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.015em; }
.rb-stepblock-hint { margin: 4px 0 0; font-size: 13.5px; line-height: 1.55; color: var(--mute); max-width: 62ch; }
.rb-stepblock-body { padding-left: 40px; }
@media (max-width: 640px) {
  .rb-stepblock-body { padding-left: 0; }
}

.rb-grid {
  display: grid;
  gap: 16px 18px;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}
.rb-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.rb-field.is-wide { grid-column: 1 / -1; }
.rb-label { font-size: 13px; font-weight: 500; color: var(--text); }
.rb-note { margin: 2px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--mute); }
.rb-note.is-bad { color: #b4233a; }

.rb-select {
  height: 40px;
  width: 100%;
  border: 1px solid var(--rule);
  border-radius: 9px;
  background: var(--card);
  padding: 0 11px;
  font-size: 14px;
  color: var(--text);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.rb-select:hover:not(:disabled) { border-color: #b9bdc6; }
.rb-select:focus-visible {
  outline: none;
  border-color: var(--cyan-deep);
  box-shadow: 0 0 0 3px rgba(127, 211, 247, 0.34);
}
.rb-select:disabled { background: #eceef1; color: var(--mute); }

.rb-switches { display: grid; gap: 8px; margin-top: 20px; }
.rb-switch {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 11px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 160ms ease;
}
.rb-switch:hover:not(:disabled) { border-color: #b9bdc6; }
.rb-switch:disabled { opacity: 0.5; cursor: not-allowed; }
.rb-switch:focus-visible { outline: 2px solid var(--cyan-deep); outline-offset: 2px; }
.rb-switch-track {
  margin-top: 2px;
  width: 34px;
  height: 20px;
  flex: none;
  border-radius: 999px;
  background: #d7dae0;
  position: relative;
  transition: background 200ms ease;
}
.rb-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 17, 20, 0.35);
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.rb-switch.is-on .rb-switch-track { background: var(--ink); }
.rb-switch.is-on .rb-switch-knob { transform: translateX(14px); background: var(--cyan); }
.rb-switch-label { display: block; font-size: 14px; font-weight: 500; }
.rb-switch-hint { display: block; margin-top: 2px; font-size: 12.5px; line-height: 1.5; color: var(--mute); }

.rb-heroes {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  margin-bottom: 18px;
}
.rb-hero {
  position: relative;
  border: 1px solid var(--rule);
  border-radius: 11px;
  overflow: hidden;
  background: var(--card);
  cursor: pointer;
  padding: 0;
  transition: border-color 160ms ease, transform 160ms ease;
}
.rb-hero img { display: block; width: 100%; height: 78px; object-fit: cover; }
.rb-hero-custom {
  display: grid;
  place-items: center;
  height: 78px;
  font-size: 13px;
  color: var(--mute);
  background: repeating-linear-gradient(45deg, #f6f7f8 0 8px, #eceef1 8px 16px);
}
.rb-hero-label { display: block; padding: 8px 10px; font-size: 12.5px; text-align: left; }
.rb-hero:hover { transform: translateY(-1px); border-color: #b9bdc6; }
.rb-hero:focus-visible { outline: 2px solid var(--cyan-deep); outline-offset: 2px; }
.rb-hero.is-on { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }

.rb-error {
  margin: 8px 0 0;
  border-left: 3px solid #b4233a;
  background: #fdf2f3;
  padding: 11px 14px;
  font-size: 13.5px;
  line-height: 1.55;
  color: #8f1c2e;
}

.rb-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--rule);
}
.rb-generate {
  height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #fff;
  font-size: 14.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms ease;
}
.rb-generate:hover { background: #24272e; transform: translateY(-1px); }
.rb-generate:focus-visible { outline: 2px solid var(--cyan-deep); outline-offset: 3px; }
.rb-ghost {
  height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 18px;
  border: 1px solid var(--rule);
  border-radius: 10px;
  background: var(--card);
  color: var(--text);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 160ms ease;
}
.rb-ghost:hover { border-color: #b9bdc6; }
.rb-ghost:focus-visible { outline: 2px solid var(--cyan-deep); outline-offset: 2px; }

.rb-issued { margin-top: 34px; display: grid; gap: 10px; animation: rb-rise 420ms ease-out; }
.rb-issued-title {
  font-family: "Instrument Serif", ui-serif, Georgia, serif;
  font-size: 24px;
  margin: 0 0 4px;
}
.rb-link {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 12px;
  padding: 16px 18px;
}
.rb-link-text { min-width: 0; }
.rb-link-title { margin: 0; font-size: 14.5px; font-weight: 600; }
.rb-link-desc { margin: 4px 0 0; font-size: 13px; line-height: 1.5; color: var(--mute); }
.rb-link-url {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 8px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--cyan-deep);
  word-break: break-all;
}
.rb-link-actions { display: flex; gap: 8px; }

@keyframes rb-settle {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: none; }
}
@keyframes rb-tear {
  0% { transform: translateY(-14px); opacity: 0; }
  60% { transform: translateY(3px); opacity: 1; }
  100% { transform: none; }
}
@keyframes rb-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .rb *, .rb *::before, .rb *::after {
    animation: none !important;
    transition-duration: 1ms !important;
  }
}
`;
