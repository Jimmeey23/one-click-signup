// Juniors registrations create the child as a child account hanging off the parent's
// Momence customer record - the same shape the studio dashboard creates by hand. Momence
// only provisions the `child-waiver` record for members created this way, which is why a
// standalone member created through the public API can never sign it.

/** Momence custom customer field that holds a child's date of birth. */
export const DEFAULT_CHILD_DOB_CUSTOMER_FIELD_ID = 6592;

export type ChildAccountCreateRequest = {
  path: string;
  method: "POST";
  headers: { Referer: string; "X-Origin": string };
  body: {
    autoGenerateEmail: true;
    email: "";
    firstName: string;
    lastName: string;
    customerFields: Array<{ id: number; value: string }>;
  };
};

export function buildChildAccountCreateRequest({
  hostId,
  parentMemberId,
  firstName,
  lastName,
  childDateOfBirth,
  dobCustomerFieldId = DEFAULT_CHILD_DOB_CUSTOMER_FIELD_ID,
}: {
  hostId: number;
  parentMemberId: number;
  firstName: string;
  lastName: string;
  childDateOfBirth?: string;
  dobCustomerFieldId?: number;
}): ChildAccountCreateRequest {
  const crmUrl = `https://momence.com/dashboard/${hostId}/crm/${parentMemberId}`;
  const dateOfBirth = childDateOfBirth?.trim() ?? "";

  return {
    path: `/host/${hostId}/customers/${parentMemberId}/children`,
    method: "POST",
    headers: { Referer: crmUrl, "X-Origin": crmUrl },
    body: {
      autoGenerateEmail: true,
      email: "",
      firstName,
      lastName,
      // Momence blocks a free session booking for a member with no date of birth when the
      // host has age restrictions configured, so it is always sent.
      customerFields: dateOfBirth ? [{ id: dobCustomerFieldId, value: dateOfBirth }] : [],
    },
  };
}

const CHILD_CONTAINER_KEYS = [
  "children",
  "child",
  "customers",
  "customer",
  "members",
  "member",
  "payload",
  "data",
  "items",
  "results",
  "rows",
  "records",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMemberId(value: Record<string, unknown>): number | null {
  for (const key of ["memberId", "member_id", "customerId", "customer_id", "id"]) {
    const raw = value[key];
    const parsed = typeof raw === "string" ? Number(raw) : raw;
    if (typeof parsed === "number" && Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

/**
 * Momence has shipped several shapes for this response (a bare object, a `payload` array, a
 * `children` list), so the child's member id is pulled out of whichever one comes back.
 */
export function parseChildAccountMemberId(data: unknown): number | null {
  const collect = (value: unknown): number[] => {
    if (Array.isArray(value)) return value.flatMap(collect);
    if (!isPlainObject(value)) return [];

    for (const key of CHILD_CONTAINER_KEYS) {
      const nested = collect(value[key]);
      if (nested.length) return nested;
    }

    const memberId = readMemberId(value);
    return memberId ? [memberId] : [];
  };

  return collect(data)[0] ?? null;
}
