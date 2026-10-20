import { useEffect } from 'react';
import { CalendarDays, CheckCircle2, Clock, Video } from 'lucide-react';
import SEO from '../components/SEO';
import CopilotLandingLayout, { Audience, ComparisonTable, CtaArrow, HostBio, LandingFaq, LandingSection, ProofSection, SectionHeading, WebinarSoftLink, landingCtaClass } from '../components/jobSwitchCopilot/CopilotLandingLayout';
import { JOB_SWITCH_PROGRAM as PROGRAM } from '../lib/constants/jobSwitchProgram';
import { BOOTCAMP_FAQS, BOOTCAMP_MODULES, BOOTCAMP_PRICE_NOTE, BOOTCAMP_REVIEW } from '../lib/constants/jobSearchLanding';
import { EVENTS } from '../lib/analytics';
import { trackLandingEvent, useCampaignLink } from '../lib/copilotFunnel';

export default function JobSearchBootcamp() {
  const campaignLink = useCampaignLink();
  useEffect(() => { trackLandingEvent('landing_page_view', { offer: 'job_search_bootcamp' }); }, []);
  const enrol = (placement: string) => <a href={campaignLink(PROGRAM.checkoutUrl)} onClick={() => {
    trackLandingEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement, destination: 'bootcamp_checkout' });
    trackLandingEvent(EVENTS.CHECKOUT_STARTED, { placement, value: PROGRAM.price, currency: 'INR', offer: 'job_switch_copilot' });
    trackLandingEvent('purchase_click', { placement, value: PROGRAM.price, currency: 'INR', offer: 'job_search_bootcamp' });
  }} className={landingCtaClass}>Enrol for {PROGRAM.priceLabel} <CtaArrow /></a>;
  return <CopilotLandingLayout offer="bootcamp" sticky={<><p className="text-xs sm:text-sm text-slate-300 text-center sm:text-left">₹5,000 · One month · 16 live hours</p>{enrol('sticky')}</>}>
    <SEO title="Job Search Bootcamp · ₹5,000 | Skillsurger" description="Prepare for your next job search with Skillsurger’s ₹5,000 bootcamp. Eight live sessions covering CV positioning, applications and interview practice." canonicalUrl="/job-search-bootcamp" />
    <section className="bg-gradient-to-br from-blue-950/70 via-[#020420] to-indigo-950/50 px-4 py-10 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14 items-center">
        <div>
          <p className="mb-4 text-xs sm:text-sm font-bold uppercase tracking-widest text-cyan-300">Skillsurger · Job Search Bootcamp</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">Turn scattered preparation into <span className="text-cyan-300">a job-search routine.</span></h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-300">Work on your CV, applications and interview preparation with a structured plan and personal feedback.</p>
          <p className="mt-5 text-sm text-slate-400">For Indian professionals preparing for their next tech role. Progress depends on your practice and the market; jobs and salary increases are not guaranteed.</p>
        </div>
        <div className="rounded-2xl border border-blue-400/40 bg-[#0a1238] p-5 sm:p-8">
          <p className="text-sm font-semibold text-cyan-200">Job Search Bootcamp</p>
          <p className="mt-3 text-5xl font-extrabold">{PROGRAM.priceLabel}</p>
          <p className="mt-3 text-sm text-slate-300">{BOOTCAMP_PRICE_NOTE}</p>
          <ul className="my-6 space-y-3 text-slate-300">{['One-month programme', 'Eight live sessions · 16 hours total', 'Six group + two personal sessions'].map(text => <li key={text} className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />{text}</li>)}</ul>
          {enrol('hero')}
          <p className="mt-3 text-xs leading-relaxed text-slate-400">Pay securely through Dodo Payments. Review the final total before paying.</p>
        </div>
      </div>
    </section>

    <LandingSection>
      <SectionHeading eyebrow="The problem → the work" title="Give each part of your search a clear job.">More applications cannot fix an unclear target or an unprepared interview. Use the programme to work on those gaps together.</SectionHeading>
      <div className="grid gap-4 md:grid-cols-3">{[['A generic CV', 'Position your experience for a target role.', 'A CV and LinkedIn profile to keep improving.'], ['Applications in bursts', 'Build a shortlist and follow-up routine.', 'An application tracker and outreach drafts.'], ['Last-minute preparation', 'Practise and review your answers.', 'An interview improvement plan and next steps.']].map(([problem, action, outcome]) => <article key={problem} className="rounded-2xl border border-white/10 p-5 sm:p-6"><p className="text-sm text-slate-400">Starting point: {problem}</p><h3 className="mt-3 text-xl font-bold">{action}</h3><p className="mt-4 text-slate-300">Work towards: {outcome}</p></article>)}</div>
    </LandingSection>

    <LandingSection alternate id="curriculum">
      <SectionHeading eyebrow="Full curriculum" title="Every session has a practical deliverable.">Eight sessions across five modules, covering your CV, applications and interview preparation.</SectionHeading>
      <div className="space-y-5">{BOOTCAMP_MODULES.map((module, index) => <article key={module.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Module {index + 1}</p><h3 className="mt-2 text-xl sm:text-2xl font-bold">{module.title}</h3>
        <ol className="mt-5 space-y-5">{module.sessions.map(session => <li key={session.number} className="border-l-2 border-blue-400/40 pl-4"><p className="text-xs text-blue-200">Session {session.number} · {session.kind} · {session.duration} · {session.format}</p><h4 className="mt-1 font-bold">{session.title}</h4><p className="mt-2 text-sm text-slate-300"><span className="font-semibold text-white">Deliverable:</span> {session.deliverable}</p></li>)}</ol>
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-400"><span className="text-slate-200">Tools / materials:</span> {module.tools}</p>
      </article>)}</div>
      <div className="mt-7">{enrol('curriculum')}</div>
    </LandingSection>

    <LandingSection id="schedule">
      <SectionHeading eyebrow="Complete agenda" title="Know the commitment before you enrol." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">{[{ Icon: CalendarDays, title: 'One month', detail: 'A structured programme' }, { Icon: Clock, title: '16 hours total', detail: '8 sessions × 2 hours' }, { Icon: Video, title: 'Live online', detail: '6 group + 2 personal sessions' }].map(({ Icon, title, detail }) => <div key={title} className="rounded-2xl border border-white/10 p-5"><Icon aria-hidden="true" className="mb-3 h-5 w-5 text-cyan-300" /><p className="font-bold">{title}</p><p className="mt-1 text-sm text-slate-400">{detail}</p></div>)}</div>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">{BOOTCAMP_MODULES.flatMap(module => module.sessions).map(session => <li key={session.number} className="rounded-xl border border-white/10 p-4"><p className="text-xs font-semibold text-cyan-300">Session {session.number} · {session.kind} · 2h live online</p><h3 className="mt-2 font-semibold">{session.title}</h3>{session.date && <p className="mt-2 text-sm text-slate-300">{session.date}</p>}</li>)}</ol>
    </LandingSection>

    <LandingSection alternate>
      <SectionHeading eyebrow="What you get" title="Practical work you can use in your own search.">Build useful materials and a routine you can keep improving throughout your search.</SectionHeading>
      <dl className="grid gap-4 sm:grid-cols-2">{[['CV and LinkedIn positioning', 'A role-focused CV/profile draft, with a personal resume review.'], ['Templates and application tracker', 'Outreach drafts and a place to track applications and follow-ups.'], ['Interview practice and feedback', 'Group mock-interview work and a personal interview/strategy review.'], ['A continuation plan', 'A next-step plan for your job search after the sessions.'], ['Recordings', PROGRAM.recordings], ['Community and support', PROGRAM.support]].map(([title, detail]) => <div key={title} className="rounded-2xl border border-white/10 p-5"><dt className="font-bold text-lg">{title}</dt><dd className="mt-2 text-sm leading-relaxed text-slate-300">{detail}</dd></div>)}</dl>
    </LandingSection>

    <LandingSection>
      <SectionHeading eyebrow="Price in context" title="Compare the price. Compare the support too.">Our advertised fee is ₹5,000. These publicly priced alternatives differ in scope and duration, so the table makes those differences visible.</SectionHeading>
      <ComparisonTable />
    </LandingSection>

    <LandingSection alternate><SectionHeading eyebrow="Who should join" title="A focused programme needs the right fit." /><Audience bootcamp /></LandingSection>
    <ProofSection />
    <LandingSection><SectionHeading eyebrow="Your trainer" title="Know who will guide your preparation." /><HostBio /></LandingSection>

    <LandingSection alternate id="support-policy">
      <SectionHeading eyebrow="Support & purchase terms" title="Get the terms clear before paying." />
      {BOOTCAMP_REVIEW.refundPolicy ? <p className="text-slate-300">{BOOTCAMP_REVIEW.refundPolicy}</p> : <>
        <p className="max-w-3xl text-slate-300 leading-relaxed">For questions about the schedule, payment, cancellations or refunds, email <a className="underline text-cyan-200" href="mailto:support@skillsurger.com">support@skillsurger.com</a> before enrolling. Include your payment reference if you have already paid.</p>
      </>}
    </LandingSection>

    <LandingSection><SectionHeading eyebrow="Before you enrol" title="Your questions, answered plainly." /><LandingFaq items={BOOTCAMP_FAQS} /></LandingSection>
    <LandingSection alternate><div className="mx-auto max-w-2xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-300">Prepare with a plan</p>
      <h2 className="text-3xl sm:text-4xl font-bold">Work on your next move, one step at a time.</h2>
      <p className="mt-5 mb-6 text-slate-300">Review the curriculum, schedule and purchase terms. When the programme fits your goals, enrol through our existing secure checkout.</p>
      {enrol('final')}
      <p className="mt-4 text-sm text-slate-300">{BOOTCAMP_PRICE_NOTE}</p>
      <div className="mt-7"><WebinarSoftLink /></div>
    </div></LandingSection>
  </CopilotLandingLayout>;
}
