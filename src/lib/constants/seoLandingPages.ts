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
  {
    slug: 'cloud-engineer-resume',
    metaTitle: 'Cloud Engineer Resume Guide India | Skillsurger',
    metaDescription:
      'Build a stronger cloud engineer resume with AWS/Azure/GCP keywords, migration examples, cost-optimization framing, and job-switch guidance.',
    keywords: 'cloud engineer resume, AWS resume India, cloud architect resume, GCP resume India',
    breadcrumbLabel: 'Cloud Engineer Resume',
    h1: 'Cloud Engineer Resume Guide for Indian Tech Professionals',
    intro:
      'Cloud engineer resumes are judged on the scale and business impact of what you migrated, secured, or optimized — not just which certifications you hold. Here is how to position cloud experience so it reads as ownership, not a tool list.',
    sections: [
      {
        heading: 'Lead with migration and cost outcomes',
        body: 'Cloud hiring managers look for concrete outcomes: what you migrated, how much downtime was avoided, and how much cost was saved through right-sizing, reserved instances, or architecture changes.',
      },
      {
        heading: 'Show security and architecture judgement, not just tool usage',
        body: 'Listing "AWS, Azure, GCP" says little on its own. Pairing it with a decision you made — a security posture fix, a multi-region design trade-off — shows judgement, which is what senior cloud roles actually screen for.',
      },
      {
        heading: 'Certifications help, but do not replace production experience',
        body: 'Certifications are useful for passing initial ATS/recruiter screens, especially without a referral. In interviews, though, real production incidents and architecture decisions carry far more weight than the badge itself.',
      },
    ],
    faqs: [
      {
        question: 'Do I need a specific cloud certification to switch into a cloud engineering role?',
        answer: 'Not strictly, but a relevant certification (AWS Solutions Architect, Azure Administrator, etc.) can help you pass initial screens if you lack a strong referral network — it should support, not replace, real project experience on your resume.',
      },
      {
        question: 'How do I show cloud impact if I worked on a shared platform team?',
        answer: 'Scope your resume bullets to your specific contribution ("Led the migration of X workload" or "Reduced cost for the storage layer by Y%") rather than claiming ownership of the entire platform.',
      },
    ],
    relatedRoleTrackId: 'cloud-engineer',
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'ai-ml-engineer-resume',
    metaTitle: 'AI/ML Engineer Resume Guide India | Skillsurger',
    metaDescription:
      'Improve your AI/ML engineer resume with production-impact framing, MLOps keywords, model deployment examples, and job-switch guidance.',
    keywords: 'AI ML engineer resume, machine learning resume India, MLOps resume, LLM engineer resume',
    breadcrumbLabel: 'AI/ML Engineer Resume',
    h1: 'AI/ML Engineer Resume Guide for Indian Tech Professionals',
    intro:
      'AI/ML resumes are increasingly judged on production impact, not just model accuracy in a notebook. Here is how to frame ML work so it reads as engineering impact to both ATS systems and hiring panels.',
    sections: [
      {
        heading: 'Production impact beats offline metrics',
        body: 'A model with 92% accuracy that never shipped is worth less on a resume than a simpler model that shipped and moved a real business metric. Lead with the shipped outcome, then the technical approach.',
      },
      {
        heading: 'MLOps and deployment keywords matter as much as modeling',
        body: 'Terms like model deployment, monitoring, retraining pipelines, and MLOps signal that you can own a model through its full lifecycle, not just the research phase — increasingly what companies screen for.',
      },
      {
        heading: 'Be specific about your role on the ML lifecycle',
        body: 'Data pipeline work, model training, evaluation, and deployment are often split across a team. State clearly which parts you owned so interviewers can calibrate their questions and your resume reads as precise, not inflated.',
      },
    ],
    faqs: [
      {
        question: 'Do I need LLM-specific experience to be competitive right now?',
        answer: 'It helps for certain roles, but strong fundamentals in production ML systems, deployment, and monitoring remain valuable even without direct LLM project experience — frame transferable skills clearly.',
      },
      {
        question: 'How do I resume-position a mostly research-focused ML background?',
        answer: 'Highlight any experiments that influenced a real decision or shipped feature, and be upfront in interviews about your production-engineering gaps so the conversation can focus on how you would close them.',
      },
    ],
    relatedRoleTrackId: 'ai-ml-engineer',
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'product-manager-resume',
    metaTitle: 'Product Manager Resume Guide India | Skillsurger',
    metaDescription:
      'Build a stronger product manager resume with outcome-driven bullet points, metrics framing, and job-switch guidance for Indian tech PMs.',
    keywords: 'product manager resume India, PM resume guide, product management resume examples',
    breadcrumbLabel: 'Product Manager Resume',
    h1: 'Product Manager Resume Guide for Indian Tech Professionals',
    intro:
      'PM resumes are frequently too feature-list-heavy and too metric-light. Here is how to restructure a PM resume so it reads as outcomes owned, not just features shipped.',
    sections: [
      {
        heading: 'Every bullet point should have a number attached',
        body: 'Adoption rate, retention lift, revenue impact, time saved — a PM resume without metrics reads as a project list, not a track record. If a metric genuinely is not available, describe the qualitative outcome instead of omitting impact entirely.',
      },
      {
        heading: 'Show the full loop: research to roadmap to result',
        body: 'Strong PM resumes show the connective tissue — what user research or data led to a roadmap decision, and what happened after it shipped. This is what "product sense" interview rounds are actually probing for.',
      },
      {
        heading: 'Cross-functional leadership is a resume line, not just a soft skill',
        body: 'Describe specifically how you aligned engineering, design, and business stakeholders on a contested decision — this is often the differentiator between mid-level and senior PM resumes.',
      },
    ],
    faqs: [
      {
        question: 'How do I quantify impact if my product does not have clean analytics?',
        answer: 'Use the best directional indicator you have (support ticket volume, sales team feedback, qualitative user research themes) and be transparent about its limitations rather than fabricating a precise number.',
      },
      {
        question: 'Should a PM resume be different for a growth PM role vs a platform PM role?',
        answer: 'Yes — a growth PM resume should foreground experimentation and funnel metrics, while a platform PM resume should foreground reliability, developer experience, and cross-team enablement metrics.',
      },
    ],
    relatedRoleTrackId: 'product-manager',
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'business-analyst-resume',
    metaTitle: 'Business Analyst Resume Guide India | Skillsurger',
    metaDescription:
      'Improve your business analyst resume with SQL/analytics keywords, quantified impact examples, and job-switch guidance for Indian professionals.',
    keywords: 'business analyst resume India, BA resume guide, data analyst resume India',
    breadcrumbLabel: 'Business Analyst Resume',
    h1: 'Business Analyst Resume Guide for Indian Tech Professionals',
    intro:
      'Business analyst resumes often list tools and responsibilities without showing the business impact behind them. Here is how to lead with outcomes so your resume stands out to both ATS systems and hiring managers.',
    sections: [
      {
        heading: 'Quantify the business impact of your analysis',
        body: 'Time saved through a process change, cost reduced through a dashboard-driven decision, or revenue influenced by an insight — these are the numbers that separate a strong BA resume from a task list.',
      },
      {
        heading: 'SQL and analytics tool fluency should show through outcomes',
        body: 'Instead of just listing SQL, Excel, or Tableau, tie them to specific outputs: "Built a SQL-based reporting pipeline that replaced 10 hours/week of manual reporting."',
      },
      {
        heading: 'Stakeholder management is a skill worth demonstrating, not just naming',
        body: 'Describe a specific instance of aligning conflicting stakeholder requirements or pushing back on a flawed request — this signals judgement that generic "stakeholder management" bullet points do not.',
      },
    ],
    faqs: [
      {
        question: 'Is a business analyst resume different from a data analyst resume?',
        answer: 'They overlap significantly, but BA resumes should lean more on stakeholder communication and requirements gathering, while data analyst resumes should lean more on technical analysis depth and tooling.',
      },
      {
        question: 'How technical does a BA resume need to be for tech companies?',
        answer: 'Tech company BA roles increasingly expect solid SQL and dashboarding skills — highlight these clearly alongside your business-facing skills rather than assuming they are implied.',
      },
    ],
    relatedRoleTrackId: 'business-analyst',
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'software-engineer-mock-interview',
    metaTitle: 'Software Engineer Mock Interview Prep | Skillsurger',
    metaDescription:
      'Prepare for software engineer interviews with structured mock interview practice covering DSA, low-level design, and system design rounds.',
    keywords: 'software engineer mock interview, SDE interview practice India, coding interview prep',
    breadcrumbLabel: 'Software Engineer Mock Interview',
    h1: 'Software Engineer Mock Interview Preparation',
    intro:
      'Most software engineers prepare for interviews by solving problems alone, then feel blindsided by how different it is to explain their thinking out loud under time pressure. Structured mock interview practice closes that gap.',
    sections: [
      {
        heading: 'What a software engineer mock interview actually tests',
        body: 'Beyond correctness, interviewers are evaluating how you communicate trade-offs, how you handle a hint without shutting down, and whether your code quality holds up under time pressure — none of which solo practice alone builds.',
      },
      {
        heading: 'DSA, low-level design, and system design need different practice',
        body: 'A DSA round rewards clean problem decomposition and complexity analysis; a system design round rewards structured trade-off discussions. Practicing both formats separately matters more than solving more problems of one type.',
      },
      {
        heading: 'Feedback is what makes mock practice compound',
        body: 'Practicing without structured feedback on communication, pacing, and gaps tends to repeat the same mistakes. A short, specific feedback loop after each mock session is what actually improves interview performance over 2-3 weeks.',
      },
    ],
    faqs: [
      {
        question: 'How many mock interviews should I do before a real interview loop?',
        answer: 'Most candidates see meaningful improvement after 3-5 structured mock sessions covering a mix of DSA and system design, spaced a few days apart so feedback can actually be applied.',
      },
      {
        question: 'Is mock interview practice useful for experienced engineers, not just freshers?',
        answer: 'Yes — experienced engineers often struggle more with system design communication and staying structured under pressure than with raw problem-solving, both of which mock practice directly targets.',
      },
    ],
    relatedRoleTrackId: 'software-engineer',
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-switch-copilot',
  },
  {
    slug: 'system-design-interview-prep',
    metaTitle: 'System Design Interview Prep | Skillsurger',
    metaDescription:
      'Prepare for system design interview rounds with a structured approach to trade-offs, scalability, and communication for senior tech roles.',
    keywords: 'system design interview prep, system design interview India, senior engineer interview prep',
    breadcrumbLabel: 'System Design Interview Prep',
    h1: 'System Design Interview Preparation for Senior Tech Roles',
    intro:
      'System design rounds are less about memorizing architectures and more about how you reason through ambiguity, trade-offs, and scale under time pressure. Here is how to prepare for that specifically.',
    sections: [
      {
        heading: 'Structure beats memorized architectures',
        body: 'Interviewers are wary of candidates who recite a memorized design regardless of the prompt. A clear structure — requirements, back-of-envelope estimation, high-level design, then deep dives — reads as stronger than a "correct" but rigid answer.',
      },
      {
        heading: 'Trade-off articulation is the actual skill being tested',
        body: 'Every design decision (SQL vs NoSQL, sync vs async, consistency vs availability) should come with a stated trade-off and a reason tied to the specific requirements, not a default answer.',
      },
      {
        heading: 'Practicing out loud under time pressure changes the prep',
        body: 'System design knowledge read from articles does not automatically translate into a structured 45-minute verbal answer. Practicing the format itself — not just the concepts — is what most candidates skip.',
      },
    ],
    faqs: [
      {
        question: 'How much system design knowledge do I need before I start practicing mock rounds?',
        answer: 'Enough to discuss core building blocks (load balancing, caching, databases, queues) at a basic level — mock practice is where you build the structured communication skill on top of that foundation, not before it.',
      },
      {
        question: 'Is system design interview prep only relevant for senior/staff roles?',
        answer: 'It increasingly shows up for mid-level roles too, especially at ₹25L+ compensation bands, so it is worth preparing for even if you are not explicitly targeting a senior title.',
      },
    ],
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-switch-copilot',
  },
  {
    slug: 'notice-period-job-search',
    metaTitle: 'Notice Period Job Search India | Skillsurger',
    metaDescription:
      'A structured approach to job searching during your notice period — resume readiness, discreet applications, and interview scheduling in India.',
    keywords: 'notice period job search India, job search while employed, discreet job search',
    breadcrumbLabel: 'Notice Period Job Search',
    h1: 'Job Search During Your Notice Period: A Structured Approach',
    intro:
      'A notice period gives you a fixed runway and a real reason to move quickly — but also less flexibility for interview scheduling and more need for discretion. Here is how to run a structured search within that constraint.',
    sections: [
      {
        heading: 'Start resume and positioning work on day one of notice',
        body: 'Your notice period clock is running regardless of when you start applying — get your resume audited and tailored immediately so you are not losing weeks to avoidable positioning issues.',
      },
      {
        heading: 'Batch outreach and applications instead of trickling them out',
        body: 'With a fixed timeline, running recruiter outreach and applications in structured weekly batches (rather than ad hoc) gives you a clearer read on what is converting and time to adjust.',
      },
      {
        heading: 'Interview scheduling needs a discreet, realistic plan',
        body: 'Block realistic time windows for interviews in advance (early morning, lunch, evening) rather than scrambling each time a recruiter reaches out — this reduces both stress and the risk of your search becoming visible at your current job.',
      },
    ],
    faqs: [
      {
        question: 'How do I explain being on notice period to a new recruiter?',
        answer: 'Be upfront about your notice period length early in the process — most recruiters and companies plan around it routinely, and surprises late in the process cause more friction than the notice period itself.',
      },
      {
        question: 'Can I negotiate a shorter notice period once I have an offer?',
        answer: 'Sometimes, depending on your contract and how critical your current role is — but treat it as a possibility to explore once you have a signed offer, not something to assume in your search timeline.',
      },
    ],
    primaryCtaLabel: 'Explore Job Switch Copilot',
    primaryCtaHref: '/job-switch-copilot',
  },
  {
    slug: 'resume-review-india',
    metaTitle: 'Resume Review India | Free Resume Feedback | Skillsurger',
    metaDescription:
      'Get a structured resume review covering ATS compatibility, role-fit, keyword gaps, and impact framing for Indian tech professionals.',
    keywords: 'resume review India, free resume feedback India, resume check India',
    breadcrumbLabel: 'Resume Review India',
    h1: 'Resume Review for Indian Tech Professionals',
    intro:
      'A resume review is only useful if it is structured — vague feedback like "make it stronger" does not tell you what to actually change. Here is what a useful resume review covers.',
    sections: [
      {
        heading: 'A real review checks structure, not just wording',
        body: 'Section order, formatting consistency, and ATS-parseable structure matter as much as sentence-level wording — a review that only edits phrasing misses half the problem.',
      },
      {
        heading: 'Keyword and role-fit gaps need to be explicit',
        body: 'A useful review names the specific keywords missing for your target role and scores how well your current resume fits that role, rather than giving generic "looks good" feedback.',
      },
      {
        heading: 'Impact framing is usually the biggest gap',
        body: 'Most resumes that "look fine" still describe responsibilities instead of outcomes. A good review flags exactly which bullet points need a number or outcome attached, and why.',
      },
    ],
    faqs: [
      {
        question: 'Is resume review the same as a resume audit?',
        answer: 'They overlap — Skillsurger\'s free resume audit is a structured resume review covering ATS compatibility, role-fit, keyword gaps, and impact framing, delivered as a prioritized action plan.',
      },
      {
        question: 'How long does a resume review take?',
        answer: 'Submitting your resume for audit takes a few minutes; turnaround for the review itself depends on current volume, and you will be notified once it is ready.',
      },
    ],
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
  {
    slug: 'career-coach-for-tech-professionals',
    metaTitle: 'Career Coach for Tech Professionals India | Skillsurger',
    metaDescription:
      'Structured career coaching for Indian tech professionals switching roles — resume, positioning, outreach, and interview readiness in one system.',
    keywords: 'career coach for tech professionals, tech career coaching India, career diagnosis call',
    breadcrumbLabel: 'Career Coach for Tech Professionals',
    h1: 'Career Coaching for Indian Tech Professionals Switching Roles',
    intro:
      'Generic career coaching often stays at the level of motivation and general advice. Tech professionals switching roles usually need something more specific: a structured diagnosis of what is actually blocking their search.',
    sections: [
      {
        heading: 'A career diagnosis starts with what is not working',
        body: 'Instead of generic advice, a useful diagnosis looks at your resume, target roles, application volume, and callback rate together to identify the specific bottleneck — positioning, targeting, or outreach.',
      },
      {
        heading: 'Coaching works best paired with a structured system',
        body: 'Advice without a resume audit, tracking system, and outreach templates behind it is hard to act on consistently. Skillsurger pairs a diagnosis call with the tools to actually execute on it.',
      },
      {
        heading: 'This is not a placement agency',
        body: 'A career coach helps you get better at running your own job search — resume, positioning, outreach, interview readiness. It is not a recruiter finding you a job or guaranteeing an outcome.',
      },
    ],
    faqs: [
      {
        question: 'What happens on a career diagnosis call?',
        answer: 'A focused 20-30 minute conversation covering your target roles, current resume/positioning gaps, and what is actually blocking callbacks, followed by a short plan for next steps.',
      },
      {
        question: 'Is this different from a placement consultant?',
        answer: 'Yes — Skillsurger is not a placement agency and does not find or guarantee jobs. It is a structured system and coaching process to improve how you run your own job search.',
      },
    ],
    primaryCtaLabel: 'Book Career Diagnosis',
    primaryCtaHref: '/book-a-call',
  },
  {
    slug: 'linkedin-profile-optimization-india',
    metaTitle: 'LinkedIn Profile Optimization India | Skillsurger',
    metaDescription:
      'Optimize your LinkedIn profile for recruiter search visibility, with headline, summary, and experience section guidance for Indian tech professionals.',
    keywords: 'LinkedIn profile optimization India, LinkedIn resume India, LinkedIn headline tech',
    breadcrumbLabel: 'LinkedIn Profile Optimization',
    h1: 'LinkedIn Profile Optimization for Indian Tech Professionals',
    intro:
      'Most LinkedIn profiles are written like a static resume copy-paste, not optimized for how recruiters actually search and skim. Here is what to fix first.',
    sections: [
      {
        heading: 'Your headline is a search-ranking field, not just a title',
        body: 'LinkedIn recruiter search weighs headline keywords heavily. A headline of just your current title misses target-role keywords that would otherwise surface your profile in relevant searches.',
      },
      {
        heading: 'The About section should be skimmable, not a wall of text',
        body: 'Recruiters skim the first 2-3 lines before deciding to expand. Lead with your role, years of experience, and specialization, not a generic opening sentence.',
      },
      {
        heading: 'Experience section keywords should mirror your target role',
        body: 'Align the language in your experience bullet points with how your target roles are described in job postings — this is what determines whether you surface in a recruiter\'s keyword search at all.',
      },
    ],
    faqs: [
      {
        question: 'Should my LinkedIn profile match my resume exactly?',
        answer: 'They should be consistent in facts (titles, dates, companies) but do not need identical wording — LinkedIn can be slightly more narrative, while your resume stays tightly bullet-pointed.',
      },
      {
        question: 'Does an incomplete LinkedIn profile actually hurt my job search?',
        answer: 'Yes — recruiters increasingly source candidates directly through LinkedIn search, so a sparse or outdated profile can mean you are invisible to searches you would otherwise match.',
      },
    ],
    primaryCtaLabel: 'Get a Free Resume Audit',
    primaryCtaHref: '/free-resume-audit',
  },
];
