import { JOB_SWITCH_PROGRAM, PROGRAM_SESSIONS } from './jobSwitchProgram';
import { WEBINAR } from './webinar';

export const WEBINAR_PATH = '/job-search-copilot-webinar';
export const BOOTCAMP_PATH = '/job-search-bootcamp';
export const COPILOT_LANDING_PATHS = [WEBINAR_PATH, BOOTCAMP_PATH, '/job-switch-copilot', '/job-search-copilot', '/training'];

// Approval fields deliberately remain unset. Existing offer details are draft
// source material, not confirmation of dates, tax treatment or a refund promise.
export const BOOTCAMP_REVIEW = {
  includesGst: null as boolean | null,
  gstInvoice: null as string | null,
  launchPrice: false,
  curriculumConfirmed: false,
  refundPolicy: null as string | null,
  hostBio: null as string | null,
  webinarRecording: null as string | null,
  toolAccess: null as string | null,
  certificate: null as string | null,
};

export const BOOTCAMP_MODULES = [
  { title: 'Position your experience', sessions: [0, 1], tools: 'Your CV, LinkedIn and a target-role shortlist' },
  { title: 'Build a repeatable application routine', sessions: [2], tools: 'Application tracker, outreach templates and Skillsurger job matching' },
  { title: 'Prepare and practise interviews', sessions: [3, 4], tools: 'Interview prep plan and Skillsurger mock interview' },
  { title: 'Review your progress', sessions: [5], tools: 'Your application pipeline and continuation plan' },
  { title: 'Get personal feedback', sessions: [6, 7], tools: 'Your CV, career roadmap and interview notes' },
].map(module => ({ ...module, sessions: module.sessions.map(index => ({
  ...PROGRAM_SESSIONS[index],
  number: index + 1,
  date: null as string | null,
  duration: '2 hours',
  format: 'Live online',
})) }));

export const BOOTCAMP_PRICE_NOTE = BOOTCAMP_REVIEW.includesGst === true
  ? 'Includes GST'
  : BOOTCAMP_REVIEW.includesGst === false
    ? 'GST extra; confirm the total at checkout before paying'
    : 'Review the final total and tax details at checkout.';

export const WEBINAR_AGENDA = [
  ['00–05', 'Choose your focus', 'Identify one role to target and the part of your search to improve first.'],
  ['05–15', 'Understand your CV feedback', 'See CV scoring and how to turn feedback into clearer, more specific bullet points.'],
  ['15–25', 'Find better-fit jobs', 'See how skills, interests and location guide job matching. Check requirements before applying.'],
  ['25–40', 'Practise an interview', 'Watch a mock interview workflow and see how feedback guides your next practice round.'],
  ['40–50', 'Plan your next steps with the AI mentor', 'See how to ask focused career questions and turn the answers into a weekly routine.'],
  ['50–60', 'Live Q&A and your next step', 'Ask about the workflow and decide what to work on after the session.'],
];

// Public provider pages checked 20 October 2026. Preserve original currencies,
// billing periods and scope: these are alternatives, not identical packages.
export const CAREER_PREP_COMPARISONS = [
  {
    name: 'India Career Centre · Career Pivot',
    price: '₹9,999',
    billing: 'Listed package price',
    scope: 'Career transition assessment, two mentoring sessions and a strategy report.',
    url: 'https://www.indiacareercentre.com/pricing-plans/plans-pricing',
  },
  {
    name: 'InterviewReady · All in One',
    price: 'US$209 / year',
    billing: 'Annual plan, paid upfront',
    scope: 'Self-paced engineering interview courses, AI mock interviewer and question bank.',
    url: 'https://interviewready.io/courses',
  },
  {
    name: 'Design Gurus · Annual Subscription',
    price: 'US$373 / year',
    billing: 'Annual plan, paid upfront',
    scope: 'Interview-preparation course subscription and five AI coding mocks per year.',
    url: 'https://www.designgurus.io/pricing',
  },
];

