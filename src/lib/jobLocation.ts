const indianCities = /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|chennai|pune|kolkata|ahmedabad|jaipur|gurgaon|gurugram|noida|kochi|mysore|mysuru|chandigarh|lucknow|indore|coimbatore|bhubaneswar)\b/i;

export function normalizeJobLocation(value: string): string {
  const location = value.trim();
  return indianCities.test(location) && !/\b(india|united states|usa|united kingdom|uk|canada|australia|germany|singapore)\b/i.test(location) ? `${location}, India` : location;
}

export function profileJobLocation(profile: { preferred_locations?: string[]; city?: string; state?: string; country?: string } | null): string {
  return normalizeJobLocation(profile?.preferred_locations?.find(Boolean) || [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', '));
}

export function jobCountryCode(location: string): string {
  const countries: Array<[RegExp, string]> = [
    [/\bindia\b/i, 'in'], [/\b(united states|usa|us)\b/i, 'us'], [/\b(united kingdom|uk)\b/i, 'gb'],
    [/\baustralia\b/i, 'au'], [/\bcanada\b/i, 'ca'], [/\bgermany\b/i, 'de'], [/\bsingapore\b/i, 'sg'],
  ];
  return countries.find(([match]) => match.test(normalizeJobLocation(location)))?.[1] || '';
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/\bbangalore\b/g, 'bengaluru').replace(/\bgurgaon\b/g, 'gurugram').replace(/\bmysore\b/g, 'mysuru').replace(/\busa\b/g, 'united states').trim();
}

export function matchesJobLocation(job: { location: string; remote?: boolean }, requested: string): boolean {
  if (!requested.trim()) return true;
  const target = normalized(requested);
  const actual = normalized(job.location || '');
  if (target === 'remote') return job.remote === true || /\bremote\b/i.test(actual);
  const requestedCountry = jobCountryCode(requested), actualCountry = jobCountryCode(job.location || '');
  if (requestedCountry && actualCountry && requestedCountry !== actualCountry) return false;
  const primary = target.split(',')[0].trim();
  return actual.includes(primary);
}

export function jobSalary(job: Record<string, any>, publishedSalary: string): string {
  if (publishedSalary) return publishedSalary;
  const currency = job.salary_currency || job.currency;
  const min = Number(job.salary_min), max = Number(job.salary_max);
  if (!currency || (!min && !max)) return '';
  try {
    const format = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en', { style: 'currency', currency, maximumFractionDigits: 0 });
    return min && max ? `${format.format(min)} – ${format.format(max)}` : min ? `${format.format(min)}+` : `Up to ${format.format(max)}`;
  } catch { return ''; }
}
