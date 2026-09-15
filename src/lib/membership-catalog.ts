// The memberships a shareable route can put a new member on. Kept in one place so the
// Route Builder dropdown and the server-side enrolment read the same list, and so a
// route can only pick a membership that actually exists at the studio it targets.
import {
  BENGALURU_INDIRANAGAR_LOCATION_ID,
  BENGALURU_INDIRANAGAR_MEMBERSHIP_ID,
  BENGALURU_INDIRANAGAR_PRICE_INR,
  BENGALURU_LAVELLE_ROAD_INTRO_MEMBERSHIP_ID,
  BENGALURU_LAVELLE_ROAD_INTRO_PRICE_INR,
  BENGALURU_LAVELLE_ROAD_LOCATION_ID,
  BENGALURU_PLASH_PILATES_LOCATION_ID,
  BENGALURU_PLASH_PILATES_MEMBERSHIP_ID,
  NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
  NEWCOMERS_2_FOR_1_PRICE_INR,
  OPEN_BARRE_MEMBERSHIP_ID,
  openBarreMembershipIdForLocation,
} from "./momence-booking.helpers";
import { MUMBAI_LOCATIONS } from "./momence-locations";

const MUMBAI_LOCATION_IDS = MUMBAI_LOCATIONS.map((location) => location.id as number);

export type MembershipOption = {
  key: string;
  membershipId: number;
  label: string;
  description: string;
  /** Assigned at price 0 with a "free" payment method - no Stripe step. */
  free: boolean;
  priceInr: string;
  /** Empty means "available at every studio". */
  locationIds: number[];
};

export const MEMBERSHIP_OPTIONS: MembershipOption[] = [
  {
    key: "open-barre",
    membershipId: OPEN_BARRE_MEMBERSHIP_ID,
    label: "Open Barre (free trial)",
    description:
      "The standard complimentary first-class membership used by the Mumbai trial funnel.",
    free: true,
    priceInr: "0",
    locationIds: MUMBAI_LOCATION_IDS,
  },
  {
    key: "newcomers-2-for-1",
    membershipId: NEWCOMERS_2_FOR_1_MEMBERSHIP_ID,
    label: "Newcomers 2-for-1 (paid)",
    description: "Two classes for one price. Collected through Stripe before the class is booked.",
    free: false,
    priceInr: NEWCOMERS_2_FOR_1_PRICE_INR,
    locationIds: MUMBAI_LOCATION_IDS,
  },
  {
    key: "blr-lavelle-intro",
    membershipId: BENGALURU_LAVELLE_ROAD_INTRO_MEMBERSHIP_ID,
    label: "Lavelle Road intro (paid)",
    description: "Bengaluru Lavelle Road introductory single class.",
    free: false,
    priceInr: BENGALURU_LAVELLE_ROAD_INTRO_PRICE_INR,
    locationIds: [BENGALURU_LAVELLE_ROAD_LOCATION_ID],
  },
  {
    key: "blr-indiranagar",
    membershipId: BENGALURU_INDIRANAGAR_MEMBERSHIP_ID,
    label: "Indiranagar intro (paid)",
    description: "Bengaluru Indiranagar introductory single class.",
    free: false,
    priceInr: BENGALURU_INDIRANAGAR_PRICE_INR,
    locationIds: [BENGALURU_INDIRANAGAR_LOCATION_ID],
  },
  {
    key: "blr-plash-pilates",
    membershipId: BENGALURU_PLASH_PILATES_MEMBERSHIP_ID,
    label: "Plash Pilates intro (paid)",
    description: "Plash Pilates, Sadashivnagar introductory session.",
    free: false,
    priceInr: "0",
    locationIds: [BENGALURU_PLASH_PILATES_LOCATION_ID],
  },
];

export function membershipOptionsForLocation(locationId: number): MembershipOption[] {
  return MEMBERSHIP_OPTIONS.filter(
    (option) => option.locationIds.length === 0 || option.locationIds.includes(locationId),
  );
}

export function membershipOptionByKey(key: string): MembershipOption | undefined {
  return MEMBERSHIP_OPTIONS.find((option) => option.key === key);
}

export function membershipOptionById(membershipId: number): MembershipOption | undefined {
  return MEMBERSHIP_OPTIONS.find((option) => option.membershipId === membershipId);
}

/**
 * The membership a route should use when it names none: whatever the studio's own free
 * trial membership is.
 */
export function defaultMembershipIdForLocation(locationId: number): number {
  return openBarreMembershipIdForLocation(locationId);
}

export function isFreeMembershipId(membershipId: number): boolean {
  return membershipOptionById(membershipId)?.free ?? false;
}
