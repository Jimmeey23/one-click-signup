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

  if (name.includes("cycle") || name.includes("spin")) return "power-cycle";
  if (name.includes("fit") || name.includes("functional")) return "studio-fit";
  if (name.includes("recovery") || name.includes("restore") || name.includes("stretch")) {
    return "recovery";
  }
  if (name.includes("hiit")) return "hiit";
  if (name.includes("cardio") && name.includes("plus")) return "cardio-barre-plus";
  if (name.includes("cardio")) return "cardio-barre";
  if (name.includes("back body") || name.includes("blaze")) return "back-body-blaze";
  if (
    name.includes("strength") ||
    compactName.includes("strengthlab") ||
    name.includes("lab") ||
    name.includes("pull") ||
    name.includes("push")
  ) {
    return "strength-lab";
  }
  if (name.includes("mat")) return "mat-57";

  return "barre-57";
}
