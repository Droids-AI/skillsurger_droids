import { jobCountryCode } from '../../../../src/lib/jobLocation.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
type Row = Record<string, any>;
function transform(job: Row): Row {
  const highlights = Object.entries(job.job_highlights || {}).filter(([, value]) => Array.isArray(value)).map(([title, items]) => ({ title, items }));
  const extensions = [job.job_employment_type, job.job_is_remote ? 'Remote' : ''].filter(Boolean);
  if (job.job_salary_currency && (job.job_min_salary || job.job_max_salary)) extensions.push(`${job.job_salary_currency} ${job.job_min_salary || ''}${job.job_max_salary ? ` - ${job.job_max_salary}` : '+'}`);
  return { job_id: job.job_id || job.job_apply_link || '', title: job.job_title || '', company_name: job.employer_name || '', thumbnail: job.employer_logo || '', company_logo: job.employer_logo || '', company_url: job.employer_website || '', location: [job.job_city, job.job_state].filter(Boolean).join(', ') || job.job_country || '', description: job.job_description || '', job_highlights: highlights, extensions, detected_extensions: { schedule_type: job.job_employment_type || '', remote: job.job_is_remote || false, ...(job.job_posted_at_datetime_utc ? { posted_at: job.job_posted_at_datetime_utc } : {}) }, apply_options: job.job_apply_link ? [{ title: 'Apply via JSearch', link: job.job_apply_link }] : [], share_link: job.job_google_link || job.job_apply_link || '', via: 'JSearch', country: job.job_country || '' };
}
async function providers(query: string, location: string, country: string) {
  const requests: Array<Promise<Row[]>> = [];
  for (const provider of ['serpapi', 'jsearch']) {
    const key = Deno.env.get(provider === 'serpapi' ? 'SERPAPI_KEY' : 'JSEARCH_API_KEY');
    if (!key) continue;
    requests.push((async () => {
      const url = new URL(provider === 'serpapi' ? 'https://serpapi.com/search.json' : 'https://jsearch.p.rapidapi.com/search');
      const params = provider === 'serpapi' ? { engine: 'google_jobs', q: query, location, hl: 'en', gl: country, api_key: key } : { query: `${query} in ${location}`, country, page: '1', num_pages: '1', date_posted: 'all' };
      Object.entries(params).forEach(([key,value]) => url.searchParams.set(key, value));
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), ...(provider === 'jsearch' ? { headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' } } : {}) });
      if (!response.ok) throw new Error(provider + ':' + response.status);
      const body = await response.json();
      if (body.error || body.status === 'ERROR') throw new Error(provider + ':rejected');
      return provider === 'serpapi' ? body.jobs_results || [] : (body.data || []).map(transform);
    })());
  }
  if (!requests.length) throw new Error('Job providers are not configured');
  const outcomes = await Promise.allSettled(requests);
  outcomes.filter(outcome => outcome.status === 'rejected').forEach(() => console.warn(JSON.stringify({ area: 'skillsurger-jobs', code: 'provider_failed' })));
  if (outcomes.every(outcome => outcome.status === 'rejected')) throw new Error('Job search providers are temporarily unavailable');
  return outcomes.flatMap(outcome => outcome.status === 'fulfilled' ? outcome.value : []);
}
export async function findJobs(body: Row, admin: SupabaseClient) {
  const query = String(body.query || body.title || '').trim();
  const location = String(body.location || 'United States').trim();
  const country = jobCountryCode(location) || String(body.countryCode || 'us').toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(body.limit) || 20));
  if (!query || !location || query.length > 300 || location.length > 200 || !/^[a-z]{2}$/.test(country)) throw new Error('Provide a job title and location');
  const cacheKey = `${query.toLowerCase()}|${location.toLowerCase()}|${country}`;
  const cached = await admin.from('skillsurger_jobs_cache').select('jobs_data').eq('cache_key', cacheKey).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (cached.data?.jobs_data?.length) return cached.data.jobs_data.slice(0, limit);
  const city = location.split(',')[0].trim();
  let rows = await providers(query, city, country);
  if (!rows.length && city !== location) rows = await providers(query, location, country);
  if (!rows.length) {
    const countryName = ({in:'India',gb:'United Kingdom',ca:'Canada',au:'Australia',de:'Germany',sg:'Singapore'} as Record<string,string>)[country] || 'United States';
    rows = await providers(query,countryName,country);
  }
  const seen = new Set<string>();
  rows = rows.filter(row => { const key = `${row.title?.toLowerCase()}|${row.company_name?.toLowerCase()}`; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 50);
  if (rows.length) {
    const result = await admin.from('skillsurger_jobs_cache').upsert({ cache_key: cacheKey, jobs_data: rows, expires_at: new Date(Date.now() + 12*3600000).toISOString() });
    if (result.error) console.warn(JSON.stringify({ area: 'skillsurger-jobs', code: 'cache_write_failed' }));
  }
  return rows.slice(0, limit);
}
