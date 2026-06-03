# Paid Newcomers Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate powerCycle and StrengthLab bookings behind a Stripe Checkout payment for the Newcomers 2 For 1 membership, then book the selected Momence session with that membership.

**Architecture:** Keep class-format detection and Momence request-building in small helpers with node:test coverage. Add server functions for Stripe Checkout creation, Checkout verification, Momence paid membership purchase, and paid-membership booking. Update the classes route so regular classes keep using Open Barre while paid formats redirect to Stripe and finish booking on successful return.

**Tech Stack:** TanStack Start server functions, React 19, Momence API/dashboard fetch helpers, Stripe Checkout Sessions, TypeScript, node:test helper tests.

---

### Task 1: Helper Tests

**Files:**

- Modify: `src/lib/momence-booking.helpers.test.ts`
- Modify: `src/lib/momence-booking.helpers.ts`

- [ ] Add tests proving paid format detection returns true for `powerCycle`, `StrengthLab`, and Momence variants like `Strength Lab Push`.
- [ ] Add tests proving paid membership checkout request uses membership id `675444`, attempted price `1`, and payment method `stripe`.
- [ ] Add tests proving paid membership lookup selects only compatible bought membership id for membership id `675444`.
- [ ] Run the helper test and verify it fails before implementation.

### Task 2: Booking Helpers

**Files:**

- Modify: `src/lib/momence-booking.helpers.ts`
- Modify: `src/lib/momence.server.ts`

- [ ] Export `NEWCOMERS_2_FOR_1_MEMBERSHIP_ID = 675444`.
- [ ] Export paid format helpers: `isPaidNewcomersClassName` and `membershipIdForClassName`.
- [ ] Export `buildMembershipCheckoutRequest` for Momence `/host/checkout`.
- [ ] Keep existing Open Barre behavior unchanged.
- [ ] Run the helper test and verify it passes.

### Task 3: Stripe Server Functions

**Files:**

- Create: `src/lib/stripe-checkout.functions.ts`
- Modify: `package.json`

- [ ] Add the official `stripe` package.
- [ ] Create `createNewcomersCheckoutSession` with validated `memberId`, `sessionId`, `homeLocationId`, `className`, `sessionStartsAt`, and optional `successUrl` / `cancelUrl`.
- [ ] Create `completeNewcomersCheckoutBooking` that retrieves the Checkout Session, checks `payment_status === "paid"` or `status === "complete"`, purchases membership `675444` in Momence if needed, then books with the compatible paid membership.
- [ ] Store Stripe metadata for `memberId`, `sessionId`, `homeLocationId`, and `membershipId`.

### Task 4: Classes Route

**Files:**

- Modify: `src/routes/classes.$memberId.tsx`

- [ ] Add search params for `checkout_session_id`, `paidSessionId`, and `paidLocationId`.
- [ ] On paid format booking, call `createNewcomersCheckoutSession` and redirect to the returned Checkout URL.
- [ ] On successful return, call `completeNewcomersCheckoutBooking`, show the existing thank-you screen, and clear one-time checkout params from the URL.
- [ ] Keep full-class disabled state and error display behavior.

### Task 5: Verification

**Files:**

- No production file edits.

- [ ] Run helper tests with the available TypeScript test command.
- [ ] Run `tsc --noEmit`.
- [ ] Run `npm run lint` or record the exact blocker.
- [ ] Run `npm run build` or record the exact blocker.
