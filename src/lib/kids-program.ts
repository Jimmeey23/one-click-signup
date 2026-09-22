// Physique 57 Juniors. Ported from the paid-trial kids form so the two entry points stay
// in step: same hero rotation, same batch grid, same parent-facing copy.

export const JUNIORS_PROGRAM_NAME = "Physique 57 - Juniors";

export const JUNIORS_MIN_AGE = 8;
export const JUNIORS_MAX_AGE = 12;

export const JUNIORS_HERO_IMAGES = [
  "/p57-assets/p57-juniors-hero-1.jpg",
  "/p57-assets/p57-juniors-hero-2.jpg",
  "/p57-assets/p57-juniors-hero-3.jpg",
  "/p57-assets/p57-juniors-hero-4.jpg",
];

export type JuniorsBatch = {
  value: string;
  days: string;
  time: string;
  instructors: string;
  studio: string;
  note: string;
  accent: string;
  metaAccent: string;
};

// Keyed by Momence location id rather than the studio's display name, so a rename in the
// locations catalog cannot silently empty the batch list.
export const JUNIORS_BATCHES_BY_LOCATION_ID: Record<number, JuniorsBatch[]> = {
  29821: [
    {
      value: "Tuesday & Friday - 4:30 PM - Tue: Simonelle, Fri: Cauveri",
      days: "Tuesday & Friday",
      time: "4:30 PM",
      instructors: "Tue: Simonelle, Fri: Cauveri",
      studio: "Bandra",
      note: "A twice-weekly class for posture, alignment, and confidence.",
      accent: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      metaAccent: "text-rose-700",
    },
  ],
  9030: [
    {
      value: "Batch A - Monday & Thursday - 11:30 AM - Mon: Simonelle, Thu: Karanvir",
      days: "Batch A - Monday & Thursday",
      time: "11:30 AM",
      instructors: "Mon: Simonelle, Thu: Karanvir",
      studio: "Kemps Corner",
      note: "A late-morning class with guided technique and balance work.",
      accent: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
      metaAccent: "text-sky-700",
    },
    {
      value: "Batch B - Monday & Wednesday - 4:30 PM - Mon: Cauveri, Wed: Pranjali",
      days: "Batch B - Monday & Wednesday",
      time: "4:30 PM",
      instructors: "Mon: Cauveri, Wed: Pranjali",
      studio: "Kemps Corner",
      note: "An after-school class for young movers who prefer a later start.",
      accent: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      metaAccent: "text-emerald-700",
    },
  ],
};

// Juniors runs at the two Mumbai studios only, so the centre picker must not offer
// locations where no batch exists.
export const JUNIORS_LOCATION_IDS = [9030, 29821];

export function juniorsBatchesForLocation(locationId: number): JuniorsBatch[] {
  return JUNIORS_BATCHES_BY_LOCATION_ID[locationId] ?? [];
}

export const JUNIORS_USPS = [
  {
    title: "Signature Method DNA",
    description:
      "Built from the Physique 57 barre-based Interval Overload method, adapted into a precise, age-aware practice for young movers.",
    icon: "sparkles",
    accent: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  },
  {
    title: "Low-Impact, High-Control Movement",
    description:
      "Sessions focus on posture, coordination, flexibility, balance, and body control without the stress of high-impact training.",
    icon: "shield",
    accent: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  },
  {
    title: "Instructor-Led Alignment",
    description:
      "P57 instructors guide form, rhythm, and confidence with the same premium coaching standards used across the adult studio experience.",
    icon: "award",
    accent: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  },
  {
    title: "Confidence Through Practice",
    description:
      "A polished studio journey that helps juniors build strength, focus, musicality, and comfort inside a boutique fitness environment.",
    icon: "heart",
    accent: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
] as const;

export const JUNIORS_BUILD_AREAS = [
  {
    title: "Postural Intelligence",
    description:
      "Clean alignment cues help juniors understand how strength, balance, and control connect.",
    icon: "target",
    accent: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  },
  {
    title: "Rhythm & Focus",
    description:
      "Music-led sequencing builds coordination, timing, attention, and comfort with structured movement.",
    icon: "sparkles",
    accent: "bg-pink-50 text-pink-700 ring-1 ring-pink-100",
  },
  {
    title: "Confident Strength",
    description:
      "Low-impact resistance work supports steady progress without overwhelming growing bodies.",
    icon: "shield",
    accent: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
  },
] as const;

export const JUNIORS_PROGRAM_FEATURES = [
  {
    title: "Functional Movement",
    icon: "accessibility",
    accent: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  },
  {
    title: "Agility Drills",
    icon: "footprints",
    accent: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  },
  {
    title: "Barre-Based Work",
    icon: "table",
    accent: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  },
  {
    title: "Designed for Growing Bodies",
    icon: "person",
    accent: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
] as const;

export const JUNIORS_PROGRAM_OUTCOMES = [
  { title: "Build Strength", icon: "dumbbell" },
  { title: "Improve Balance", icon: "person" },
  { title: "Boost Agility", icon: "activity" },
  { title: "Build Confidence", icon: "zap" },
  { title: "Have Fun", icon: "smile" },
] as const;

export const JUNIORS_JOURNEY_STEPS = [
  "A warm welcome at your selected studio",
  "Instructor-led movement with age-aware cues",
  "Friendly guidance on the class that suits your child best",
];

export const JUNIORS_PARENT_NOTES = [
  `Designed for young movers aged ${JUNIORS_MIN_AGE} to ${JUNIORS_MAX_AGE}.`,
  "We will confirm availability and help you choose the most suitable class.",
  "Your contact details help us coordinate your child's first session.",
];
