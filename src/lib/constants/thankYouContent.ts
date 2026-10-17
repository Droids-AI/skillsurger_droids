import { WEBINAR } from './webinar';
export type ThankYouType = 'resume-audit' | 'diagnosis-booking' | 'webinar' | 'purchase';

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
  purchase: {
    headline: 'Payment received. Welcome to Job Switch Copilot.',
    body: 'Your seat in the next cohort is reserved. Our team will message you on WhatsApp and email within 24 hours with your cohort dates, session calendar and onboarding form.',
    primaryCtaLabel: 'Contact us',
    primaryCtaHref: '/contact',
    secondaryCtaLabel: 'View programme details',
    secondaryCtaHref: '/job-switch-copilot#programme',
  },
  'resume-audit': {
    headline: 'Your resume audit request is received.',
    body: "We'll review your resume for ATS gaps, role-fit, structure, keywords, and job-search readiness. If the audit shows the programme is a good fit, you can book an optional consultation call. No sales sequence.",
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-switch-copilot',
    secondaryCtaLabel: 'Book an optional consultation',
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
