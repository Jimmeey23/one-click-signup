// Momence lead sources. The id is what Momence stores against the lead, so picking a
// source in the Route Builder fills the source id in for you rather than leaving it to be
// typed from memory.
export type LeadSource = {
  id: string;
  name: string;
};

export const LEAD_SOURCES: LeadSource[] = [
  { id: "8076", name: "Client Referral" },
  { id: "7657", name: "Dashboard" },
  { id: "8078", name: "Enquiry on call" },
  { id: "147016", name: "Events - Stronger in 30" },
  { id: "8084", name: "Hosted Class" },
  { id: "103872", name: "Influencer Marketing - Dhun Wellness" },
  { id: "201918", name: "Influencer Marketing - Inde Wild" },
  { id: "148921", name: "Influencer Marketing - Shaan" },
  { id: "160856", name: "Influencer Marketing - The Mum Tribe" },
  { id: "116785", name: "Influencer Marketing - Ureco" },
  { id: "14729", name: "Influencer Sign-up" },
  { id: "8085", name: "Outdoor Class" },
  { id: "7659", name: "Paid Meta Ads (FB/Instagram)" },
  { id: "212426", name: "Physique Kids" },
  { id: "8083", name: "Social" },
  { id: "8081", name: "Social - Facebook" },
  { id: "8080", name: "Social - Instagram" },
  { id: "8077", name: "Staff Referral" },
  { id: "17263", name: "Staff Referral" },
  { id: "213149", name: "The Amazing Race Signups" },
  { id: "8079", name: "Walkin" },
  { id: "8082", name: "Website" },
  { id: "180573", name: "Website - AC" },
  { id: "100715", name: "Website - Diwali Detox" },
  { id: "32412", name: "Website Form" },
  { id: "11969", name: "Website - Pre/Post Natal" },
  { id: "8075", name: "Yellow Messenger/Whatsapp Enquiry" },
];

const DUPLICATE_NAMES = new Set(
  LEAD_SOURCES.map((source) => source.name).filter(
    (name, index, all) => all.indexOf(name) !== index,
  ),
);

/**
 * Two sources share the name "Staff Referral", so show the id alongside those to keep the
 * options in the dropdown tellable apart.
 */
export function leadSourceLabel(source: LeadSource): string {
  return DUPLICATE_NAMES.has(source.name) ? `${source.name} (${source.id})` : source.name;
}

export function leadSourceById(id: string): LeadSource | undefined {
  return LEAD_SOURCES.find((source) => source.id === id);
}

export function leadSourceIdForName(name: string): string {
  return LEAD_SOURCES.find((source) => source.name === name)?.id ?? "";
}
