// Phone validation shared by the signup forms, so the Activate button and the
// submit-time checks can never disagree about what counts as a usable number.

/** Indian mobile numbers are always 10 national digits. */
export const INDIA_DIAL_CODE = "+91";
export const INDIA_PHONE_DIGITS = 10;

// Other countries range from 7 to 11 national digits, so we only guard against
// obviously truncated input rather than pretending to know each country's format.
const MIN_INTERNATIONAL_DIGITS = 6;

export function phoneDigits(phoneNumber: string): string {
  return phoneNumber.replace(/[^0-9]/g, "");
}

export function isValidPhoneNumber(phoneNumber: string, dialCode: string): boolean {
  const digits = phoneDigits(phoneNumber);
  if (dialCode.trim() === INDIA_DIAL_CODE) return digits.length === INDIA_PHONE_DIGITS;
  return digits.length >= MIN_INTERNATIONAL_DIGITS;
}

/** The message to show under the field, or null while the number is still acceptable. */
export function phoneNumberError(phoneNumber: string, dialCode: string): string | null {
  const digits = phoneDigits(phoneNumber);
  if (digits.length === 0) return null;
  if (isValidPhoneNumber(phoneNumber, dialCode)) return null;
  if (dialCode.trim() === INDIA_DIAL_CODE) {
    return `Enter all ${INDIA_PHONE_DIGITS} digits of your mobile number (${digits.length} so far).`;
  }
  return "Enter a valid phone number.";
}
