# Bengaluru signup route (`/bengaluru`) — design

Date: 2026-07-27

Adds a second city to the signup app. Bengaluru differs from the existing Mumbai flow in every dimension that currently assumes a single city: Momence host, studio locations, class formats offered, membership product, pricing, and lead-capture webhook target. This spec introduces a small city-config layer so those dimensions become parameterized instead of hardcoded, then wires a new route on top of it.

## Security note (handled outside this spec)

The curl sample provided included live session cookies and should never be pasted into source or committed. Bengaluru's dashboard-auth cookie value, if a new one is needed, goes into the same env-var mechanism the app already uses (`MOMENCE_ALL_COOKIES`) — confirmed below that Mumbai's existing cookie/OAuth credentials are reused as-is (shared Momence login manages both hosts), so no new secret is actually needed for this feature.

## 1. City config layer (new)

**New file:** `src/lib/momence-cities.ts`

```ts
export type CityKey = "mumbai" | "bengaluru";

export type CityLocation = {
  id: number | null; // null = not a real Momence location; picker shows it but routes to WhatsApp instead of continuing
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

export function hostIdForLocationId(locationId: number): number {
  for (const city of Object.keys(CITY_LOCATIONS) as CityKey[]) {
    if (CITY_LOCATIONS[city].some((loc) => loc.id === locationId)) return CITY_HOST_IDS[city];
  }
  return CITY_HOST_IDS.mumbai; // existing behavior for any unrecognized id
}

export function cityForLocationId(locationId: number): CityKey {
  for (const city of Object.keys(CITY_LOCATIONS) as CityKey[]) {
    if (CITY_LOCATIONS[city].some((loc) => loc.id === locationId)) return city;
  }
  return "mumbai";
}
```

- `src/lib/momence-locations.ts` (client-safe LOCATIONS) and the duplicate array in `momence.server.ts:164-167` both get replaced by reading from `CITY_LOCATIONS.mumbai` (filtered to `bookable`) — removes the existing sync-by-hand duplication as a side benefit, since this work already touches both files.
- `class-formats.ts`'s `STUDIO_CLASS_TYPES` gets a new entry: `22116: ["barre-57"]`.
- Non-bookable entries (`Pop Up`, `Copper & Cloves`) never reach any Momence API call — selecting one in the UI shows a "this studio isn't available for online signup yet" message with a WhatsApp CTA (`DEFAULT_WHATSAPP_PHONE`), and the form simply doesn't proceed. No location ID is invented for them.

## 2. `MOMENCE_HOST_ID` becomes location-derived, not a single constant

Every place that currently builds a path like `` `/host/${MOMENCE_HOST_ID}/...` `` (session auto-book in `momence-sessions.functions.ts:136`, waiver signing in `momence.functions.ts:301,307`, customer-fields save) switches to resolving the host id from the member's `homeLocationId` via `hostIdForLocationId()`, instead of importing the constant directly. `MOMENCE_HOST_ID` in `momence.server.ts:4` stays as the fallback/default (Mumbai) but is no longer the only value in play.

OAuth credentials (`MOMENCE_CLIENT_ID/SECRET`, `MOMENCE_USERNAME/PASSWORD`) and the dashboard cookie (`MOMENCE_ALL_COOKIES`) are **shared** across both hosts per your confirmation — no new env vars needed for auth itself.

## 3. Membership + pricing constants

**File:** `src/lib/momence-booking.helpers.ts`

- Fix `GST_RATE` from `0.18` to `0.05` (your correction — applies to both the existing Mumbai Newcomers 2-for-1 Stripe charge and the new Bengaluru charge; this changes the live Mumbai charge amount from ₹2065 to ₹1838 for that flow).
- Add:
  ```ts
  export const NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID = 654474;
  export const NEW_CLIENT_INTRO_PACK_PRICE_INR = "675"; // Momence catalog price sent to /host/checkout
  export const NEW_CLIENT_INTRO_PACK_FULL_PRICE_INR = "1350"; // display-only, struck through
  export const NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID = 4391;
  export const BENGALURU_CUSTOM_PAYMENT_METHOD_ID = 5801;
  export const NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR = toGstInclusiveInr(
    NEW_CLIENT_INTRO_PACK_PRICE_INR,
  ); // ≈ ₹709
  ```
