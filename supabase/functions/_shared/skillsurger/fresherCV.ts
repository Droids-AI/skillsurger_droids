// Same fresher-CV response fields, built only from the candidate's supplied facts.
// Suggested projects/certifications must never become completed qualifications.
type Profile = Record<string, unknown>;
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export function buildFresherCV(profile: Profile, interests: string) {
  const education = array(profile.education);
  const degree = typeof profile.degree === 'string' ? profile.degree : '';
  const institution = typeof profile.institution === 'string' ? profile.institution : '';
  if (!education.length && (degree || institution)) education.push({ degree, institution, year: String(profile.graduationYear || '') });
  const study = typeof profile.fieldOfStudy === 'string' ? profile.fieldOfStudy : degree;
  const summary = typeof profile.summary === 'string' && profile.summary.trim() ? profile.summary : [study ? `${study} graduate.` : '', interests ? `Interested in ${interests}.` : ''].filter(Boolean).join(' ');
  return {
    summary,
    experience: array(profile.experience),
    projects: array(profile.projects),
    education,
    skills: array(profile.skills),
    languages: array(profile.languages),
    certifications: array(profile.certifications),
    awards: array(profile.awards),
    publications: array(profile.publications),
    volunteerWork: array(profile.volunteerWork || profile.volunteer_work),
    customSections: array(profile.customSections || profile.custom_sections),
  };
}
