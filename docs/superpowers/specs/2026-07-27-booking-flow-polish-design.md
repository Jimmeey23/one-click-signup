# Booking flow polish — design

Date: 2026-07-27

Five independent, small-to-medium changes to the trial signup / class booking flow. Each ships as its own isolated change; no shared component between them beyond the files listed.

## 1. Confetti on successful booking

**File:** `src/routes/classes.$memberId.tsx` (`ThankYou` component, ~line 1867)

- Add `canvas-confetti` (+ `@types/canvas-confetti`) as a dependency.
- On `ThankYou` mount, fire two bursts via a single shared canvas: one from `origin: { x: 0, y: 0.6 }` angled ~60° (rightward/inward), one from `origin: { x: 1, y: 0.6 }` angled ~120° (leftward/inward), fired ~150ms apart.
- One-shot only — no loop, no re-trigger on re-render. Guard with a `useRef` fired-once flag.
- Skip entirely if `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- No change to existing `animate-scale-in` checkmark — confetti is additive.

## 2. respond.io contact — map center + class type

**Files:** `src/lib/signup-and-enroll.helpers.ts`, `src/lib/momence.functions.ts`

- Add `classType?: string` to `LeadCapturePayload` (currently only `firstName/lastName/email/phoneE164/center/waiverAccepted/...`).
- Thread `classType` from the signup form all the way through `SignupAndEnrollInput` → wherever `LeadCapturePayload` is constructed before calling `captureLead` — same path `center` already takes.
- In `syncRespondIoContactAndConversation` (momence.functions.ts:132), extend the `/contact/create_or_update/:identifier` request body to include custom fields for center and class type, in addition to the existing `firstName/lastName/email/phone`. Exact custom-fields wire format (`customFields` array vs flat keys) gets confirmed against respond.io v2 docs during implementation — if their API needs pre-registered custom-field IDs rather than free-form names, fall back to appending `"Center: <center>"` / `"Class: <classType>"` as additional tags (same tagging mechanism already used for `RESPONDIO_TAG`) so the information isn't lost even if custom fields aren't configured on the respond.io account yet.
- Unaffected: Momence lead webhook body (`momence.functions.ts:222`) already sends `center`; leave `type: "Barre 57"` as-is unless `classType` is available, in which case use it instead of the hardcoded string.

## 3. Member profile modal (`CustomerFieldsModal`) — visual polish

**File:** `src/routes/classes.$memberId.tsx` (lines ~1074–1287)

- Pure styling pass — no field/section/behavior changes.
- Replace hardcoded hex colors (`#123f7a`, `#1d7cf2`, `#fcfdff`, `#e8eef6`, etc.) with the design-token Tailwind classes already used elsewhere in this file (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.) for light/dark consistency.
- Each field's lucide icon gets a soft circular background chip instead of sitting bare, for visual weight and scannability.
- Tighten vertical spacing between sections, add clearer section dividers, refine input focus-ring states.
- Keep the existing hero-image aside, header, error banner, scrollable body, and footer action bar structure intact.

## 4. Block back-navigation to schedule after booking

**File:** `src/routes/classes.$memberId.tsx` (`ClassesPage`, around `booked` state at line 402)

- When `booked` is set (both the paid-checkout path and the membership-booking path), push a history marker via `window.history.pushState`.
- While `booked` is truthy, attach a `popstate` listener that immediately re-pushes the same marker state — traps the browser Back button on the `ThankYou` screen instead of exposing the prior schedule/form state.
- Listener is removed on `onAnother` (user explicitly chooses to book another class) and on unmount.
- Does not affect the existing Stripe-return URL-cleanup logic (`buildClearedPaidCheckoutUrl`) — that already runs before `booked` is set.

## 5. URL parameter prefill + full UTM support

**File:** `src/components/OpenBarreLanding.tsx`

Audit finding: most prefill already works — `firstName/lastName/email/phoneNumber/countryCode/countryIso/homeLocationId/center/classType/waiverAccepted` all read from URL params today (lines 186–260), and `utm_source/utm_medium/utm_campaign` are captured into `sessionStorage` on first hit (lines 92–115) and re-read at submit time.

Gaps to close:
- Extend `StoredAttribution` type and `persistAttributionIfPresent` to also capture `utm_term`, `utm_content`, `gclid`, `fbclid` from the URL on first hit.
- Extend the submit-time payload (lines 290–308, `submitPartialLead` call, and the final signup submit) to pass these four additional values through alongside the existing three UTM fields — same optional-field pattern.
- No new form fields — these are attribution-only, not user-visible inputs, matching how `utm_source/medium/campaign` are already handled (tracking metadata, not rendered in the form).

## Out of scope

- No changes to `src/lib/ab-test.ts` (`variant` param) — unrelated to this work.
- No prefill support added to `classes.$memberId.tsx`'s own `searchSchema` — confirmed scope is `OpenBarreLanding` only.
- No toast/`sonner` wiring — confetti is the only celebration mechanism added; the dormant `Toaster` scaffold is left as-is.
