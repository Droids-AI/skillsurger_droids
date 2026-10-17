// Single source for the paid Job Switch Copilot offer. Homepage, programme page,
// pricing page, webinar form and checkout success page all read from here, so the
// price and terms cannot drift apart.
export const JOB_SWITCH_PROGRAM = {
  name: 'Job Switch Copilot',
  price: 5000,
  priceLabel: '₹5,000',
  // Dodo checkout charges ₹5,000 total, with 18% GST included (₹4,237.29 + ₹762.71).
  taxNote: 'incl. 18% GST',
  durationLabel: '30-day programme',
  checkoutUrl: 'https://dodo.pe/kc8etqr6z2a',
  audience: 'Indian tech professionals with 3–12 years of experience targeting ₹20–50 LPA roles',
  mentor: { name: 'Saurav', role: 'Founder, Skillsurger · Lead mentor' },
  refundPolicy: 'Full refund if you ask within 7 days of payment and before the second session.',
  recordings: 'Group sessions are recorded and shared with participants for the programme month. Personal 1-to-1 sessions are not recorded.',
  cohortDates: 'Next cohort dates are announced in the free webinar and the webinar WhatsApp group.',
  support: 'WhatsApp support from the Skillsurger team throughout the programme month, plus two personal 1-to-1 sessions.',
  paymentMethods: 'UPI, debit and credit cards, via secure Dodo Payments checkout',
  format: '8 live sessions of 2 hours each (16 hours across one month): 6 group sessions + 2 personal 1-to-1 sessions',
} as const;

// What each session produces. Personal sessions are part of the eight, not extra.
export const PROGRAM_SESSIONS = [
  { id: 'S1', kind: 'Group', title: 'Career diagnosis and resume/LinkedIn positioning', deliverable: 'Personalised switch roadmap; role-specific CV and LinkedIn profile' },
  { id: 'S2', kind: 'Group', title: 'Job search strategy', deliverable: 'Target-company shortlist' },
  { id: 'S3', kind: 'Group', title: 'AI-assisted applications and recruiter outreach', deliverable: 'Application workflow and tracker; outreach templates' },
  { id: 'S4', kind: 'Group', title: 'Technical interview preparation', deliverable: 'Your interview prep plan' },
  { id: 'S5', kind: 'Group', title: 'Mock interviews and feedback', deliverable: 'Strengths and gaps assessment' },
  { id: 'S6', kind: 'Group', title: 'Pipeline review', deliverable: '30-day continuation plan' },
  { id: '1:1', kind: 'Personal', title: 'Personal resume and career review', deliverable: 'Written feedback on your resume and career plan' },
  { id: '1:1', kind: 'Personal', title: 'Personal interview and strategy review', deliverable: 'Your improvement plan' },
] as const;

// Lead pipeline stages, in order. Every new lead row starts at its entry stage.
export const CRM_STAGES = ['New', 'Qualified', 'Registered', 'Attended', 'Sales Follow-up', 'Paid', 'Onboarded', 'Completed', 'Refunded'] as const;

export const EXPERIENCE_OPTIONS = ['Under 3 years', '3–5 years', '6–8 years', '9–12 years', 'More than 12 years'] as const;
export const TIMELINE_OPTIONS = ['Within 1 month', '1–3 months', '3–6 months', 'Just exploring'] as const;

// The programme is built for 3–12 years of experience and a near-term move.
export function isQualifiedLead(experience: string, timeline: string): boolean {
  return ['3–5 years', '6–8 years', '9–12 years'].includes(experience) && timeline !== 'Just exploring';
}
