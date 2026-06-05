import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildCustomerFieldsDataRequest,
  validateCustomerFieldValues,
  type CustomerFieldValues,
} from "./momence-customer-fields.helpers";
import { momenceDashboardFetch } from "./momence.server";

const CustomerFieldValuesSchema = z.object({
  fitnessGoal: z.string().max(500).optional(),
  emergencyContactInfo: z.string().max(100).optional(),
  pregnancyStatus: z.string().max(100).optional(),
  medicalHistory: z.string().max(1000).optional(),
  postNatalStatus: z.string().max(100).optional(),
  fnf: z.string().max(500).optional(),
  gender: z.string().max(100).optional(),
  euShoeSize: z.string().max(20).optional(),
  howDidHear: z.string().max(250).optional(),
});

const SaveCustomerFieldsInput = z.object({
  memberId: z.number().int().positive(),
  requiresShoeSize: z.boolean().default(false),
  values: CustomerFieldValuesSchema,
});

export const saveCustomerFieldsForMember = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveCustomerFieldsInput.parse(input))
  .handler(async ({ data }) => {
    const values = data.values as CustomerFieldValues;
    const errors = validateCustomerFieldValues(values, {
      requiresShoeSize: data.requiresShoeSize,
    });

    if (Object.keys(errors).length > 0) {
      throw new Error("Required profile details are missing.");
    }

    const request = buildCustomerFieldsDataRequest({
      memberId: data.memberId,
      values,
    });

    await momenceDashboardFetch(request.path, {
      method: "POST",
      body: JSON.stringify(request.body),
    });

    return { saved: true as const };
  });
