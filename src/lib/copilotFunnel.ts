import { useLocation } from 'react-router-dom';
import { getAttribution } from './attribution';
import { trackEvent } from './analytics';

export function trackLandingEvent(event: string, params: Record<string, unknown>) {
  const attribution = getAttribution();
  trackEvent(event, {
    page_path: window.location.pathname,
    utm_source: attribution.utmSource,
    utm_medium: attribution.utmMedium,
    utm_campaign: attribution.utmCampaign,
    utm_content: attribution.utmContent,
    utm_term: attribution.utmTerm,
    gclid: attribution.gclid,
    ...params,
  });
}

// Preserve campaign parameters through the two landing pages and thank-you
// state. First-touch attribution is also stored by the existing app tracker.
export function useCampaignLink() {
  const { search } = useLocation();
  return (path: string) => {
    const [base, hash] = path.split('#');
    const [pathname, query] = base.split('?');
    const params = new URLSearchParams(query);
    new URLSearchParams(search).forEach((value, key) => {
      if (key.startsWith('utm_') || ['gclid', 'fbclid', 'msclkid'].includes(key)) params.set(key, value);
    });
    // Links also carry a stored campaign after navigation removed its query.
    const attribution = getAttribution();
    for (const [key, value] of Object.entries({
      utm_source: attribution.utmSource, utm_medium: attribution.utmMedium,
      utm_campaign: attribution.utmCampaign, utm_content: attribution.utmContent,
      utm_term: attribution.utmTerm, gclid: attribution.gclid,
    })) if (value && !params.has(key)) params.set(key, value);
    const queryString = params.toString();
    return pathname + (queryString ? `?${queryString}` : '') + (hash ? `#${hash}` : '');
  };
}
