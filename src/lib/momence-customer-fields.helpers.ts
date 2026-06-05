export type CustomerFieldValues = {
  fitnessGoal?: string;
  emergencyContactInfo?: string;
  pregnancyStatus?: string;
  medicalHistory?: string;
  postNatalStatus?: string;
  fnf?: string;
  gender?: string;
  euShoeSize?: string;
  howDidHear?: string;
};

export type CustomerFieldErrors = Partial<Record<keyof CustomerFieldValues, string>>;

export const MOMENCE_CUSTOM_FIELDS_HOST_ID = 13752;

const CUSTOMER_FIELD_IDS: Record<keyof CustomerFieldValues, number> = {
  fitnessGoal: 8149,
  emergencyContactInfo: 8251,
  pregnancyStatus: 8252,
  medicalHistory: 8253,
  postNatalStatus: 8254,
  fnf: 8401,
  gender: 16549,
  euShoeSize: 17139,
  howDidHear: 19050,
};

const CUSTOMER_FIELD_LABELS: Record<keyof CustomerFieldValues, string> = {
  fitnessGoal: "Fitness Goal",
  emergencyContactInfo: "Emergency Contact Info",
  pregnancyStatus: "Are you currently pregnant?",
  medicalHistory: "Medical History",
  postNatalStatus: "Post Natal",
  fnf: "FNF",
  gender: "Gender",
  euShoeSize: "EU Shoe Size",
  howDidHear: "How did you hear about us?",
};

const ALWAYS_REQUIRED_FIELDS: Array<keyof CustomerFieldValues> = [
  "emergencyContactInfo",
  "pregnancyStatus",
  "medicalHistory",
  "postNatalStatus",
];

function trimmed(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function validateCustomerFieldValues(
  values: CustomerFieldValues,
  { requiresShoeSize }: { requiresShoeSize: boolean },
): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};

  for (const field of ALWAYS_REQUIRED_FIELDS) {
    if (!trimmed(values[field])) {
      errors[field] = `${CUSTOMER_FIELD_LABELS[field]} is required.`;
    }
  }

  if (requiresShoeSize && !trimmed(values.euShoeSize)) {
    errors.euShoeSize = "EU Shoe Size is required for powerCycle classes.";
  }

  return errors;
}

export function buildCustomerFieldsDataRequest({
  memberId,
  values,
}: {
  memberId: number;
  values: CustomerFieldValues;
}) {
  const mappedValues: Record<string, string> = {};

  for (const [key, id] of Object.entries(CUSTOMER_FIELD_IDS) as Array<
    [keyof CustomerFieldValues, number]
  >) {
    const value = values[key];
    if (typeof value === "string" && value.length > 0) {
      mappedValues[String(id)] = value;
    }
  }

  return {
    path: `/host/${MOMENCE_CUSTOM_FIELDS_HOST_ID}/customer-fields/data`,
    body: {
      memberId,
      values: mappedValues,
    },
  } as const;
}
