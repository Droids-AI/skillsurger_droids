import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/Button';
import RoleTrackCard from '../components/roleTracks/RoleTrackCard';
import IllustrationFrame from '../components/illustrations/IllustrationFrame';
import RoleCardsIllustration from '../components/illustrations/RoleCardsIllustration';
import { roleTracks } from '../lib/constants/roleTracks';
import { trackEvent, EVENTS } from '../lib/analytics';

export default function ResumeExamples() {
  useEffect(() => {
    trackEvent(EVENTS.RESUME_EXAMPLE_VIEWED, { source: 'resume_examples_page' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Resume Examples by Role | Skillsurger"
        description="Browse resume keywords, interview focus areas, and job-switch guidance by role — software engineering, data, DevOps, cloud, AI/ML, product, and more."
        keywords="resume examples India, tech resume examples, role-specific resume guide"
        canonicalUrl="/resume-examples"
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
                11 Role Tracks
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">Resume Examples by Role</h1>
              <p className="text-xl text-gray-600 mb-8">
                Resume keywords, interview focus areas, and job-switch guidance tailored to your target role.
              </p>
              <Link to="/free-resume-audit">
                <Button size="lg">
                  Get Free Resume Audit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="hidden lg:flex justify-center">
              <IllustrationFrame>
                <RoleCardsIllustration />
              </IllustrationFrame>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Pick Your Role Track</h2>
            <p className="text-gray-600">
              Each track below covers the exact resume keywords, interview focus areas, and job-switch plan
              that applies to that role — not generic advice copy-pasted across every profile.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {roleTracks.map((track) => (
              <RoleTrackCard key={track.id} track={track} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/free-resume-audit"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Not sure which track fits you? Get a free resume audit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
