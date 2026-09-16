export type PredefinedWaiverType =
  | "waiver"
  | "membership-waiver"
  | "child-waiver"
  | "privacy-policy";

export type HandwrittenElementPoint = {
  x: number;
  y: number;
};

export type HandwrittenElementPath = {
  points: HandwrittenElementPoint[];
};

export type HandwrittenElement = {
  paths: HandwrittenElementPath[];
};

export type MemberSignDocumentRequestBody = {
  customWaiverIdsToSign: number[];
  predefinedWaiverTypesToSign: PredefinedWaiverType[];
  simpleSignature?: string;
  handwrittenSignature?: HandwrittenElement;
};

export type MemberHostSignableDocumentsSignRequest = {
  path: "/member/host/signable-documents/sign";
  method: "PUT";
  body: MemberSignDocumentRequestBody;
};

type DashboardWaiverType = "predefined" | "custom";

export type DashboardWaiver = {
  type: DashboardWaiverType;
  id: string | number;
  signatureStatus?: string | null;
  signatureKey?: string | null;
};

export type DashboardPublicWaiverSignRequest = {
  path: string;
  method: "POST";
  body: {
    realSignature: string;
  };
  headers: {
    Referer: string;
    "X-Origin": string;
  };
};

const DEFAULT_PREDEFINED_WAIVER_TYPES: PredefinedWaiverType[] = [
  "waiver",
  "membership-waiver",
  "privacy-policy",
];

const DEFAULT_DASHBOARD_PREDEFINED_WAIVER_IDS = new Set(["waiver", "membership-waiver"]);

/** Signed against the parent's own member record on a Juniors registration. */
export const KIDS_PARENT_PREDEFINED_WAIVER_IDS: PredefinedWaiverType[] = [
  "waiver",
  "membership-waiver",
];

/** Signed against the child's member record. Momence only offers it on a child account. */
export const KIDS_CHILD_PREDEFINED_WAIVER_IDS: PredefinedWaiverType[] = ["child-waiver"];

function uniquePositiveIntegers(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isInteger(value) && value > 0))];
}

function uniquePredefinedTypes(values: PredefinedWaiverType[]): PredefinedWaiverType[] {
  return [...new Set(values)];
}

export function buildMemberHostSignableDocumentsSignRequest({
  signatureName,
  customWaiverIdsToSign = [],
  predefinedWaiverTypesToSign = DEFAULT_PREDEFINED_WAIVER_TYPES,
}: {
  signatureName: string;
  customWaiverIdsToSign?: number[];
  predefinedWaiverTypesToSign?: PredefinedWaiverType[];
}): MemberHostSignableDocumentsSignRequest {
  return {
    path: "/member/host/signable-documents/sign",
    method: "PUT",
    body: {
      customWaiverIdsToSign: uniquePositiveIntegers(customWaiverIdsToSign),
      predefinedWaiverTypesToSign: uniquePredefinedTypes(predefinedWaiverTypesToSign),
      simpleSignature: signatureName.trim(),
    },
  };
}

function dashboardWaiverSignPageUrl({
  hostId,
  memberId,
  waiverId,
  signatureKey,
}: {
  hostId: number;
  memberId: number;
  waiverId: string;
  signatureKey: string;
}): string {
  return `https://momence.com/dashboard/${hostId}/crm/${memberId}/waivers/${encodeURIComponent(
    waiverId,
  )}/sign?signature=${encodeURIComponent(signatureKey)}&returnTo=/dashboard/${hostId}/crm/${memberId}`;
}

export function buildDashboardPublicWaiverSignRequests({
  hostId,
  memberId,
  realSignature,
  waivers,
  predefinedWaiverIds = DEFAULT_DASHBOARD_PREDEFINED_WAIVER_IDS,
}: {
  hostId: number;
  memberId: number;
  realSignature: string;
  waivers: DashboardWaiver[];
  predefinedWaiverIds?: Set<string>;
}): DashboardPublicWaiverSignRequest[] {
  const availableById = new Map(
    waivers
      .filter((waiver) => waiver.type === "predefined" && typeof waiver.id === "string")
      .map((waiver) => [String(waiver.id), waiver]),
  );

  // Driven by the requested ids rather than the response order, so the caller decides which
  // waivers a member signs - a parent signs the studio waivers, a child the child-waiver.
  return [...predefinedWaiverIds].flatMap((waiverId) => {
    const waiver = availableById.get(waiverId);
    if (!waiver || waiver.signatureStatus?.toLowerCase() === "signed" || !waiver.signatureKey) {
      return [];
    }

    const signatureKey = waiver.signatureKey;
    const signPageUrl = dashboardWaiverSignPageUrl({
      hostId,
      memberId,
      waiverId,
      signatureKey,
    });

    return [
      {
        path: `/public/hosts/${hostId}/members/${memberId}/waivers/${encodeURIComponent(
          waiverId,
        )}/sign?signatureKey=${encodeURIComponent(signatureKey)}`,
        method: "POST" as const,
        body: { realSignature },
        headers: {
          Referer: signPageUrl,
          "X-Origin": signPageUrl,
        },
      },
    ];
  });
}
