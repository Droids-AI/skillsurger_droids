import { seoLandingPages } from './seoLandingPages';

// Topic clusters for internal linking: each guide links to its siblings and to the
// cluster's hub page, and the hub pages link back to every guide.
export interface ContentCluster {
  id: string;
  title: string;
  hub: { label: string; href: string };
  slugs: string[];
}

export const CONTENT_CLUSTERS: ContentCluster[] = [
  {
    id: 'resume',
    title: 'Resume guides',
    hub: { label: 'Get a free career audit', href: '/free-resume-audit' },
    slugs: [
      'software-engineer-resume', 'devops-resume', 'data-engineer-resume', 'cloud-engineer-resume',
      'ai-ml-engineer-resume', 'product-manager-resume', 'business-analyst-resume',
      'ats-resume-checker-india', 'resume-review-india',
    ],
  },
  {
    id: 'interview',
    title: 'Interview preparation',
    hub: { label: 'See the Job Switch Copilot programme', href: '/job-switch-copilot#programme' },
    slugs: ['software-engineer-mock-interview', 'system-design-interview-prep'],
  },
  {
    id: 'job-switch',
    title: 'Switching jobs',
    hub: { label: 'See the Job Switch Copilot programme', href: '/job-switch-copilot#programme' },
    slugs: ['job-search-after-layoff', 'notice-period-job-search', 'linkedin-profile-optimization-india', 'career-coach-for-tech-professionals'],
  },
];

export interface ClusterLink { slug: string; label: string; href: string }

export function clusterLinks(cluster: ContentCluster): ClusterLink[] {
  return cluster.slugs.flatMap(slug => {
    const page = seoLandingPages.find(p => p.slug === slug);
    return page ? [{ slug, label: page.breadcrumbLabel, href: `/${slug}` }] : [];
  });
}

export function clusterForSlug(slug: string): ContentCluster | undefined {
  return CONTENT_CLUSTERS.find(c => c.slugs.includes(slug));
}
