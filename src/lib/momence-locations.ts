// Client-safe constants (mirrors LOCATIONS in momence.server.ts)
export const MUMBAI_LOCATIONS = [
  {
    id: 9030,
    name: "Kwality House, Kemps Corner",
    phone: "97696 65757",
    address: "Kwality House, August Kranti Rd, below Kemps Corner, Grant Road, Mumbai 400036",
  },
  {
    id: 29821,
    name: "Supreme HQ, Bandra",
    phone: "97696 65757",
    address:
      "203, Supreme Headquarters, Junction of 14th & 33rd Rd, opposite Monkey Bar, Bandra West, Mumbai 400050",
  },
] as const;

export const BENGALURU_LOCATIONS = [
  {
    id: 22116,
    name: "Lavelle Road, Bengaluru",
    phone: "97696 65757",
    address:
      "1st Floor, Kenkere House, Vittal Mallya Rd, above Raymonds, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001",
  },
  {
    id: 36372,
    name: "Indiranagar, Bengaluru",
    phone: "97696 65757",
    address:
      "4th Floor, 167, 2nd Stage, 2nd Cross, Shankarnag Rd, Domlur, Bengaluru, Karnataka 560071",
  },
  {
    id: 287883,
    name: "Plash Pilates, Sadashivnagar",
    phone: "97696 65757",
    address:
      "72/14, 2nd Main Rd, next to namdharis fresh, Vyalikaval, Kodandarampura, Malleshwaram, Bengaluru, Karnataka 560003",
    scheduleTagId: 383332,
  },
] as const;

export const LOCATIONS = [...MUMBAI_LOCATIONS, ...BENGALURU_LOCATIONS] as const;
