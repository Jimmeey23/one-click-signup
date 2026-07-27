# Bengaluru Signup Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/bengaluru` signup route for Kenkere House with its own Momence host, membership product (New Client Intro Pack, ₹1350→₹675, 50% off), barre-only class formats, and lead-capture webhook — while Pop Up and Copper & Cloves show a WhatsApp-contact fallback instead of the signup form.

**Architecture:** Introduces one new pure-data module (`src/lib/momence-cities.ts`) as the single source of truth for which Momence host, locations, and pricing belong to which city. Every place that currently hardcodes a single host/location/membership assumption gets a small city-aware wrapper on top of its existing logic — the existing Mumbai code paths are preserved untouched, Bengaluru is additive. The booking/payment mechanism itself (Stripe → Momence custom-payment checkout → dashboard-cookie auto-book) is unchanged; only *which* membership/host/price it uses becomes resolvable from `homeLocationId`.

**Tech Stack:** React 18 + TanStack Start/Router, TypeScript, Tailwind, `node:test` via `npx tsx --test <file>`, existing Stripe + Momence integrations.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-bengaluru-signup-route-design.md`
- No real subdomain — this is a path route (`/bengaluru`) on the existing domain.
- Momence OAuth credentials (`MOMENCE_CLIENT_ID/SECRET/USERNAME/PASSWORD`) and the dashboard cookie (`MOMENCE_ALL_COOKIES`) are **shared** across Mumbai and Bengaluru hosts — do not add per-city variants of these.
- One new secret is needed: `MOMENCE_API_TOKEN_BLR` (value `qy71rOk8en`, the Bengaluru lead-capture webhook token) — add it to your local `.env` (not committed) before manually testing lead capture against host 33905; it also needs to be added to the deployed environment (Vercel) before this ships to production.
- `GST_RATE` changes from `0.18` to `0.05` globally — this changes the **live** Mumbai Newcomers 2-for-1 Stripe charge amount (₹2065 → ₹1838). This is intentional per your confirmation, not a bug.
- Test runner: `npx tsx --test <file>` (no vitest/jest).

---

### Task 1: City config layer

**Files:**
- Create: `src/lib/momence-cities.ts`
- Test: `src/lib/momence-cities.test.ts`
- Modify: `src/lib/momence-locations.ts` (thin re-export, keeps existing import sites working)
- Modify: `src/lib/momence.server.ts` (`LOCATIONS` export becomes a re-export of the same source)

**Interfaces:**
- Produces: `CityKey`, `CityLocation`, `CITY_HOST_IDS`, `CITY_LOCATIONS`, `hostIdForLocationId(locationId): number`, `cityForLocationId(locationId): CityKey`, `allBookableLocations(): CityLocation[]`, `mapsQueryForLocationId(locationId): string`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/momence-cities.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hostIdForLocationId,
  cityForLocationId,
  allBookableLocations,
  mapsQueryForLocationId,
  CITY_LOCATIONS,
} from "./momence-cities.ts";

describe("Momence city config", () => {
  it("resolves Mumbai locations to host 13752", () => {
    assert.equal(hostIdForLocationId(9030), 13752);
    assert.equal(hostIdForLocationId(29821), 13752);
    assert.equal(cityForLocationId(9030), "mumbai");
  });

  it("resolves Kenkere House to Bengaluru host 33905", () => {
    assert.equal(hostIdForLocationId(22116), 33905);
    assert.equal(cityForLocationId(22116), "bengaluru");
  });

  it("falls back to the Mumbai host for an unrecognized location id", () => {
    assert.equal(hostIdForLocationId(999999), 13752);
    assert.equal(cityForLocationId(999999), "mumbai");
  });

  it("lists only bookable locations, excluding Pop Up and Copper & Cloves", () => {
    const bookable = allBookableLocations();
    const names = bookable.map((l) => l.name);
    assert.ok(names.includes("Kenkere House"));
    assert.ok(!names.includes("Pop Up"));
    assert.ok(!names.includes("Copper & Cloves"));
    assert.equal(
      CITY_LOCATIONS.bengaluru.filter((l) => !l.bookable).length,
      2,
    );
  });

  it("builds a maps query for Kenkere House", () => {
    assert.equal(mapsQueryForLocationId(22116), "Physique 57 India Kenkere House Bengaluru");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test src/lib/momence-cities.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `src/lib/momence-cities.ts`**

```ts
export type CityKey = "mumbai" | "bengaluru";

export type CityLocation = {
  id: number | null; // null = not a real Momence location; UI shows a WhatsApp fallback instead
  name: string;
  bookable: boolean;
};

export const CITY_HOST_IDS: Record<CityKey, number> = {
  mumbai: 13752,
  bengaluru: 33905,
};

export const CITY_LOCATIONS: Record<CityKey, CityLocation[]> = {
  mumbai: [
    { id: 9030, name: "Kwality House, Kemps Corner", bookable: true },
    { id: 29821, name: "Supreme HQ, Bandra", bookable: true },
  ],
  bengaluru: [
    { id: 22116, name: "Kenkere House", bookable: true },
    { id: null, name: "Pop Up", bookable: false },
    { id: null, name: "Copper & Cloves", bookable: false },
  ],
};

const MAPS_QUERY_BY_LOCATION_ID: Record<number, string> = {
  9030: "Physique 57 India Kwality House Kemps Corner Mumbai",
  29821: "Physique 57 India Supreme HQ Bandra Mumbai",
  22116: "Physique 57 India Kenkere House Bengaluru",
};

function cityKeys(): CityKey[] {
  return Object.keys(CITY_LOCATIONS) as CityKey[];
}

export function hostIdForLocationId(locationId: number): number {
  for (const city of cityKeys()) {
    if (CITY_LOCATIONS[city].some((loc) => loc.id === locationId)) return CITY_HOST_IDS[city];
  }
  return CITY_HOST_IDS.mumbai;
}

export function cityForLocationId(locationId: number): CityKey {
  for (const city of cityKeys()) {
    if (CITY_LOCATIONS[city].some((loc) => loc.id === locationId)) return city;
  }
  return "mumbai";
}

export function allBookableLocations(): Array<{ id: number; name: string }> {
  return cityKeys()
    .flatMap((city) => CITY_LOCATIONS[city])
    .filter((loc): loc is CityLocation & { id: number } => loc.bookable && loc.id !== null)
    .map((loc) => ({ id: loc.id, name: loc.name }));
}

export function mapsQueryForLocationId(locationId: number): string {
  return MAPS_QUERY_BY_LOCATION_ID[locationId] ?? `Physique 57 India`;
}
```

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx tsx --test src/lib/momence-cities.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Point the existing duplicated `LOCATIONS` arrays at this new source**

In `src/lib/momence-locations.ts`, replace the whole file with:

```ts
// Client-safe re-export - single source of truth is momence-cities.ts.
import { CITY_LOCATIONS } from "./momence-cities";

