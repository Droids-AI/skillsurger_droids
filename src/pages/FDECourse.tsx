import { ArrowUpRight, CheckCircle2, Code2, ShieldCheck, Network } from 'lucide-react';
import SEO from '../components/SEO';
import curriculum from '../data/fdeCurriculum.json';

export const FDE_UDEMY_URL = 'https://www.udemy.com/course/ai-forward-deployed-engineer-extensive-program/?referralCode=059C9E3DEB7126402751';
const outcomes = ['Scope an enterprise AI problem and connect the build to business KPIs.', 'Build retrieval, tool and agent workflows with evaluation and observability.', 'Design permission-aware integrations and test security boundaries.', 'Prepare deployment, runbooks, UAT and a portfolio architecture review.'];

const courseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Forward Deployed AI Engineer: Enterprise GenAI, RAG & AI Agents',
  description: 'Learn to deliver enterprise GenAI, RAG and AI agent systems inside real client workflows, from discovery and secure integrations to evaluation, deployment and handoff.',
  provider: { '@type': 'Organization', name: 'Skillsurger', url: 'https://skillsurger.com' },
  url: 'https://skillsurger.com/courses/forward-deployed-ai-engineer',
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online' },
};

export default function FDECourse() {
  const count = curriculum.sections.reduce((sum, section) => sum + section.items.length, 0);
  return <div className="bg-gray-50 text-slate-900">
    <SEO title="Forward Deployed AI Engineer Course: Enterprise GenAI, RAG & AI Agents | Skillsurger" description="Forward Deployed AI Engineer course: learn to deliver enterprise GenAI, RAG and AI agents inside real client workflows. 18 sections, 156 lessons, 2 capstones. Enroll on Udemy." keywords="forward deployed AI engineer course, forward deployed engineer, enterprise GenAI course, RAG course, AI agents course" canonicalUrl="/courses/forward-deployed-ai-engineer" structuredData={courseSchema} />
    <section className="bg-[#020420] text-white pt-24 pb-16 sm:pt-32 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
        <div><p className="text-cyan-300 font-semibold mb-4">Skillsurger learning</p><h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">Forward Deployed AI Engineer<span className="block text-2xl sm:text-3xl font-bold text-cyan-200 mt-3">Enterprise GenAI, RAG &amp; AI Agents</span></h1><p className="text-xl text-slate-300 mb-7">Connect AI engineering with real enterprise workflows, from discovery and secure integrations to evaluation, deployment and handoff.</p><a href={FDE_UDEMY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-4 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Enroll on Udemy <ArrowUpRight className="w-5 h-5" /></a></div>
        <aside className="rounded-3xl border border-white/15 bg-white/5 p-7"><Code2 className="text-cyan-300 w-12 h-12 mb-6" /><h2 className="text-2xl font-bold mb-5">From foundations to enterprise delivery</h2><dl className="space-y-4">{[[curriculum.sections.length, 'Curriculum sections'], [count, 'Curriculum items'], [2, 'Capstones: OmniGuard and AuditMesh']].map(([value, label]) => <div key={label} className="border-b border-white/10 pb-3"><dt className="text-slate-300">{label}</dt><dd className="text-3xl font-bold">{value}</dd></div>)}</dl></aside>
      </div>
    </section>
    <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">
      <div><h2 className="text-3xl font-bold mb-5">Who this curriculum is for</h2><p className="text-slate-600 leading-relaxed">Software and AI engineers who want to connect technical implementation with enterprise discovery, integrations, security and delivery. The curriculum spans Python and backend foundations, machine learning, LLMs, RAG and production systems.</p><h3 className="text-xl font-bold mt-6 mb-3">Before you start</h3><p className="text-slate-600">Review the Python, Git, API and data foundations in the curriculum and identify any gaps. Confirm the provider’s entry requirements and learning format on Udemy.</p></div>
      <div><h2 className="text-3xl font-bold mb-5">What you will work on</h2><ul className="space-y-4">{outcomes.map(item => <li className="flex gap-3" key={item}><CheckCircle2 className="text-blue-600 w-5 h-5 shrink-0 mt-1" /><span>{item}</span></li>)}</ul><p className="text-sm text-slate-500 mt-6">Learning goals describe the curriculum. No employment or salary outcome is guaranteed.</p></div>
    </section>
    <section className="bg-white py-16"><div className="max-w-6xl mx-auto px-4"><h2 className="text-3xl font-bold mb-5">Two enterprise capstones</h2><div className="grid md:grid-cols-2 gap-6">{[
      { icon: ShieldCheck, name: 'OmniGuard', title: 'Secure AI Integration', description: 'RBAC, Hybrid RAG, Secure SQL and Guardrails' },
      { icon: Network, name: 'AuditMesh', title: 'Multi-Agent Compliance System', description: 'LangGraph Supervisor, MCP, Human Approval and Cost Tracing' },
    ].map(({ icon: Icon, name, title, description }) => <article key={name} className="rounded-2xl border p-6"><Icon className="text-blue-600 w-8 h-8 mb-4" /><h3 className="text-2xl font-bold mb-2">{name}</h3><p className="font-semibold mb-3">{title}</p><p className="text-slate-600">{description}</p></article>)}</div></div></section>
    <section className="max-w-4xl mx-auto px-4 py-16"><h2 className="text-3xl font-bold mb-3">Explore the full curriculum</h2><p className="text-slate-600 mb-8">{curriculum.sections.length} sections · {count} items. Open a section to see every topic and item type.</p><div className="space-y-3">{curriculum.sections.map(section => <details key={section.number} className="bg-white border rounded-xl p-5"><summary className="cursor-pointer font-bold">{section.number}. {section.title}<span className="block text-sm text-slate-500 font-normal mt-1">{section.items.length} items</span></summary><ol className="mt-5 space-y-3">{section.items.map(item => <li key={item.number} className="flex gap-3 items-start border-t pt-3"><span className="text-slate-500 text-sm pt-1">{item.number}.</span><div><p>{item.title}</p><p className="text-xs text-blue-700 mt-1">{item.type}</p></div></li>)}</ol></details>)}</div></section>
    <section className="max-w-4xl mx-auto px-4 pb-16"><h2 className="text-3xl font-bold mb-6">Course questions</h2>{[
      ['What is covered?', 'The curriculum covers foundations, enterprise backend and data systems, ML, transformers, prompting, RAG, fine-tuning, agents, MCP/A2A, security, evaluations, multimodal systems, inference and the FDE delivery lifecycle.'],
      ['Are there practical exercises?', 'Yes. The curriculum labels hands-on items and capstone work. Open the sections above to review their exact topics.'],
      ['How is the course delivered?', 'View the provider’s course page on Udemy for the published format, access terms and any requirements.'],
      ['Is this the Job Switch Copilot programme?', 'This is a separate course curriculum. The Job Switch Copilot webinar and one-month programme remain on their own page.'],
    ].map(([question, answer]) => <details key={question} className="border-b py-4"><summary className="font-semibold cursor-pointer">{question}</summary><p className="mt-3 text-slate-600">{answer}</p></details>)}<a href={FDE_UDEMY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-8 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Explore the course on Udemy <ArrowUpRight className="w-5 h-5" /></a></section>
  </div>;
}
