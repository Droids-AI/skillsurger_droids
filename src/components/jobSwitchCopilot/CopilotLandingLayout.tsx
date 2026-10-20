import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Check, ChevronDown, UserRound, X } from 'lucide-react';
import { BOOTCAMP_PATH, BOOTCAMP_REVIEW, CAREER_PREP_COMPARISONS, WEBINAR_PATH } from '../../lib/constants/jobSearchLanding';
import { JOB_SWITCH_PROGRAM } from '../../lib/constants/jobSwitchProgram';
import { useCampaignLink } from '../../lib/copilotFunnel';

export const landingCtaClass = 'inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300';

export default function CopilotLandingLayout({ children, offer, sticky }: { children: ReactNode; offer: 'webinar' | 'bootcamp'; sticky: ReactNode }) {
  const campaignLink = useCampaignLink();
  return <div className="min-h-screen bg-[#020420] text-white selection:bg-blue-500/40">
    <header className="border-b border-white/10 bg-[#020420]">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="Skillsurger home" className="inline-flex items-center gap-2 font-bold text-xl"><Brain aria-hidden="true" className="h-7 w-7 text-blue-400" />Skillsurger</Link>
        <span className="text-xs sm:text-sm text-slate-300 text-right">{offer === 'webinar' ? 'Free live webinar' : 'Job Search Bootcamp'}</span>
      </div>
    </header>
    {children}
    <footer className="border-t border-white/10 px-4 pt-10 pb-32">
      <div className="mx-auto max-w-6xl text-sm text-slate-400">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <p>© {new Date().getFullYear()} Skillsurger</p>
          <nav aria-label="Legal and support" className="flex flex-wrap gap-x-5 gap-y-3">
            <Link to="/privacy" className="hover:text-white underline underline-offset-4">Privacy</Link>
            <Link to="/terms" className="hover:text-white underline underline-offset-4">Terms</Link>
            <a href="mailto:support@skillsurger.com" className="hover:text-white underline underline-offset-4">Support</a>
          </nav>
        </div>
        {offer === 'webinar' && <p className="mt-6">Looking for guided practice? <Link to={campaignLink(BOOTCAMP_PATH)} className="underline underline-offset-4 hover:text-white">Read about the optional paid bootcamp</Link>.</p>}
      </div>
    </footer>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-400/25 bg-[#080d2b]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-2 sm:gap-5">{sticky}</div>
    </div>
  </div>;
}

export function LandingSection({ children, id, alternate = false }: { children: ReactNode; id?: string; alternate?: boolean }) {
  return <section id={id} className={`scroll-mt-6 px-4 py-12 sm:py-16 ${alternate ? 'bg-[#080d2b]' : ''}`}><div className="mx-auto max-w-6xl">{children}</div></section>;
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="mb-8 max-w-3xl">
    <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-cyan-300">{eyebrow}</p>
    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{title}</h2>
    {children && <div className="mt-4 text-base sm:text-lg leading-relaxed text-slate-300">{children}</div>}
  </div>;
}

export function Audience({ bootcamp = false }: { bootcamp?: boolean }) {
  const fits = bootcamp
    ? ['You have work experience and a target tech role in mind.', 'You want a structured routine and feedback on your CV and interview preparation.', 'You can attend live sessions and work on your search between them.']
    : ['You are exploring a switch, on notice period or searching after a layoff.', 'Your CV or interview preparation needs a clearer direction.', 'You want to see the Skillsurger workflow before deciding what to use.'];
  const notFits = ['You expect a guaranteed job, placement or salary increase.', bootcamp ? 'You want a full coding course or a placement agency to apply for you.' : 'You want a full coding course in one hour.', 'You expect tools to replace your own judgement, practice and applications.'];
  return <div className="grid gap-4 md:grid-cols-2">
    {[{ title: 'A good fit if…', items: fits, Icon: Check, color: 'text-emerald-300' }, { title: 'A poor fit if…', items: notFits, Icon: X, color: 'text-slate-400' }].map(({ title, items, Icon, color }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
      <h3 className="mb-5 text-xl font-bold">{title}</h3>
      <ul className="space-y-4">{items.map(item => <li key={item} className="flex gap-3 text-slate-300"><Icon aria-hidden="true" className={`mt-1 h-4 w-4 shrink-0 ${color}`} /><span>{item}</span></li>)}</ul>
    </div>)}
  </div>;
}

export function ComparisonTable({ webinar = false }: { webinar?: boolean }) {
  return <>
    <div className="overflow-x-auto rounded-2xl border border-white/10" tabIndex={0} role="region" aria-label="Career preparation price comparison">
      <table className="w-full text-left text-sm">
        <caption className="border-b border-white/10 px-4 py-4 text-left text-slate-300">Public prices checked 20 October 2026. Scroll across on small screens.</caption>
        <thead className="bg-white/5 text-slate-200"><tr><th scope="col" className="p-4">Option</th><th scope="col" className="p-4">Price / billing</th><th scope="col" className="p-4 min-w-[12rem]">Scope</th></tr></thead>
        <tbody className="divide-y divide-white/10">
          <tr className="bg-blue-500/10"><th scope="row" className="p-4 min-w-[10rem] text-cyan-200">Skillsurger · {webinar ? 'Free webinar' : 'Job Search Bootcamp'}</th><td className="p-4 min-w-[9rem]"><strong>{webinar ? '₹0' : JOB_SWITCH_PROGRAM.priceLabel}</strong><p className="mt-1 text-xs text-slate-300">{webinar ? 'No payment required' : 'One-month programme'}</p></td><td className="p-4 text-slate-300">{webinar ? 'One-hour live introduction, product walkthrough and Q&A.' : '16 live hours, including two personal sessions.'}</td></tr>
          {CAREER_PREP_COMPARISONS.map((option, index) => <tr key={option.name}><th scope="row" className="p-4 font-medium">{option.name}<sup className="ml-1 text-cyan-300"><a href={`#price-source-${index + 1}`} aria-label={`Price source ${index + 1}`}>[{index + 1}]</a></sup></th><td className="p-4"><strong>{option.price}</strong><p className="mt-1 text-xs text-slate-400">{option.billing}</p></td><td className="p-4 text-slate-300">{option.scope}</td></tr>)}
        </tbody>
      </table>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-slate-400">These options have different curricula, mentoring and access periods. USD prices are shown as listed, without an INR conversion. Taxes, location-based prices and offers may change; check each provider before buying.</p>
    <ol className="mt-4 space-y-2 text-xs text-slate-400">{CAREER_PREP_COMPARISONS.map((option, index) => <li id={`price-source-${index + 1}`} key={option.name} className="scroll-mt-6 break-words">[{index + 1}] <a href={option.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-white">{option.name} — {option.url}</a></li>)}</ol>
  </>;
}

export function ProofSection() {
  return <LandingSection alternate>
    <SectionHeading eyebrow="Product proof & feedback" title="See the workflow. Make your own judgement.">The webinar demonstrates existing CV scoring, job matching, mock interview and AI mentor workflows. A product demo shows how it works; it does not establish hiring outcomes.</SectionHeading>
  </LandingSection>;
}

export function HostBio() {
  return <div className="grid gap-6 sm:grid-cols-[auto_1fr] items-start rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><UserRound aria-hidden="true" className="h-8 w-8" /></div>
    <div><h3 className="text-2xl font-bold">{JOB_SWITCH_PROGRAM.mentor.name}</h3><p className="mt-1 text-cyan-200">{JOB_SWITCH_PROGRAM.mentor.role}</p>
      {BOOTCAMP_REVIEW.hostBio && <p className="mt-4 text-slate-300">{BOOTCAMP_REVIEW.hostBio}</p>}
    </div>
  </div>;
}

export function LandingFaq({ items }: { items: string[][] }) {
  return <div className="divide-y divide-white/10 rounded-2xl border border-white/10 px-5 sm:px-7">{items.map(([question, answer]) => <details key={question} className="group py-5">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 [&::-webkit-details-marker]:hidden">{question}<ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-300 transition-transform group-open:rotate-180" /></summary>
    <p className="mt-3 max-w-4xl text-slate-300 leading-relaxed">{answer}</p>
  </details>)}</div>;
}

export function WebinarCountdown({ startsAt }: { startsAt: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(startsAt).getTime() - Date.now()));
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(startsAt).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startsAt]);
  if (remaining === 0) return <p className="my-6 text-cyan-200">This webinar has started. Registration is closed.</p>;
  const seconds = Math.floor(remaining / 1000);
  const parts = [[Math.floor(seconds / 86400), 'days'], [Math.floor(seconds / 3600) % 24, 'hours'], [Math.floor(seconds / 60) % 60, 'mins'], [seconds % 60, 'secs']];
  return <div role="timer" aria-label="Time until the webinar starts" className="my-7 flex justify-center gap-2 sm:gap-4">{parts.map(([value, label]) => <div key={label} className="w-16 sm:w-20 rounded-xl border border-blue-400/20 bg-blue-400/10 py-3"><p className="text-2xl font-bold tabular-nums text-white">{String(value).padStart(2, '0')}</p><p className="text-xs text-slate-300 mt-1">{label}</p></div>)}</div>;
}

export function CtaArrow() { return <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />; }

export function WebinarSoftLink() {
  const campaignLink = useCampaignLink();
  return <Link to={campaignLink(WEBINAR_PATH)} className="text-sm text-slate-300 underline underline-offset-4 hover:text-white">Not ready? Attend the free webinar first</Link>;
}
