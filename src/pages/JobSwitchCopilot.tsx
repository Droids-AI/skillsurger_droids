import { ArrowRight, CheckCircle2, Clock, Sparkles, Video, ShieldCheck, ArrowUpRight, IndianRupee, RotateCcw, UserRound, CalendarDays, LifeBuoy, Timer, CreditCard, PlayCircle } from 'lucide-react';
import SEO from '../components/SEO';
import WebinarRegistrationForm from '../components/leadgen/WebinarRegistrationForm';
import ApplicationTrackerMockup from '../components/jobSwitchCopilot/ApplicationTrackerMockup';
import ResumeAuditReportPreview from '../components/jobSwitchCopilot/ResumeAuditReportPreview';
import { trackEvent, EVENTS } from '../lib/analytics';

import { WEBINAR } from '../lib/constants/webinar';
import { JOB_SWITCH_PROGRAM as PROGRAM, PROGRAM_SESSIONS } from '../lib/constants/jobSwitchProgram';

// 60-minute webinar, minute by minute.
const agenda = [
  ['0–5', 'Why strong tech resumes still fail', 'What recruiters and ATS filters see in the first few seconds.'],
  ['5–15', 'Five mistakes in senior tech job searches', 'The patterns that keep experienced engineers stuck at the same level.'],
  ['15–30', 'Live resume diagnosis', 'A real resume reviewed on screen, with the fixes explained.'],
  ['30–40', 'Outreach and interview workflow', 'How applications, recruiter messages and interview prep fit into one weekly routine.'],
  ['40–48', 'Programme walkthrough', 'What happens in each Job Switch Copilot session and what you leave with.'],
  ['48–55', 'Price, cohort limits and enrolment', `${PROGRAM.priceLabel} ${PROGRAM.taxNote}, refund policy and how to join the next cohort.`],
  ['55–60', 'Q&A', 'Your questions, answered live.'],
];
const details = [
  { icon: IndianRupee, label: 'Price and taxes', value: `${PROGRAM.priceLabel} for the full month, ${PROGRAM.taxNote}. No other fees.` },
  { icon: RotateCcw, label: 'Refund policy', value: PROGRAM.refundPolicy },
  { icon: UserRound, label: 'Your mentor', value: `${PROGRAM.mentor.name}, ${PROGRAM.mentor.role}.` },
  { icon: CalendarDays, label: 'Cohort dates', value: PROGRAM.cohortDates },
  { icon: Timer, label: 'Session duration', value: PROGRAM.format + '.' },
  { icon: LifeBuoy, label: 'Support', value: PROGRAM.support },
  { icon: CreditCard, label: 'Payment methods', value: PROGRAM.paymentMethods + '.' },
  { icon: PlayCircle, label: 'Recordings', value: PROGRAM.recordings },
];
const faqs = [
  ['Is the webinar really free?', 'Yes. This form reserves a free one-hour online webinar. No payment or programme purchase is required.'],
  ['When is the webinar, and how do I join?', `${WEBINAR.schedule}. The session lasts one hour. After registering, join the webinar WhatsApp group from your confirmation page; the joining link and reminders are shared there.`],
  ['Who should attend?', 'Professionals planning a job switch, including software, data, cloud, DevOps, and AI professionals; people on notice period or returning after a layoff; and applicants who want to improve their callbacks, interview preparation, or salary conversations.'],
  ['Do I need to prepare anything?', 'Come with a target role in mind and a sense of where your current job search is getting stuck. Keeping your resume handy can help you relate the discussion to your own experience.'],
  ['Is 1.5x to 5x salary growth guaranteed?', 'No. This is a target to explore, not a promised result. Your starting salary, experience, skills, target role, market conditions, and execution all affect what is achievable. No job offer or salary increase is guaranteed.'],
  ['What does the one-month programme include?', `Job Switch Copilot costs ${PROGRAM.priceLabel} (${PROGRAM.taxNote}) for one month and includes eight sessions of two hours each: six group sessions and two personal 1-to-1 sessions, for 16 hours total. The two personal sessions are included within the eight sessions.`],
  ['Can I get a refund?', PROGRAM.refundPolicy],
  ['Are sessions recorded?', PROGRAM.recordings],
  ['When does the next cohort start, and how do I pay?', `${PROGRAM.cohortDates} You can pay by ${PROGRAM.paymentMethods}.`],
  ['Does registering enrol me in the paid programme?', 'No. You are registering only for the free webinar. You can learn the approach first and decide separately whether the one-month programme fits your goals.'],
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Course',
      name: PROGRAM.name,
      description: `30-day job switch programme: ${PROGRAM.format}.`,
      provider: { '@type': 'Organization', name: 'Skillsurger', url: 'https://skillsurger.com' },
      offers: { '@type': 'Offer', price: PROGRAM.price, priceCurrency: 'INR', url: 'https://skillsurger.com/job-switch-copilot', category: 'Paid' },
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT16H', instructor: { '@type': 'Person', name: PROGRAM.mentor.name } },
    },
    {
      '@type': 'Event',
      name: `Free webinar: ${WEBINAR.title}`,
      startDate: WEBINAR.startsAt,
      endDate: WEBINAR.endsAt,
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url: 'https://skillsurger.com/job-switch-copilot' },
      organizer: { '@type': 'Organization', name: 'Skillsurger', url: 'https://skillsurger.com' },
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: 'https://skillsurger.com/job-switch-copilot#webinar' },
    },
  ],
};

