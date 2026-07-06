import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, FileEdit, Send, LineChart, Code2, Cloud, CalendarClock, LifeBuoy, TrendingUp, Search } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/Button';
import StepIndicator from '../components/ui/StepIndicator';
import FAQItem from '../components/ui/FAQItem';
import PlaceholderTestimonialCard from '../components/ui/PlaceholderTestimonialCard';
import FeatureCardsGrid from '../components/jobSwitchCopilot/FeatureCardsGrid';
import ApplicationTrackerMockup from '../components/jobSwitchCopilot/ApplicationTrackerMockup';
import ResumeAuditReportPreview from '../components/jobSwitchCopilot/ResumeAuditReportPreview';
import PricingTiers from '../components/jobSwitchCopilot/PricingTiers';
import CTASection from '../components/landing/CTASection';
import IllustrationFrame from '../components/illustrations/IllustrationFrame';
import PipelineIllustration from '../components/illustrations/PipelineIllustration';
import { jobSwitchCopilotFaqs } from '../lib/constants/jobSwitchCopilotFaqs';
import { placeholderTestimonials } from '../lib/constants/placeholderTestimonials';
import { trackEvent, EVENTS } from '../lib/analytics';

const whoThisIsFor = [
  { icon: Code2, text: 'Software engineers switching jobs' },
  { icon: Cloud, text: 'Data, DevOps, cloud, and AI professionals' },
  { icon: CalendarClock, text: 'Professionals on notice period' },
  { icon: LifeBuoy, text: 'Laid-off tech professionals' },
  { icon: TrendingUp, text: '3-12 years experience targeting ₹20-50 LPA roles' },
  { icon: Search, text: 'Applying actively but not getting enough callbacks' },
];

const sprintWeeks = [
  { number: '1', title: 'Foundation', description: 'Resume audit, positioning, and target-role clarity.', icon: FileEdit },
  { number: '2', title: 'Tailoring', description: 'Resume tailoring, LinkedIn optimization, application pipeline setup.', icon: Send },
  { number: '3', title: 'Outreach', description: 'Recruiter outreach, follow-ups, and mock interviews begin.', icon: LineChart },
  { number: '4', title: 'Interview Push', description: 'Interview preparation, iteration, and job-search review.', icon: Rocket },
];

function trackCTA(location: string) {
  trackEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { location });
}

export default function JobSwitchCopilot() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Job Switch Copilot for Indian Tech Professionals | Skillsurger"
        description="A structured job-search system for tech professionals switching to better roles with resume tailoring, outreach templates, tracking, and interview prep."
        keywords="job switch copilot, job search system India, tech job switch, resume tailoring, career diagnosis"
        canonicalUrl="/job-switch-copilot"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: jobSwitchCopilotFaqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4">
                Structured Job Search System
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Your structured job-search system for switching to better tech roles
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                Skillsurger Job Switch Copilot helps Indian tech professionals improve their resume, tailor
                applications, track opportunities, prepare for interviews, and stay consistent during their job search.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/free-resume-audit" onClick={() => trackCTA('hero_primary')}>
                  <Button size="lg" className="w-full sm:w-auto">
                    Start with Free Resume Audit
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/book-a-call" onClick={() => trackCTA('hero_secondary')}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Book Career Diagnosis
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <IllustrationFrame>
                <PipelineIllustration />
              </IllustrationFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">Who this is for</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Job Switch Copilot is built specifically around the realities of switching tech roles in India.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whoThisIsFor.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="group p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300"
              >
                <div className="inline-flex p-3 rounded-lg bg-blue-100 text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-gray-700 font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">The Problem</h3>
              <p className="text-gray-600 mb-4">
                Most job seekers do not have a job-search system. They use one resume for every role, apply
                randomly, forget follow-ups, and prepare for interviews only after getting shortlisted.
              </p>
              <p className="text-gray-600">
                The result: hours spent applying, few callbacks, and no clear sense of what's actually working
                or where the process is breaking down.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">The Solution</h3>
              <p className="text-gray-600 mb-4">
                Skillsurger gives you a structured job-search operating system with resume audit, role-fit
                matching, resume tailoring, recruiter outreach, application tracking, and mock interview
                preparation — all connected as one system.
              </p>
              <p className="text-gray-600">
                Instead of guessing, you follow a weekly rhythm: tailor, apply, track, follow up, practice,
                and improve — with visibility into what's working at every step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">What's Included</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Every module works together as one system — not a bundle of disconnected tools.
          </p>
          <FeatureCardsGrid />
        </div>
      </section>

      {/* 30-Day Sprint */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">The 30-Day Job Recovery Sprint</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            A focused, week-by-week plan for anyone who needs to move quickly — especially useful during a
            notice period or right after a layoff.
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {sprintWeeks.map((week, i) => (
              <StepIndicator
                key={week.number}
                number={week.number}
                title={week.title}
                description={week.description}
                icon={week.icon}
                isLast={i === sprintWeeks.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Tracker + Audit preview */}
      <section className="py-16">
        <div className="container mx-auto px-4 space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">See Your Pipeline at a Glance</h2>
            <ApplicationTrackerMockup />
          </div>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What a Resume Audit Looks Like</h2>
            <ResumeAuditReportPreview />
          </div>
        </div>
      </section>

      {/* Trust & Proof */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">Built by People Who've Done This</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Real user stories are being added as Job Switch Copilot rolls out — the cards below are
            placeholders illustrating the kind of feedback we'll feature.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {placeholderTestimonials.map((testimonial, i) => (
              <PlaceholderTestimonialCard key={i} testimonial={testimonial} />
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-8 max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Founder's Note — Placeholder</p>
            <p className="text-gray-600 italic">
              "Replace with a real founder-led note about why Job Switch Copilot exists and what problem it was
              built to solve for Indian tech professionals."
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">Pricing</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Start free, or choose the level of support that matches how urgently you need to move.
          </p>
          <PricingTiers />
          <p className="text-center text-sm text-gray-500 mt-8">
            No guaranteed placement, interviews, or salary outcomes — these plans improve the quality and
            consistency of your job search.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {jobSwitchCopilotFaqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <div onClick={() => trackCTA('final_cta')}>
        <CTASection
          title="Build your job-search pipeline today."
          subtitle="Start with a free resume audit and understand what is blocking your job search."
          ctaLabel="Get Free Resume Audit"
          ctaHref="/free-resume-audit"
          footnote="No guaranteed outcomes — just a structured system to improve your job search."
        />
      </div>
    </div>
  );
}
