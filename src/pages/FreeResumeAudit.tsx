import { CheckCircle2, Target, FileSearch, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO';
import ResumeAuditForm from '../components/leadgen/ResumeAuditForm';
import ResumeAuditReportPreview from '../components/jobSwitchCopilot/ResumeAuditReportPreview';
import FAQItem from '../components/ui/FAQItem';
import IllustrationFrame from '../components/illustrations/IllustrationFrame';
import ResumeAuditIllustration from '../components/illustrations/ResumeAuditIllustration';
import { jobSwitchCopilotFaqs } from '../lib/constants/jobSwitchCopilotFaqs';
import { faqs } from '../lib/constants/faqs';

const highlights = [
  {
    icon: FileSearch,
    title: 'ATS & Structure Check',
    description: 'See exactly which formatting and section issues could be causing ATS systems to reject your resume.',
  },
  {
    icon: Target,
    title: 'Role-Fit Scoring',
    description: 'Understand how well your resume aligns with your target role before you apply.',
  },
  {
    icon: TrendingUp,
    title: 'Priority Action Plan',
    description: 'Get a ranked list of the highest-impact fixes to make first, not a generic checklist.',
  },
];

const relevantFaqs = [
  jobSwitchCopilotFaqs.find((f) => f.question === 'What happens after I upload my resume?'),
  jobSwitchCopilotFaqs.find((f) => f.question === 'How is this different from a generic resume builder?'),
  faqs.find((f) => f.question === 'Is my resume data safe and private?'),
].filter(Boolean) as { question: string; answer: string }[];

export default function FreeResumeAudit() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Free Resume Audit for Indian Tech Professionals | Skillsurger"
        description="Upload your resume and get a free audit covering ATS gaps, role-fit, keywords, structure, and improvement opportunities."
        keywords="free resume audit India, resume review India, ATS resume check, resume feedback"
        canonicalUrl="/free-resume-audit"
      />

      <section className="relative pt-32 pb-12 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4">
                Free • No Payment Required
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">Get a Free Resume Audit</h1>
              <p className="text-xl text-gray-600">
                Upload your resume and get a free audit covering ATS compatibility, role-fit, keyword gaps,
                structure, and impact — no payment required.
              </p>
            </div>
            <div className="hidden lg:flex justify-center">
              <IllustrationFrame>
                <ResumeAuditIllustration />
              </IllustrationFrame>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {highlights.map((item) => (
              <div key={item.title} className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <div className="inline-flex p-3 rounded-lg bg-blue-100 text-blue-600 mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6">Get Free Resume Audit</h2>
              <ResumeAuditForm />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What your audit includes</h2>
              <ResumeAuditReportPreview />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {relevantFaqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
