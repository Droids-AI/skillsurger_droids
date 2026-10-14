import { WEBINAR } from './webinar';
export type ThankYouType = 'resume-audit' | 'diagnosis-booking' | 'webinar';

export interface ThankYouContent {
  headline: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

/**
 * Copy for the parameterized /thank-you?type=... variants. Visits without
 * a `type` param redirect to the current webinar page.
 */
export const thankYouContent: Record<ThankYouType, ThankYouContent> = {
  webinar: {
    headline: 'Your free webinar registration is received.',
    body: `You registered for the free one-hour webinar on switching jobs and targeting 1.5x to 5x salary growth. ${WEBINAR.schedule}. You have not enrolled in the paid programme.`,
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-switch-copilot#programme',
    secondaryCtaLabel: 'Back to home',
    secondaryCtaHref: '/',
  },
  'resume-audit': {
    headline: 'Your resume audit request is received.',
    body: "We'll review your resume for ATS gaps, role-fit, structure, keywords, and job-search readiness. You can contact us or book a career diagnosis call for next steps.",
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
