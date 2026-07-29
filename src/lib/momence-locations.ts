// Client-safe constants (mirrors LOCATIONS in momence.server.ts)
export const MUMBAI_LOCATIONS = [
  { id: 9030, name: "Kwality House, Kemps Corner" },
  { id: 29821, name: "Supreme HQ, Bandra" },
] as const;

export const BENGALURU_LOCATIONS = [
  { id: 22116, name: "Lavelle Road, Bengaluru" },
  { id: 36372, name: "Indiranagar, Bengaluru" },
] as const;

export const LOCATIONS = [...MUMBAI_LOCATIONS, ...BENGALURU_LOCATIONS] as const;
