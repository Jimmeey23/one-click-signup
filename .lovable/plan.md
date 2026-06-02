
# Physique 57 India — Trial Landing Upgrade

A focused pass that brings the trial site fully on-brand, replaces the custom class list with the official Momence schedule widget, adds waiver consent at signup, and pushes every lead into the Momence customer-leads webhook.

## 1. Brand foundation

- Pull the Physique 57 logo and the 9 photoshoot images into `src/assets/` via lovable-assets pointers (no binaries committed).
- Update `src/styles.css` design tokens to the Physique 57 palette: deep black background, off-white text, signature light-blue `#7FD3F7` as primary, soft neutral surfaces. Add gradients + shadow tokens that match.
- Add Inter (body) + a refined display face (e.g. Instrument Serif for the "57" accent) via Google Fonts in `__root.tsx`.

## 2. Landing page redesign (`src/routes/index.tsx`)

- New layered hero: full-bleed dark image (trainer shot) + Physique 57 logo lockup + headline "Your first Open Barre is on us."
- Marquee photo strip using the studio + trainer images.
- "Why Physique 57" 3-up benefit grid with photo cards.
- Reviews section: mount `<div id="momence-plugin-reviews">` and inject the Momence reviews `<script>` once on mount; expose the CSS custom properties they document, themed on brand.
- Signup form card on the right of hero on desktop, stacked on mobile. Real inputs use shadcn `Input` / `Select`.
- Phone field becomes **required** with a country-code dropdown (default +91 India, full ISO list with flag emoji). Stored as E.164 string.
- Waiver consent block: fetches signable documents (see §4) and renders each with a checkbox + typed-name signature field. Submit is disabled until all required docs are checked and signed.
- Footer with studio addresses + logo.

## 3. Class schedule page (`src/routes/classes.$memberId.tsx`)

- Remove the custom session list driven by `listUpcomingSessions`.
- Mount the official Momence schedule widget by injecting the provided `<script>` tag with `host_id="13752"`, `location_ids="[9030]"`, `tag_ids="[284832]"`, `lock_timezone="Asia/Kolkata"` into `<div id="ribbon-schedule">`.
- Add a location switcher above the widget that re-mounts the script with the chosen `location_ids`.
- Wrap the widget in a branded container (header, padding, on-brand background) and inject a small `<style>` block targeting the widget's CSS variables so colors/borders match.
- Keep `bookSession` server fn available but no longer the primary booking path (the widget handles booking).

## 4. Waiver + member APIs (new `src/lib/momence-member.functions.ts`)

Server functions hitting the Momence member endpoints listed by the user:
- `listSignableDocuments({ memberId })` → `/member/host/signable-documents`
- `signDocument({ memberId, documentId, signatureText })` → POST `/member/host/signable-documents/:id/sign`
- `listMemberLocations`, `listMemberMemberships`, `listMemberSessions`, `listMemberBookings`, `cancelBooking` — thin wrappers for future use.

All go through the existing `momenceFetch` helper (host token already cached server-side).

## 5. Signup flow update (`signupAndEnroll` in `src/lib/momence.functions.ts`)

Extend the existing flow:
1. Validate input (now requires `phoneNumber` E.164 + `countryCode`, plus `signatures: { documentId, signatureText }[]` and `waiverAccepted: true`).
2. Create member (existing).
3. Enroll in Open Barre membership (existing).
4. For each provided signature, call the sign endpoint.
5. Fire-and-await POST to `https://api.momence.com/integrations/customer-leads/13752/collect` using a new `MOMENCE_API_TOKEN` secret, with body matching the curl example (sourceId `"8082"`, name/email/phone, `center`, `type: "Barre 57"`, `waiverAccepted: "accepted"`, `event_id`, plus utm/referrer/landing_page passed from the client).
6. Return `{ memberId, homeLocationId, enrolled, signed, leadCaptured }`.

New secret required: `MOMENCE_API_TOKEN` (request via add_secret before the lead-capture call is wired live; signup still works without it but logs a warning).

## 6. Technical notes

- Country code list: ship a small static `src/lib/country-codes.ts` (top ~60 countries, flag emoji + dial code) — avoids a heavy dep.
- Momence widget scripts are loaded by appending a `<script type="module" async src="...">` element inside the target container in a `useEffect`, and removed on unmount to avoid duplicates on re-render.
- All new colors live as semantic tokens in `styles.css`; components use `bg-background`, `text-primary`, etc. — no hardcoded hex in TSX.
- Lead-capture call lives server-side so the token never reaches the browser.
- UTM / referrer / landing_page captured client-side from `document.referrer` and `window.location` and forwarded to the server fn.

## Out of scope (ask if wanted)
- Saved payment methods UI (the endpoints are wrapped but no UI built — Open Barre is free).
- Member dashboard for cancelling bookings (wrapper exists, no page yet).

