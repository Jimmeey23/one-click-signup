// Writes each submission to Supabase. Server-only: this uses the service role key, which
// bypasses row-level security and must never reach the browser.
//
// PostgREST is called directly rather than through supabase-js for the same reason
// route-store.functions.ts does - the SDK builds a Realtime client on construction, which
// throws on Node 20 for want of a native WebSocket.
import type { LeadCapturePayload } from "./signup-and-enroll.helpers";
import {
  buildSubmissionRow,
  partialPruneFilter,
  tableForStage,
  submissionOutcomeColumns,
  COMPLETED_SUBMISSIONS_TABLE,
  PARTIAL_SUBMISSIONS_TABLE,
  type SubmissionWebhookOutcome,
} from "./submission-store.helpers";

function submissionStoreConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

/** The stored row, so its outcome can be filled in once the lead webhook has run. */
export type StoredSubmissionRef = { id: string; createdAt: string };

/**
 * Stores one submission. Never throws: a submission record is an audit trail, and losing
 * it must not cost the member their signup. Returns whether the row was written so the
 * caller can log it, and the row itself when it was.
 */
export async function recordSubmission(
  payload: LeadCapturePayload,
  outcome: SubmissionWebhookOutcome,
): Promise<{ stored: boolean; error?: string; row?: StoredSubmissionRef }> {
  const config = submissionStoreConfig();
  if (!config) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not set - skipping submission record. Submissions are not being saved.",
    );
    return { stored: false, error: "Submission store is not configured" };
  }

  const table = tableForStage(payload.stage);
  try {
    const res = await fetch(`${config.url}/rest/v1/${table}?select=id,created_at`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(buildSubmissionRow(payload, outcome)),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Submission record failed:", res.status, detail);
      return { stored: false, error: `Submission record ${res.status}` };
    }

    const rows = (await res.json().catch(() => [])) as Array<{ id?: string; created_at?: string }>;
    const inserted = rows?.[0];

    // They finished, so whatever they left in the partial table is no longer an abandoned
    // signup. Dropping it keeps partial_submissions a list of people to chase and nothing
    // else. Their details are all in the completed row, which was just written.
    if (table === COMPLETED_SUBMISSIONS_TABLE) await prunePartialSubmissions(config, payload);

    return {
      stored: true,
      row:
        inserted?.id && inserted.created_at
          ? { id: inserted.id, createdAt: inserted.created_at }
          : undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Submission record failed";
    console.error("Submission record failed:", message);
    return { stored: false, error: message };
  }
}

/** Fills in the lead webhook's verdict on a row stored before the webhook ran. */
export async function recordSubmissionOutcome(
  row: StoredSubmissionRef,
  outcome: SubmissionWebhookOutcome,
): Promise<void> {
  const config = submissionStoreConfig();
  if (!config) return;
  try {
    const query = new URLSearchParams({ id: `eq.${row.id}` });
    const res = await fetch(`${config.url}/rest/v1/${COMPLETED_SUBMISSIONS_TABLE}?${query}`, {
      method: "PATCH",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(submissionOutcomeColumns(outcome)),
    });
    if (!res.ok) {
      console.warn(
        "Submission outcome update failed:",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (e) {
    console.warn(
      "Submission outcome update failed:",
      e instanceof Error ? e.message : "unknown error",
    );
  }
}

/**
 * How far back a stored submission still counts as the same one. Someone refilling the
 * form after a page reload, or sending it twice, was reaching Momence and Meta as a
 * second, third and fourth lead; a genuine second signup a day later is still let through.
 */
export const DUPLICATE_SUBMISSION_WINDOW_MS = 60 * 60 * 1000;

/**
 * The earlier completed submission, inside the window, that makes `row` a repeat - if
 * there is one. Called after `row` is stored, so two sends racing each other both see one
 * another and only the first goes on to Momence and Meta. A row whose webhook explicitly
 * failed does not count: Momence never got that one, so the retry is allowed through.
 *
 * Fails open: an unreadable store must never block a real lead, so any error here is
 * logged and treated as "not a duplicate".
 */
export async function earlierDuplicateSubmission(
  payload: LeadCapturePayload,
  row: StoredSubmissionRef,
): Promise<{ createdAt: string } | null> {
  const config = submissionStoreConfig();
  if (!config) return null;

  const filter = partialPruneFilter(payload);
  if (!filter) return null;

  const createdAtMs = Date.parse(row.createdAt);
  if (Number.isNaN(createdAtMs)) return null;

  const query = new URLSearchParams({
    select: "id,created_at,lead_webhook_ok",
    or: filter,
    and: `(created_at.gte.${new Date(createdAtMs - DUPLICATE_SUBMISSION_WINDOW_MS).toISOString()},created_at.lte.${row.createdAt})`,
    // A parent registering a second child is a new lead, not a repeat of the first; and a
    // Juniors registration never makes the parent's own adult signup a repeat.
    child_name: payload.childName?.trim() ? `eq.${payload.childName.trim()}` : "is.null",
    order: "created_at.asc,id.asc",
    limit: "50",
  });

  try {
    const res = await fetch(`${config.url}/rest/v1/${COMPLETED_SUBMISSIONS_TABLE}?${query}`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.warn(
        "Duplicate submission check failed:",
        res.status,
        await res.text().catch(() => ""),
      );
      return null;
    }
    const rows = (await res.json()) as Array<{
      id?: string;
      created_at?: string;
      lead_webhook_ok?: boolean | null;
    }>;
    const earlier = rows.find((candidate) => {
      if (!candidate.id || !candidate.created_at || candidate.id === row.id) return false;
      if (candidate.lead_webhook_ok === false) return false;
      const candidateMs = Date.parse(candidate.created_at);
      // Same timestamp: the lower id wins, so exactly one of a tied pair goes through.
      return candidateMs < createdAtMs || (candidateMs === createdAtMs && candidate.id < row.id);
    });
    return earlier?.created_at ? { createdAt: earlier.created_at } : null;
  } catch (e) {
    console.warn(
      "Duplicate submission check failed:",
      e instanceof Error ? e.message : "unknown error",
    );
    return null;
  }
}

/**
 * Removes the partial rows belonging to someone who has now completed the form. Failures
 * are logged and swallowed: a stale partial row is a reporting wrinkle, never a reason to
 * fail a submission that has already been stored.
 */
async function prunePartialSubmissions(
  config: { url: string; key: string },
  payload: LeadCapturePayload,
): Promise<void> {
  const filter = partialPruneFilter(payload);
  if (!filter) return;

  const query = new URLSearchParams({ or: filter });
  try {
    const res = await fetch(`${config.url}/rest/v1/${PARTIAL_SUBMISSIONS_TABLE}?${query}`, {
      method: "DELETE",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Prefer: "return=minimal",
      },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn("Partial submission cleanup failed:", res.status, detail);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Partial submission cleanup failed";
    console.warn("Partial submission cleanup failed:", message);
  }
}
