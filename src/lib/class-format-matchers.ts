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

// Finer-grained than classFormatKeyForSessionName, which folds every barre-family class into
// "barre-57" because only the three bookable class types matter for signup. This one is for
// showing the right name and description on a schedule.
export function detailedClassFormatKeyForSessionName(value: string): ClassFormatKey {
  const name = normalizeClassFormatName(value);
  const words = ` ${name} `;

  if (words.includes(" back body blaze ")) return "back-body-blaze";
  if (words.includes(" cardio barre plus ") || words.includes(" cardio barre + ")) {
    return "cardio-barre-plus";
  }
  if (words.includes(" cardio barre ")) return "cardio-barre";
  if (words.includes(" hiit ")) return "hiit";
  if (words.includes(" fit ")) return "studio-fit";
  if (words.includes(" mat ")) return "mat-57";
  if (words.includes(" recovery ") || words.includes(" stretch ")) return "recovery";
  return classFormatKeyForSessionName(value);
}

export function classTypeValueForClassFormatKey(key: ClassFormatKey): string {
  switch (key) {
    case "barre-57":
      return "Barre";
    case "power-cycle":
      return "powerCycle";
    case "strength-lab":
      return "Strength Lab";
    default:
      return "Barre";
  }
}
