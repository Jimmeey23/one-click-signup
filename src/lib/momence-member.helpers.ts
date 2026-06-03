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

  return {
    path: "/host/members",
    method: "POST",
    body: {
      firstName: safeFirstName,
      lastName: safeLastName,
      email: email.trim(),
      ...(phoneNumber ? { phoneNumber } : {}),
      ...(homeLocationId ? { homeLocationId } : {}),
    },
  };
}
