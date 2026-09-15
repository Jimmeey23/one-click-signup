export type HostMemberCreateRequestBody = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  homeLocationId?: number;
};

export type HostMemberCreateRequest = {
  path: "/host/members";
  method: "POST";
  body: HostMemberCreateRequestBody;
};

export function normalizeMomenceNamePart(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{M}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildHostMemberCreateRequest({
  firstName,
  lastName,
  email,
  phoneNumber,
  homeLocationId,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  homeLocationId?: number;
}): HostMemberCreateRequest {
  const safeFirstName = normalizeMomenceNamePart(firstName);
  const safeLastName = normalizeMomenceNamePart(lastName);

  if (!safeFirstName || !safeLastName) {
    throw new Error("Please enter first and last name using letters.");
  }

  // Momence's /host/members endpoint requires homeLocationId for every known studio.
  const eligibleHomeLocationId = homeLocationId === 287883 ? 22116 : homeLocationId;
  const supportedHomeLocationId =
    eligibleHomeLocationId && [9030, 29821, 22116, 36372].includes(eligibleHomeLocationId)
      ? eligibleHomeLocationId
      : undefined;

  return {
    path: "/host/members",
    method: "POST",
    body: {
      firstName: safeFirstName,
      lastName: safeLastName,
      email: email.trim(),
      ...(phoneNumber ? { phoneNumber } : {}),
      ...(supportedHomeLocationId ? { homeLocationId: supportedHomeLocationId } : {}),
    },
  };
}

/**
 * Juniors registrations name the child in one field. Momence requires both a first and a
 * last name, so a single-word child name inherits the parent's surname: "Riya" with parent
 * "Asha Shah" becomes Riya Shah.
 */
export function splitChildName(
  childName: string,
  parentLastName: string,
): { firstName: string; lastName: string } {
  const parts = normalizeMomenceNamePart(childName).split(" ").filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: normalizeMomenceNamePart(parentLastName) };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * A child has no email of their own, so their Momence record uses the parent's address.
 * Momence rejects a second member on an address it already knows, so this builds the
 * plus-addressed variant used on retry - it still delivers to the parent's inbox.
 */
export function childEmailVariant(parentEmail: string, childFirstName: string): string {
  const email = parentEmail.trim();
  const at = email.lastIndexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const tag = childFirstName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  if (!tag) return email;
  // Do not stack tags if the parent already used a plus address.
  const baseLocal = local.includes("+") ? local.slice(0, local.indexOf("+")) : local;
  return `${baseLocal}+${tag}${domain}`;
}
