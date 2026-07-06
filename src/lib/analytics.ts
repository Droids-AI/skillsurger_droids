declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export const EVENTS = {
  RESUME_UPLOADED: 'resume_uploaded',
  AUDIT_REQUESTED: 'audit_requested',
  PRICING_VIEWED: 'pricing_viewed',
  PLAN_SELECTED: 'plan_selected',
  DIAGNOSIS_BOOKED: 'diagnosis_booked',
  WHATSAPP_CLICKED: 'whatsapp_clicked',
  DEMO_WATCHED: 'demo_watched',
  PAYMENT_INITIATED: 'payment_initiated',
  LEAD_FORM_STARTED: 'lead_form_started',
  LEAD_FORM_SUBMITTED: 'lead_form_submitted',
  MOCK_INTERVIEW_CLICKED: 'mock_interview_clicked',
  JOB_SWITCH_COPILOT_CTA_CLICKED: 'job_switch_copilot_cta_clicked',
  RESUME_EXAMPLE_VIEWED: 'resume_example_viewed',
  BLOG_CTA_CLICKED: 'blog_cta_clicked',
} as const;

export type AnalyticsEventName = (typeof EVENTS)[keyof typeof EVENTS];

export function trackEvent(name: AnalyticsEventName | string, params?: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', name, params);
    }
  } catch {
    // analytics must never break the app
  }
}
