import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Calendar, CheckCircle2, FileSearch, UserRound } from 'lucide-react';
import Button from '../Button';
import { JOB_SWITCH_PROGRAM, PROGRAM_SESSIONS } from '../../lib/constants/jobSwitchProgram';
import { WEBINAR } from '../../lib/constants/webinar';
import { trackEvent, EVENTS } from '../../lib/analytics';

const track = (placement: string, destination: string) => () =>
  trackEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement, destination });

// Paid offer first, then the two free ways in (audit, webinar).
export function ProgramOfferSection() {
  const webinarUpcoming = Date.now() < new Date(WEBINAR.startsAt).getTime();
  return (
    <section id="pricing" className="py-14 sm:py-16 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border-2 border-blue-600 p-6 sm:p-8 shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-2">The programme</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{JOB_SWITCH_PROGRAM.name}</h2>
          <p className="text-gray-600 mb-5">{JOB_SWITCH_PROGRAM.format}.</p>
          <p className="mb-5"><span className="text-4xl sm:text-5xl font-extrabold text-gray-900">{JOB_SWITCH_PROGRAM.priceLabel}</span> <span className="text-gray-600">for one month, {JOB_SWITCH_PROGRAM.taxNote}</span></p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-6 text-gray-700">
            {['Role-specific CV and LinkedIn profile', 'Target-company shortlist', 'Application tracker and outreach templates', 'Mock interviews with feedback', 'Two personal 1-to-1 reviews', '7-day refund window'].map(item => (
              <li key={item} className="flex gap-2"><CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />{item}</li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/job-switch-copilot#programme" onClick={track('home_offer', 'programme')} className="block"><Button size="lg" className="w-full">View Program <ArrowRight className="ml-2 w-5 h-5" /></Button></Link>
            <Link to="/free-resume-audit" onClick={track('home_offer', 'free_audit')} className="block"><Button size="lg" variant="outline" className="w-full border-2">Free Career Audit</Button></Link>
          </div>
        </div>
        <div className="grid gap-4">
          <Link to="/free-resume-audit" onClick={track('home_offer_card', 'free_audit')} className="group rounded-2xl bg-blue-50 border border-blue-100 p-6 hover:border-blue-300 transition-colors">
            <FileSearch className="w-7 h-7 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Start free: career audit</h3>
            <p className="text-gray-600 mb-3">Upload your resume and get a review of ATS gaps, role fit and the fixes to make first.</p>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700">Get my free audit <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
          </Link>
          {webinarUpcoming && (
            <Link to="/job-switch-copilot#webinar" onClick={track('home_offer_card', 'free_webinar')} className="group rounded-2xl bg-indigo-50 border border-indigo-100 p-6 hover:border-indigo-300 transition-colors">
              <Calendar className="w-7 h-7 text-indigo-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Free webinar: {WEBINAR.schedule}</h3>
              <p className="text-gray-600 mb-3">60 minutes online. See the method and the programme before you decide.</p>
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">Reserve my free seat <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

const aiDoes = ['Scores your resume against target job descriptions', 'Drafts role-specific resume and LinkedIn versions', 'Finds matching roles by skills and location', 'Runs practice interviews whenever you want'];
const coachDoes = ['Diagnoses why your search is stalling', 'Decides which roles and companies to target', 'Reviews your resume and stories line by line in two 1-to-1s', 'Gives live feedback in mock interviews'];

export function AiVsHumanSection() {
  return (
    <section className="py-14 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">AI does the volume. A human coach does the judgement.</h2>
          <p className="text-lg text-gray-600">The programme pairs the Skillsurger AI tools with live sessions, so you get speed and a second opinion that knows the Indian tech market.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[{ icon: Bot, title: 'What the AI software gives you', items: aiDoes, tone: 'text-blue-600' }, { icon: UserRound, title: 'What your human coach gives you', items: coachDoes, tone: 'text-purple-600' }].map(({ icon: Icon, title, items, tone }) => (
            <article key={title} className="bg-white rounded-2xl border p-6 sm:p-7">
              <Icon className={`w-8 h-8 mb-4 ${tone}`} />
              <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
              <ul className="space-y-3">{items.map(item => <li key={item} className="flex gap-2 text-gray-700"><CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tone}`} />{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Proof without unverifiable claims: the actual calendar and who runs it.
export function ProgramProofSection() {
  return (
    <section className="py-14 sm:py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl grid gap-8 lg:grid-cols-[1.5fr_1fr] items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-2">Programme calendar</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Eight sessions, each with something you keep</h2>
          <ol className="divide-y rounded-2xl border">
            {PROGRAM_SESSIONS.map((session, index) => (
              <li key={session.title} className="flex gap-4 p-4">
                <span className={`flex-shrink-0 w-12 h-8 rounded-lg text-xs font-bold flex items-center justify-center ${session.kind === 'Personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{session.kind === 'Personal' ? `1:1 #${index - 5}` : session.id}</span>
                <div><p className="font-semibold text-gray-900">{session.title}</p><p className="text-sm text-gray-600">You get: {session.deliverable}</p></div>
              </li>
            ))}
          </ol>
          <p className="text-sm text-gray-500 mt-3">Each session is 2 hours live. {JOB_SWITCH_PROGRAM.cohortDates}</p>
        </div>
        <aside className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 sm:p-7">
          <UserRound className="w-10 h-10 mb-4 text-blue-100" />
          <p className="text-sm uppercase tracking-wider text-blue-100 font-bold mb-1">Your mentor</p>
          <h3 className="text-2xl font-bold">{JOB_SWITCH_PROGRAM.mentor.name}</h3>
          <p className="text-blue-100 mb-5">{JOB_SWITCH_PROGRAM.mentor.role}</p>
          <ul className="space-y-2 text-sm text-blue-50">
            <li>{JOB_SWITCH_PROGRAM.recordings}</li>
            <li>{JOB_SWITCH_PROGRAM.refundPolicy}</li>
          </ul>
          <Link to="/job-switch-copilot#programme" onClick={track('home_proof', 'programme')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 px-5 py-3 font-bold hover:bg-blue-50">See full programme <ArrowRight className="w-4 h-4" /></Link>
        </aside>
      </div>
    </section>
  );
}

// Mobile-only bar that keeps the primary CTA in reach once the hero scrolls away.
export function StickyAuditBar({ visible }: { visible: boolean }) {
  return (
    <div aria-hidden={!visible} className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur px-4 py-3 pr-24 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
      <Link to="/free-resume-audit" tabIndex={visible ? 0 : -1} onClick={track('home_sticky_bar', 'free_audit')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white">
        Free Career Audit <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