export const WEBINAR_FAQS = [
  ['Is it really free?', 'Yes. Registration and attendance cost ₹0. No card details or purchase are required.'],
  ['When is it, and how do I register?', `${WEBINAR.schedule}. The session lasts ${WEBINAR.durationMinutes} minutes. Enter your name, email and WhatsApp number in the form. Your registration is confirmed only after it is saved successfully.`],
  ['How will I get the joining link?', 'The confirmation page has a link to the webinar WhatsApp group. Join the group for the meeting link and reminders. The page also shows the email confirmation status, so you can save the details even if email is unavailable.'],
  ['Who is hosting?', `${JOB_SWITCH_PROGRAM.mentor.name}, ${JOB_SWITCH_PROGRAM.mentor.role}.`],
  ['Will I get a recording?', 'Please plan to attend live. For questions about replay access, contact support@skillsurger.com.'],
  ['Who is this for?', 'Indian professionals planning a job switch who want a practical introduction to CV feedback, job matching and interview practice. The examples focus on tech roles.'],
  ['What should I bring?', 'An internet-connected phone or laptop, a target role and your current CV for your own reference. You do not upload a CV to register.'],
  ['Do I need a Skillsurger subscription?', 'No subscription is required to attend the webinar. A live demo does not include ongoing access to paid product features.'],
  ['What happens after the webinar?', 'Use what you learn to choose one CV improvement, shortlist relevant roles and plan interview practice. Continuing with Skillsurger is optional.'],
  ['Will I be pitched a paid programme?', 'Skillsurger offers optional paid training. You may hear about it, but attending creates no obligation to buy. Your registration is for the free webinar only.'],
  ['Can I get a refund?', 'There is no webinar fee to refund. Any later purchase is a separate decision with its own terms.'],
  ['What happens to my data?', 'We use your registration details to manage the webinar and send session communications. See the Privacy Policy below. Joining the WhatsApp group is optional; your number may be visible to other group members.'],
  ['Are jobs, interviews or salary increases guaranteed?', 'No. The session helps you prepare and practise. Employers, your experience, your effort and market conditions determine hiring outcomes.'],
  ['What if my confirmation does not arrive?', 'If registration succeeds, save the confirmation page, add the calendar event and join the linked WhatsApp group. Check spam for email. Contact support@skillsurger.com if you need help.'],
];

export const BOOTCAMP_FAQS = [
  ['What is the price?', 'The advertised bootcamp price is ₹5,000. Review the final total and tax details on Dodo checkout before paying.'],
  ['How do I pay?', `Use the Enrol button to open the existing Dodo Payments checkout. The current offer lists ${JOB_SWITCH_PROGRAM.paymentMethods}. Available methods are shown at checkout.`],
  ['Will I receive a GST invoice?', 'Contact support@skillsurger.com before paying if you need a business invoice or want to provide GSTIN and billing details.'],
  ['When does the next cohort start?', JOB_SWITCH_PROGRAM.cohortDates],
  ['How much live time is included?', 'Eight two-hour live online sessions: six group sessions and two personal sessions, totalling 16 hours across one month.'],
  ['What are the prerequisites?', 'Bring your current CV, a target role, internet access and time to work on your applications between sessions.'],
  ['Is this suitable for freshers?', 'The programme focuses on working tech professionals. Contact support@skillsurger.com before enrolling if you are a fresher or applying for non-tech roles.'],
  ['What is the refund policy?', 'For payment, cancellation or refund questions, email support@skillsurger.com before enrolling. Include your payment reference if you have already paid.'],
  ['Are recordings included, and for how long?', JOB_SWITCH_PROGRAM.recordings],
  ['How long can I use the Skillsurger tools?', 'Feature access and usage limits depend on your subscription. Contact support@skillsurger.com about access included with the bootcamp before enrolling.'],
  ['Will I get a certificate?', 'The programme focuses on practical job-search preparation. If you need a certificate, contact support@skillsurger.com about availability before enrolling.'],
  ['What support will I receive?', JOB_SWITCH_PROGRAM.support],
  ['How are the two personal sessions scheduled?', 'Both personal sessions are included within the eight sessions. Contact the Skillsurger team to discuss scheduling.'],
  ['Are jobs or salary hikes guaranteed?', 'No. We help you improve your CV, organise your search and practise interviews. No job, interview call, placement or salary outcome is guaranteed.'],
  ['Can I see the approach before enrolling?', 'Yes. Attend the free webinar first. The link at the end of this page takes you to free registration.'],
];
