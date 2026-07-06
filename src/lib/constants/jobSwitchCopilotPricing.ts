export interface JobSwitchCopilotTier {
  name: string;
  price: string;
  period: string;
  bestFor: string;
  ctaLabel: string;
  ctaHref: string;
  objectionHandling: string;
  popular?: boolean;
}

export const jobSwitchCopilotPricing: JobSwitchCopilotTier[] = [
  {
    name: 'Free Resume Audit',
    price: '₹0',
    period: '',
    bestFor: 'Tech professionals who want to identify resume gaps before applying.',
    ctaLabel: 'Get Free Audit',
    ctaHref: '/free-resume-audit',
    objectionHandling: 'No payment required.',
  },
  {
    name: 'AI Career Pro',
    price: '₹999',
    period: '/month',
    bestFor: 'Users who want AI-assisted resume and interview support.',
    ctaLabel: 'Start AI Career Pro',
    ctaHref: '/book-a-call',
    objectionHandling: 'Cancel anytime.',
  },
  {
    name: 'Job Switch Copilot Lite',
    price: '₹4,999',
    period: '/month',
    bestFor: 'Active job seekers who want a structured job-search system.',
    ctaLabel: 'Start Lite',
    ctaHref: '/book-a-call',
    objectionHandling: 'Best for self-driven users.',
    popular: true,
  },
  {
    name: 'Job Switch Copilot Premium',
    price: '₹14,999',
    period: '/month',
    bestFor: 'Users who want deeper guidance, resume tailoring, outreach support, and interview prep.',
    ctaLabel: 'Apply for Premium',
    ctaHref: '/book-a-call',
    objectionHandling: 'Built for serious job switchers.',
  },
  {
    name: 'Job Recovery Sprint',
    price: '₹24,999',
    period: '/30 days',
    bestFor: 'Laid-off professionals or people on notice period who need an intensive 30-day job-search sprint.',
    ctaLabel: 'Join 30-Day Sprint',
    ctaHref: '/book-a-call',
    objectionHandling: 'Focused sprint, not a guaranteed job promise.',
  },
];
