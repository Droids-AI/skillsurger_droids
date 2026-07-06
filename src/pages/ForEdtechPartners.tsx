import { Link } from 'react-router-dom';
import { Handshake, Layers, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/Button';
import IllustrationFrame from '../components/illustrations/IllustrationFrame';
import PartnershipIllustration from '../components/illustrations/PartnershipIllustration';

const stats = [
  { label: 'Learners supported per cohort', value: '180+' },
  { label: 'Avg. interview callback lift', value: '+35%' },
  { label: 'Resumes tailored', value: '600+' },
  { label: 'Partner programs live', value: '12' },
];

const features = [
  {
    icon: Layers,
    title: 'Career Outcomes Layer',
    description: 'Plug Job Switch Copilot in as the post-course job-search layer for your learners.',
  },
  {
    icon: TrendingUp,
    title: 'Stronger Program ROI',
    description: 'Help learners convert new skills into interviews with resume tailoring and outreach support.',
  },
  {
    icon: Handshake,
    title: 'Flexible Partnership Models',
    description: "Co-branded or white-label options depending on your program's structure and audience.",
  },
];

export default function ForEdtechPartners() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Skillsurger for EdTech Partners | Career Outcomes Layer"
        description="Add resume audit, application tracking, and mock interview prep as a career-outcomes layer for your edtech learners."
        keywords="skillsurger edtech partnership, career outcomes for edtech, bootcamp job placement support"
        canonicalUrl="/for-edtech-partners"
      />

      <section className="relative pt-32 pb-20 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4">
                For EdTech Partners
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">Skillsurger for EdTech Partners</h1>
              <p className="text-xl text-gray-600 mb-8">
                Give your learners a structured job-search layer — resume tailoring, application tracking,
                and interview prep — after they complete your program.
              </p>
              <Link to="/book-a-call">
                <Button size="lg">Talk to Our Partnerships Team</Button>
              </Link>
            </div>
            <div className="hidden lg:flex justify-center">
              <IllustrationFrame>
                <PartnershipIllustration />
              </IllustrationFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Program stats */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 mb-8">
            Illustrative — Program Outcomes at a Glance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-extrabold text-blue-700">{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="inline-flex p-3 rounded-lg bg-blue-100 text-blue-600 mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-white text-center border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Let's explore a partnership</h2>
          <p className="text-gray-600 mb-6">
            Tell us about your program and learner base, and we'll put together an outcomes-layer plan.
          </p>
          <Link to="/book-a-call">
            <Button size="lg">Book a Call</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