- `buildMembershipCheckoutRequest`'s request/body type gains an optional `appliedPriceRuleIds?: number[]`, passed through into the `/host/checkout` body when present. Nothing else about that function changes.
- Add `buildNewClientIntroPackCheckoutRequest({ memberId, homeLocationId })` mirroring `buildNewcomersMembershipCheckoutRequest`, using the constants above and `paymentMethodType: "custom"` with `customPaymentMethodId: BENGALURU_CUSTOM_PAYMENT_METHOD_ID`.
- `getSchedulePriceDisplay` and `isPaidNewcomersClassName`/`membershipIdForClassName` become city-aware: since Bengaluru offers barre only and has **no free trial**, every Bengaluru session is paid regardless of class name. Both functions take the resolved `city` (or `homeLocationId`) and branch: for `bengaluru`, always return the Intro Pack pricing/membership; for `mumbai`, keep today's class-name-based logic unchanged.

## 4. Stripe checkout — generalize instead of duplicating the file

**File:** `src/lib/stripe-checkout.functions.ts`

Rather than cloning `createNewcomersCheckoutSession`/`completeNewcomersCheckoutBooking`/`fulfillNewcomersCheckoutSession` for a second product, this introduces a small registry so both products flow through the same functions:

```ts
const PAID_MEMBERSHIP_PRODUCTS: Record<number, {
  label: string;
  attemptedPriceInCurrency: string;
  stripeChargePriceInCurrency: string;
  customPaymentMethodId: number;
  appliedPriceRuleIds?: number[];
}> = {
  [NEWCOMERS_2_FOR_1_MEMBERSHIP_ID]: { label: "Newcomers 2 For 1", attemptedPriceInCurrency: NEWCOMERS_2_FOR_1_PRICE_INR, stripeChargePriceInCurrency: NEWCOMERS_2_FOR_1_STRIPE_CHARGE_PRICE_INR, customPaymentMethodId: MOMENCE_STRIPE_LINK_CUSTOM_PAYMENT_METHOD_ID },
  [NEW_CLIENT_INTRO_PACK_MEMBERSHIP_ID]: { label: "New Client Intro Pack", attemptedPriceInCurrency: NEW_CLIENT_INTRO_PACK_PRICE_INR, stripeChargePriceInCurrency: NEW_CLIENT_INTRO_PACK_STRIPE_CHARGE_PRICE_INR, customPaymentMethodId: BENGALURU_CUSTOM_PAYMENT_METHOD_ID, appliedPriceRuleIds: [NEW_CLIENT_INTRO_PACK_APPLIED_PRICE_RULE_ID] },
};
```

- `CheckoutSessionInput` gains `membershipId: z.number()`, validated as a key of `PAID_MEMBERSHIP_PRODUCTS`.
- `assertCheckoutMatchesExpected` checks membership against the registry keys instead of the single hardcoded `NEWCOMERS_2_FOR_1_MEMBERSHIP_ID` equality; the paid-class-name check (`isPaidNewcomersClassName`) is only applied for Mumbai — for Bengaluru sessions it's skipped since everything there is paid.
- `ensureNewcomersMembership`/`fulfillNewcomersCheckoutSession` generalize to look up the product from the registry by `metadata.membershipId` and build the checkout/booking requests generically instead of hardcoding the Newcomers constant.
- `stripe-checkout.helpers.ts`'s `buildNewcomersCheckoutSessionParams` becomes `buildPaidCheckoutSessionParams`, pulling the Stripe line-item name/amount from the resolved product entry.

Net effect: the schedule page (`classes.$memberId.tsx`) booking flow works identically for both cities — pick a session, if it's a paid format (always true for Bengaluru, format-dependent for Mumbai) redirect to Stripe for that product's price, on return the same completion handler assigns the right membership and books the session via the existing dashboard-cookie auto-book call (now using the host id resolved from `homeLocationId`).

