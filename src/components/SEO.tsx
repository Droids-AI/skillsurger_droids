import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Skillsurger | AI Career Agent for Job Seekers',
  description = 'AI-powered career coach to optimize your resume, land interviews, and upskill for top jobs. Free trial—transform your job search with Skillsurger.',
  keywords = 'AI career coach, resume builder, job matching, mock interviews, career development, ATS optimization, interview practice, job search',
  ogImage = 'https://skillsurger.com/og-image.png',
  canonicalUrl,
  noIndex = false,
  structuredData
}) => {
  const fullCanonicalUrl = canonicalUrl
    ? `https://skillsurger.com${canonicalUrl}`
    : 'https://skillsurger.com/';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={new URL(ogImage, 'https://skillsurger.com').href} />
      <meta property="og:site_name" content="Skillsurger" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={new URL(ogImage, 'https://skillsurger.com').href} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
