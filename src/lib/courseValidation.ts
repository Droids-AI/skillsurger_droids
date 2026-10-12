import { supabase } from './supabase';
import { isCourseCandidate } from '../../supabase/functions/_shared/courseEvidence';
export type CourseCandidate = { url: string; type?: string; price?: string; difficulty?: string; rating?: number; provider?: string; duration?: string; verified?: boolean };

export function normalizeCourseMetadata<T extends CourseCandidate>(resource: T): T {
  let course = false;
  try {
    const url = new URL(resource.url);
    if (url.protocol !== 'https:' || url.username || url.password) return { ...resource, url: '#', type: 'Resource', verified: false, price: 'unknown', difficulty: 'unknown', rating: undefined, duration: undefined };
    course = isCourseCandidate(resource.url);
  } catch { return { ...resource, url: '#', type: 'Resource', verified: false, price: 'unknown', difficulty: 'unknown', rating: undefined, duration: undefined }; }
  return {
    ...resource,
    // A course-shaped URL is only a candidate, never proof of provider metadata.
    type: course ? 'Course (unverified)' : 'Resource',
    verified: false,
    price: 'unknown', difficulty: 'unknown', rating: undefined, duration: undefined,
  };
}

export async function verifyCourseCandidates<T extends CourseCandidate>(resources: T[]): Promise<T[]> {
  const safe = resources.filter(resource => resource && typeof resource.url === 'string').map(normalizeCourseMetadata);
  const urls = safe.filter(resource => isCourseCandidate(resource.url)).map(resource => resource.url).slice(0,10);
  if (!urls.length) return safe;
  const { data, error } = await supabase.functions.invoke('verify-courses', { body: { urls } });
  if (error || !Array.isArray(data?.resources)) return safe;
  return safe.map(resource => {
    const evidence = data.resources.find((item: { url: string; verified: boolean }) => item.url === resource.url && item.verified === true);
    if (!evidence) return resource;
    return { ...resource, type: 'Course', title: evidence.title, description: evidence.description || 'Review the provider for course details.', verified: true, price: 'unknown', difficulty: evidence.difficulty || 'unknown', rating: undefined, duration: undefined };
  });
}
