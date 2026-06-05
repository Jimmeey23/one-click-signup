export function buildClearedPaidCheckoutUrl(currentHref: string, locationId: number): string {
  const url = new URL(currentHref);
  url.searchParams.set("locationId", String(locationId));
  url.searchParams.delete("checkout_session_id");
  url.searchParams.delete("paidSessionId");
  url.searchParams.delete("paidLocationId");
  return `${url.pathname}${url.search}${url.hash}`;
}
