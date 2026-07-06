import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';
import SEO from '../../components/SEO';
import Button from '../../components/Button';
import FAQItem from '../../components/ui/FAQItem';
import RoleTrackCard from '../../components/roleTracks/RoleTrackCard';
import NotFound from '../NotFound';
import { seoLandingPages } from '../../lib/constants/seoLandingPages';
import { roleTracks } from '../../lib/constants/roleTracks';
import { trackEvent, EVENTS } from '../../lib/analytics';

interface SEOLandingPageProps {
  slug: string;
}

export default function SEOLandingPage({ slug }: SEOLandingPageProps) {
  const content = seoLandingPages.find((page) => page.slug === slug);

  if (!content) {
    return <NotFound />;
  }

  const relatedTrack = content.relatedRoleTrackId
    ? roleTracks.find((track) => track.id === content.relatedRoleTrackId)
    : undefined;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: content.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://skillsurger.com/' },
          {
            '@type': 'ListItem',
            position: 2,
            name: content.breadcrumbLabel,
            item: `https://skillsurger.com/${content.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={content.metaTitle}
        description={content.metaDescription}
        keywords={content.keywords}
        canonicalUrl={`/${content.slug}`}
        structuredData={structuredData}
      />

      <div className="container mx-auto px-4 pt-32">
        <nav className="flex items-center text-sm text-gray-500 max-w-3xl mx-auto" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-gray-700">{content.breadcrumbLabel}</span>
        </nav>
      </div>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{content.h1}</h1>
          <p className="text-lg text-gray-600">{content.intro}</p>
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-8">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{section.heading}</h2>
              <p className="text-gray-600">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      {relatedTrack && (
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Role Track: {relatedTrack.title}</h2>
            <div className="max-w-md">
              <RoleTrackCard track={relatedTrack} />
            </div>
          </div>
        </section>
      )}

      <section className="pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {content.faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 rounded-xl p-8 text-center text-white">
            <p className="text-lg mb-6">
              Explore related resources or take the next step in your job search.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                to={content.primaryCtaHref}
                onClick={() => trackEvent(EVENTS.LEAD_FORM_STARTED, { source: content.slug })}
              >
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  {content.primaryCtaLabel}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link
                to="/resume-examples"
                onClick={() => trackEvent(EVENTS.RESUME_EXAMPLE_VIEWED, { source: content.slug })}
              >
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  Browse More Role Guides
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <Link
                to="/mock-interview"
                className="hover:text-white underline"
                onClick={() => trackEvent(EVENTS.MOCK_INTERVIEW_CLICKED, { source: content.slug })}
              >
                Mock Interview
              </Link>
              <Link to="/job-switch-copilot" className="hover:text-white underline">Job Switch Copilot</Link>
              <Link to="/pricing" className="hover:text-white underline">Pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
