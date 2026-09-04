// Client-safe constants (mirrors LOCATIONS in momence.server.ts)
export const MUMBAI_LOCATIONS = [
  {
    id: 9030,
    city: "Mumbai",
    state: "Maharashtra",
    postcode: "400036",
    name: "Kwality House, Kemps Corner",
    phone: "97696 65757",
    address: "Kwality House, August Kranti Rd, below Kemps Corner, Grant Road, Mumbai 400036",
  },
  {
    id: 29821,
    city: "Mumbai",
    state: "Maharashtra",
    postcode: "400050",
    name: "Supreme HQ, Bandra",
    phone: "97696 65757",
    address:
      "203, Supreme Headquarters, Junction of 14th & 33rd Rd, opposite Monkey Bar, Bandra West, Mumbai 400050",
  },
] as const;

export const BENGALURU_LOCATIONS = [
  {
    id: 22116,
    city: "Bengaluru",
    state: "Karnataka",
    postcode: "560001",
    name: "Lavelle Road, Bengaluru",
    phone: "97696 65757",
    address:
      "1st Floor, Kenkere House, Vittal Mallya Rd, above Raymonds, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001",
  },
  {
    id: 36372,
    city: "Bengaluru",
    state: "Karnataka",
    postcode: "560071",
    name: "Indiranagar, Bengaluru",
    phone: "97696 65757",
    address:
      "4th Floor, 167, 2nd Stage, 2nd Cross, Shankarnag Rd, Domlur, Bengaluru, Karnataka 560071",
  },
  {
    id: 287883,
    city: "Bengaluru",
    state: "Karnataka",
    postcode: "560003",
    name: "Plash Pilates, Sadashivnagar",
    phone: "97696 65757",
    address:
      "72/14, 2nd Main Rd, next to namdharis fresh, Vyalikaval, Kodandarampura, Malleshwaram, Bengaluru, Karnataka 560003",
    scheduleTagId: 383332,
  },
] as const;

export const LOCATIONS = [...MUMBAI_LOCATIONS, ...BENGALURU_LOCATIONS] as const;

// Meta event match quality accepts ct / st / zp. We never ask a trial signup for their
// address, so this is the studio they chose - a proxy, not their own address. Trial
// members are overwhelmingly local to the studio they book, but treat these as lower
// confidence than the email, phone and country the member typed themselves.
export type MetaGeo = { city: string; state: string; postcode: string };

export function metaGeoForLocationId(locationId?: number): MetaGeo | undefined {
  if (locationId === undefined) return undefined;
  const location = LOCATIONS.find((l) => l.id === locationId);
  if (!location) return undefined;
  return { city: location.city, state: location.state, postcode: location.postcode };
}
