// Turns a lead payload into the row we store in Supabase. Kept separate from the
// PostgREST call so the mapping can be tested without a network or a database.
import type { LeadCapturePayload } from "./signup-and-enroll.helpers";

export const COMPLETED_SUBMISSIONS_TABLE = "signup_submissions";
export const PARTIAL_SUBMISSIONS_TABLE = "partial_submissions";

export type SubmissionWebhookOutcome = {
  ok: boolean;
  error?: string | null;
};

export type SubmissionRow = {
  first_name: string;
  last_name: string;
  email: string;
  phone_e164: string;
  home_location_id: number | null;
  center: string;
  class_type: string | null;
  source_id: string | null;
  source_form: string | null;
  waiver_accepted: boolean;
  whatsapp_consent: boolean;
  whatsapp_consent_at: string | null;
  child_name: string | null;
  child_age: string | null;
  child_date_of_birth: string | null;
  batch: string | null;
  ab_variant: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
  referrer: string | null;
  landing_page: string | null;
  meta_event_id: string | null;
  member_id: number | null;
  lead_webhook_ok: boolean | null;
  lead_webhook_error: string | null;
  raw: Record<string, unknown>;
};

/** Empty strings are stored as null so "not provided" and "provided blank" do not blur. */
function orNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Postgres rejects a timestamptz it cannot parse, which would lose the whole row over one
 * malformed field. Anything unparseable is dropped to null and still kept in `raw`.
 */
function asTimestamp(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return Number.isNaN(Date.parse(trimmed)) ? null : trimmed;
}

export function tableForStage(stage: LeadCapturePayload["stage"]): string {
  return stage === "partial" ? PARTIAL_SUBMISSIONS_TABLE : COMPLETED_SUBMISSIONS_TABLE;
}

export function buildSubmissionRow(
  payload: LeadCapturePayload,
  outcome: SubmissionWebhookOutcome,
): SubmissionRow {
  return {
    first_name: payload.firstName?.trim() ?? "",
    last_name: payload.lastName?.trim() ?? "",
    email: payload.email?.trim() ?? "",
    phone_e164: payload.phoneE164?.trim() ?? "",
    home_location_id: payload.homeLocationId ?? null,
    center: payload.center?.trim() ?? "",
    class_type: orNull(payload.classType),
    source_id: orNull(payload.sourceId),
    source_form: orNull(payload.sourceForm),
    waiver_accepted: payload.waiverAccepted === true,
    whatsapp_consent: payload.whatsappConsent === true,
    whatsapp_consent_at: asTimestamp(payload.whatsappConsentAt),
    child_name: orNull(payload.childName),
    child_age: orNull(payload.childAge),
    child_date_of_birth: orNull(payload.childDateOfBirth),
    batch: orNull(payload.batch),
    ab_variant: orNull(payload.abVariant),
    utm_source: orNull(payload.utmSource),
    utm_medium: orNull(payload.utmMedium),
    utm_campaign: orNull(payload.utmCampaign),
    utm_term: orNull(payload.utmTerm),
    utm_content: orNull(payload.utmContent),
    gclid: orNull(payload.gclid),
    fbclid: orNull(payload.fbclid),
    fbp: orNull(payload.fbp),
    fbc: orNull(payload.fbc),
    referrer: orNull(payload.referrer),
    landing_page: orNull(payload.landingPage),
    meta_event_id: orNull(payload.metaEventId),
    member_id: payload.memberId ?? null,
    lead_webhook_ok: outcome.ok,
    lead_webhook_error: orNull(outcome.error),
    raw: { ...payload } as Record<string, unknown>,
  };
}
