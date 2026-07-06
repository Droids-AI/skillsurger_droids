import { Link } from 'react-router-dom';
import { FileText, TrendingUp, LayoutDashboard, Video } from 'lucide-react';
import SEO from '../components/SEO';
import PlaceholderTestimonialCard from '../components/ui/PlaceholderTestimonialCard';
import Button from '../components/Button';
import IllustrationFrame from '../components/illustrations/IllustrationFrame';
import TestimonialIllustration from '../components/illustrations/TestimonialIllustration';
import { placeholderTestimonials } from '../lib/constants/placeholderTestimonials';

const upcomingProofCategories = [
  {
    icon: FileText,
    title: 'Before/After Resume Examples',
    description: 'Side-by-side resume rewrites showing structure, keyword, and positioning changes.',
  },
  {
    icon: TrendingUp,
    title: 'Callback Improvement Stories',
    description: 'Real accounts of how callback rates changed after a resume audit and tailoring pass.',
  },
  {
    icon: LayoutDashboard,
    title: 'Application Tracker Screenshots',
    description: 'Real (anonymized) tracker views from users running an active job-search pipeline.',
  },
  {
    icon: Video,
    title: 'Mock Interview Feedback Samples',
    description: 'Examples of the structured feedback users get after a mock interview session.',
  },
];

export default function SuccessStories() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Success Stories | Skillsurger Job Switch Copilot"
        description="Stories from tech professionals using Skillsurger Job Switch Copilot to run a structured job search."
        keywords="skillsurger success stories, job switch stories India"
        canonicalUrl="/success-stories"
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
                Job Switch Copilot
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">Success Stories</h1>
              <p className="text-xl text-gray-600 mb-8">
                This section is being populated with real user stories as Job Switch Copilot rolls out.
                Everything below is clearly marked as a placeholder until real results are in.
              </p>
              <Link to="/free-resume-audit">
                <Button size="lg">Get Your Free Resume Audit</Button>
              </Link>
            </div>
            <div className="hidden lg:flex justify-center">
              <IllustrationFrame>
                <TestimonialIllustration />
              </IllustrationFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">What Users Are Saying</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Sample cards illustrating the kind of feedback this section will feature once real testimonials come in.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {placeholderTestimonials.map((testimonial, i) => (
              <PlaceholderTestimonialCard key={i} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon proof categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">More Proof, Coming Soon</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            As real users move through Job Switch Copilot, we'll add concrete, verifiable proof in these categories.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {upcomingProofCategories.map((category) => (
              <div
                key={category.title}
                className="p-6 bg-white rounded-xl border-2 border-dashed border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Want to be one of the first success stories?</p>
            <Link to="/free-resume-audit">
              <Button size="lg">Get Your Free Resume Audit</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
