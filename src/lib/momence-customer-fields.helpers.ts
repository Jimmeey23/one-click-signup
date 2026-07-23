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

const PHONE_NUMBER_PATTERN = /^[0-9]{7,15}$/;

function trimmed(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function sanitizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateCustomerFieldValues(
  values: CustomerFieldValues,
  { requiresShoeSize, gender }: { requiresShoeSize: boolean; gender?: string },
): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};

  const isFemale = gender === "Female";

  for (const field of ALWAYS_REQUIRED_FIELDS) {
    if ((field === "pregnancyStatus" || field === "postNatalStatus") && !isFemale) continue;
    if (!trimmed(values[field])) {
      errors[field] = `${CUSTOMER_FIELD_LABELS[field]} is required.`;
    }
  }

  if (requiresShoeSize && !trimmed(values.euShoeSize)) {
    errors.euShoeSize = "EU Shoe Size is required for powerCycle classes.";
  }

  const emergencyContact = trimmed(values.emergencyContactInfo);
  if (emergencyContact && !PHONE_NUMBER_PATTERN.test(sanitizePhoneNumber(emergencyContact))) {
    errors.emergencyContactInfo = "Emergency Contact Info must be a phone number.";
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
    const value =
      key === "emergencyContactInfo" && typeof values[key] === "string"
        ? sanitizePhoneNumber(values[key])
        : values[key];
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
