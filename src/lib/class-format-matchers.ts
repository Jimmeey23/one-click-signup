export const CLASS_FORMAT_KEYS = [
  "barre-57",
  "power-cycle",
  "studio-fit",
  "cardio-barre",
  "cardio-barre-plus",
  "hiit",
  "mat-57",
  "strength-lab",
  "back-body-blaze",
  "recovery",
] as const;

export type ClassFormatKey = (typeof CLASS_FORMAT_KEYS)[number];

function normalizeClassFormatName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function classFormatKeyForSessionName(value: string): ClassFormatKey {
  const name = normalizeClassFormatName(value);
  const compactName = name.replace(/\s+/g, "");

  if (name.includes("powercycle") || name.includes("power cycle") || name.includes("spin")) {
    return "power-cycle";
  }

  if (name.includes("strength lab") || compactName.includes("strengthlab")) {
    return "strength-lab";
  }

  return "barre-57";
}
