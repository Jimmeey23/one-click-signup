// Bridges the signup page (where we have the member's contact details) to the class
// booking page (where CompleteRegistration should actually fire) via sessionStorage,
// since the two are separate page loads connected by a full navigation.
const STORAGE_KEY = "p57RegistrationMeta";

export type RegistrationMeta = {
  eventId: string;
  memberId: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  classType: string;
  variant: string;
  countryIso?: string;
  fbp?: string;
  fbc?: string;
  landingPage: string;
};

export function storeRegistrationMeta(meta: RegistrationMeta) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
}

export function readRegistrationMeta(memberId: number): RegistrationMeta | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RegistrationMeta;
    return parsed.memberId === memberId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearRegistrationMeta() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
