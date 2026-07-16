export const SUPREME_HQ_BANDRA_LOCATION_ID = 29821;
export const SUPREME_HQ_BANDRA_WHATSAPP_PHONE = "919769570037";
export const DEFAULT_WHATSAPP_PHONE = "919769665757";

export function whatsappPhoneForLocationId(locationId: number): string {
  return locationId === SUPREME_HQ_BANDRA_LOCATION_ID
    ? SUPREME_HQ_BANDRA_WHATSAPP_PHONE
    : DEFAULT_WHATSAPP_PHONE;
}
