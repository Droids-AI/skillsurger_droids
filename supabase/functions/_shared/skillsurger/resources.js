import { verifyCourseEvidence, isCourseCandidate } from '../courseEvidence.ts';
import { completeLearningResources, isUsableResourceLink } from '../../../../src/lib/curatedLearningResources.ts';
import { textCompletion } from './openai.js';
const hosts = ['udemy.com','coursera.org','edx.org','freecodecamp.org','youtube.com','youtu.be','github.com','docs.python.org','fastapi.tiangolo.com','developer.mozilla.org','learn.microsoft.com','docs.docker.com','dev.java','react.dev','nodejs.org','typescriptlang.org','sqlbolt.com'];
function safeLink(url) {
  try { const parsed = new URL(url); return parsed.protocol === 'https:' && !parsed.username && !parsed.password && (!parsed.port || parsed.port === '443') && hosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.'+host)); } catch { return false; }
}
export async function learningResources(input) {
  const title = input.jobTitle || input.careerPath || input.profile?.current_role || input.currentPath?.jobTitle || input.currentPath?.job_title || 'professional development';
  const skills = input.requirements || input.profile?.skills || input.currentPath?.skillsToLearn || [];
  const targets = [...skills, title, String(input.userFeedback || '')].filter(Boolean);
  const query = `${title} ${skills.slice(0, 2).join(' ')} ${String(input.userFeedback || '').slice(0, 120)} courses tutorials`;
  const key = Deno.env.get('SERPAPI_KEY');
  let candidates = [], searchFailed = false;
  if (key) {
    try {
      const url = new URL('https://serpapi.com/search.json');
      Object.entries({ engine: 'google', api_key: key, q: query, num: '8', hl: 'en' }).forEach(([k,v]) => url.searchParams.set(k,v));
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('search_rejected');
      const data = await response.json();
      if (data.error && !/no results|hasn't returned|did not match/i.test(data.error)) throw new Error('search_rejected');
      candidates = (data.organic_results || []).filter(item => safeLink(item.link) && isUsableResourceLink({url:item.link,title:item.title})).map(item => ({ type: isCourseCandidate(item.link) ? 'Course' : 'Resource', title: item.title, description: item.snippet || '', url: item.link }));
    } catch { searchFailed = true; console.warn(JSON.stringify({area:'skillsurger-resources',code:'search_unavailable_using_official_guides'})); }
  }
  if (!candidates.length) candidates = (input.currentPath?.resources || []).filter(item => safeLink(item.url) && isUsableResourceLink(item)).slice(0, 8);
  // Existing official skill guides remain available when a provider has no
  // results. They are labelled guides, never fabricated verified courses.
  const official = completeLearningResources([],targets);
  const availableGuides = (await Promise.all(official.map(async resource => {
    try { const response = await fetch(resource.url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(5000)}); return response.ok || [301,302,307,308].includes(response.status) ? resource : null; } catch { return null; }
  }))).filter(Boolean);
  const combined = [...availableGuides,...candidates];
  const unique = [...new Map(combined.map(item => [item.url, item])).values()].slice(0, 8);
  if (!unique.length && searchFailed) throw new Error('Learning resources are temporarily unavailable');
  return await Promise.all(unique.map(async resource => {
    const evidence = isCourseCandidate(resource.url) ? await verifyCourseEvidence(resource.url) : null;
    const host = new URL(resource.url).hostname.replace(/^www\./, '');
    return { type: resource.type || 'Resource', title: evidence?.title || resource.title, description: evidence?.description || resource.description || '', url: resource.url, provider: resource.provider || host, verified: evidence?.verified || false, price: evidence?.price || resource.price || 'unknown', difficulty: evidence?.difficulty || 'unknown', duration: resource.duration || 'Self-paced', completed: false, ...(resource.curated ? {curated:true} : {}), ...(input.profile ? { skill: skills[0] || title } : {}) };
  }));
}
export async function fresherLearningPlan(input) {
  return await textCompletion('Write a practical learning plan for the supplied education, skills and interests. Return plain text. Distinguish future practice from completed qualifications. Do not invent course URLs or prices.', input);
}
