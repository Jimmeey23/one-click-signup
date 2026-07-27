# Booking Flow Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five independent polish changes to the trial signup / booking flow: confetti on booking success, full respond.io contact field mapping, a restyled Member Profile modal, a browser-back-button trap after booking, and fuller URL/UTM prefill on the landing form.

**Architecture:** Each of the 5 changes touches a different, mostly non-overlapping slice of the codebase (a UI component, a server-side lead-capture function, another UI component, a route-level effect, and a client form component). They're implemented as 5 independent tasks; any subset can ship without the others.

**Tech Stack:** React 18 + TanStack Start/Router, TypeScript, Tailwind, `node:test` for unit tests (run via `npx tsx --test <file>`), `canvas-confetti` (new dependency).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-booking-flow-polish-design.md`
- Test runner: this repo uses Node's built-in test runner via `npx tsx --test <file>` (see existing `src/lib/*.test.ts` files) — there is no vitest/jest installed. Do not add one.
- No new UI framework/toast library — the dormant `sonner`/`Toaster` scaffold stays untouched.
- Design tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-primary`, `text-primary-deep`, `text-muted-foreground`) are the established Tailwind convention elsewhere in `classes.$memberId.tsx` (see `ThankYou`, lines ~1884-2001) — new/restyled UI must use these, not new hardcoded hex values.

---

### Task 1: Confetti on successful booking

**Files:**
- Modify: `package.json` (add `canvas-confetti` + `@types/canvas-confetti`)
- Create: `src/lib/confetti.ts`
- Test: `src/lib/confetti.test.ts`
- Modify: `src/routes/classes.$memberId.tsx` (`ThankYou` component, ~line 1867)

**Interfaces:**
- Produces: `fireDualSideConfetti(confettiFn?: (opts: object) => void): void` from `src/lib/confetti.ts`, used by `ThankYou`.

- [ ] **Step 1: Install the dependency**

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Write the failing test for the pure scheduling logic**

`canvas-confetti` itself needs a real `<canvas>`/DOM and is not meaningfully unit-testable, so `src/lib/confetti.ts` isolates the *decision* (how many bursts, from which origins, whether to skip for reduced motion) behind a small function that accepts the confetti caller as a parameter — this part is what gets tested.

Create `src/lib/confetti.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDualSideConfettiBursts } from "./confetti.ts";

describe("confetti", () => {
  it("builds a left-origin and a right-origin burst, angled inward", () => {
    const bursts = buildDualSideConfettiBursts();

    assert.equal(bursts.length, 2);
    assert.deepEqual(bursts[0].origin, { x: 0, y: 0.6 });
    assert.equal(bursts[0].angle, 60);
    assert.deepEqual(bursts[1].origin, { x: 1, y: 0.6 });
    assert.equal(bursts[1].angle, 120);
    assert.equal(bursts[1].delayMs, 150);
    assert.equal(bursts[0].delayMs, 0);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx tsx --test src/lib/confetti.test.ts`
Expected: FAIL — `confetti.ts` doesn't exist yet.

- [ ] **Step 4: Implement `src/lib/confetti.ts`**

```ts
export type ConfettiBurst = {
  particleCount: number;
  spread: number;
  angle: number;
  origin: { x: number; y: number };
  delayMs: number;
};

export function buildDualSideConfettiBursts(): ConfettiBurst[] {
  return [
    { particleCount: 70, spread: 70, angle: 60, origin: { x: 0, y: 0.6 }, delayMs: 0 },
    { particleCount: 70, spread: 70, angle: 120, origin: { x: 1, y: 0.6 }, delayMs: 150 },
  ];
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function fireDualSideConfetti(confettiFn: (opts: Record<string, unknown>) => void): void {
  if (prefersReducedMotion()) return;
  for (const burst of buildDualSideConfettiBursts()) {
    const { delayMs, ...opts } = burst;
    if (delayMs === 0) {
      confettiFn(opts);
    } else {
      setTimeout(() => confettiFn(opts), delayMs);
    }
  }
}
```

- [ ] **Step 5: Run the test again to confirm it passes**

Run: `npx tsx --test src/lib/confetti.test.ts`
Expected: PASS (1 test)

- [ ] **Step 6: Wire it into `ThankYou`**

In `src/routes/classes.$memberId.tsx`, add near the top imports:

```ts
import confetti from "canvas-confetti";
import { fireDualSideConfetti } from "@/lib/confetti";
```

In the `ThankYou` function body (starts ~line 1867), add a fired-once effect right after the existing `const policy = classPolicy(...)` / `whatsappPhone` lines:

```ts
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    fireDualSideConfetti((opts) => confetti(opts));
  }, []);
```

(`useRef`/`useEffect` are already imported in this file for other state — confirm the import line includes both; add if missing.)

- [ ] **Step 7: Manual verification**

Run `npm run dev`, complete a full signup + booking flow (or navigate directly to a `booked` state if there's a dev shortcut), confirm confetti bursts fire from both screen edges once on the ThankYou screen, and do not re-fire on re-render (e.g. resizing the window). Then enable "reduce motion" in OS accessibility settings and confirm no confetti fires.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/confetti.ts src/lib/confetti.test.ts src/routes/classes.\$memberId.tsx
git commit -m "feat: fire dual-side confetti on successful class booking"
```

---

### Task 2: respond.io contact — map center + class type as custom fields

**Files:**
- Modify: `src/lib/signup-and-enroll.helpers.ts` (`LeadCapturePayload` type, `SignupAndEnrollInput` type, `runSignupAndEnroll`)
- Modify: `src/lib/momence.functions.ts` (`syncRespondIoContactAndConversation`, `captureLead`, `SignupInput`/wiring if `classType` needs threading in)
- Test: `src/lib/signup-and-enroll.helpers.test.ts` (extend existing file)

**Interfaces:**
- Produces: `LeadCapturePayload` gains `classType?: string`.
- Consumes: nothing new from other tasks.

- [ ] **Step 1: Write the failing test for `LeadCapturePayload`/`runSignupAndEnroll` threading `classType`**

Open `src/lib/signup-and-enroll.helpers.test.ts`, find the test that asserts on the `captureLead` dependency call (it currently checks the payload passed to the injected `captureLead` mock). Add a new assertion field. If the existing test's fixture `SignupAndEnrollInput` doesn't include `classType`, add it there too. Add this case (adapt to match the file's existing mock-dependency style — read the file first to match its exact `dependencies` mock shape):

```ts
it("threads classType through to the captureLead payload", async () => {
  let capturedPayload: LeadCapturePayload | undefined;
  const dependencies = {
    createMember: async () => ({ memberId: 1 }),
    signMemberWaivers: async () => ({ signedCount: 1, availableCount: 1 }),
    enrollOpenBarre: async () => {},
    captureLead: async (payload: LeadCapturePayload) => {
      capturedPayload = payload;
      return { ok: true };
    },
    resolveCenterName: () => "Kwality House, Kemps Corner",
  };

  await runSignupAndEnroll(
    {
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      countryCode: "+91",
      phoneNumber: "9876543210",
      homeLocationId: 9030,
      waiverAccepted: true,
      signatureName: "Asha Rao",
      signatureRealSignature: "sig-data",
      classType: "barre-57",
    },
    dependencies,
    { captureLead: true },
  );

  assert.equal(capturedPayload?.classType, "barre-57");
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test src/lib/signup-and-enroll.helpers.test.ts`
Expected: FAIL — `classType` not accepted on `SignupAndEnrollInput`/not present on the captured payload (TypeScript compile error or `undefined` assertion failure depending on how `tsx` handles the extra field).

- [ ] **Step 3: Add `classType` to the types and thread it through**

In `src/lib/signup-and-enroll.helpers.ts`:

```ts
export type SignupAndEnrollInput = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  homeLocationId: number;
  waiverAccepted: true;
  signatureName: string;
  signatureRealSignature?: string;
  signatureDataUrl?: string;
  signatures?: Array<{ documentId: number; signatureText: string }>;
  classType?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
  abVariant?: string;
};

export type LeadCapturePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  center: string;
  classType?: string;
  waiverAccepted: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
  abVariant?: string;
  memberId?: number;
  stage?: "partial" | "completed";
};
```

In `runSignupAndEnroll`, inside the `captureLead` block (around line 134), add `classType: data.classType,` to the object passed to `dependencies.captureLead(...)`.

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx tsx --test src/lib/signup-and-enroll.helpers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/signup-and-enroll.helpers.ts src/lib/signup-and-enroll.helpers.test.ts
git commit -m "feat: thread classType into LeadCapturePayload"
```

- [ ] **Step 6: Write the failing test for the respond.io contact body**

`syncRespondIoContactAndConversation` is a `momence.functions.ts`-local `async function` that calls `fetch` directly (via `callRespondIo`) — it's not currently exported or easily testable in isolation. Extract the *request-body construction* into a pure, exported, testable function first.

Create/extend a test file `src/lib/momence.functions.test.ts` (check if one already exists via `ls src/lib/momence.functions.test.ts`; if not, create it):

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRespondIoContactBody } from "./momence.functions.ts";

describe("respond.io contact body", () => {
  it("includes center and classType as custom fields alongside name/email/phone", () => {
    const body = buildRespondIoContactBody({
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phoneE164: "+919876543210",
      center: "Kwality House, Kemps Corner",
      classType: "barre-57",
    });

    assert.deepEqual(body, {
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phone: "+919876543210",
      customFields: [
        { name: "center", value: "Kwality House, Kemps Corner" },
        { name: "classType", value: "barre-57" },
      ],
    });
  });

  it("falls back to Barre 57 for classType when not provided", () => {
    const body = buildRespondIoContactBody({
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phoneE164: "+919876543210",
      center: "Kwality House, Kemps Corner",
    });

    assert.deepEqual(body.customFields, [
      { name: "center", value: "Kwality House, Kemps Corner" },
      { name: "classType", value: "Barre 57" },
    ]);
  });
});
```

- [ ] **Step 7: Run it to confirm it fails**

Run: `npx tsx --test src/lib/momence.functions.test.ts`
Expected: FAIL — `buildRespondIoContactBody` is not exported (doesn't exist yet).

- [ ] **Step 8: Extract and export the pure builder, use it in `syncRespondIoContactAndConversation`**

In `src/lib/momence.functions.ts`, add this exported function above `syncRespondIoContactAndConversation` (~line 130):

```ts
export function buildRespondIoContactBody({
  firstName,
  lastName,
  email,
  phoneE164,
  center,
  classType,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  center: string;
  classType?: string;
}) {
  return {
    firstName,
    lastName,
    email,
    phone: phoneE164,
    customFields: [
      { name: "center", value: center },
      { name: "classType", value: classType ?? "Barre 57" },
    ],
  };
}
```

Then change the body of the `/contact/create_or_update/${identifier}` call (currently ~lines 151-156) from the inline object to:

```ts
      body: buildRespondIoContactBody({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneE164: payload.phoneE164,
        center: payload.center,
        classType: payload.classType,
      }),
```

**Note for whoever implements this:** respond.io's v2 custom-fields wire format needs a one-time confirmation against a real account (does `/contact/create_or_update` accept ad-hoc `customFields: [{name, value}]`, or does it require pre-registered field IDs?). If a live call to this endpoint returns a 4xx specifically about `customFields`, fall back to appending `` `Center: ${center}` `` and `` `Class: ${classType}` `` to the existing tags array in the follow-up `/contact/${identifier}/tag` call (~line 171) instead, and remove `customFields` from this body. Do not guess silently — if you hit that error, note it in the PR description.

- [ ] **Step 9: Run the test again to confirm it passes**

Run: `npx tsx --test src/lib/momence.functions.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 10: Commit**

```bash
git add src/lib/momence.functions.ts src/lib/momence.functions.test.ts
git commit -m "feat: map center and classType as respond.io contact custom fields"
```

---

### Task 3: Restyle the Member Profile modal (`CustomerFieldsModal`)

**Files:**
- Modify: `src/routes/classes.$memberId.tsx` (`CustomerFieldsModal`, `TextField`, `SelectField` — lines ~1074-1470)

**Interfaces:** None — pure visual change, no prop/behavior changes to any of these three components.

This is a visual-only task with no meaningful unit test (it's JSX/Tailwind classes) — verify manually.

- [ ] **Step 1: Replace hardcoded hex colors with design tokens in `CustomerFieldsModal`**

In the modal shell (~lines 1106-1285), apply this hex → token mapping consistently:

| Old (hardcoded) | New (token) |
|---|---|
| `bg-[#fcfdff]` (form background) | `bg-card` |
| `bg-[#050a14]/70` (overlay) | `bg-foreground/70` |
| `text-[#101828]` | `text-foreground` |
| `text-[#5c6b78]`, `text-[#6f7d90]` | `text-muted-foreground` |
| `text-[#7d8aa0]` (field label) | `text-muted-foreground` |
| `border-[#e8eef6]`, `border-[#e2e9f2]`, `border-[#dedee5]`, `border-[#dde5ee]`, `border-[#d7e0ec]` | `border-border` |
| `text-[#1d7cf2]` / `#123f7a` (accent blue) | `text-primary-deep` |
| `bg-gradient-to-r from-[#123f7a] to-[#1d7cf2]` (submit button, top accent bar) | `bg-primary` (drop the gradient — flat `bg-primary` matches the rest of the app's buttons, e.g. `ThankYou`'s `bg-primary` badge) |
| `bg-[#fbfcff]` (footer bar) | `bg-muted` (if `bg-muted` isn't a defined token in this project's Tailwind config, use `bg-background`) |

Apply this mapping to every occurrence in the modal shell, `TextField`, and `SelectField` (find all via `grep -n '#[0-9a-f]\{3,6\}' src/routes/classes.\$memberId.tsx` restricted to the ~1074-1470 line range).

- [ ] **Step 2: Give each field icon a soft circular chip background**

In `TextField` (~line 1289) and `SelectField`, change:

```tsx
{icon && <span className="text-[#1d7cf2]">{icon}</span>}
```

to:

```tsx
{icon && (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary-deep">
    {icon}
  </span>
)}
```

- [ ] **Step 3: Tighten spacing and refine focus states**

In the form-body container (~line 1174), change `space-y-5` to `space-y-6` for clearer section separation. In `TextField`'s `baseClass` (~line 1319-1320) and the equivalent in `SelectField`, change the focus ring from `focus:ring-2 focus:ring-[#123f7a]/12` to `focus:ring-2 focus:ring-primary/20` and `focus:border-[#123f7a]` to `focus:border-primary`.

- [ ] **Step 4: Manual verification**

Run `npm run dev`, get to a booking flow that opens the Member Profile modal (select a session requiring custom fields), and visually confirm: no more raw blue/gray hex colors, icons have soft circular backgrounds, spacing reads cleaner, and the modal still functions identically (all fields fillable, validation errors still show, Cancel/Save buttons still work, Escape still closes it). Check both light and dark OS theme if the app supports dark mode (check `bg-background`/`text-foreground` usage elsewhere to confirm dark-mode support exists before testing it).

- [ ] **Step 5: Commit**

```bash
git add src/routes/classes.\$memberId.tsx
git commit -m "style: restyle Member Profile modal with design tokens and icon chips"
```

---

### Task 4: Trap the browser back button after booking

**Files:**
- Modify: `src/routes/classes.$memberId.tsx` (`ClassesPage`, around the `booked` state at line 402 and its setters at ~510/~619)

**Interfaces:** None — internal effect, no new exports.

- [ ] **Step 1: Add the history-trap effect**

In `ClassesPage` (the component holding `booked` state), add this effect near the other effects that react to `booked` (search for `const [booked, setBooked]` around line 402 and add the effect right after the component's other `useEffect` calls that depend on `booked`):

```ts
  useEffect(() => {
    if (!booked) return;

    window.history.pushState(null, "", window.location.href);
    function trapBack() {
      window.history.pushState(null, "", window.location.href);
    }
    window.addEventListener("popstate", trapBack);
    return () => window.removeEventListener("popstate", trapBack);
  }, [booked]);
```

This pushes one history marker as soon as `booked` becomes truthy (covers both the paid-checkout path, which already lands here via a URL change, and the direct membership-booking path, which is a local state swap with no URL change) and re-pushes on every `popstate` while `booked` is set, so the browser Back button never actually navigates away from the `ThankYou` screen. It's automatically torn down (`onAnother` sets `booked` back to `null`, the effect's condition becomes false, and the cleanup removes the listener; unmount also runs the cleanup).

- [ ] **Step 2: Manual verification**

Run `npm run dev`, complete a booking (both the free-membership path and, if you have a way to trigger it in a test/staging Stripe mode, the paid path), land on the ThankYou screen, then click the browser's Back button. Confirm the page does not navigate back to the schedule/form — it stays on ThankYou. Then click "Book another class" (`onAnother`) and confirm Back now behaves normally again (no leftover trap).

- [ ] **Step 3: Commit**

```bash
git add src/routes/classes.\$memberId.tsx
git commit -m "fix: trap browser back button on the booking ThankYou screen"
```

---

### Task 5: Fuller UTM capture on the landing form

**Files:**
- Modify: `src/components/OpenBarreLanding.tsx` (`StoredAttribution` type, `persistAttributionIfPresent`, the partial-lead-capture effect, the final `onSubmit` tracking payload)
- Test: create `src/components/open-barre-landing-attribution.test.ts` for the pure, extractable parsing logic

**Interfaces:**
- Produces: `parseAttributionFromSearch(search: string): StoredAttribution` — a pure function extracted from the existing inline `URLSearchParams` parsing, so it's unit-testable without a DOM/router.

- [ ] **Step 1: Write the failing test**

Create `src/components/open-barre-landing-attribution.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAttributionFromSearch } from "./OpenBarreLanding.tsx";

describe("attribution capture", () => {
  it("captures utm_term, utm_content, gclid, and fbclid alongside the existing utm fields", () => {
    const attribution = parseAttributionFromSearch(
      "?utm_source=google&utm_medium=cpc&utm_campaign=trial&utm_term=barre+class&utm_content=variant-a&gclid=abc123&fbclid=xyz789",
    );

    assert.equal(attribution.utmSource, "google");
    assert.equal(attribution.utmMedium, "cpc");
    assert.equal(attribution.utmCampaign, "trial");
    assert.equal(attribution.utmTerm, "barre class");
    assert.equal(attribution.utmContent, "variant-a");
    assert.equal(attribution.gclid, "abc123");
    assert.equal(attribution.fbclid, "xyz789");
  });

  it("omits fields that are absent from the query string", () => {
    const attribution = parseAttributionFromSearch("?utm_source=google");
    assert.equal(attribution.utmSource, "google");
    assert.equal(attribution.utmTerm, undefined);
    assert.equal(attribution.gclid, undefined);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test src/components/open-barre-landing-attribution.test.ts`
Expected: FAIL — `parseAttributionFromSearch` is not exported yet.

- [ ] **Step 3: Extract and export the parsing function; extend `StoredAttribution`**

In `src/components/OpenBarreLanding.tsx`, change the `StoredAttribution` type (~line 82-88) to:

```ts
type StoredAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
};
```

Add this exported pure function above `persistAttributionIfPresent` (~line 92):

```ts
export function parseAttributionFromSearch(search: string): Omit<StoredAttribution, "referrer" | "landingPage"> {
  const params = new URLSearchParams(search);
  const attribution: Omit<StoredAttribution, "referrer" | "landingPage"> = {};
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmTerm = params.get("utm_term");
  const utmContent = params.get("utm_content");
  const gclid = params.get("gclid");
  const fbclid = params.get("fbclid");
  if (utmSource) attribution.utmSource = utmSource;
  if (utmMedium) attribution.utmMedium = utmMedium;
  if (utmCampaign) attribution.utmCampaign = utmCampaign;
  if (utmTerm) attribution.utmTerm = utmTerm;
  if (utmContent) attribution.utmContent = utmContent;
  if (gclid) attribution.gclid = gclid;
  if (fbclid) attribution.fbclid = fbclid;
  return attribution;
}
```

Update `persistAttributionIfPresent` (~lines 95-115) to use it:

```ts
function persistAttributionIfPresent(routeSource: string) {
  if (typeof window === "undefined") return;
  const parsed = parseAttributionFromSearch(window.location.search);
  if (Object.keys(parsed).length === 0) return;

  const attribution: StoredAttribution = {
    ...parsed,
    utmMedium: parsed.utmMedium ?? routeSource,
    referrer: document.referrer || undefined,
    landingPage: window.location.href,
  };
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage unavailable (private mode quota) - attribution just won't persist
  }
}
```

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx tsx --test src/components/open-barre-landing-attribution.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Thread the four new fields into both submit-time payloads**

In the partial-lead-capture effect (~lines 290-308), the `submitPartialLead` call currently reads `params.get("utm_source")` etc directly plus `stored.*` fallbacks. Add the four new fields the same way:

```ts
    submitPartialLead({
      data: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        countryCode: form.countryCode,
        phoneNumber: form.phoneNumber.trim(),
        homeLocationId: form.homeLocationId || undefined,
        utmSource: params.get("utm_source") ?? stored.utmSource,
        utmMedium: params.get("utm_medium") ?? stored.utmMedium ?? routeSource,
        utmCampaign: params.get("utm_campaign") ?? stored.utmCampaign,
        utmTerm: params.get("utm_term") ?? stored.utmTerm,
        utmContent: params.get("utm_content") ?? stored.utmContent,
        gclid: params.get("gclid") ?? stored.gclid,
        fbclid: params.get("fbclid") ?? stored.fbclid,
        referrer: stored.referrer ?? document.referrer,
        landingPage: stored.landingPage ?? window.location.href,
        abVariant: variant,
      },
    }).catch((e) => console.debug("[debug:signup] partial lead capture failed", e));
```

Do the same in the final `onSubmit`'s `trackingPayload` (~lines 374-386):

```ts
      const trackingPayload = captureLead
        ? {
            utmSource: params.get("utm_source") ?? stored.utmSource ?? undefined,
            utmMedium: params.get("utm_medium") ?? stored.utmMedium ?? routeSource,
            utmCampaign: params.get("utm_campaign") ?? stored.utmCampaign ?? undefined,
            utmTerm: params.get("utm_term") ?? stored.utmTerm ?? undefined,
            utmContent: params.get("utm_content") ?? stored.utmContent ?? undefined,
            gclid: params.get("gclid") ?? stored.gclid ?? undefined,
            fbclid: params.get("fbclid") ?? stored.fbclid ?? undefined,
            referrer:
              stored.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined),
            landingPage:
              stored.landingPage ??
              (typeof window !== "undefined" ? window.location.href : undefined),
            abVariant: variant,
          }
        : { abVariant: variant };
```

- [ ] **Step 6: Add the four fields to the server-side types they flow into**

In `src/lib/signup-and-enroll.helpers.ts`, add `utmTerm?: string; utmContent?: string; gclid?: string; fbclid?: string;` to both `SignupAndEnrollInput` and `LeadCapturePayload` (same spot as Task 2's `classType` addition — if Task 2 already ran, add these alongside it). In `runSignupAndEnroll`'s `captureLead` call block, pass them through the same way as the existing `utmSource`/`utmMedium`/`utmCampaign`.

In `src/lib/momence.functions.ts`'s `captureLead` function, add `utm_term: payload.utmTerm ?? "", utm_content: payload.utmContent ?? "", gclid: payload.gclid ?? "", fbclid: payload.fbclid ?? "",` to the `leadBody` object (~line 222-241), alongside the existing `utm_source`/`utm_medium`/`utm_campaign` lines. Also add matching fields to the `captureLeadPartial` server fn's input schema and body construction if it constructs a separate `leadBody` (check the file for a second `SignupInput`/partial-lead zod schema and mirror the same four fields there).

- [ ] **Step 7: Run the full test suite for touched files**

Run: `npx tsx --test src/components/open-barre-landing-attribution.test.ts src/lib/signup-and-enroll.helpers.test.ts src/lib/momence.functions.test.ts`
Expected: all PASS

- [ ] **Step 8: Manual verification**

Run `npm run dev`, visit `/?utm_source=test&utm_medium=email&utm_campaign=jul&utm_term=barre&utm_content=v1&gclid=g1&fbclid=f1`, fill the form partially (name/email/phone) and confirm (via browser devtools network tab or server logs) the partial-lead payload includes all seven attribution fields; complete the signup and confirm the final payload does too.

- [ ] **Step 9: Commit**

```bash
git add src/components/OpenBarreLanding.tsx src/components/open-barre-landing-attribution.test.ts src/lib/signup-and-enroll.helpers.ts src/lib/momence.functions.ts
git commit -m "feat: capture utm_term, utm_content, gclid, fbclid attribution"
```

---

## Self-Review Notes

- **Spec coverage:** All 5 spec sections have a task. §2's respond.io custom-field format uncertainty is explicitly flagged inline in Task 2 Step 8 rather than silently assumed.
- **Type consistency:** `LeadCapturePayload`/`SignupAndEnrollInput` are extended twice (Task 2 for `classType`, Task 5 for the four attribution fields) — if executed out of order, whichever task runs second should find the type already partially extended and just add its own fields, not clobber the other's.
- **No placeholders:** every step has real, copy-pasteable code.
