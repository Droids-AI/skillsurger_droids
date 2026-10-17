// First-touch lead attribution. Captured once per browser from the landing URL,
// then attached to every lead so ads and campaigns can be tied to registrations.
const KEY = 'skillsurger:attribution';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'] as const;

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  gclid: string;
  landingPage: string;
  referrer: string;
  firstSeenAt: string;
};

const clip = (value: string | null) => (value || '').trim().slice(0, 100);

function fromUrl(): Attribution {
  const url = new URL(window.location.href);
  const value = (name: (typeof PARAMS)[number]) => clip(url.searchParams.get(name));
  let referrer = '';
  try { referrer = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* Ignore malformed referrers. */ }
  return {
    utmSource: value('utm_source'), utmMedium: value('utm_medium'), utmCampaign: value('utm_campaign'),
    utmContent: value('utm_content'), utmTerm: value('utm_term'), gclid: value('gclid'),
    landingPage: clip(url.pathname), referrer: clip(referrer === window.location.hostname ? '' : referrer),
    firstSeenAt: new Date().toISOString(),
  };
}

// Call once on app start. A later visit with campaign parameters replaces an
// untagged first visit, so a direct visit never hides a paid click.
export function captureAttribution(): void {
  try {
    const current = fromUrl();
    const stored = localStorage.getItem(KEY);
    const tagged = PARAMS.some(name => new URLSearchParams(window.location.search).has(name));
    if (!stored || (tagged && !JSON.parse(stored).utmSource && !JSON.parse(stored).gclid)) {
      localStorage.setItem(KEY, JSON.stringify(current));
    }
  } catch { /* Storage can be blocked; getAttribution falls back to the current URL. */ }
}

export function getAttribution(): Attribution {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return { ...fromUrl(), ...JSON.parse(stored) };
  } catch { /* Fall through. */ }
  return fromUrl();
}
