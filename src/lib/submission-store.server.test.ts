import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { LeadCapturePayload } from "./signup-and-enroll.helpers.ts";
import {
  DUPLICATE_SUBMISSION_WINDOW_MS,
  recentDuplicateSubmission,
} from "./submission-store.server.ts";

const BASE: LeadCapturePayload = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "Ada@Example.com",
  phoneE164: "+919876543210",
  center: "Kwality House, Kemps Corner",
  waiverAccepted: true,
  stage: "completed",
};

const NOW = Date.parse("2026-09-19T15:00:00.000Z");
const realFetch = globalThis.fetch;
let requested: string[] = [];

function stubFetch(handler: () => Response | Promise<Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requested.push(String(input));
    return await handler();
  }) as typeof fetch;
}

describe("Duplicate submission check", () => {
  beforeEach(() => {
    requested = [];
    process.env.SUPABASE_URL = "https://store.example.com/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("reports the stored submission that makes this one a repeat", async () => {
    stubFetch(() => Response.json([{ created_at: "2026-09-19T14:47:24.726615+00:00" }]));

    const duplicate = await recentDuplicateSubmission(BASE, NOW);

    assert.deepEqual(duplicate, { createdAt: "2026-09-19T14:47:24.726615+00:00" });
  });

  it("looks only at completed submissions inside the window, by email or phone", async () => {
    stubFetch(() => Response.json([]));

    await recentDuplicateSubmission(BASE, NOW);

    const url = new URL(requested[0]);
    assert.equal(url.pathname, "/rest/v1/signup_submissions");
    assert.equal(
      url.searchParams.get("created_at"),
      `gte.${new Date(NOW - DUPLICATE_SUBMISSION_WINDOW_MS).toISOString()}`,
    );
    assert.equal(
      url.searchParams.get("or"),
      '(phone_e164.eq."+919876543210",email.ilike."Ada@Example.com")',
    );
  });

  it("returns nothing when no stored submission matches", async () => {
    stubFetch(() => Response.json([]));

    assert.equal(await recentDuplicateSubmission(BASE, NOW), null);
  });

  // A store we cannot read must never hold back a real lead.
  it("fails open when the store errors", async () => {
    stubFetch(() => {
      throw new Error("network down");
    });

    assert.equal(await recentDuplicateSubmission(BASE, NOW), null);
  });

  it("fails open when the store is not configured", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    stubFetch(() => Response.json([{ created_at: "2026-09-19T14:47:24.726615+00:00" }]));

    assert.equal(await recentDuplicateSubmission(BASE, NOW), null);
    assert.deepEqual(requested, []);
  });
});