export default function JobSwitchCopilot() {
  // Every webinar CTA lands the visitor in the form's first field, not just near it.
  const reserve = (placement: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement, destination: 'free_webinar' });
    const form = document.getElementById('webinar');
    const name = document.getElementById('webinar-name') as HTMLInputElement | null;
    if (!form || !name) return;
    event.preventDefault();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => name.focus({ preventScroll: true }), 450);
  };
  const startCheckout = (placement: string) => () => trackEvent(EVENTS.CHECKOUT_STARTED, { placement, value: PROGRAM.price, currency: 'INR', offer: 'job_switch_copilot' });
  const ctaClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500';
  return <div className="min-h-screen bg-[#020420] text-white">
    <SEO title="Job Switch Copilot: 30-Day Job Switch Programme for Tech Professionals | Skillsurger" description="A 30-day AI + human programme for Indian tech professionals with 3–12 years of experience: 8 live sessions, 2 personal 1-to-1s. ₹5,000 incl. 18% GST. Free webinar on 24 October." canonicalUrl="/job-switch-copilot" structuredData={structuredData} />

    <section className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-20 bg-[#020420] text-white">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-950/60 via-[#020420] to-indigo-950/60" />
      <div aria-hidden="true" className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 mb-6"><Video className="w-4 h-4" /> FREE ONLINE WEBINAR · 60 MINUTES</p>
          <p className="text-cyan-200 font-semibold mb-4">{WEBINAR.schedule}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">Your next job could be a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">bigger step up.</span></h1>
          <p className="text-xl sm:text-2xl font-semibold text-white mb-4">Learn how to switch jobs and target <span className="text-cyan-300">1.5x to 5x salary growth.</span></p>
          <p className="text-lg leading-relaxed text-slate-300 mb-7">Sending more applications isn't always the answer. Discover how to choose better-fit roles, make your experience stand out, and approach interviews and salary conversations with a clear plan.</p>
          <div className="flex flex-wrap gap-3 mb-7">{[{ label: '60 minutes', icon: Clock }, { label: 'Online', icon: Video }, { label: '₹0 to attend', icon: ShieldCheck }].map(({ label, icon: Icon }) =>
            <span key={label} className="flex items-center gap-2 text-sm rounded-lg bg-white/5 border border-white/10 px-3 py-2"><Icon className="w-4 h-4 text-cyan-300" />{label}</span>
          )}</div>
          <a href="#webinar" onClick={reserve('hero')} className={`${ctaClass} lg:hidden`}>Register for the free webinar <ArrowRight className="w-5 h-5" /></a>
          <p className="mt-4"><a href="#programme" className="font-semibold text-cyan-200 underline underline-offset-4">Already decided? See the {PROGRAM.priceLabel} programme</a></p>
          <p className="text-sm text-slate-400 mt-4 max-w-lg">Salary growth is a target, not a guarantee. What is achievable depends on your starting point, skills, role, and market.</p>
        </div>
        <div id="webinar" className="scroll-mt-24 rounded-3xl bg-white/5 text-white border border-white/10 p-6 sm:p-8 shadow-2xl shadow-blue-950/40 border border-blue-400/20">
          <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm mb-4"><span className="w-2 h-2 rounded-full bg-blue-600" /> YOUR FIRST STEP STARTS HERE</div>
          <WebinarRegistrationForm dark />
        </div>
      </div>
    </section>

    <section className="py-16 lg:py-20 bg-[#080d2b]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-10"><p className="text-blue-300 text-sm font-bold tracking-wider uppercase mb-3">Inside the free webinar</p><h2 className="text-3xl sm:text-4xl font-bold mb-4">One hour, minute by minute.</h2><p className="text-slate-300 text-lg">A practical session built around real resumes and a working job-search routine, not generic motivation.</p></div>
        <ol className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-white/5">{agenda.map(([minutes, title, text]) => <li key={title} className="flex gap-4 sm:gap-6 p-5 sm:p-6">
          <span className="w-16 sm:w-20 shrink-0 font-mono text-sm font-bold text-cyan-300 pt-0.5">{minutes} min</span>
          <div><h3 className="font-bold text-lg">{title}</h3><p className="text-slate-300 mt-1">{text}</p></div>
        </li>)}</ol>
        <div className="mt-8 text-center"><a href="#webinar" onClick={reserve('agenda')} className={ctaClass}>Reserve my free webinar seat <ArrowRight className="w-5 h-5" /></a><p className="text-sm text-slate-400 mt-3">{WEBINAR.schedule}. No payment required. Joining link sent privately via WhatsApp.</p></div>
      </div>
    </section>

    <section className="py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
        <div><p className="text-blue-300 text-sm font-bold tracking-wider uppercase mb-3">Does this sound familiar?</p><h2 className="text-3xl sm:text-4xl font-bold mb-5">You have the experience.<br />Your job search needs a plan.</h2><p className="text-slate-300 text-lg mb-6">This webinar is for professionals ready to make a considered move, whether you're exploring your next role, on notice period, or rebuilding after a layoff.</p>
          <ul className="space-y-4">{['You apply regularly but get too few relevant callbacks.', 'Your resume lists responsibilities but struggles to show your impact.', 'You want to move into a better role, not repeat the same job elsewhere.', 'You are unsure how to talk about salary without underselling yourself.'].map(text => <li key={text} className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />{text}</li>)}</ul>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-7 sm:p-10">
          <Sparkles className="w-9 h-9 text-cyan-200 mb-5" /><h3 className="text-2xl sm:text-3xl font-bold mb-6">Leave with a clearer direction for your next move.</h3>
          <div className="space-y-5">{[['Choose', 'Focus on roles that match your strengths and growth goals.'], ['Position', 'Show why your experience matters to the employer.'], ['Execute', 'Connect applications, outreach, interview prep, and negotiation.']].map(([title, text], i) => <div key={title} className="flex gap-4"><span className="w-8 h-8 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">{i + 1}</span><div><h4 className="font-bold">{title}</h4><p className="text-blue-100 mt-1">{text}</p></div></div>)}</div>
          <a href="#webinar" onClick={reserve('audience')} className="inline-flex items-center gap-2 bg-white text-blue-700 rounded-xl px-5 py-3 font-bold mt-8 hover:bg-blue-50">Join the free webinar <ArrowUpRight className="w-5 h-5" /></a>
        </div>
      </div>
    </section>

    <section id="programme" className="py-16 lg:py-20 bg-[#020420] text-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12"><p className="text-cyan-300 text-sm font-bold tracking-wider uppercase mb-3">After the webinar · Optional paid programme</p><h2 className="text-3xl sm:text-4xl font-bold mb-5">Learn the approach. Then put it to work.</h2><p className="text-slate-300 text-lg">If you want guided practice and personal feedback, Job Switch Copilot turns the strategy into one month of focused action.</p></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">{[['1 month', 'A focused programme'], ['8 × 2 hours', '16 hours of live sessions'], ['6 group sessions', 'Learn and practise together'], ['2 personal sessions', '1-to-1 support, included in the 8']].map(([value, label]) => <div key={value} className="p-5 rounded-2xl border border-white/10 bg-white/5"><p className="font-bold text-2xl text-cyan-200 mb-2">{value}</p><p className="text-sm text-slate-300">{label}</p></div>)}</div>
        <h3 className="text-2xl font-bold mb-5">Session by session</h3>
        <ol className="grid sm:grid-cols-2 gap-4">{PROGRAM_SESSIONS.map((session, i) => <li key={session.title} className="rounded-2xl bg-white/5 border border-white/10 p-5 flex gap-4">
          <span className={`shrink-0 h-9 min-w-[3rem] px-2 rounded-lg text-xs font-bold flex items-center justify-center ${session.kind === 'Personal' ? 'bg-purple-500/20 text-purple-200' : 'bg-blue-500/20 text-blue-200'}`}>{session.kind === 'Personal' ? `1:1 #${i - 5}` : session.id}</span>
          <div><p className="font-bold">{session.title}</p><p className="text-sm text-slate-300 mt-1"><span className="text-cyan-200 font-semibold">Deliverable:</span> {session.deliverable}</p></div>
        </li>)}</ol>
        <h3 className="text-2xl font-bold mt-14 mb-5">Before you pay</h3>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{details.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="w-6 h-6 text-cyan-300 mb-3" /><dt className="font-bold mb-1">{label}</dt><dd className="text-sm text-slate-300 leading-relaxed">{value}</dd></div>)}</dl>
      </div>
    </section>

    <section className="py-16 lg:py-20 bg-[#080d2b]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div><p className="text-blue-300 text-sm font-bold tracking-wider uppercase mb-3">A system you can follow</p><h2 className="text-3xl sm:text-4xl font-bold mb-5">Connect every part of your job search.</h2><p className="text-slate-300 text-lg mb-7">Use the programme to work on the things that matter together, rather than treating your resume, applications, and interviews as separate tasks.</p>
            <ul className="space-y-4 mb-8">{['Resume and LinkedIn positioning aligned to target roles', 'Applications, recruiter outreach, and follow-up planning', 'Interview practice built around your experience and impact', 'Salary negotiation and offer-evaluation guidance', 'Two personal 1-to-1 sessions for your individual priorities'].map(item => <li key={item} className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />{item}</li>)}</ul>
            <div className="grid sm:grid-cols-2 gap-4 [&_.bg-white]:bg-[#0a1238] [&_.bg-gray-50]:bg-white/5 [&_.border-gray-200]:border-white/10 [&_.border-gray-100]:border-white/10 [&_.text-gray-900]:text-white [&_.text-gray-700]:text-blue-100 [&_.text-gray-600]:text-slate-300 [&_.text-gray-500]:text-slate-400"><ResumeAuditReportPreview compact /><ApplicationTrackerMockup compact /></div><p className="text-xs text-slate-400 mt-3">Illustrative previews of resume feedback and application tracking. Sample data is not a participant result.</p>
          </div>
          <div className="rounded-3xl border-2 border-blue-500 bg-[#0a1238] p-6 sm:p-9 shadow-xl shadow-blue-900/5">
            <p className="text-blue-300 font-bold text-sm tracking-wider uppercase mb-3">One programme · One fee</p><h3 className="text-3xl font-bold mb-5">Job Switch Copilot</h3><p className="text-5xl font-extrabold mb-2">{PROGRAM.priceLabel}</p><p className="text-slate-400 mb-7">For the complete one-month programme, {PROGRAM.taxNote}</p>
            <div className="border-y border-white/10 py-5 mb-7 space-y-3"><p className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />8 live sessions of 2 hours each</p><p className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />6 group + 2 personal 1-to-1 sessions</p><p className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />16 hours total, across one month</p></div>
            <a href={PROGRAM.checkoutUrl} onClick={startCheckout('price_card')} rel="noopener" className={`${ctaClass} w-full`}>Enrol now: {PROGRAM.priceLabel} <ArrowRight className="w-5 h-5 shrink-0" /></a><p className="text-xs text-slate-400 mt-3">Secure checkout by Dodo Payments: {PROGRAM.paymentMethods.replace(', via secure Dodo Payments checkout', '')}. {PROGRAM.refundPolicy}</p>
            <a href="#webinar" onClick={reserve('programme')} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">Not sure yet? Join the free webinar first</a><p className="text-xs text-slate-400 mt-4">Registering for the webinar does not enrol you in the programme. No job or salary outcome is guaranteed.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="py-16 max-w-3xl mx-auto px-4"><h2 className="text-3xl font-bold text-center mb-8">Your questions, answered</h2>{faqs.map(([question, answer]) => <details key={question} className="border-b border-white/10 py-5"><summary className="font-semibold text-lg cursor-pointer pr-2">{question}</summary><p className="text-slate-300 mt-3 leading-relaxed">{answer}</p></details>)}</section>
    <section className="py-16 bg-gradient-to-br from-blue-950 to-[#020420]"><div className="max-w-3xl mx-auto px-4 text-center"><p className="text-blue-300 font-bold text-sm uppercase tracking-wider mb-3">Start with one hour</p><h2 className="text-3xl sm:text-4xl font-bold mb-5">Make your next application part of a plan.</h2><p className="text-slate-300 text-lg mb-8">Join the free job-switch webinar and see how a more focused approach could change your next move.</p><a href="#webinar" onClick={reserve('final')} className={ctaClass}>Reserve my free webinar seat <ArrowRight className="w-5 h-5" /></a><p className="text-sm text-slate-400 mt-4">Free registration · 60 minutes online · No programme purchase required</p></div></section>
  </div>;
}
