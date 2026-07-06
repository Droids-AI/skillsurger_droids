import { Link } from 'react-router-dom';
import { GraduationCap, Users, BarChart3 } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/Button';
import IllustrationFrame from '../components/illustrations/IllustrationFrame';
import CollegesIllustration from '../components/illustrations/CollegesIllustration';

const stats = [
  { label: 'Students onboarded per term', value: '250+' },
  { label: 'Avg. ATS score improvement', value: '+22' },
  { label: 'Mock interviews completed', value: '400+' },
  { label: 'Resume gaps identified', value: '1,100+' },
];

const features = [
  {
    icon: GraduationCap,
    title: 'Placement Readiness',
    description: 'Resume audits and role-fit guidance so students apply with stronger, ATS-friendly resumes.',
  },
  {
    icon: Users,
    title: 'Mock Interview Practice',
    description: 'Structured, role-specific mock interviews to build confidence before real placement rounds.',
  },
  {
    icon: BarChart3,
    title: 'Cohort Insights',
    description: 'Aggregate visibility into common resume and readiness gaps across your student cohort.',
  },
];

export default function ForColleges() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Skillsurger for Colleges | Placement Cell Partnerships"
        description="Partner with Skillsurger to give your students structured resume, interview, and job-search readiness support ahead of placements."
        keywords="skillsurger for colleges, placement cell partnership, campus career readiness"
        canonicalUrl="/for-colleges"
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
                For Placement Cells
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">Skillsurger for Colleges</h1>
              <p className="text-xl text-gray-600 mb-8">
                Help your students walk into placements with a stronger resume, clearer role-fit, and real
                interview practice — not just a generic resume template.
              </p>
              <Link to="/book-a-call">
                <Button size="lg">Talk to Our Partnerships Team</Button>
              </Link>
            </div>
            <div className="hidden lg:flex justify-center">
              <IllustrationFrame>
                <CollegesIllustration />
              </IllustrationFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Cohort stats */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 mb-8">
            Illustrative — Cohort Insights at a Glance
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Interested in a partnership?</h2>
          <p className="text-gray-600 mb-6">
            Tell us about your college and placement timelines, and we'll put together a plan for your students.
          </p>
          <Link to="/book-a-call">
            <Button size="lg">Book a Call</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
