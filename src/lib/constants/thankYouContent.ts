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
    headline: 'You’re registered for the free webinar.',
    body: `Your registration is saved for ${WEBINAR.schedule}. 60 minutes online, covering CV feedback, job matching and interview preparation. Join the group below, add the session to your calendar and keep your CV handy.`,
    primaryCtaLabel: 'Read about the optional bootcamp',
    primaryCtaHref: '/job-search-bootcamp',
    secondaryCtaLabel: 'Back to home',
    secondaryCtaHref: '/',
  },
  purchase: {
    headline: 'Payment received. Welcome to Job Switch Copilot.',
    body: 'Your seat in the next cohort is reserved. Our team will message you on WhatsApp and email within 24 hours with your cohort dates, session calendar and onboarding form.',
    primaryCtaLabel: 'Contact us',
    primaryCtaHref: '/contact',
    secondaryCtaLabel: 'View programme details',
    secondaryCtaHref: '/job-search-bootcamp',
  },
  'resume-audit': {
    headline: 'Your resume audit request is received.',
    body: "We'll review your resume for ATS gaps, role-fit, structure, keywords, and job-search readiness. If the audit shows the programme is a good fit, you can book an optional consultation call. No sales sequence.",
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-search-bootcamp',
    secondaryCtaLabel: 'Book an optional consultation',
    secondaryCtaHref: '/book-a-call',
  },
  'diagnosis-booking': {
    headline: 'Your career diagnosis call request is received.',
    body: "We'll follow up to confirm your slot. In the meantime, feel free to explore Job Switch Copilot and get a free resume audit.",
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
    secondaryCtaLabel: 'Explore Job Switch Copilot',
    secondaryCtaHref: '/job-search-bootcamp',
  },
};
