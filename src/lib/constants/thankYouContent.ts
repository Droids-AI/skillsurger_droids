export type ThankYouType = 'resume-audit' | 'diagnosis-booking';

export interface ThankYouContent {
  headline: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

/**
 * Copy for the parameterized /thank-you?type=... variants. The default
 * (no `type` param) masterclass/webinar experience in ThankYouPage.tsx is
 * untouched and does not read from this file.
 */
export const thankYouContent: Record<ThankYouType, ThankYouContent> = {
  'resume-audit': {
    headline: 'Your resume audit request is received.',
    body: "We'll review your resume for ATS gaps, role-fit, structure, keywords, and job-search readiness. You'll receive next steps shortly.",
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-switch-copilot',
    secondaryCtaLabel: 'Book Career Diagnosis',
    secondaryCtaHref: '/book-a-call',
  },
  'diagnosis-booking': {
    headline: 'Your career diagnosis call request is received.',
    body: "We'll follow up to confirm your slot. In the meantime, feel free to explore Job Switch Copilot and get a free resume audit.",
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
    secondaryCtaLabel: 'Explore Job Switch Copilot',
    secondaryCtaHref: '/job-switch-copilot',
  },
};
