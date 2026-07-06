import { FAQ } from './faqs';

export interface SEOLandingPageSection {
  heading: string;
  body: string;
}

export interface SEOLandingPageContent {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  breadcrumbLabel: string;
  h1: string;
  intro: string;
  sections: SEOLandingPageSection[];
  faqs: FAQ[];
  relatedRoleTrackId?: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
}

export const seoLandingPages: SEOLandingPageContent[] = [
  {
    slug: 'software-engineer-resume',
    metaTitle: 'Software Engineer Resume Guide India | Skillsurger',
    metaDescription:
      'Build an ATS-friendly software engineer resume with role-specific keywords, examples, structure, and job-switch guidance.',
    keywords: 'software engineer resume, ATS resume India, SDE resume, tech resume India',
    breadcrumbLabel: 'Software Engineer Resume',
    h1: 'Software Engineer Resume Guide for Indian Tech Professionals',
    intro:
      'Most software engineer resumes get filtered out before a human ever reads them — not because the candidate is unqualified, but because the resume is not structured for how ATS systems and recruiters actually scan it. Here is what a resume needs to get past both.',
    sections: [
      {
        heading: 'What ATS systems look for',
        body: 'ATS parsers look for a clean, single-column structure, standard section headings (Experience, Education, Skills), and keyword overlap with the job description — things like "system design", "REST APIs", "CI/CD", or the specific languages/frameworks the role calls for.',
      },
      {
        heading: 'What recruiters look for in the first 10 seconds',
        body: 'Recruiters scan for scope (what you owned), scale (how big/impactful), and outcome (what changed because of your work). "Built a payments service" says less than "Owned a payments service processing 2M+ transactions/month, cut latency by 35%."',
      },
      {
        heading: 'Common mistakes in SDE resumes',
        body: "Listing responsibilities instead of impact, using one generic resume for every application, and omitting metrics are the three most common reasons a qualified engineer's resume gets passed over.",
      },
    ],
    faqs: [
      {
        question: 'Should a software engineer resume be one page or two?',
        answer: 'One page for under ~8 years of experience; two pages is acceptable beyond that if every line adds value. Padding a one-page resume to two pages hurts more than it helps.',
      },
      {
        question: 'Do I need a separate resume for every job I apply to?',
        answer: 'Not from scratch — but the keywords and top 2-3 bullet points under your most recent role should be tailored to each job description for the best ATS match.',
      },
    ],
    relatedRoleTrackId: 'software-engineer',
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'devops-resume',
    metaTitle: 'DevOps Engineer Resume Guide India | Skillsurger',
    metaDescription:
      'Create a stronger DevOps resume with CI/CD, cloud, Kubernetes, automation, and infrastructure keywords.',
    keywords: 'devops resume, cloud engineer resume India, kubernetes resume, SRE resume',
    breadcrumbLabel: 'DevOps Resume',
    h1: 'DevOps Engineer Resume Guide for Indian Tech Professionals',
    intro:
      'DevOps resumes are judged on reliability and automation impact more than raw tool lists. Here is how to position infrastructure work so it reads as business impact, not just a checklist of tools.',
    sections: [
      {
        heading: 'Lead with reliability and automation metrics',
        body: 'Deployment frequency, mean time to recovery, uptime percentage, and infrastructure cost reduction are the metrics that separate a strong DevOps resume from a tool-list resume.',
      },
      {
        heading: 'Keywords that matter for ATS and recruiters',
        body: 'CI/CD pipelines, Kubernetes, Terraform/IaC, monitoring and observability, incident response, and cloud platforms (AWS/Azure/GCP) should appear naturally tied to specific outcomes, not just listed in a skills block.',
      },
      {
        heading: 'Structuring incident-response experience',
        body: 'Recruiters want to see how you handled production incidents — detection, root cause, resolution, and the prevention work that followed. This is often the strongest differentiator in interviews too.',
      },
    ],
    faqs: [
      {
        question: 'Do I need certifications listed on a DevOps resume?',
        answer: 'They help pass initial screens (especially cloud certifications) but should never replace demonstrated production impact — put them in a dedicated section, not as a substitute for experience bullets.',
      },
      {
        question: 'How do I show impact if I work on shared infrastructure?',
        answer: 'Scope your contribution clearly ("Led migration of X service" or "Reduced deployment time for the platform team by Y%") rather than claiming ownership of the whole system.',
      },
    ],
    relatedRoleTrackId: 'devops-engineer',
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'data-engineer-resume',
    metaTitle: 'Data Engineer Resume Guide India | Skillsurger',
    metaDescription:
      'Improve your data engineer resume with ATS keywords, project examples, cloud/data stack positioning, and job-search tips.',
    keywords: 'data engineer resume, data engineering resume India, ETL resume, pipeline resume',
    breadcrumbLabel: 'Data Engineer Resume',
    h1: 'Data Engineer Resume Guide for Indian Tech Professionals',
    intro:
      'Data engineer resumes need to balance pipeline architecture depth with business-facing impact. Here is how to structure both so ATS systems and hiring managers see the full picture.',
    sections: [
      {
        heading: 'Quantify pipeline scale and reliability',
        body: 'Data volume processed, pipeline uptime, latency reduction, and cost savings from optimization are the numbers that make a data engineering resume stand out.',
      },
      {
        heading: 'Show the business outcome, not just the pipeline',
        body: 'A pipeline that "enables real-time fraud detection" or "powers the recommendation engine" tells a hiring manager why the work mattered, not just what tools were used.',
      },
      {
        heading: 'Keywords recruiters and ATS systems scan for',
        body: 'Spark, Airflow, dbt, data warehousing (Snowflake/BigQuery/Redshift), streaming (Kafka), and SQL optimization are common high-signal keywords across Indian tech job descriptions.',
      },
    ],
    faqs: [
      {
        question: 'Is SQL still important to highlight for data engineer roles?',
        answer: 'Yes — SQL proficiency is assumed baseline and often tested directly in interviews, so it should be visible in both your skills section and your project bullet points.',
      },
      {
        question: 'How do I position a resume if I moved from data analyst to data engineer?',
        answer: 'Lead with the engineering-adjacent parts of your analyst work (pipeline building, automation, data modeling) and be explicit about the technical skills you have picked up since.',
      },
    ],
    relatedRoleTrackId: 'data-engineer',
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'job-search-after-layoff',
    metaTitle: 'Job Search After Layoff India | 30-Day Recovery Plan | Skillsurger',
    metaDescription:
      'A practical job-search system for laid-off tech professionals to rebuild resume, outreach, applications, and interview readiness.',
    keywords: 'job search after layoff, laid off tech job India, layoff recovery plan, notice period job search',
    breadcrumbLabel: 'Job Search After Layoff',
    h1: 'Job Search After a Layoff: A Structured Recovery Plan for Indian Tech Professionals',
    intro:
      'A layoff compresses your timeline and raises the stakes on every application. The professionals who land well after a layoff usually aren\'t applying to more jobs — they\'re running a tighter, more structured process. Here is what that looks like.',
    sections: [
      {
        heading: 'Week 1: Stabilize and reposition',
        body: 'Update your resume and LinkedIn to reflect your strongest, most current work first. Get a resume audit before you start applying broadly — fixing positioning issues after 50 applications is much more expensive than fixing them before application 1.',
      },
      {
        heading: 'Week 2-3: Build a real pipeline, not a pile of applications',
        body: 'Track every application, its status, and follow-up dates. Layoffs create urgency, but urgency without structure leads to burnout and inconsistent outreach — a simple tracker changes that.',
      },
      {
        heading: 'Week 4 and beyond: Interview readiness compounds',
        body: 'Mock interviews matter more than usual after a layoff, since confidence and articulation are often the first things affected. Practicing your layoff narrative (why you\'re on the market) is as important as practicing technical rounds.',
      },
    ],
    faqs: [
      {
        question: 'How do I explain a layoff in interviews without it hurting my chances?',
        answer: 'Be brief, factual, and forward-looking: state that it was a company-wide/team-wide reduction (if true), and pivot quickly to what you\'re looking for next. Over-explaining raises more questions than it answers.',
      },
      {
        question: 'Should I take the first offer I get after a layoff?',
        answer: 'Not automatically — but do weigh urgency honestly. A structured pipeline with multiple parallel conversations gives you leverage to make that decision from a position of choice rather than panic.',
      },
    ],
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-switch-copilot',
  },
  {
    slug: 'ats-resume-checker-india',
    metaTitle: 'ATS Resume Checker India | Skillsurger',
    metaDescription:
      'Check your resume for ATS compatibility issues — formatting, keyword gaps, and structure problems common in Indian tech job applications.',
    keywords: 'ATS resume checker India, ATS score resume, resume scanner India, ATS friendly resume',
    breadcrumbLabel: 'ATS Resume Checker',
    h1: 'ATS Resume Checker for Indian Tech Job Applications',
    intro:
      'Applicant Tracking Systems reject a large share of qualified resumes purely on formatting and keyword mismatch — before a recruiter ever opens them. Here is what actually breaks ATS parsing, and how to check your own resume for these issues.',
    sections: [
      {
        heading: 'Formatting issues that break ATS parsing',
        body: 'Multi-column layouts, text inside images or tables, non-standard section headings, and unusual fonts can all cause an ATS to misread or drop content entirely — even if the resume looks polished to a human eye.',
      },
      {
        heading: 'Keyword matching, not keyword stuffing',
        body: 'ATS scoring compares your resume\'s language against the job description\'s language. The fix isn\'t cramming keywords in a hidden block — it\'s naturally mirroring the terminology the job description already uses.',
      },
      {
        heading: 'What a good ATS score actually predicts',
        body: 'A high ATS score means your resume is more likely to reach a human reviewer — it does not replace strong positioning and quantified impact once it gets there. Both matter.',
      },
    ],
    faqs: [
      {
        question: 'Can I check my resume\'s ATS score for free?',
        answer: 'Yes — Skillsurger\'s free resume audit includes an ATS compatibility check alongside role-fit and keyword-gap analysis.',
      },
      {
        question: 'Do all companies in India use ATS software?',
        answer: 'Most mid-size and large tech companies do, especially for high-volume roles. Startups and smaller teams are more likely to have a human read every resume directly, but ATS-friendly formatting rarely hurts either way.',
      },
    ],
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
];