export const LOCATIONS = CITY_LOCATIONS.mumbai
  .filter((l) => l.bookable && l.id !== null)
  .map((l) => ({ id: l.id as number, name: l.name })) as ReadonlyArray<{
  id: number;
  name: string;
}>;
```

In `src/lib/momence.server.ts`, replace the hardcoded `LOCATIONS` export (lines 164-167) with:

```ts
export { LOCATIONS } from "./momence-locations";
```

(Keep the `export const MOMENCE_HOST_ID = 13752;` line at the top — Task 2 changes how it's *used*, not this declaration.)

- [ ] **Step 6: Run the full existing test suite once to confirm nothing broke**

Run: `npx tsx --test src/lib/*.test.ts`
Expected: all PASS (this step just guards against the `LOCATIONS` re-export change breaking any existing import)

- [ ] **Step 7: Commit**

```bash
git add src/lib/momence-cities.ts src/lib/momence-cities.test.ts src/lib/momence-locations.ts src/lib/momence.server.ts
git commit -m "feat: add city config layer for Momence host/location resolution"
```

---

### Task 2: Host-id resolution for dashboard-cookie calls (waivers, custom fields, session booking)

**Files:**
- Modify: `src/lib/momence.functions.ts` (`signMemberWaivers`)
- Modify: `src/lib/momence-customer-fields.helpers.ts` (`buildCustomerFieldsDataRequest`)
- Modify: `src/lib/momence-customer-fields.functions.ts` (`SaveCustomerFieldsInput`, `saveCustomerFieldsForMember`)
- Modify: `src/lib/momence-sessions.functions.ts` (`bookSessionWithMomenceMembership`)
- Modify: `src/lib/signup-and-enroll.helpers.ts` (`SignupAndEnrollDependencies.signMemberWaivers`, its call in `runSignupAndEnroll`)
- Modify: `src/routes/classes.$memberId.tsx` (`saveCustomerFieldsFn` call site, ~line 574)
- Test: `src/lib/momence-customer-fields.helpers.test.ts` (extend existing)

**Interfaces:**
- Consumes: `hostIdForLocationId` from Task 1.
- Produces: `signMemberWaivers({ memberId, realSignature, homeLocationId })`, `buildCustomerFieldsDataRequest({ memberId, values, homeLocationId })`, `bookSessionWithMomenceMembership` resolves its dashboard host id from `data.homeLocationId` instead of the `MOMENCE_HOST_ID` import.

- [ ] **Step 1: Write the failing test for `buildCustomerFieldsDataRequest`'s host resolution**

Open `src/lib/momence-customer-fields.helpers.test.ts`, find the existing test(s) for `buildCustomerFieldsDataRequest` and add:

```ts
it("resolves the request path to the Bengaluru host for a Kenkere House member", () => {
  const request = buildCustomerFieldsDataRequest({
    memberId: 123,
    homeLocationId: 22116,
    values: { gender: "Female" },
  });
  assert.equal(request.path, "/host/33905/customer-fields/data");
});

it("keeps the Mumbai host for a Mumbai member", () => {
  const request = buildCustomerFieldsDataRequest({
    memberId: 123,
    homeLocationId: 9030,
    values: { gender: "Female" },
  });
  assert.equal(request.path, "/host/13752/customer-fields/data");
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test src/lib/momence-customer-fields.helpers.test.ts`
Expected: FAIL — `buildCustomerFieldsDataRequest` doesn't accept `homeLocationId` yet, path is still hardcoded to `MOMENCE_CUSTOM_FIELDS_HOST_ID` (13752) for both cases.

- [ ] **Step 3: Update `buildCustomerFieldsDataRequest`**

In `src/lib/momence-customer-fields.helpers.ts`, add the import and update the function signature (~line 85):

```ts
import { hostIdForLocationId } from "./momence-cities";

export function buildCustomerFieldsDataRequest({
  memberId,
  values,
  homeLocationId,
}: {
  memberId: number;
  values: CustomerFieldValues;
  homeLocationId: number;
}) {
  const mappedValues: Record<string, string> = {};
  // ... existing loop unchanged ...

  return {
    path: `/host/${hostIdForLocationId(homeLocationId)}/customer-fields/data`,
    body: {
      memberId,
      // ... existing body fields unchanged ...
    },
  };
}
```

(Keep everything else in the function body identical — only the `path` line and the added parameter change. `MOMENCE_CUSTOM_FIELDS_HOST_ID` can be deleted if nothing else in the file references it — check with `grep -n MOMENCE_CUSTOM_FIELDS_HOST_ID src/lib/momence-customer-fields.helpers.ts` after this edit.)

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx tsx --test src/lib/momence-customer-fields.helpers.test.ts`
Expected: PASS

- [ ] **Step 5: Thread `homeLocationId` through `saveCustomerFieldsForMember` and its call site**

In `src/lib/momence-customer-fields.functions.ts`, add `homeLocationId: z.number().int().positive()` to `SaveCustomerFieldsInput` (~line 22), and pass `homeLocationId: data.homeLocationId` into the `buildCustomerFieldsDataRequest(...)` call (~line 40).

In `src/routes/classes.$memberId.tsx`, update the `saveCustomerFieldsFn` call (~line 574) to include the location:

```ts
      await saveCustomerFieldsFn({
        data: {
          memberId,
          homeLocationId: locationId,
          requiresShoeSize: requiresCycleShoeSize(session),
          values: customFieldValues,
        },
      });
```

(`locationId` is already in scope in this component from `Route.useSearch()` — confirm via the existing usage at line 607/618 in the same file.)

- [ ] **Step 6: Update `signMemberWaivers` to resolve the host from `homeLocationId`**

In `src/lib/momence.functions.ts`, change `signMemberWaivers` (~lines 294-328):

```ts
import { hostIdForLocationId } from "./momence-cities";

async function signMemberWaivers({
  memberId,
  realSignature,
  homeLocationId,
}: {
  memberId: number;
  realSignature: string;
  homeLocationId: number;
}): Promise<{ signedCount: number; availableCount: number }> {
  const hostId = hostIdForLocationId(homeLocationId);
  const res = await momenceDashboardFetch<{ waivers?: DashboardWaiver[] }>(
    `/host/${hostId}/members/${memberId}/waivers`,
    { method: "GET" },
  );
  const waivers = res.waivers ?? [];
  const signRequests = buildDashboardPublicWaiverSignRequests({
    hostId,
    memberId,
    realSignature,
    waivers,
  });
  // ... rest of the function body is unchanged ...
```

- [ ] **Step 7: Thread `homeLocationId` through `SignupAndEnrollDependencies.signMemberWaivers` and `runSignupAndEnroll`**

In `src/lib/signup-and-enroll.helpers.ts`:
- Update the `SignupAndEnrollDependencies` type (~line 62): `signMemberWaivers: (input: { memberId: number; realSignature: string; homeLocationId: number }) => Promise<{ signedCount: number; availableCount: number }>;`
- Update the call in `runSignupAndEnroll` (~line 95): add `homeLocationId: data.homeLocationId,` to the object passed in.

In `src/lib/momence.functions.ts`, `signMemberWaivers` is already wired directly as `signupAndEnrollDependencies.signMemberWaivers` (~line 336) — its signature now matches the updated dependency type automatically since both were changed to accept `homeLocationId`.

- [ ] **Step 8: Update `bookSessionWithMomenceMembership` to resolve its dashboard host**

In `src/lib/momence-sessions.functions.ts`, replace the `MOMENCE_HOST_ID` import and usage:

```ts
import { momenceDashboardFetch, momenceFetch } from "./momence.server";
import { hostIdForLocationId } from "./momence-cities";
```

Then in `bookSessionWithMomenceMembership` (~lines 136-153):

```ts
  const hostId = hostIdForLocationId(data.homeLocationId);
  await momenceDashboardFetch(
    `/host/${hostId}/auto-book/member/${data.memberId}/session/${data.sessionId}`,
    {
      method: "POST",
      headers: {
        Referer: `https://momence.com/dashboard/${hostId}/sessions/${data.sessionId}`,
        "X-Origin": `https://momence.com/dashboard/${hostId}/sessions/${data.sessionId}`,
        "X-Idempotence-Key": globalThis.crypto.randomUUID(),
      },
      body: JSON.stringify({
        autoCheckin: false,
        membershipIds: [boughtMembershipId],
        addToWaitlist: false,
        isCapacityOverriden: false,
        isAgeRestrictionOverridden: false,
      }),
    },
  );
```

(`MOMENCE_HOST_ID` import can be removed from this file if nothing else in it references it.)

- [ ] **Step 9: Run the full test suite for touched files**

Run: `npx tsx --test src/lib/momence-customer-fields.helpers.test.ts src/lib/signup-and-enroll.helpers.test.ts src/lib/momence-booking.helpers.test.ts`
Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add src/lib/momence.functions.ts src/lib/momence-customer-fields.helpers.ts src/lib/momence-customer-fields.helpers.test.ts src/lib/momence-customer-fields.functions.ts src/lib/momence-sessions.functions.ts src/lib/signup-and-enroll.helpers.ts src/routes/classes.\$memberId.tsx
git commit -m "feat: resolve Momence dashboard host id from homeLocationId instead of a global constant"
```

---

### Task 3: Membership + pricing constants (New Client Intro Pack, GST fix)

**Files:**
- Modify: `src/lib/momence-booking.helpers.ts`
- Test: `src/lib/momence-booking.helpers.test.ts` (extend existing)

**Interfaces:**
- Produces: `NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID`, `NEW_CLIENT_INTRO_PACK_PRICE_INR`, `NEW_CLIENT_INTRO_PACK_FULL_PRICE_INR`, `NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID`, `BENGALURU_CUSTOM_PAYMENT_METHOD_ID`, `NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR`, `buildNewClientIntroPackCheckoutRequest`, `isPaidClassForLocation(locationId, className)`, `membershipIdForLocationAndClassName(locationId, className)`, `getSchedulePriceDisplayForLocation(locationId, className)`.
- Consumes: `cityForLocationId` from Task 1.

- [ ] **Step 1: Update the existing GST test to reflect the 5% fix (this test SHOULD now fail against old code — that's expected, it documents the intentional change)**

In `src/lib/momence-booking.helpers.test.ts`, find:

```ts
// 1750 pre-tax + 18% GST = 2065 (the Stripe-charged, post-tax amount)
assert.deepEqual(getSchedulePriceDisplay("powerCycle"), {
  originalPriceInCurrency: null,
  bookingPriceInCurrency: "2065",
  label: "Newcomers 2 for 1",
  slashOriginalPrice: false,
});
```

Change to:

```ts
// 1750 pre-tax + 5% GST = 1838 (the Stripe-charged, post-tax amount)
assert.deepEqual(getSchedulePriceDisplay("powerCycle"), {
  originalPriceInCurrency: null,
  bookingPriceInCurrency: "1838",
  label: "Newcomers 2 for 1",
  slashOriginalPrice: false,
});
```

Also update the corresponding `"Strength Lab Push"` assertion in the same test to `"1838"`.

Also update `src/lib/stripe-checkout.helpers.test.ts`'s comment and assertion:

```ts
// 1750 pre-tax + 5% GST = 1838
assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 183800);
```

- [ ] **Step 2: Run these to confirm they now fail against current code (0.18 GST)**

Run: `npx tsx --test src/lib/momence-booking.helpers.test.ts src/lib/stripe-checkout.helpers.test.ts`
Expected: FAIL — current `GST_RATE = 0.18` produces `2065`/`206500`, not `1838`/`183800`.

- [ ] **Step 3: Fix `GST_RATE` and add the new constants**

In `src/lib/momence-booking.helpers.ts`, change line 16:

```ts
export const GST_RATE = 0.05;
```

Add these new constants after `NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR` (~line 24):

```ts
export const NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID = 654474;
export const NEW_CLIENT_INTRO_PACK_PRICE_INR = "675"; // Momence catalog price sent to /host/checkout
export const NEW_CLIENT_INTRO_PACK_FULL_PRICE_INR = "1350"; // display-only, struck through
export const NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID = 4391;
export const BENGALURU_CUSTOM_PAYMENT_METHOD_ID = 5801;
export const NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR = toGstInclusiveInr(
  NEW_CLIENT_INTRO_PACK_PRICE_INR,
);
```

- [ ] **Step 4: Run the tests again to confirm the GST fix passes**

Run: `npx tsx --test src/lib/momence-booking.helpers.test.ts src/lib/stripe-checkout.helpers.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for `appliedPriceRuleIds` support in `buildMembershipCheckoutRequest`**

Add to `src/lib/momence-booking.helpers.test.ts`:

```ts
it("includes appliedPriceRuleIds in the checkout body when provided", () => {
  const request = buildMembershipCheckoutRequest({
    memberId: 27473761,
    homeLocationId: 22116,
    membershipId: 654474,
    attemptedPriceInCurrency: "675",
    paymentMethodType: "custom",
    customPaymentMethodId: 5801,
    appliedPriceRuleIds: [4391],
  });

  assert.deepEqual(request.body, {
    memberId: 27473761,
    homeLocationId: 22116,
    items: [
      { id: "1", type: "subscription", membershipId: 654474, attemptedPriceInCurrency: "675" },
    ],
    paymentMethods: [{ id: "1", type: "custom", customPaymentMethodId: 5801 }],
    appliedPriceRuleIds: [4391],
  });
});

it("builds the New Client Intro Pack checkout request", () => {
  const request = buildNewClientIntroPackCheckoutRequest({
    memberId: 27473761,
    homeLocationId: 22116,
  });

  assert.deepEqual(request.body, {
    memberId: 27473761,
    homeLocationId: 22116,
    items: [
      { id: "1", type: "subscription", membershipId: 654474, attemptedPriceInCurrency: "675" },
    ],
    paymentMethods: [{ id: "1", type: "custom", customPaymentMethodId: 5801 }],
    appliedPriceRuleIds: [4391],
  });
});

it("treats every Bengaluru class as paid, regardless of class name", () => {
  assert.equal(isPaidClassForLocation(22116, "Barre 57"), true);
  assert.equal(isPaidClassForLocation(9030, "Barre 57"), false);
  assert.equal(isPaidClassForLocation(9030, "powerCycle"), true);
});

it("resolves the New Client Intro Pack membership id for Bengaluru locations", () => {
  assert.equal(membershipIdForLocationAndClassName(22116, "Barre 57"), 654474);
  assert.equal(membershipIdForLocationAndClassName(9030, "Barre 57"), 33609);
  assert.equal(membershipIdForLocationAndClassName(9030, "powerCycle"), 240932);
});

it("shows the struck-through 50%-off price for Bengaluru", () => {
  assert.deepEqual(getSchedulePriceDisplayForLocation(22116, "Barre 57"), {
    originalPriceInCurrency: "1350",
    bookingPriceInCurrency: "709",
    label: "New Client Intro Pack",
    slashOriginalPrice: true,
  });
});
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npx tsx --test src/lib/momence-booking.helpers.test.ts`
Expected: FAIL — none of `appliedPriceRuleIds`, `buildNewClientIntroPackCheckoutRequest`, `isPaidClassForLocation`, `membershipIdForLocationAndClassName`, `getSchedulePriceDisplayForLocation` exist yet.

- [ ] **Step 7: Implement**

In `src/lib/momence-booking.helpers.ts`, add the import at the top:

```ts
import { cityForLocationId } from "./momence-cities";
```

Update `MembershipCheckoutRequest` type (~line 40) to add the optional field:

```ts
export type MembershipCheckoutRequest = {
  memberId: number;
  homeLocationId: number;
  membershipId: number;
  attemptedPriceInCurrency: string;
  appliedPriceRuleIds?: number[];
} & (
  | { paymentMethodType: "free" }
  | { paymentMethodType: "custom"; customPaymentMethodId: number; customPaymentNote?: string }
);
```

Update `buildMembershipCheckoutRequest` (~line 130) to thread it into the body:

```ts
export function buildMembershipCheckoutRequest({
  memberId,
  homeLocationId,
  membershipId,
  attemptedPriceInCurrency,
  appliedPriceRuleIds,
  ...paymentMethod
}: MembershipCheckoutRequest) {
  return {
    path: "/host/checkout",
    body: {
      memberId,
      homeLocationId,
      items: [{ id: "1", type: "subscription", membershipId, attemptedPriceInCurrency }],
      paymentMethods: [
        paymentMethod.paymentMethodType === "custom"
          ? {
              id: "1",
              type: "custom",
              customPaymentMethodId: paymentMethod.customPaymentMethodId,
              ...(paymentMethod.customPaymentNote ? { note: paymentMethod.customPaymentNote } : {}),
            }
          : { id: "1", type: "free" },
      ],
      ...(appliedPriceRuleIds ? { appliedPriceRuleIds } : {}),
    },
  } as const;
}
```

Add these new functions after `buildNewcomersMembershipCheckoutRequest` (~line 179):

```ts
export function buildNewClientIntroPackCheckoutRequest({
  memberId,
  homeLocationId,
}: {
  memberId: number;
  homeLocationId: number;
}) {
  return buildMembershipCheckoutRequest({
    memberId,
    homeLocationId,
    membershipId: NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID,
    attemptedPriceInCurrency: NEW_CLIENT_INTRO_PACK_PRICE_INR,
    paymentMethodType: "custom",
    customPaymentMethodId: BENGALURU_CUSTOM_PAYMENT_METHOD_ID,
    appliedPriceRuleIds: [NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID],
  });
}

export function isPaidClassForLocation(locationId: number, className: string): boolean {
  if (cityForLocationId(locationId) === "bengaluru") return true;
  return isPaidNewcomersClassName(className);
}

export function membershipIdForLocationAndClassName(locationId: number, className: string): number {
  if (cityForLocationId(locationId) === "bengaluru") return NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID;
  return membershipIdForClassName(className);
}

export function getSchedulePriceDisplayForLocation(
  locationId: number,
  className: string,
): ReturnType<typeof getSchedulePriceDisplay> {
  if (cityForLocationId(locationId) === "bengaluru") {
    return {
      originalPriceInCurrency: NEW_CLIENT_INTRO_PACK_FULL_PRICE_INR,
      bookingPriceInCurrency: NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR,
      label: "New Client Intro Pack",
      slashOriginalPrice: true,
    };
  }
  return getSchedulePriceDisplay(className);
}
```

- [ ] **Step 8: Run the tests again to confirm they pass**

Run: `npx tsx --test src/lib/momence-booking.helpers.test.ts`
Expected: PASS (all tests, including the 5 new ones)

- [ ] **Step 9: Commit**

```bash
git add src/lib/momence-booking.helpers.ts src/lib/momence-booking.helpers.test.ts src/lib/stripe-checkout.helpers.test.ts
git commit -m "feat: add New Client Intro Pack pricing/membership constants and fix GST_RATE to 5%"
```

---

### Task 4: Generalize Stripe checkout to a product registry

**Files:**
- Modify: `src/lib/stripe-checkout.helpers.ts`
- Modify: `src/lib/stripe-checkout.functions.ts`
- Modify: `src/lib/stripe-checkout.helpers.test.ts` (rename/extend)

**Interfaces:**
- Consumes: `NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID`, `NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR`, `BENGALURU_CUSTOM_PAYMENT_METHOD_ID`, `NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID`, `buildNewClientIntroPackCheckoutRequest` from Task 3.
- Produces: `buildPaidCheckoutSessionParams(input)` (replaces `buildNewcomersCheckoutSessionParams`), `PAID_MEMBERSHIP_PRODUCTS` registry.

- [ ] **Step 1: Update the existing test to use the generalized function name and add a Bengaluru case**

Rename `src/lib/stripe-checkout.helpers.test.ts`'s import and first test, then add a second:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPaidCheckoutSessionParams } from "./stripe-checkout.helpers.ts";

describe("Stripe checkout helpers", () => {
  it("builds hosted Checkout params for the newcomers membership", () => {
    const params = buildPaidCheckoutSessionParams({
      memberId: 27473761,
      sessionId: 15525,
      homeLocationId: 9030,
      membershipId: 240932,
      className: "powerCycle",
      sessionStartsAt: "2026-06-05T10:30:00.000Z",
      successUrl: "https://trial.physique57india.com/classes/27473761",
      cancelUrl: "https://trial.physique57india.com/classes/27473761?locationId=9030",
    });

    assert.equal(params.mode, "payment");
    assert.deepEqual(params.metadata, {
      memberId: "27473761",
      sessionId: "15525",
      homeLocationId: "9030",
      membershipId: "240932",
      className: "powerCycle",
    });
    // 1750 pre-tax + 5% GST = 1838
    assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 183800);
    assert.equal(
      params.line_items?.[0]?.price_data?.product_data?.name,
      "powerCycle Newcomers 2 For 1",
    );
  });

  it("builds hosted Checkout params for the Bengaluru New Client Intro Pack", () => {
    const params = buildPaidCheckoutSessionParams({
      memberId: 99001,
      sessionId: 40001,
      homeLocationId: 22116,
      membershipId: 654474,
      className: "Barre 57",
      sessionStartsAt: "2026-08-01T05:00:00.000Z",
      successUrl: "https://trial.physique57india.com/classes/99001",
      cancelUrl: "https://trial.physique57india.com/classes/99001?locationId=22116",
    });

    assert.deepEqual(params.metadata, {
      memberId: "99001",
      sessionId: "40001",
      homeLocationId: "22116",
      membershipId: "654474",
      className: "Barre 57",
    });
    // 675 pre-tax + 5% GST = 709 (rounded)
    assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 70900);
    assert.equal(
      params.line_items?.[0]?.price_data?.product_data?.name,
      "Barre 57 New Client Intro Pack",
    );
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test src/lib/stripe-checkout.helpers.test.ts`
Expected: FAIL — `buildPaidCheckoutSessionParams` doesn't exist; `buildNewcomersCheckoutSessionParams` doesn't take `membershipId`.

- [ ] **Step 3: Implement the registry and generalized builder**

Replace the contents of `src/lib/stripe-checkout.helpers.ts`:

```ts
import type Stripe from "stripe";
import {
  NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
  NEWCOMERS_2_FOR_1_PRICE_INR,
  NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR,
  MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID,
  NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID,
  NEW_CLIENT_INTRO_PACK_PRICE_INR,
  NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR,
  NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID,
  BENGALURU_CUSTOM_PAYMENT_METHOD_ID,
} from "./momence-booking.helpers.ts";

export type PaidMembershipProduct = {
  label: string;
  attemptedPriceInCurrency: string;
  stripeChargePriceInCurrency: string;
  customPaymentMethodId: number;
  appliedPriceRuleIds?: number[];
};

export const PAID_MEMBERSHIP_PRODUCTS: Record<number, PaidMembershipProduct> = {
  [NEWCOMERS_2_FOR_1_MEMBERSHIP_ID]: {
    label: "Newcomers 2 For 1",
    attemptedPriceInCurrency: NEWCOMERS_2_FOR_1_PRICE_INR,
    stripeChargePriceInCurrency: NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR,
    customPaymentMethodId: MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID,
  },
  [NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID]: {
    label: "New Client Intro Pack",
    attemptedPriceInCurrency: NEW_CLIENT_INTRO_PACK_PRICE_INR,
    stripeChargePriceInCurrency: NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR,
    customPaymentMethodId: BENGALURU_CUSTOM_PAYMENT_METHOD_ID,
    appliedPriceRuleIds: [NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID],
  },
};

export function paidMembershipProduct(membershipId: number): PaidMembershipProduct {
  const product = PAID_MEMBERSHIP_PRODUCTS[membershipId];
  if (!product) {
    throw new Error(`No paid membership product configured for membershipId ${membershipId}`);
  }
  return product;
}

export type PaidCheckoutSessionInput = {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
  membershipId: number;
  className: string;
  sessionStartsAt: string;
  successUrl: string;
  cancelUrl: string;
};

export type PaidCheckoutMetadata = {
  memberId: string;
  sessionId: string;
  homeLocationId: string;
  membershipId: string;
  className: string;
};

function appendSuccessParams(input: PaidCheckoutSessionInput): string {
  const url = new URL(input.successUrl);
  url.searchParams.set("locationId", String(input.homeLocationId));
  url.searchParams.set("checkout_session_id", "{CHECKOUT_SESSION_ID}");
  url.searchParams.set("paidSessionId", String(input.sessionId));
  url.searchParams.set("paidLocationId", String(input.homeLocationId));
  return url.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
}

export function buildPaidCheckoutMetadata(input: PaidCheckoutSessionInput): PaidCheckoutMetadata {
  return {
    memberId: String(input.memberId),
    sessionId: String(input.sessionId),
    homeLocationId: String(input.homeLocationId),
    membershipId: String(input.membershipId),
    className: input.className,
  };
}

export function buildPaidCheckoutSessionParams(
  input: PaidCheckoutSessionInput,
): Stripe.Checkout.SessionCreateParams {
  const metadata = buildPaidCheckoutMetadata(input);
  const product = paidMembershipProduct(input.membershipId);

  return {
    mode: "payment",
    client_reference_id: `${input.memberId}:${input.sessionId}`,
    success_url: appendSuccessParams(input),
    cancel_url: input.cancelUrl,
    metadata,
    payment_intent_data: { metadata },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: Number(product.stripeChargePriceInCurrency) * 100,
          product_data: {
            name: `${input.className} ${product.label}`,
            description: `Physique 57 India ${product.label} membership.`,
          },
        },
      },
    ],
  };
}
```

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx tsx --test src/lib/stripe-checkout.helpers.test.ts`
Expected: PASS (both tests)

- [ ] **Step 5: Update `stripe-checkout.functions.ts` to use the registry**

Replace the relevant parts of `src/lib/stripe-checkout.functions.ts`:

```ts
import {
  buildCompatibleMembershipsRequest,
  buildMembershipCheckoutRequest,
  findCompatibleBoughtMembershipId,
  isPaidClassForLocation,
  type CompatibleMembershipsResponse,
} from "./momence-booking.helpers";
import { momenceFetch, requireServerEnv } from "./momence.server";
import { bookSessionWithMomenceMembership } from "./momence-sessions.functions";
import {
  buildPaidCheckoutSessionParams,
  paidMembershipProduct,
  type PaidCheckoutMetadata,
} from "./stripe-checkout.helpers";

const STRIPE_API_VERSION = "2026-05-27.dahlia";

const CheckoutSessionInput = z.object({
  memberId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  homeLocationId: z.number().int().positive(),
  membershipId: z.number().int().positive(),
  className: z.string().trim().min(1).max(200),
  sessionStartsAt: z.string().datetime(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const CompleteCheckoutInput = z.object({
  checkoutSessionId: z.string().trim().min(1).max(200),
  memberId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  homeLocationId: z.number().int().positive(),
});

const CheckoutMetadataSchema = z.object({
  memberId: z.coerce.number().int().positive(),
  sessionId: z.coerce.number().int().positive(),
  homeLocationId: z.coerce.number().int().positive(),
  membershipId: z.coerce.number().int().positive(),
  className: z.string().trim().min(1),
});
```

(Keep `getStripeClient`, `cachedStripe`/`cachedStripeKey` unchanged.)

```ts
function parseCheckoutMetadata(metadata: Stripe.Metadata | null | undefined) {
  return CheckoutMetadataSchema.parse(metadata ?? {});
}

function assertCheckoutMatchesExpected(
  metadata: z.infer<typeof CheckoutMetadataSchema>,
  expected?: z.infer<typeof CompleteCheckoutInput>,
) {
  paidMembershipProduct(metadata.membershipId); // throws if the membershipId isn't a known paid product
  if (!isPaidClassForLocation(metadata.homeLocationId, metadata.className)) {
    throw new Error("Stripe Checkout session is not for a paid class/location.");
  }
  if (!expected) return;
  if (
    metadata.memberId !== expected.memberId ||
    metadata.sessionId !== expected.sessionId ||
    metadata.homeLocationId !== expected.homeLocationId
  ) {
    throw new Error("Stripe Checkout session metadata does not match this booking request.");
  }
}

async function findBoughtMembershipId({
  memberId,
  sessionId,
  homeLocationId,
  membershipId,
}: {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
  membershipId: number;
}): Promise<number | null> {
  const compatibilityRequest = buildCompatibleMembershipsRequest({
    memberId,
    sessionId,
    homeLocationId,
  });
  const compatibleMemberships = await momenceFetch<CompatibleMembershipsResponse>(
    compatibilityRequest.path,
    { method: "POST", body: JSON.stringify(compatibilityRequest.body) },
  );
  return findCompatibleBoughtMembershipId(compatibleMemberships, membershipId);
}

async function ensurePaidMembership({
  memberId,
  sessionId,
  homeLocationId,
  membershipId,
}: {
  memberId: number;
  sessionId: number;
  homeLocationId: number;
  membershipId: number;
}) {
  const existing = await findBoughtMembershipId({ memberId, sessionId, homeLocationId, membershipId });
  if (existing) return;

  const product = paidMembershipProduct(membershipId);
  const purchaseRequest = buildMembershipCheckoutRequest({
    memberId,
    homeLocationId,
    membershipId,
    attemptedPriceInCurrency: product.attemptedPriceInCurrency,
    paymentMethodType: "custom",
    customPaymentMethodId: product.customPaymentMethodId,
    customPaymentNote: "Paid via Stripe Checkout",
    ...(product.appliedPriceRuleIds ? { appliedPriceRuleIds: product.appliedPriceRuleIds } : {}),
  });

  await momenceFetch(purchaseRequest.path, {
    method: "POST",
    body: JSON.stringify(purchaseRequest.body),
  });
}

function isAlreadyFulfilledBookingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("session-bought-membership-already-used") ||
    error.message.includes("err-session-purchase-limit-reached") ||
    error.message.toLowerCase().includes("already booked")
  );
}

export async function fulfillPaidCheckoutSession(
  checkoutSessionId: string,
  expected?: z.infer<typeof CompleteCheckoutInput>,
) {
  const stripe = await getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);

  if (checkoutSession.payment_status !== "paid" && checkoutSession.status !== "complete") {
    throw new Error("Stripe Checkout session is not paid yet.");
  }

  const metadata = parseCheckoutMetadata(checkoutSession.metadata);
  assertCheckoutMatchesExpected(metadata, expected);
  const product = paidMembershipProduct(metadata.membershipId);

  const bookingInput = {
    memberId: metadata.memberId,
    sessionId: metadata.sessionId,
    homeLocationId: metadata.homeLocationId,
  };

  await ensurePaidMembership({ ...bookingInput, membershipId: metadata.membershipId });

  try {
    return await bookSessionWithMomenceMembership({
      ...bookingInput,
      membershipId: metadata.membershipId,
      membershipLabel: product.label,
    });
  } catch (error) {
    if (isAlreadyFulfilledBookingError(error)) {
      return { booked: true as const, method: "already-booked" as const };
    }
    throw error;
  }
}

export async function handleStripeWebhook(rawBody: string, signature: string | null) {
  if (!signature) throw new Error("Missing Stripe signature header.");

  const stripe = await getStripeClient();
  const webhookSecret = await requireServerEnv("STRIPE_WEBHOOK_SECRET");
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillPaidCheckoutSession(session.id);
    return { received: true as const, fulfilled: true as const };
  }

  return { received: true as const, fulfilled: false as const };
}

export const createNewcomersCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => CheckoutSessionInput.parse(i))
  .handler(async ({ data }) => {
    if (!isPaidClassForLocation(data.homeLocationId, data.className)) {
      throw new Error("This class does not require the paid checkout flow.");
    }

    const stripe = await getStripeClient();
    const params = buildPaidCheckoutSessionParams(data);
    const checkoutSession = await stripe.checkout.sessions.create(params);

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return {
      id: checkoutSession.id,
      url: checkoutSession.url,
      metadata: params.metadata as PaidCheckoutMetadata,
    };
  });

export const completeNewcomersCheckoutBooking = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => CompleteCheckoutInput.parse(i))
  .handler(async ({ data }) => {
    return fulfillPaidCheckoutSession(data.checkoutSessionId, data);
  });
```

Note: exported server-fn names (`createNewcomersCheckoutSession`, `completeNewcomersCheckoutBooking`) are kept as-is even though they're no longer Newcomers-specific, to avoid touching every import site in `classes.$memberId.tsx` — Task 5 adds the new `membershipId` field to the call, not a rename.

- [ ] **Step 6: Run the full test suite for touched files**

Run: `npx tsx --test src/lib/stripe-checkout.helpers.test.ts src/lib/momence-booking.helpers.test.ts`
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/stripe-checkout.helpers.ts src/lib/stripe-checkout.functions.ts src/lib/stripe-checkout.helpers.test.ts
git commit -m "refactor: generalize Stripe checkout to a paid-membership-product registry"
```

---

### Task 5: Make `classes.$memberId.tsx` city-aware

**Files:**
- Modify: `src/routes/classes.$memberId.tsx`

**Interfaces:**
- Consumes: `isPaidClassForLocation`, `membershipIdForLocationAndClassName`, `getSchedulePriceDisplayForLocation` from Task 3; `allBookableLocations`, `mapsQueryForLocationId` from Task 1.

This task has no isolated unit test — `classes.$memberId.tsx` is a route component with heavy DOM/network dependencies. Verify manually per Step 6.

- [ ] **Step 1: Swap imports**

At the top of `src/routes/classes.$memberId.tsx`, change:

```ts
import { getSchedulePriceDisplay, isPaidNewcomersClassName } from "@/lib/momence-booking.helpers";
```

to:

```ts
import {
  isPaidClassForLocation,
  membershipIdForLocationAndClassName,
  getSchedulePriceDisplayForLocation,
} from "@/lib/momence-booking.helpers";
```

- [ ] **Step 2: Replace the three `isPaidNewcomersClassName(s.name)` call sites with the location-aware version**

At line ~596 (`continueBooking`):

```ts
      if (isPaidClassForLocation(locationId, s.name)) {
```

At line ~906 (`SessionCard` render in the schedule list):

```ts
                      requiresPayment={isPaidClassForLocation(locationId, s.name)}
```

- [ ] **Step 3: Pass `homeLocationId` into the paid-checkout call and add `membershipId`**

In `continueBooking` (~lines 603-613), add `membershipId`:

```ts
        const checkout = await createCheckoutFn({
          data: {
            memberId,
            sessionId: s.id,
            homeLocationId: locationId,
            membershipId: membershipIdForLocationAndClassName(locationId, s.name),
            className: s.name,
            sessionStartsAt: s.startsAt,
            successUrl: `${window.location.origin}/classes/${memberId}`,
            cancelUrl: currentUrl.toString(),
          },
        });
```

- [ ] **Step 4: Thread `locationId` into `CustomerFieldsModal` and use the location-aware paid check there**

`CustomerFieldsModal` currently computes `requiresPayment = isPaidNewcomersClassName(session.name)` (~line 1095) with no `locationId` prop. Add a `locationId: number` prop:

```ts
function CustomerFieldsModal({
  session,
  locationId,
  values,
  errors,
  submitError,
  saving,
  requiresShoeSize,
  onChange,
  onCancel,
  onSubmit,
}: {
  session: SessionDTO;
  locationId: number;
  values: CustomerFieldValues;
  errors: CustomerFieldErrors;
  submitError: string | null;
  saving: boolean;
  requiresShoeSize: boolean;
  onChange: (field: keyof CustomerFieldValues, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const requiresPayment = isPaidClassForLocation(locationId, session.name);
```

At the modal's render call site (~line 918), add `locationId={locationId}` to the props passed in (`locationId` is already in scope in `ClassesPage` via `Route.useSearch()`).

- [ ] **Step 5: Use the location-aware price display and combined location list**

At line ~1461 (`SessionCard`), change:

```ts
  const priceDisplay = getSchedulePriceDisplayForLocation(locationId, s.name);
```

`SessionCard` needs a `locationId` prop added the same way `requiresPayment` was already a prop — add `locationId: number` to its prop type and pass `locationId={locationId}` from the render call site (~line 900-909), alongside the existing `requiresPayment` prop.

Replace `bookingLocationForId` (~lines 1826-1833):

```ts
import { allBookableLocations, mapsQueryForLocationId } from "@/lib/momence-cities";

function bookingLocationForId(locationId: number): BookedClass["location"] {
  const location =
    allBookableLocations().find((l) => l.id === locationId) ?? allBookableLocations()[0];
  return { id: location.id, name: location.name, mapsQ: mapsQueryForLocationId(location.id) };
}
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`. Since there's no way to sign up a real Bengaluru member end-to-end without live Momence credentials for host 33905, verify what's testable locally:
1. Existing Mumbai flow still works end-to-end (signup → schedule → book a free Barre class → ThankYou) with no regressions.
2. Existing Mumbai paid flow (powerCycle/strength class) still redirects to Stripe with the ₹1838 (post-GST-fix) amount, and completes booking on return.
3. Manually visit `/classes/999?locationId=22116` (a fake memberId is fine for this UI-only check) and confirm the page doesn't crash resolving `currentLoc`/`classTypeOptionsForLocation` for the Bengaluru location id — it should show "Kenkere House" as the studio and only Barre-format classes in the type filter.

- [ ] **Step 7: Commit**

```bash
git add src/routes/classes.\$memberId.tsx
git commit -m "feat: make classes/\$memberId route city-aware for pricing and paid-format checks"
```

---

### Task 6: Per-city lead-capture webhook

**Files:**
- Modify: `src/lib/momence.functions.ts` (`captureLead`)
- Test: `src/lib/momence.functions.test.ts` (created in the other in-flight plan's Task 2 — if that hasn't run yet, create it here)

**Interfaces:**
- Consumes: `hostIdForLocationId` from Task 1.

- [ ] **Step 1: Write the failing test for the webhook URL/token selection**

`captureLead` makes a live `fetch` call, so isolate the *URL and token selection* into a small pure function first. Add to `src/lib/momence.functions.test.ts` (create the file if Task 2 of the other plan hasn't landed yet — same file, just add this describe block):

```ts
import { leadWebhookConfigForLocation } from "./momence.functions.ts";

describe("lead webhook config", () => {
  it("uses the Mumbai host and MOMENCE_API_TOKEN for Mumbai locations", () => {
    const config = leadWebhookConfigForLocation(9030, { MOMENCE_API_TOKEN: "mumbai-token" });
    assert.equal(config.url, "https://api.momence.com/integrations/customer-leads/13752/collect");
    assert.equal(config.token, "mumbai-token");
  });

  it("uses the Bengaluru host and MOMENCE_API_TOKEN_BLR for Kenkere House", () => {
    const config = leadWebhookConfigForLocation(22116, {
      MOMENCE_API_TOKEN: "mumbai-token",
      MOMENCE_API_TOKEN_BLR: "blr-token",
    });
    assert.equal(config.url, "https://api.momence.com/integrations/customer-leads/33905/collect");
    assert.equal(config.token, "blr-token");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test src/lib/momence.functions.test.ts`
Expected: FAIL — `leadWebhookConfigForLocation` doesn't exist.

- [ ] **Step 3: Extract and use it in `captureLead`**

In `src/lib/momence.functions.ts`, add near the top (after imports):

```ts
import { hostIdForLocationId } from "./momence-cities";

export function leadWebhookConfigForLocation(
  homeLocationId: number,
  env: { MOMENCE_API_TOKEN?: string; MOMENCE_API_TOKEN_BLR?: string },
): { url: string; token: string | undefined } {
  const hostId = hostIdForLocationId(homeLocationId);
  const token = hostId === 33905 ? env.MOMENCE_API_TOKEN_BLR : env.MOMENCE_API_TOKEN;
  return { url: `https://api.momence.com/integrations/customer-leads/${hostId}/collect`, token };
}
```

In `captureLead` (~lines 215-292), `payload` doesn't currently carry `homeLocationId` directly — it has `center` (the resolved name). Add `homeLocationId?: number` to `LeadCapturePayload` (alongside the `classType` field from the other in-flight plan's Task 2, if that's landed — otherwise add both fields together here) and pass it from `runSignupAndEnroll`'s `captureLead` call (in `signup-and-enroll.helpers.ts`, alongside the other fields at ~line 134, add `homeLocationId: data.homeLocationId,`).

Then in `captureLead`, replace the hardcoded token/URL:

```ts
async function captureLead(payload: LeadCapturePayload): Promise<{ ok: boolean; error?: string }> {
  const { url: leadWebhookUrl, token } = leadWebhookConfigForLocation(payload.homeLocationId ?? 0, {
    MOMENCE_API_TOKEN: process.env.MOMENCE_API_TOKEN,
    MOMENCE_API_TOKEN_BLR: process.env.MOMENCE_API_TOKEN_BLR,
  });
  if (!token) {
    console.warn("Lead webhook token not set for this location - skipping lead capture");
    return { ok: false, error: "Lead webhook token not configured" };
  }
  try {
    const leadBody = {
      token,
      sourceId: "8082",
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phoneNumber: payload.phoneE164,
      time: "Flexible / Needs Recommendation",
      center: payload.center,
      type: payload.classType ?? "Barre 57",
      waiverAccepted: payload.waiverAccepted ? "accepted" : "declined",
      event_id: `${payload.stage ?? "completed"}_${payload.memberId ?? "prospect"}_${Date.now()}`,
      utm_source: payload.utmSource ?? "website",
      utm_medium: payload.utmMedium ?? "trial-landing",
      utm_campaign: payload.utmCampaign ?? "open-barre-trial",
      landing_page: payload.landingPage ?? "https://trial.physique57india.com/",
      referrer: payload.referrer ?? "",
      ab_variant: payload.abVariant ?? "",
      lead_stage: payload.stage ?? "completed",
    };

    const res = await fetch(leadWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadBody),
    });
    // ... rest of the function (error handling, respond.io sync, additional webhook forward, return) is unchanged ...
```

(Note the request no longer needs an `Authorization: Bearer` header for this call, matching the existing code's pattern — confirm by reading the current fetch call at ~line 243-250: if it already sends the token in the body only, keep that; if it also sends an `Authorization` header, keep that header too, just switch the value source from `token` (the env-derived constant) to the resolved `token` here.)

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx tsx --test src/lib/momence.functions.test.ts`
Expected: PASS

- [ ] **Step 5: Add the new env var locally for manual testing**

Add to your local `.env` (not committed):

```
MOMENCE_API_TOKEN_BLR=qy71rOk8en
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/momence.functions.ts src/lib/momence.functions.test.ts src/lib/signup-and-enroll.helpers.ts
git commit -m "feat: resolve lead-capture webhook URL and token per city"
```

---

### Task 7: Skip free-membership enrollment for Bengaluru signups

**Files:**
- Modify: `src/lib/signup-and-enroll.helpers.ts` (`SignupAndEnrollInput`, `runSignupAndEnroll`)
- Test: `src/lib/signup-and-enroll.helpers.test.ts` (extend existing)

**Interfaces:**
- Consumes: `cityForLocationId` from Task 1.
- Produces: `SignupAndEnrollInput.city?: CityKey` (defaults to resolving from `homeLocationId` if omitted — see Step 3).

- [ ] **Step 1: Write the failing test**

Add to `src/lib/signup-and-enroll.helpers.test.ts`:

```ts
it("skips the free membership checkout for a Bengaluru signup", async () => {
  let enrollOpenBarreCalled = false;
  const dependencies = {
    createMember: async () => ({ memberId: 1 }),
    signMemberWaivers: async () => ({ signedCount: 1, availableCount: 1 }),
    enrollOpenBarre: async () => {
      enrollOpenBarreCalled = true;
    },
    captureLead: async () => ({ ok: true }),
    resolveCenterName: () => "Kenkere House",
  };

  const result = await runSignupAndEnroll(
    {
      firstName: "Priya",
      lastName: "Shah",
      email: "priya@example.com",
      countryCode: "+91",
      phoneNumber: "9876543210",
      homeLocationId: 22116,
      waiverAccepted: true,
      signatureName: "Priya Shah",
      signatureRealSignature: "sig-data",
    },
    dependencies,
    { captureLead: true },
  );

  assert.equal(enrollOpenBarreCalled, false);
  assert.equal(result.enrolled, false);
  assert.equal(result.enrollError, null);
});

it("still enrolls the free membership for a Mumbai signup", async () => {
  let enrollOpenBarreCalled = false;
  const dependencies = {
    createMember: async () => ({ memberId: 1 }),
    signMemberWaivers: async () => ({ signedCount: 1, availableCount: 1 }),
    enrollOpenBarre: async () => {
      enrollOpenBarreCalled = true;
    },
    captureLead: async () => ({ ok: true }),
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
    },
    dependencies,
    { captureLead: true },
  );

  assert.equal(enrollOpenBarreCalled, true);
});
```

- [ ] **Step 2: Run it to confirm the Bengaluru case fails**

Run: `npx tsx --test src/lib/signup-and-enroll.helpers.test.ts`
Expected: the new Bengaluru test FAILs (`enrollOpenBarreCalled` is currently always `true`); the Mumbai test passes already.

- [ ] **Step 3: Skip enrollment for Bengaluru in `runSignupAndEnroll`**

In `src/lib/signup-and-enroll.helpers.ts`, add the import and wrap the enrollment block (~lines 113-129):

```ts
import { cityForLocationId } from "./momence-cities";

  // ... inside runSignupAndEnroll, after waiver signing ...
  let enrolled = false;
  let enrollError: string | null = null;
  if (cityForLocationId(data.homeLocationId) !== "bengaluru") {
    try {
      const checkoutRequest = buildMembershipCheckoutRequest({
        memberId: created.memberId,
        homeLocationId: data.homeLocationId,
        membershipId: OPEN_BARRE_MEMBERSHIP_ID,
        attemptedPriceInCurrency: "0",
        paymentMethodType: "free",
      });
      await dependencies.enrollOpenBarre(checkoutRequest);
      enrolled = true;
      console.debug("[debug:signup] open barre enrolled", { memberId: created.memberId });
    } catch (e) {
      enrollError = e instanceof Error ? e.message : "Enrollment failed";
      console.error("Membership enrollment failed:", enrollError);
    }
  }
```

Also update the caller in `OpenBarreLanding.tsx`'s `onSubmit` (~line 406): it currently does `if (!result.enrolled) { ...error...; return; }` — this must NOT treat Bengaluru's expected `enrolled: false` as a failure. Change the check to only apply for Mumbai. In `src/components/OpenBarreLanding.tsx`, near the `onSubmit` result handling:

```ts
      if (city !== "bengaluru" && !result.enrolled) {
        console.error("[debug:signup] enrollment failed:", result.enrollError);
        setError(
          result.enrollError ??
            "Open Barre membership could not be activated. Please contact the studio team before booking.",
        );
        return;
      }
```

(`city` here is the new prop added in Task 8 — if Task 8 hasn't run yet when this task executes, add a `city: CityKey = "mumbai"` prop to `OpenBarreLanding` now as a minimal stub so this compiles; Task 8 will build the rest of the city-aware UI on top of it.)

- [ ] **Step 4: Run the tests again to confirm they pass**

Run: `npx tsx --test src/lib/signup-and-enroll.helpers.test.ts`
Expected: PASS (both new tests, plus all pre-existing ones)

- [ ] **Step 5: Commit**

```bash
git add src/lib/signup-and-enroll.helpers.ts src/components/OpenBarreLanding.tsx
git commit -m "feat: skip free-membership enrollment for Bengaluru signups"
```

---

### Task 8: `OpenBarreLanding` becomes city-aware (studio picker, copy, price block)

**Files:**
- Modify: `src/components/OpenBarreLanding.tsx`

**Interfaces:**
- Consumes: `CityKey`, `CITY_LOCATIONS` from Task 1; `NEW_CLIENT_INTRO_PACK_FULL_PRICE_INR`, `NEW_CLIENT_INTRO_PACK_PRICE_INR` from Task 3; `city` prop stub from Task 7.

This task is UI-only for the studio-picker/copy changes — verify manually.

- [ ] **Step 1: Add the `city` prop and switch the studio picker's data source**

Change the component signature (~line 140-146):

```ts
import type { CityKey } from "@/lib/momence-cities";
import { CITY_LOCATIONS } from "@/lib/momence-cities";
import {
  NEW_CLIENT_INTRO_PACK_FULL_PRICE_INR,
  NEW_CLIENT_INTRO_PACK_PRICE_INR,
} from "@/lib/momence-booking.helpers";

export function OpenBarreLanding({
  captureLead = true,
  routeSource = "landing",
  city = "mumbai",
}: {
  captureLead?: boolean;
  routeSource?: string;
  city?: CityKey;
}) {
```

Replace the `LOCATIONS`-based validity check (~line 337):

```ts
      CITY_LOCATIONS[city].some((l) => l.bookable && l.id === form.homeLocationId) &&
```

- [ ] **Step 2: Render non-bookable studios as a WhatsApp fallback in the picker**

Replace the studio `<select>` (~lines 1018-1041) with a picker that distinguishes bookable vs non-bookable entries. Since a native `<select>` can't easily branch into "show a WhatsApp link instead," switch this one field to a button-group matching the class-type picker's existing pattern:

```tsx
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              Preferred studio *
            </label>
            <div className="grid gap-2">
              {CITY_LOCATIONS[city].map((location) =>
                location.bookable && location.id !== null ? (
                  <button
                    key={location.name}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, homeLocationId: location.id as number });
                      onStudioSelectedChange(true);
                    }}
                    className={`h-11 rounded-lg border px-3 text-left text-sm font-medium transition ${
                      form.homeLocationId === location.id
                        ? "border-primary-deep bg-[#f8f5ff] ring-2 ring-primary-deep"
                        : "border-input bg-background hover:border-[#c8bef4]"
                    }`}
                  >
                    {location.name}
                  </button>
                ) : (
                  <a
                    key={location.name}
                    href={`https://wa.me/${DEFAULT_WHATSAPP_PHONE}?text=${encodeURIComponent(
                      `Hi! I'd like to know more about classes at ${location.name}.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 items-center justify-between rounded-lg border border-dashed border-input bg-background px-3 text-sm font-medium text-muted-foreground hover:border-[#25D366] hover:text-[#25D366]"
                  >
                    <span>{location.name}</span>
                    <span className="text-xs uppercase tracking-wide">Message us on WhatsApp →</span>
                  </a>
                ),
              )}
            </div>
          </div>
```

Add the import: `import { DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp-contact.helpers";`

- [ ] **Step 3: Swap Bengaluru copy and add the struck-through price block**

Near the hero copy (search for `"Your first Barre 57 class is complimentary"` — the exact JSX location varies, it's rendered once near the top of the form), branch on `city`:

```tsx
          <p className="...">
            {city === "bengaluru"
              ? "Your first class is 50% off. Sculpt, strengthen, and energize your body in 57 minutes."
              : "Your first Barre 57 class is complimentary. Sculpt, strengthen, and energize your body in 57 minutes."}
          </p>
```

Near the submit button, add the price block for Bengaluru only:

```tsx
          {city === "bengaluru" && (
            <p className="text-sm text-muted-foreground">
              First class:{" "}
              <span className="line-through">₹{NEW_CLIENT_INTRO_PACK_FULL_PRICE_INR}</span>{" "}
              <span className="font-bold text-foreground">₹{NEW_CLIENT_INTRO_PACK_PRICE_INR}</span>
            </p>
          )}
```

(Match the exact surrounding markup/classes to whatever's already there for the submit button area — read the ~30 lines above the `<button type="submit">` in the file before inserting, so indentation and container structure stay consistent.)

- [ ] **Step 4: Thread `city` into the signup submission**

In `onSubmit` (~line 388), the `signup({ data: {...} })` call needs `city` so `runSignupAndEnroll` can resolve it — but note `SignupAndEnrollInput` resolves city from `homeLocationId` via `cityForLocationId` (Task 7's `runSignupAndEnroll` change reads `data.homeLocationId`, not a separate `city` field) — so no explicit `city` field is needed in the payload itself. Just make sure the `if (city !== "bengaluru" && !result.enrolled)` check added in Task 7 Step 3 uses this component's `city` prop (it already does, once Task 7's stub is in place).

- [ ] **Step 5: Manual verification**

Run `npm run dev`, temporarily render `<OpenBarreLanding city="bengaluru" routeSource="bengaluru-test" />` from a scratch route or by editing `index.tsx` locally (revert after testing), and confirm:
- Studio picker shows "Kenkere House" as selectable and "Pop Up"/"Copper & Cloves" as WhatsApp links that open `wa.me` in a new tab instead of selecting.
- Copy says "50% off", price block shows ₹1350 struck through and ₹675.
- Selecting Kenkere House and continuing only offers Barre-format class types (via existing `classTypeOptionsForLocation`, once Task 9 wires the route with a real `homeLocationId`).
- Existing Mumbai `/` and `/skip-lead` still render exactly as before (default `city="mumbai"` preserves current behavior).

- [ ] **Step 6: Commit**

```bash
git add src/components/OpenBarreLanding.tsx
git commit -m "feat: make OpenBarreLanding city-aware (studio picker, copy, price display)"
```

---

### Task 9: New `/bengaluru` route

**Files:**
- Create: `src/routes/bengaluru.tsx`

**Interfaces:** None — leaf route, no exports consumed elsewhere.

- [ ] **Step 1: Create the route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { OpenBarreLanding } from "@/components/OpenBarreLanding";
import groupBarre from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";

const bengaluruHead = () => ({
  meta: [
    { title: "Physique 57 India Bengaluru - Your first class, 50% off." },
    {
      name: "description",
      content:
        "Book your first Barre 57 class at Kenkere House, Bengaluru for 50% off. Sculpt, strengthen, and energize your body in 57 minutes.",
    },
    {
      property: "og:title",
      content: "Physique 57 India Bengaluru - Your first class, 50% off.",
    },
    {
      property: "og:description",
      content: "Book your first Barre 57 class at Kenkere House, Bengaluru for 50% off.",
    },
    { property: "og:image", content: groupBarre },
    { name: "twitter:image", content: groupBarre },
  ],
});

export const Route = createFileRoute("/bengaluru")({
  head: bengaluruHead,
  component: BengaluruLanding,
});

function BengaluruLanding() {
  return <OpenBarreLanding city="bengaluru" routeSource="bengaluru" />;
}
```

- [ ] **Step 2: Regenerate the route tree**

TanStack Start's route-tree generation runs automatically via the dev server / build (`routeTree.gen.ts` is auto-generated — do not hand-edit it, per `src/routes/README.md`). Run:

```bash
npm run dev
```

and confirm in the terminal output that the route generator picks up `bengaluru.tsx` without errors (or run `npm run build` if you want a one-shot check without leaving a dev server running).

- [ ] **Step 3: Manual verification**

With `npm run dev` running, visit `http://localhost:5173/bengaluru` (or whatever port Vite prints) and confirm:
- Page loads with the Bengaluru meta title/description (check via browser tab title and view-source).
- Studio picker, copy, and price block match Task 8's verification.
- Filling the form and selecting Kenkere House, then submitting, creates a member (check server logs for `[debug:signup] member created`) and redirects to `/classes/$memberId?locationId=22116&classType=barre-57` — full end-to-end payment/booking on that page requires live Bengaluru Momence credentials and is out of scope for local manual testing; confirm at least that the redirect happens and the schedule page doesn't crash.

- [ ] **Step 4: Commit**

```bash
git add src/routes/bengaluru.tsx
git commit -m "feat: add /bengaluru signup route for Kenkere House"
```

---

## Self-Review Notes

- **Spec coverage:** All 7 spec sections (city config, host resolution, membership/pricing, Stripe generalization, route/form, enrollment skip, lead-capture) map to Tasks 1-9 (Task 5 additionally covers a scope gap found during planning — `classes.$memberId.tsx` itself must resolve locations/pricing/paid-status per-city, since it's the exact page Bengaluru members land on after signup; the original spec's "out of scope" note only excluded adding *new URL prefill* to that route, not city-awareness of its existing booking logic).
- **Placeholder scan:** No TBD/TODO left; the one open item (respond.io custom-fields wire format, carried from the other in-flight plan) is explicitly flagged with a concrete fallback, not silently assumed.
- **Type consistency:** `homeLocationId` is threaded consistently as a required `number` parameter everywhere it's newly added (`signMemberWaivers`, `buildCustomerFieldsDataRequest`, `SaveCustomerFieldsInput`) rather than mixed optional/required across tasks. `CityKey`/`CITY_LOCATIONS`/`hostIdForLocationId`/`cityForLocationId` names are used identically in every task that consumes them (Tasks 2, 3, 6, 7, 8 all import from `momence-cities.ts` verbatim).
- **Task order matters:** Tasks 1→2→3→4→5 must run in that order (each depends on exports from the previous). Tasks 6, 7, 8 each depend on Task 1 and Task 3 but not on each other or on Task 5 — they can run in parallel if using subagent-driven development, aside from the small `city` prop stub noted in Task 7 Step 3 (needed only if Task 7 runs before Task 8). Task 9 depends on Task 8.
