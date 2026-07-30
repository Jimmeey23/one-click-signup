import barreImage from "@/assets/DSC_2963.jpg";
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
  duration: string;
  equipment: string;
};

export const CLASS_FORMATS: ClassFormat[] = [
  {
    key: "barre-57",
    name: "Barre",
    image: barreImage,
    intensity: "Beginner to intermediate",
    bestFor: "All fitness levels, and your very first class",
    description:
      "The signature fundamental barre class and cornerstone of the Physique 57 experience. Muscle-defining arm work, intense thigh and seat sequences, waist-chiseling ab work, and fluid stretches, built on the proprietary Interval Overload method - work a muscle group to fatigue, then immediately stretch it for relief and recovery.",
    duration: "57 minutes",
    equipment: "Ballet barre, light dumbbells, resistance bands and loops, body weight",
  },
  {
    key: "power-cycle",
    name: "powerCycle",
    image: cycleImage,
    intensity: "Open level, rider controlled",
    bestFor: "Low-impact cardio, endurance, and strong lean legs",
    description:
      "Rhythm-driven indoor cycling on Stages SC3 bikes that maps the beat of the music to the pedal stroke and emphasises meaningful resistance over pure speed. Tracks your watts, RPM, and kilometres ridden for measurable progress - low-impact cardio that builds cardiac and lung capacity without bulking your legs.",
    duration: "30 or 45 minutes",
    equipment: "Stages SC3 indoor bikes with power meters; SPD cleat shoes provided",
  },
  {
    key: "studio-fit",
    name: "Studio FIT",
    image: fitImage,
    intensity: "Intermediate to advanced",
    bestFor: "Building greater muscular strength alongside barre",
    description:
      "A high-intensity class combining strength-based interval training with endurance work and core conditioning, using progressive heavy weights for functional strength. An excellent complement to barre if you want to build greater muscular strength.",
    duration: "50 minutes",
    equipment: "Progressive heavy dumbbells, functional strength equipment",
  },
  {
    key: "cardio-barre",
    name: "Cardio Barre",
    image: cardioImage,
    intensity: "Intermediate",
    bestFor: "Sweat-forward barre with more cardio demand",
    description:
      "Traditional barre exercises combined with cardiovascular training - more intense strength variations at higher repetitions, elevating cardio endurance while toning every muscle group from head to toe with more dynamic movements and intervals than Barre 57.",
    duration: "57 minutes",
    equipment: "Ballet barre, light dumbbells, resistance bands",
  },
  {
    key: "cardio-barre-plus",
    name: "Cardio Barre Plus",
    image: cardioBarrePlusImage,
    intensity: "Advanced",
    bestFor: "Regular practitioners seeking a greater challenge",
    description:
      "An advanced, fast-paced evolution of Cardio Barre with tighter transitions, more complex variations, advanced layering, and compounded movements - the signature format pushed to new levels of intensity and endurance.",
    duration: "57 minutes",
    equipment: "Ballet barre, light dumbbells, resistance bands",
  },
  {
    key: "hiit",
    name: "HIIT",
    image: hiitImage,
    intensity: "Advanced",
    bestFor: "Maximum calorie burn and metabolic conditioning",
    description:
      "Physique 57's take on High-Intensity Interval Training - classic cardio movements like jumping jacks, lunges, and planks transformed into non-stop, heart-pumping sequences. Intense cardio paired with strength training designed to make you sweat and achieve maximum calorie burn.",
    duration: "45 minutes",
    equipment: "Body weight, classic cardio equipment",
  },
  {
    key: "mat-57",
    name: "Mat 57",
    image: matImage,
    intensity: "All levels",
    bestFor: "Core, posture, balance, and flexibility",
    description:
      "Pilates-style floor work that brings Physique 57's sculpting techniques to the mat - radical ab-blasting sequences that improve posture, core strength, balance, alignment, and flexibility, without using the barre.",
    duration: "57 minutes",
    equipment: "Yoga mat recommended; body weight resistance",
  },
  {
    key: "strength-lab",
    name: "StrengthLab",
    image: strengthImage,
    intensity: "Advanced (newcomer-friendly with prior strength experience)",
    bestFor: "Building lean muscle and boosting metabolism",
    description:
      "A comprehensive circuit format blending strength, core, mobility, and stretch work, built on principles of progressive overload. Can be done by a newcomer with relevant strength training experience from the past; otherwise start with barre or Studio FIT first.",
    duration: "57 minutes",
    equipment: "Dumbbells, kettlebells, plyo boxes, pull-up bars, resistance bands",
  },
  {
    key: "back-body-blaze",
    name: "Back Body Blaze",
    image: backBodyBlazeImage,
    intensity: "Intermediate",
    bestFor: "Back, glutes, hamstrings, posture, and power",
    description:
      "A focused class targeting the triceps, glutes, and back - the most commonly neglected muscle groups. Non-stop sequences with weights strengthen the posterior chain, improving posture and building a strong back.",
    duration: "57 minutes",
    equipment: "Dumbbells, resistance bands",
  },
  {
    key: "recovery",
    name: "Recovery",
    image: recoveryImage,
    intensity: "Low intensity, all levels",
    bestFor: "Rest days, post-intense training, and flexibility",
    description:
      "A total-body restorative stretch session that deeply relaxes the body while optimising muscle strength, symmetry, and recovery, gently guided by the trainer. Ideal for rest days or right after your most intense sessions.",
    duration: "30 minutes",
    equipment: "Body weight, guided stretching",
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

const STUDIO_CLASS_TYPES_BY_STUDIO: Record<string, ClassFormatKey[]> = {
  mumbai: ["barre-57", "power-cycle", "strength-lab"],
  bengaluru: ["barre-57"],
};

export function classTypeOptionsForLocation(locationId: number): ClassFormatKey[] {
  return STUDIO_CLASS_TYPES[locationId] ?? ["barre-57"];
}

export function classTypeOptionsForStudio(studio: string): ClassFormatKey[] {
  return STUDIO_CLASS_TYPES_BY_STUDIO[studio] ?? ["barre-57"];
}

for (const key of CLASS_FORMAT_KEYS) {
  if (!CLASS_FORMAT_BY_KEY[key]) {
    throw new Error(`Missing class format catalog item for ${key}`);
  }
}
