// Prefill existing static Dodo payment links. Billing country also selects the
// phone country code (+91), without inserting an incomplete customer number.
export function indianCheckoutUrl(link: string): string {
  let url: URL;
  try { url = new URL(link); } catch { return link; }
  // dodo.pe creates a saved session and drops these parameters; its defaults
  // must be changed on the saved checkout in the Dodo dashboard.
  if (!['checkout.dodopayments.com', 'test.checkout.dodopayments.com'].includes(url.hostname) || !url.pathname.startsWith('/buy/')) return link;
  if (!url.searchParams.has('country')) url.searchParams.set('country', 'IN');
  if (!url.searchParams.has('paymentCurrency')) url.searchParams.set('paymentCurrency', 'INR');
  return url.toString();
}