## 5. Signup route + form

**New file:** `src/routes/bengaluru.tsx`

```ts
export const Route = createFileRoute("/bengaluru")({
  head: bengaluruHead, // Bengaluru-specific meta/OG copy
  component: () => <OpenBarreLanding city="bengaluru" routeSource="bengaluru" />,
});
```

**`src/components/OpenBarreLanding.tsx`** gains a `city?: CityKey` prop (default `"mumbai"`, so `index.tsx` and `skip-lead.tsx` are unaffected):

- Studio picker reads from `CITY_LOCATIONS[city]` instead of the module-level `LOCATIONS` import. Non-bookable entries render as disabled-looking cards with a WhatsApp CTA instead of being selectable.
- `classTypeOptionsForLocation` naturally returns `["barre-57"]` for Kenkere House once the `STUDIO_CLASS_TYPES` entry is added (§1) — no separate branching needed here, the class-type dropdown just ends up single-option.
- Copy: when `city === "bengaluru"`, swap the "Your first class is complimentary" line for "Your first class is 50% off" and show the price block (₹1350 struck through, ₹675 shown) near the submit button. This is display-only — no payment happens on this page (per your answer, payment happens later when picking a class on the schedule page, same as Mumbai's paid formats today).
- `SignupAndEnrollInput` and `LeadCapturePayload` gain a `city: CityKey` field, threaded from this prop through `signup-and-enroll.helpers.ts` into `captureLead`.

## 6. Signup enrollment — skip free membership for Bengaluru

**File:** `src/lib/signup-and-enroll.helpers.ts`

- `runSignupAndEnroll` currently always does: create member → sign waiver → free `OPEN_BARRE_MEMBERSHIP_ID` checkout (price "0") → capture lead. For `city === "bengaluru"`, skip the membership-checkout step entirely (member has zero memberships until they pick a class and pay on the schedule page, matching §4's flow). Member creation, waiver signing, and lead capture proceed unchanged for both cities.

## 7. Lead capture — per-city webhook + respond.io fields

**File:** `src/lib/momence.functions.ts`

- `captureLead`'s hardcoded lead-webhook URL (currently a literal `.../customer-leads/13752/collect`) becomes `` `https://api.momence.com/integrations/customer-leads/${hostIdForLocationId(payload.homeLocationId)}/collect` `` — also fixes the existing latent bug where this URL duplicates `MOMENCE_HOST_ID` as a separate literal instead of referencing it.
- Bearer token: new env var `MOMENCE_API_TOKEN_BLR` (value `qy71rOk8en`, set outside of source/commits) selected when the resolved host is Bengaluru's `33905`; existing `MOMENCE_API_TOKEN` stays Mumbai's.
- `type: "Barre 57"` in the lead body stays accurate for Bengaluru too (only format offered there) — no change needed, though if `classType` threading from the earlier booking-flow-polish spec lands first, it'll naturally read correctly for both cities.
- respond.io contact sync (`syncRespondIoContactAndConversation`) is unaffected by city — same shared respond.io account/workspace, just receives whichever `center`/`classType` values are passed in (per the other in-flight spec).
- `sourceId: "8082"` in the Momence lead body stays as-is for both cities unless you tell us Bengaluru's webhook needs a different source id — flag this if wrong once the first Bengaluru lead shows up in Momence with an unexpected source.

## Out of scope

- No real subdomain (`pm.physique57india.com`) — DNS/Vercel config for that is separate infra work, not app code.
- No new Momence OAuth/dashboard-cookie credentials — shared with Mumbai per your confirmation.
- Pop Up and Copper & Cloves get no real location IDs or dedicated WhatsApp numbers in this pass — both use `DEFAULT_WHATSAPP_PHONE` until you provide studio-specific details.
- No changes to the existing Mumbai `/` or `/skip-lead` behavior beyond the `GST_RATE` fix (which changes a live charge amount, confirmed above) and the `LOCATIONS`-duplication cleanup (behavior-preserving).
