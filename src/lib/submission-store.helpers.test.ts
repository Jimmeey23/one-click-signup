import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { LeadCapturePayload } from "./signup-and-enroll.helpers.ts";
import {
  COMPLETED_SUBMISSIONS_TABLE,
  PARTIAL_SUBMISSIONS_TABLE,
  buildSubmissionRow,
  partialPruneFilter,
  tableForStage,
} from "./submission-store.helpers.ts";

const BASE: LeadCapturePayload = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phoneE164: "+919876543210",
  center: "Kwality House, Kemps Corner",
  waiverAccepted: true,
};

describe("Submission rows", () => {
  it("routes completed and partial submissions to their own tables", () => {
    assert.equal(tableForStage("completed"), COMPLETED_SUBMISSIONS_TABLE);
    assert.equal(tableForStage("partial"), PARTIAL_SUBMISSIONS_TABLE);
    // A payload with no stage is a completed signup; only the partial path sets it.
    assert.equal(tableForStage(undefined), COMPLETED_SUBMISSIONS_TABLE);
  });

  it("maps the payload onto the table's columns", () => {
    const row = buildSubmissionRow(
      {
        ...BASE,
        homeLocationId: 1,
        classType: "Barre 57",
        memberId: 27473761,
        utmSource: "google",
        gclid: "abc123",
        whatsappConsent: true,
        whatsappConsentAt: "2026-09-16T10:00:00.000Z",
      },
      { ok: true },
    );

    assert.equal(row.first_name, "Ada");
    assert.equal(row.phone_e164, "+919876543210");
    assert.equal(row.home_location_id, 1);
    assert.equal(row.class_type, "Barre 57");
    assert.equal(row.member_id, 27473761);
    assert.equal(row.utm_source, "google");
    assert.equal(row.gclid, "abc123");
    assert.equal(row.waiver_accepted, true);
    assert.equal(row.whatsapp_consent, true);
    assert.equal(row.whatsapp_consent_at, "2026-09-16T10:00:00.000Z");
    assert.equal(row.lead_webhook_ok, true);
    assert.equal(row.lead_webhook_error, null);
  });

  it("leaves the webhook verdict empty when the lead was never sent", () => {
    const row = buildSubmissionRow(BASE, {
      ok: false,
      skipped: true,
      error: "Lead webhook not sent for this signup",
    });
    // Not a failure to chase - nobody meant to send it.
    assert.equal(row.lead_webhook_ok, null);
    assert.equal(row.lead_webhook_error, "Lead webhook not sent for this signup");
  });

  it("records the webhook failure rather than dropping the submission", () => {
    const row = buildSubmissionRow(BASE, { ok: false, error: "Lead capture 500" });
    assert.equal(row.lead_webhook_ok, false);
    assert.equal(row.lead_webhook_error, "Lead capture 500");
  });

  it("stores absent and blank fields as null", () => {
    const row = buildSubmissionRow({ ...BASE, classType: "   ", gclid: "" }, { ok: true });
    assert.equal(row.class_type, null);
    assert.equal(row.gclid, null);
    assert.equal(row.utm_campaign, null);
    assert.equal(row.member_id, null);
    assert.equal(row.child_name, null);
  });

  it("drops an unparseable consent timestamp instead of losing the row", () => {
    const row = buildSubmissionRow({ ...BASE, whatsappConsentAt: "not a date" }, { ok: true });
    assert.equal(row.whatsapp_consent_at, null);
    // The original value survives in raw, so nothing submitted is actually lost.
    assert.equal(row.raw.whatsappConsentAt, "not a date");
  });

  it("keeps the Juniors fields", () => {
    const row = buildSubmissionRow(
      { ...BASE, childName: "Grace", childAge: "7", childDateOfBirth: "2019-04-01", batch: "Sat" },
      { ok: true },
    );
    assert.equal(row.child_name, "Grace");
    assert.equal(row.child_age, "7");
    assert.equal(row.child_date_of_birth, "2019-04-01");
    assert.equal(row.batch, "Sat");
  });

  it("keeps the whole payload in raw so new form fields are captured before a migration", () => {
    const payload = { ...BASE, somethingAddedLater: "kept" } as LeadCapturePayload;
    const row = buildSubmissionRow(payload, { ok: true });
    assert.equal(row.raw.somethingAddedLater, "kept");
    assert.equal(row.raw.email, "ada@example.com");
  });
});

describe("Partial submission cleanup", () => {
  it("matches the completing member's partial rows on phone or email", () => {
    assert.equal(
      partialPruneFilter(BASE),
      '(phone_e164.eq."+919876543210",email.ilike."ada@example.com")',
    );
  });

  it("still matches when only one contact detail was given", () => {
    assert.equal(partialPruneFilter({ ...BASE, email: "" }), '(phone_e164.eq."+919876543210")');
    assert.equal(partialPruneFilter({ ...BASE, phoneE164: "" }), '(email.ilike."ada@example.com")');
  });

  it("matches nothing rather than everything when there is no contact detail", () => {
    assert.equal(partialPruneFilter({ ...BASE, email: "", phoneE164: "" }), null);
  });
});
