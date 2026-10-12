export const COURSE_PATHS: Record<string, RegExp> = {
  'udemy.com': /^\/course\/(?!draft(?:\/|$))[^/]+/,
  'coursera.org': /^\/(learn|specializations|professional-certificates)\//,
  'edx.org': /^\/(learn|course|certificates)\//,
  'freecodecamp.org': /^\/learn\/[^/]+/,
  'khanacademy.org': /^\/(computing|math|science)\/.+/,
  'codecademy.com': /^\/(learn|paths)\/.+/,
  'learn.microsoft.com': /^\/[^/]+\/training\/(paths|modules)\/.+/,
};

export function isCourseCandidate(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && (!parsed.port || parsed.port === '443') && !!COURSE_PATHS[parsed.hostname.replace(/^www\./, '')]?.test(parsed.pathname);
  } catch { return false; }
}

type Evidence = { url: string; verified: boolean; title?: string; description?: string; price: string; difficulty: string; checkedAt: string };
export async function verifyCourseEvidence(url: string, fetcher: typeof fetch = fetch): Promise<Evidence> {
  const unknown = { url, verified: false, price: 'unknown', difficulty: 'unknown', checkedAt: new Date().toISOString() };
  if (!isCourseCandidate(url)) return unknown;
  try {
    let current = new URL(url);
    let response: Response | undefined;
    for (let i = 0; i < 4; i++) {
      response = await fetcher(current.href, { redirect: 'manual', signal: AbortSignal.timeout(5000), headers: { Accept: 'text/html' } });
      if (response.status >= 300 && response.status < 400) {
        const next = new URL(response.headers.get('location') || '', current);
        // No redirects to arbitrary hosts, IPs, ports or non-course pages.
        if (next.hostname.replace(/^www\./, '') !== current.hostname.replace(/^www\./, '') || !isCourseCandidate(next.href)) return unknown;
        current = next;
      } else break;
    }
    if (!response?.ok || !response.headers.get('content-type')?.includes('text/html')) return unknown;
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > 2000000) return unknown;
    // Stream with a hard cap; do not buffer unbounded provider pages.
    const reader = response.body?.getReader();
    if (!reader) return unknown;
    let html = '', bytes = 0;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        bytes += part.value.byteLength; if (bytes > 2000000) { await reader.cancel(); return unknown; }
        html += decoder.decode(part.value, { stream: true });
      }
      html += decoder.decode();
    } finally { reader.releaseLock(); }
    const courses: Record<string, unknown>[] = [];
    function collect(value: unknown) {
      if (Array.isArray(value)) { value.forEach(collect); return; }
      if (!value || typeof value !== 'object') return;
      const node = value as Record<string, unknown>;
      if (node['@type'] === 'Course' || (Array.isArray(node['@type']) && node['@type'].includes('Course'))) courses.push(node);
      if (node['@graph']) collect(node['@graph']);
      if (node.mainEntity) collect(node.mainEntity);
    }
    for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try { collect(JSON.parse(match[1])); } catch { /* Malformed schema is not evidence. */ }
    }
    const course = courses.find(node => {
      if (typeof node.name !== 'string' || !node.name.trim()) return false;
      const reference = typeof node.url === 'string' ? node.url : typeof node['@id'] === 'string' ? node['@id'] : undefined;
      if (!reference) return courses.length === 1;
      try { const canonical = new URL(reference, current); return canonical.hostname.replace(/^www\./, '') === current.hostname.replace(/^www\./, '') && canonical.pathname.replace(/\/$/, '') === current.pathname.replace(/\/$/, ''); } catch { return false; }
    });
    if (!course) return unknown;
    const levels = ['beginner', 'intermediate', 'advanced'];
    const level = typeof course.educationalLevel === 'string' ? course.educationalLevel.toLowerCase() : '';
    // Availability + provider Course schema verifies identity, never guesses price.
    return { ...unknown, verified: true, title: String(course.name).slice(0,300), description: typeof course.description === 'string' ? course.description.replace(/<[^>]*>/g, '').slice(0,2000) : undefined, difficulty: levels.includes(level) ? level : 'unknown' };
  } catch { return unknown; }
}
