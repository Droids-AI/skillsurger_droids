import { ArrowRight, CheckCircle2, Clock, Users, Target, Briefcase, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO';
import WebinarRegistrationForm from '../components/leadgen/WebinarRegistrationForm';
import { trackEvent, EVENTS } from '../lib/analytics';

const sessions = [
  ['Week 1', 'Choose your next move', 'Identify target roles, assess your strengths, and build a practical job-switch plan.'],
  ['Week 2', 'Build your application pipeline', 'Improve your resume and LinkedIn positioning, tailor applications, and plan recruiter outreach.'],
  ['Week 3', 'Prepare for interviews', 'Practice your introduction, role-specific answers, and examples that demonstrate your impact.'],
  ['Week 4', 'Negotiate your next offer', 'Prepare for salary conversations, compare opportunities, and refine your next steps.'],
];
const faqs = [
  ['What does ₹9,999 include?', 'One month of Job Switch Copilot: eight sessions of two hours each, for 16 hours total. Two of those eight sessions are personal 1-to-1 sessions; the remaining six are group sessions.'],
  ['Is the webinar free?', 'Yes. This form reserves a free one-hour online webinar. You do not pay ₹9,999 or enrol in the programme by registering.'],
  ['What will I learn in the webinar?', 'How to plan a job switch, choose higher-value roles, improve your positioning, and negotiate with a target of 1.5x to 5x your current salary.'],
  ['Is a salary increase guaranteed?', 'No. The salary range is a target to explore, not a promised outcome. Results depend on your experience, skills, target role, market conditions, and execution.'],
  ['When is the webinar?', 'The next session timing and joining details will be shared using the contact details you provide.'],
];
export default function JobSwitchCopilot() {
  const reserve = (placement: string) => trackEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement, destination: 'free_webinar' });
  return <div className="min-h-screen bg-white">
    <SEO title="Job Switch Copilot — ₹9,999 for One Month | Skillsurger" description="Plan your next job switch with 8 two-hour sessions, including 2 personal 1-to-1 sessions. Join our free one-hour webinar on targeting 1.5x to 5x salary growth." canonicalUrl="/job-switch-copilot" />
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center max-w-6xl">
        <div>
          <p className="text-blue-300 font-semibold mb-4">SKILLSURGER · JOB SWITCH COPILOT</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">Make your next job switch a step up.</h1>
          <p className="text-lg text-blue-100 mb-6">A guided one-month programme to strengthen your positioning, build a focused job-search pipeline, prepare for interviews, and negotiate your next offer.</p>
          <p className="text-3xl font-bold mb-3">₹9,999 <span className="text-base font-normal text-blue-200">for one month</span></p>
          <p className="text-blue-100 mb-8">8 sessions × 2 hours · Includes 2 personal 1-to-1 sessions</p>
          <a href="#webinar" onClick={() => reserve('hero')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-4 font-bold">Start with the free webinar <ArrowRight className="w-5 h-5" /></a>
          <p className="text-sm text-blue-200 mt-3">1 hour online · No payment required to register</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/5 p-6 sm:p-8">
          <p className="text-blue-300 font-semibold mb-3">YOUR NEXT MOVE, WITH A PLAN</p>
          <h2 className="text-2xl font-bold mb-6">From scattered applications to focused action</h2>
          {[['Positioning', 'A resume and career story aligned with your target roles.'], ['Pipeline', 'Targeted applications, recruiter outreach, and follow-ups.'], ['Preparation', 'Interview practice and clear examples of your impact.'], ['Negotiation', 'A considered approach to your next salary conversation.']].map(([title, text]) => <div key={title} className="flex gap-3 mb-5"><CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-1" /><div><h3 className="font-bold">{title}</h3><p className="text-blue-100 mt-1">{text}</p></div></div>)}
        </div>
      </div>
    </section>
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">One programme. A month of focused progress.</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">Combine practical career training with a structured job-switch system, personalised feedback, and time to put your plan into action.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{sessions.map(([week, title, description], i) => {
          const Icon = [Target, Briefcase, Users, TrendingUp][i];
          return <div key={week} className="bg-white border rounded-2xl p-6"><Icon className="w-8 h-8 text-blue-600 mb-4" /><p className="text-blue-600 font-semibold text-sm mb-2">{week}</p><h3 className="text-xl font-bold mb-3">{title}</h3><p className="text-gray-600">{description}</p></div>;
        })}</div>
      </div>
    </section>
    <section id="programme" className="py-16 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4"><div className="rounded-2xl border-2 border-blue-600 p-6 sm:p-10">
        <p className="text-blue-600 font-bold mb-2">THE COMPLETE PROGRAMME</p><h2 className="text-3xl font-bold mb-4">Job Switch Copilot</h2>
        <p className="text-5xl font-bold mb-2">₹9,999</p><p className="text-gray-600 mb-6">One month · One programme fee</p>
        <ul className="space-y-3 mb-8">{['8 live sessions, 2 hours each — 16 hours total', '6 group sessions + 2 personal 1-to-1 sessions', 'Resume and LinkedIn positioning guidance', 'Target-role selection, applications, and recruiter outreach', 'Interview preparation and salary negotiation guidance'].map(item => <li key={item} className="flex gap-3"><CheckCircle2 className="text-green-600 w-5 h-5 flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
        <a href="#webinar" onClick={() => reserve('programme')} className="block text-center bg-blue-600 text-white rounded-xl px-5 py-4 font-bold hover:bg-blue-700">Explore it in the free webinar</a>
        <p className="text-sm text-gray-500 mt-4">Learn the approach first, then decide whether the paid programme fits your goals.</p>
      </div></div>
    </section>
    <section id="webinar" className="py-16 bg-blue-50 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <p className="text-blue-700 font-bold mb-3 flex items-center gap-2"><Clock className="w-5 h-5" /> FREE 1-HOUR WEBINAR</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">How to switch jobs and target 1.5x to 5x salary growth</h2>
          <p className="text-gray-600 text-lg mb-6">Learn how to identify better opportunities, communicate your value, and approach your next job switch with a clear plan.</p>
          <ul className="space-y-4 text-gray-700">{['Identify roles and companies where your skills can command more value.', 'Understand why generic resumes and mass applications fall short.', 'Build an application and interview strategy you can act on.', 'Prepare for salary negotiation and learn how Job Switch Copilot works.'].map(item => <li key={item} className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />{item}</li>)}</ul>
          <p className="text-sm text-gray-500 mt-6">Salary growth depends on your starting point, skills, role, and the market. No job offer or salary increase is guaranteed.</p>
        </div>
        <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-sm"><WebinarRegistrationForm /></div>
      </div>
    </section>
    <section className="py-16 max-w-3xl mx-auto px-4"><h2 className="text-3xl font-bold text-center mb-8">Before you register</h2>
      {faqs.map(([question, answer]) => <details key={question} className="border-b py-5"><summary className="font-semibold text-lg cursor-pointer">{question}</summary><p className="text-gray-600 mt-3">{answer}</p></details>)}
    </section>
  </div>;
}
