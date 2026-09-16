// Writes each submission to Supabase. Server-only: this uses the service role key, which
// bypasses row-level security and must never reach the browser.
//
// PostgREST is called directly rather than through supabase-js for the same reason
// route-store.functions.ts does - the SDK builds a Realtime client on construction, which
// throws on Node 20 for want of a native WebSocket.
import type { LeadCapturePayload } from "./signup-and-enroll.helpers";
import {
  buildSubmissionRow,
  tableForStage,
  type SubmissionWebhookOutcome,
} from "./submission-store.helpers";

function submissionStoreConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

/**
 * Stores one submission. Never throws: a submission record is an audit trail, and losing
 * it must not cost the member their signup. Returns whether the row was written so the
 * caller can log it.
 */
export async function recordSubmission(
  payload: LeadCapturePayload,
  outcome: SubmissionWebhookOutcome,
): Promise<{ stored: boolean; error?: string }> {
  const config = submissionStoreConfig();
  if (!config) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not set - skipping submission record. Submissions are not being saved.",
    );
    return { stored: false, error: "Submission store is not configured" };
  }

  const table = tableForStage(payload.stage);
  try {
    const res = await fetch(`${config.url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        // Keep the response empty - we never need the row back.
        Prefer: "return=minimal",
      },
      body: JSON.stringify(buildSubmissionRow(payload, outcome)),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Submission record failed:", res.status, detail);
      return { stored: false, error: `Submission record ${res.status}` };
    }
    return { stored: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Submission record failed";
    console.error("Submission record failed:", message);
    return { stored: false, error: message };
  }
}
