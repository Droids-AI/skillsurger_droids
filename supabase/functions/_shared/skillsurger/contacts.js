import axios from 'npm:axios@1.10.0';
export async function getLinkedInProfileUrl(role, company, location = null) {
  const key = Deno.env.get('SERPAPI_KEY');
  if (!key) return 'No profile found';
  try {
    const response = await axios.get('https://serpapi.com/search.json', { params: { api_key: key, engine: 'google', q: `site:linkedin.com/in "${role}" "${company}" ${location || ''}`, num: 10 }, timeout: 12000 });
    const matches = (response.data.organic_results || []).filter(item => /^https:\/\/(?:[\w-]+\.)?linkedin\.com\/in\//i.test(item.link || ''));
    const words = String(location || '').toLowerCase().split(/[\s,]+/).filter(word => word.length > 2);
    return (matches.find(item => words.some(word => `${item.title} ${item.snippet}`.toLowerCase().includes(word))) || matches[0])?.link || 'No profile found';
  } catch { return 'No profile found'; }
}
export async function getContactInfoFromLinkedIn(url) {
  const key = Deno.env.get('LUSHA_API_KEY');
  if (!key) return null;
  if (!/^https:\/\/(?:[\w-]+\.)?linkedin\.com\/in\/[^/?#]+\/?(?:[?#].*)?$/i.test(url)) throw new Error('Provide a LinkedIn profile URL');
  try {
    const response = await axios.get('https://api.lusha.com/v2/person', { params: { linkedinUrl: url }, headers: { 'x-api-key': key }, timeout: 15000 });
    const data = response.data?.contact?.data;
    const weights = { 'A+': 4, A: 3, B: 2, C: 1 };
    const best = [...(data?.emailAddresses || [])].sort((a, b) => (weights[b.emailConfidence] || 0) - (weights[a.emailConfidence] || 0))[0];
    return best ? { email: best.email, emailConfidence: best.emailConfidence } : null;
  } catch (error) { console.warn(JSON.stringify({ area: 'skillsurger-contacts', provider: 'lusha', status: error.response?.status || null })); return null; }
}
