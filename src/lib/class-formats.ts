import barreImage from "@/assets/116 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _56A1541 (2).jpg";
import fitImage from "@/assets/2115 _ Physique57 _ Trainer Shots _ _56A3035.jpg";
import strengthImage from "@/assets/2094 _ Physique57 _ Trainer Shots _ _04A1305.jpg";
import backBodyBlazeImage from "@/assets/2123 _ Physique57 _ Trainer Shots _ _56A1916.jpg";
import matImage from "@/assets/2087 _ Physique57 _ Trainer Shots _ _56A2974.jpg";
import cardioImage from "@/assets/2068 _ Physique57 _ Trainer Shots _ _04A1243.jpg";
import hiitImage from "@/assets/2066 _ Physique57 _ Trainer Shots _ _56A2552.jpg";
import cardioBarrePlusImage from "@/assets/120 _ Physique57 _ Photoshoot _ Tanmay Kothari _ _04A1551.jpg";
import recoveryImage from "@/assets/2080 _ Physique57 _ Trainer Shots _ _56A2464.jpg";
import cycleImage from "@/assets/2007 _ Physique57 _ Trainer Shots _ _56A2318.jpg";
import {
  CLASS_FORMAT_KEYS,
  classFormatKeyForSessionName,
  type ClassFormatKey,
} from "@/lib/class-format-matchers";

export type ClassFormat = {
  key: ClassFormatKey;
  name: string;
  image: string;
  intensity: string;
  bestFor: string;
  description: string;
};

export const CLASS_FORMATS: ClassFormat[] = [
  {
    key: "barre-57",
    name: "Barre",
    image: barreImage,
    intensity: "Moderate to high, with modifications",
    bestFor: "All fitness levels",
    description:
      "The signature Physique 57 workout combines precise, controlled movements, isometric holds and targeted strength exercises to sculpt, tone and strengthen the entire body, all set to energising music.",
  },
  {
    key: "power-cycle",
    name: "powerCycle",
    image: cycleImage,
    intensity: "Open level, rider controlled",
    bestFor: "Low-impact cardio and endurance",
    description:
      "Rhythm-driven indoor cycling built on cadence, resistance, cardio interval blocks, and real-time riding metrics.",
  },
  {
    key: "studio-fit",
    name: "Studio FIT",
    image: fitImage,
    intensity: "High intensity",
    bestFor: "Strength-based interval training",
    description:
      "A 50-minute functional interval class combining strength work, endurance blocks, heavy weights, and core conditioning.",
  },
  {
    key: "cardio-barre",
    name: "Cardio Barre",
    image: cardioImage,
    intensity: "Intermediate to advanced",
    bestFor: "Sweat-forward barre",
    description:
      "Traditional barre precision meets faster cardiovascular sequences, dynamic intervals, and active recovery.",
  },
  {
    key: "cardio-barre-plus",
    name: "Cardio Barre Plus",
    image: cardioBarrePlusImage,
    intensity: "Advanced cardio barre",
    bestFor: "A stronger sweat-forward barre challenge",
    description:
      "A more athletic Cardio Barre progression with longer burn blocks, quicker transitions, and elevated heart-rate intervals while keeping Physique 57 precision.",
  },
  {
    key: "hiit",
    name: "HIIT",
    image: hiitImage,
    intensity: "High intensity",
    bestFor: "Cardio intervals and athletic conditioning",
    description:
      "A compact, high-output session alternating cardio bursts, strength drills, active recovery, and core work for a powerful full-body burn.",
  },
  {
    key: "mat-57",
    name: "Mat 57",
    image: matImage,
    intensity: "Moderate to high",
    bestFor: "Core, posture, flexibility",
    description:
      "Pilates-inspired floor work that brings Physique 57 sculpting techniques to the mat with posture, balance, and alignment.",
  },
  {
    key: "strength-lab",
    name: "StrengthLab",
    image: strengthImage,
    intensity: "Advanced strength",
    bestFor: "Experienced strength trainees",
    description:
      "A 57-minute circuit-based strength format using heavier weights, specific repetition counts, progressive overload, and power work.",
  },
  {
    key: "back-body-blaze",
    name: "Back Body Blaze",
    image: backBodyBlazeImage,
    intensity: "Advanced posterior-chain strength",
    bestFor: "Back, glutes, hamstrings, posture, and power",
    description:
      "A focused strength format targeting the back body with controlled resistance, glute and hamstring work, posture-focused pulls, and core stability.",
  },
  {
    key: "recovery",
    name: "Recovery",
    image: recoveryImage,
    intensity: "Low intensity restorative",
    bestFor: "Mobility, flexibility, reset, and active recovery",
    description:
      "A slower session built around breath, lengthening, mobility, assisted stretch patterns, and restorative movement to help the body reset between stronger classes.",
  },
];

const CLASS_FORMAT_BY_KEY = CLASS_FORMATS.reduce(
  (byKey, classFormat) => {
    byKey[classFormat.key] = classFormat;
    return byKey;
  },
  {} as Record<ClassFormatKey, ClassFormat>,
);

export function classFormatForKey(key: ClassFormatKey): ClassFormat {
  return CLASS_FORMAT_BY_KEY[key];
}

export function classFormatForSessionName(sessionName: string): ClassFormat {
  return classFormatForKey(classFormatKeyForSessionName(sessionName));
}

const STUDIO_CLASS_TYPES: Record<number, ClassFormatKey[]> = {
  9030: ["barre-57", "power-cycle", "strength-lab"], // Kwality House, Kemps Corner
  29821: ["barre-57", "power-cycle"], // Supreme HQ, Bandra
};

export function classTypeOptionsForLocation(locationId: number): ClassFormatKey[] {
  return STUDIO_CLASS_TYPES[locationId] ?? ["barre-57"];
}

for (const key of CLASS_FORMAT_KEYS) {
  if (!CLASS_FORMAT_BY_KEY[key]) {
    throw new Error(`Missing class format catalog item for ${key}`);
  }
}
