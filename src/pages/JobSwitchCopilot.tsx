import { useEffect, useState, type MouseEvent } from 'react';
import { Bot, CheckCircle2, FileSearch, Search, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import WebinarRegistrationForm from '../components/leadgen/WebinarRegistrationForm';
import ResumeAuditReportPreview from '../components/jobSwitchCopilot/ResumeAuditReportPreview';
import CopilotLandingLayout, { Audience, ComparisonTable, CtaArrow, HostBio, LandingFaq, LandingSection, ProofSection, SectionHeading, landingCtaClass } from '../components/jobSwitchCopilot/CopilotLandingLayout';
import { WEBINAR } from '../lib/constants/webinar';
import { WEBINAR_AGENDA, WEBINAR_PATH } from '../lib/constants/jobSearchLanding';
import { EVENTS } from '../lib/analytics';
import { trackLandingEvent, useCampaignLink } from '../lib/copilotFunnel';

const coverage = [
  'How CV scoring works and how to prioritise improvements.',
  'How to choose a target role and focus your search.',
  'Watch a mock interview and see how feedback guides your next practice round.',
  'Learn a weekly routine with the AI mentor for your job search.',
];

const faqs = [
  ['Is it really free?', 'Yes, no payment needed. The paid programme is separate and optional.'],
  ['Who is it for?', 'Indian tech professionals exploring a switch, on notice period, or searching after a layoff, mainly in software, data, cloud, DevOps and AI roles.'],
];

const demos = [
  { title: 'CV scoring', Icon: FileSearch, detail: 'See how the CV scorer reviews your resume and identifies areas to improve.', steps: ['Start with a CV and a target role.', 'Read the scoring feedback and suggested improvements.', 'Choose a specific edit to make first.'], location: 'Dashboard → CV Scoring' },
  { title: 'Job matching', Icon: Search, detail: 'Use your skills, interests and preferred location to explore relevant roles.', steps: ['Enter your interests or use your profile.', 'Review jobs and check requirements and location.', 'Save a relevant role for your own application.'], location: 'Dashboard → Career Explorer' },
  { title: 'Mock interview', Icon: Video, detail: 'Practise interview questions and review feedback to prepare your next answer.', steps: ['Choose a role or saved job for practice.', 'Answer the interview questions.', 'Review feedback and practise again.'], location: 'Dashboard → Mentorship / Mock Interview' },
  { title: 'AI mentor', Icon: Bot, detail: 'Ask focused career questions and use the responses to plan your next steps.', steps: ['Describe your target role and the help you need.', 'Ask a specific question about your preparation.', 'Check the advice and decide what to act on.'], location: 'Dashboard → Mentorship → AI Mentor' },
];

function ProductWalkthrough() {
  const [selected, setSelected] = useState(0);
  const demo = demos[selected];
  return <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
    <div>
      <div role="group" aria-label="Choose a webinar product walkthrough" className="grid grid-cols-2 gap-2">
        {demos.map(({ title, Icon }, index) => <button key={title} type="button" id={`demo-tab-${index}`} aria-pressed={selected === index} aria-controls={`demo-panel-${index}`} onClick={() => { setSelected(index); trackLandingEvent(EVENTS.DEMO_WATCHED, { feature: title, format: 'walkthrough_outline' }); }} className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${selected === index ? 'border-blue-400 bg-blue-500/15 text-cyan-200' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{title}</button>)}
      </div>
      <div id={`demo-panel-${selected}`} role="region" aria-labelledby={`demo-tab-${selected}`} className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">What we will demonstrate live</p>
        <h3 className="mt-3 text-2xl font-bold">{demo.title}</h3><p className="mt-3 text-slate-300">{demo.detail}</p>
        <ol className="mt-5 space-y-3">{demo.steps.map((step, index) => <li key={step} className="flex gap-3 text-slate-300"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs text-blue-200">{index + 1}</span>{step}</li>)}</ol>
        <p className="mt-5 text-xs text-slate-400">Existing product area: {demo.location}</p>
      </div>
    </div>
    <div className="rounded-2xl bg-slate-100 p-4 sm:p-6 text-slate-900">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-600">Illustrative CV feedback preview</p>
      <ResumeAuditReportPreview compact />
      <p className="mt-4 text-sm text-slate-600">Sample data to explain the format. This is not a customer result or a recorded demo. The working product is demonstrated during the live session.</p>
    </div>
  </div>;
}

export default function JobSwitchCopilot() {
  const campaignLink = useCampaignLink();
  const [closed, setClosed] = useState(() => Date.now() >= new Date(WEBINAR.startsAt).getTime());
  useEffect(() => {
    trackLandingEvent('landing_page_view', { offer: 'free_webinar' });
    const timer = window.setInterval(() => setClosed(Date.now() >= new Date(WEBINAR.startsAt).getTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const reserve = (placement: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    trackLandingEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement, destination: 'free_webinar' });
    const form = document.getElementById('webinar');
    const name = document.getElementById('webinar-name') as HTMLInputElement | null;
    if (!form || !name) return;
    event.preventDefault();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    window.setTimeout(() => name.focus({ preventScroll: true }), reducedMotion ? 0 : 450);
  };
  const cta = (placement: string) => closed
    ? <p className="text-slate-300">Registration for this session is closed.</p>
    : <a href="#webinar" onClick={reserve(placement)} className={landingCtaClass}>Reserve my free seat <CtaArrow /></a>;
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'Event', name: 'Free Skillsurger Job Search Copilot Webinar',
    description: 'A live introduction to CV feedback, job matching, mock interviews and the AI mentor.',
    startDate: WEBINAR.startsAt, endDate: WEBINAR.endsAt,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'VirtualLocation', url: `https://skillsurger.com${WEBINAR_PATH}` },
    organizer: { '@type': 'Organization', name: 'Skillsurger', url: 'https://skillsurger.com' },
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR', url: `https://skillsurger.com${WEBINAR_PATH}#webinar`, availability: closed ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' },
  };
  return <CopilotLandingLayout offer="webinar" sticky={<><p className="text-xs sm:text-sm text-slate-300 text-center sm:text-left">Free · 31 Oct · 3 PM IST · 60 min online</p>{cta('sticky')}</>}>
    <SEO title="Free Job Search Copilot Webinar · 31 Oct, 3 PM IST | Skillsurger" description="Join Skillsurger’s free live webinar on 31 October 2026, 3 PM IST. Learn to improve your CV, find relevant jobs and practise interviews. Register free." canonicalUrl="/job-search-copilot-webinar" structuredData={structuredData} />
    <section className="bg-gradient-to-br from-blue-950/70 via-[#020420] to-indigo-950/50 px-4 py-8 sm:py-16">
      <div className="mx-auto grid max-w-6xl items-start gap-7 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="lg:pt-5">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200"><Video aria-hidden="true" className="h-4 w-4" />Free live webinar · ₹0</p>
          <h1 className="max-w-2xl text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">Fix your CV. Target better roles. <span className="text-cyan-300">Practise interviews.</span></h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-slate-300">A free live webinar for Indian software, data, cloud, DevOps and AI professionals. See CV scoring, job shortlisting and mock-interview feedback, step by step. Saturday 31 October 2026, 3:00-4:00 PM IST, online.</p>
          <div className="mt-6">{cta('hero')}</div>
          <p className="mt-3 text-sm text-slate-300">Free. 60 minutes. No payment needed.</p>
          <p className="mt-4 hidden lg:block max-w-lg text-sm leading-relaxed text-slate-400">Register here. Then join the WhatsApp group from your confirmation page for the meeting link and reminders.</p>
        </div>
        <div id="webinar" className="scroll-mt-5 rounded-2xl border border-blue-300/25 bg-[#0a1238] p-5 sm:p-7 shadow-xl shadow-blue-950/20"><WebinarRegistrationForm dark /></div>
      </div>
    </section>

    <LandingSection alternate>
      <SectionHeading eyebrow="The session" title="What we will cover" />
      <ul className="grid gap-4 sm:grid-cols-2">{coverage.map(item => <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-300"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><span>{item}</span></li>)}</ul>
    </LandingSection>

    <LandingSection>
      <SectionHeading eyebrow="Who should attend" title="Bring your experience. Find a clearer next step.">A practical introduction for Indian job seekers, with examples focused on software, data, cloud, DevOps and AI roles.</SectionHeading>
      <Audience />
    </LandingSection>

    <LandingSection alternate>
      <SectionHeading eyebrow="What you will learn" title="One hour, minute by minute.">Follow a complete preparation workflow, from CV feedback to your next practice session.</SectionHeading>
      <ol className="divide-y divide-white/10 rounded-2xl border border-white/10">{WEBINAR_AGENDA.map(([minutes, title, detail]) => <li key={title} className="flex gap-3 sm:gap-6 p-4 sm:p-6"><span className="w-14 sm:w-20 shrink-0 pt-1 font-mono text-xs sm:text-sm font-bold text-cyan-300">{minutes}<span className="block text-xs font-normal text-slate-400">minutes</span></span><div><h3 className="font-bold sm:text-lg">{title}</h3><p className="mt-1 text-sm sm:text-base text-slate-300">{detail}</p></div></li>)}</ol>
      <div className="mt-7">{cta('mid_page')}</div>
    </LandingSection>

    <LandingSection>
      <SectionHeading eyebrow="Live Copilot demo" title="See the tools in a real preparation workflow.">CV scoring, job matching, mock interviews and AI mentor are existing Skillsurger features. We will walk through them live. Product access after the webinar depends on your plan.</SectionHeading>
      <ProductWalkthrough />
    </LandingSection>

    <LandingSection alternate>
      <SectionHeading eyebrow="What you get free" title="A useful starting point. No payment required.">Everything below is part of this live session. No inflated “worth ₹…” total.</SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['60-minute live session', 'A guided introduction to a more focused job-search routine.'], ['Four feature walkthroughs', 'CV scoring, job matching, mock interview and AI mentor.'], ['An approach you can repeat', 'Choose one target role, improve your CV and plan interview practice.'], ['Live Q&A', 'Time to ask about the workflow and your next preparation step.']].map(([title, detail]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><CheckCircle2 aria-hidden="true" className="mb-4 h-5 w-5 text-cyan-300" /><h3 className="font-bold text-lg">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{detail}</p></article>)}</div>
    </LandingSection>

    <LandingSection>
      <SectionHeading eyebrow="Why free" title="Start preparing before you spend.">We want career preparation to be accessible. This free introduction lets you understand the workflow and judge whether it helps you. No purchase is required to attend.</SectionHeading>
      <h3 className="mb-4 text-xl font-bold">What other career-preparation options cost</h3>
      <ComparisonTable webinar />
    </LandingSection>

    <ProofSection />
    <LandingSection alternate><SectionHeading eyebrow="Your host" title="Meet the person leading the session." /><HostBio /></LandingSection>

    <LandingSection>
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-cyan-300">Your next step starts with one hour</p>
        <h2 className="text-3xl sm:text-4xl font-bold">Build a clearer plan for your next move.</h2>
        <p className="mt-5 text-slate-300">{WEBINAR.schedule}. Register with your name, email and WhatsApp number. Your confirmation page has the group link and calendar reminder.</p>
        <div className="mt-7">{cta('final')}</div>
        <p className="mt-4 text-sm text-slate-400">Free registration · No card needed · No job or salary guarantee</p>
      </div>
    </LandingSection>

    <LandingSection alternate>
      <SectionHeading eyebrow="Optional guided help" title="What happens after the webinar" />
      <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-slate-300">The webinar is free. If you want guided help afterwards, Skillsurger offers the Job Switch Copilot: a 30-day programme for tech professionals with 3-12 years of experience targeting Rs 20-50 LPA roles. 8 live sessions (6 group + 2 one-to-one), Rs 5,000 including GST. Full details, plans and refund terms: <Link to={campaignLink('/pricing')} className="text-cyan-200 underline underline-offset-4">skillsurger.com/pricing</Link>.</p>
    </LandingSection>
    <LandingSection><SectionHeading eyebrow="Questions before you register" title="Frequently asked questions" /><LandingFaq items={faqs} /></LandingSection>
  </CopilotLandingLayout>;
}
