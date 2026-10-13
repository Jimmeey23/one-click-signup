import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { LeadCapturePayload } from "./signup-and-enroll.helpers.ts";
import {
  DUPLICATE_SUBMISSION_WINDOW_MS,
  earlierDuplicateSubmission,
  recordSubmission,
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

const ROW = { id: "bbbb", createdAt: "2026-09-19T15:00:00.000+00:00" };
const realFetch = globalThis.fetch;
let requested: Array<{ url: string; method: string }> = [];

function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requested.push({ url: String(input), method: init?.method ?? "GET" });
    return await handler(String(input));
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

  it("reports an earlier send that makes this one a repeat", async () => {
    stubFetch(() =>
      Response.json([
        { id: "aaaa", created_at: "2026-09-19T14:47:24.726615+00:00", lead_webhook_ok: true },
        { id: ROW.id, created_at: ROW.createdAt, lead_webhook_ok: null },
      ]),
    );

    assert.deepEqual(await earlierDuplicateSubmission(BASE, ROW), {
      createdAt: "2026-09-19T14:47:24.726615+00:00",
    });
  });

  // Two sends racing each other: both rows are stored before either checks.
  it("lets only the first of two racing sends through", async () => {
    const first = { id: "aaaa", createdAt: "2026-09-19T14:59:58.000+00:00" };
    const rows = [
      { id: first.id, created_at: first.createdAt, lead_webhook_ok: null },
      { id: ROW.id, created_at: ROW.createdAt, lead_webhook_ok: null },
    ];
    stubFetch(() => Response.json(rows));

    assert.equal(await earlierDuplicateSubmission(BASE, first), null);
    assert.notEqual(await earlierDuplicateSubmission(BASE, ROW), null);
  });

  it("breaks a timestamp tie by id, so exactly one of the pair goes through", async () => {
    const twin = { id: "aaaa", createdAt: ROW.createdAt };
    stubFetch(() =>
      Response.json([
        { id: twin.id, created_at: ROW.createdAt, lead_webhook_ok: null },
        { id: ROW.id, created_at: ROW.createdAt, lead_webhook_ok: null },
      ]),
    );

    assert.equal(await earlierDuplicateSubmission(BASE, twin), null);
    assert.notEqual(await earlierDuplicateSubmission(BASE, ROW), null);
  });

  // Momence never got that one, so the retry has to be allowed to reach it.
  it("ignores an earlier send whose webhook failed", async () => {
    stubFetch(() =>
      Response.json([
        { id: "aaaa", created_at: "2026-09-19T14:59:00.000+00:00", lead_webhook_ok: false },
      ]),
    );

    assert.equal(await earlierDuplicateSubmission(BASE, ROW), null);
  });

  it("looks only at completed adult submissions inside the window, by email or phone", async () => {
    stubFetch(() => Response.json([]));

    await earlierDuplicateSubmission(BASE, ROW);

    const url = new URL(requested[0].url);
    assert.equal(url.pathname, "/rest/v1/signup_submissions");
    const since = new Date(Date.parse(ROW.createdAt) - DUPLICATE_SUBMISSION_WINDOW_MS);
    assert.equal(
      url.searchParams.get("and"),
      `(created_at.gte.${since.toISOString()},created_at.lte.${ROW.createdAt})`,
    );
    assert.equal(
      url.searchParams.get("or"),
      '(phone_e164.eq."+919876543210",email.ilike."Ada@Example.com")',
    );
    assert.equal(url.searchParams.get("child_name"), "is.null");
  });

  it("matches a Juniors registration only against the same child", async () => {
    stubFetch(() => Response.json([]));

    await earlierDuplicateSubmission({ ...BASE, childName: " Ivy " }, ROW);

    assert.equal(new URL(requested[0].url).searchParams.get("child_name"), "eq.Ivy");
  });

  // A store we cannot read must never hold back a real lead.
  it("fails open when the store errors", async () => {
    stubFetch(() => {
      throw new Error("network down");
    });

    assert.equal(await earlierDuplicateSubmission(BASE, ROW), null);
  });

  it("fails open when the store is not configured", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    stubFetch(() => Response.json([{ id: "aaaa", created_at: "2026-09-19T14:47:24Z" }]));

    assert.equal(await earlierDuplicateSubmission(BASE, ROW), null);
    assert.deepEqual(requested, []);
  });
});

describe("Submission record", () => {
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

  it("returns the stored row so its outcome can be filled in later", async () => {
    stubFetch((url) =>
      url.includes("signup_submissions")
        ? Response.json([{ id: ROW.id, created_at: ROW.createdAt }], { status: 201 })
        : new Response(null, { status: 204 }),
    );

    const stored = await recordSubmission(BASE, { ok: false, skipped: true });

    assert.deepEqual(stored, { stored: true, row: ROW });
    assert.equal(requested[0].method, "POST");
  });
});
