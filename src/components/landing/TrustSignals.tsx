import { FileCheck, Briefcase, MessageSquare } from 'lucide-react';

export default function TrustSignals() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-gray-900">Prepare for your next career move</h2>
        <p className="text-lg text-gray-600 text-center mb-10">Practical tools for each step of your job search.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: FileCheck, title: 'Review your resume', body: 'Check structure, keywords, and role fit before applying.' },
            { icon: Briefcase, title: 'Explore relevant roles', body: 'Search opportunities using your skills and preferred location.' },
            { icon: MessageSquare, title: 'Practice interviews', body: 'Rehearse answers and review feedback for a saved job.' },
          ].map(({ icon: Icon, title, body }) => <article key={title} className="bg-white border rounded-2xl p-6"><Icon className="w-8 h-8 text-blue-600 mb-4" /><h3 className="text-xl font-semibold mb-3">{title}</h3><p className="text-gray-600">{body}</p></article>)}
        </div>
      </div>
    </section>
  );
}
