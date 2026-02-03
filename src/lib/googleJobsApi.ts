// Google Jobs Search API integration
export interface GoogleJobResult {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: string;
  applicationUrl: string;
  postedDate: string;
  isRemote: boolean;
  source: string;
  jobType: string;
}

export interface GoogleJobsSearchParams {
  query: string;
  location?: string;
  datePosted?: 'today' | 'week' | 'month';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: 'entry' | 'mid' | 'senior';
  countryCode?: string; // Add country code for Adzuna API
}

// Adzuna API configuration
const ADZUNA_APP_ID = 'bc6ab312';
const ADZUNA_APP_KEY = '07b1159c2bab8b3afd604c99e011e558';

// Country code mapping for Adzuna API
const ADZUNA_COUNTRY_CODES = {
  'us': 'us',
  'uk': 'gb',
  'in': 'in',
  'au': 'au',
  'ca': 'ca',
  'de': 'de',
  'fr': 'fr',
  'es': 'es',
  'it': 'it',
  'nl': 'nl',
  'br': 'br',
  'mx': 'mx',
  'jp': 'jp',
  'kr': 'kr',
  'sg': 'sg'
};

// Google Custom Search API configuration
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

import { getJobTitleSynonymsWithOpenAI } from './openai';

export function isGoogleJobsConfigured(): boolean {
  return !!(GOOGLE_API_KEY && GOOGLE_SEARCH_ENGINE_ID && 
           GOOGLE_API_KEY !== 'your_google_api_key' && 
           GOOGLE_SEARCH_ENGINE_ID !== 'your_search_engine_id');
}

export async function searchGoogleJobs(params: GoogleJobsSearchParams): Promise<GoogleJobResult[]> {
  // If country code is provided, try Adzuna API first
  if (params.countryCode && ADZUNA_COUNTRY_CODES[params.countryCode as keyof typeof ADZUNA_COUNTRY_CODES]) {
    try {
      console.log(`Searching Adzuna API for country: ${params.countryCode}`);
      let adzunaResults = await searchAdzunaJobs(params);
      if (adzunaResults.length > 0) {
        console.log(`Found ${adzunaResults.length} jobs from Adzuna API`);
        return adzunaResults;
      } else {
        // No results, try synonyms
        console.log('No results from Adzuna API, trying synonyms with OpenAI...');
        const synonyms = await getJobTitleSynonymsWithOpenAI(params.query);
        let allResults: GoogleJobResult[] = [];
        for (const synonym of synonyms) {
          if (synonym.toLowerCase() === params.query.toLowerCase()) continue;
          const synonymParams = { ...params, query: synonym };
          try {
            const synonymResults = await searchAdzunaJobs(synonymParams);
            allResults = allResults.concat(synonymResults);
          } catch (e) {
            // ignore errors for individual synonym calls
          }
        }
        // Deduplicate by title+company
        const seen = new Set<string>();
        const deduped = allResults.filter(job => {
          const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (deduped.length > 0) {
          console.log(`Found ${deduped.length} jobs from Adzuna API using synonyms`);
          return deduped;
        }
        console.log('No results from Adzuna API even after synonyms, falling back to Google Jobs');
      }
    } catch (error) {
      console.warn('Adzuna API failed, falling back to Google Jobs:', error);
    }
  }

  // Only try Google Jobs API if Adzuna failed or no country code provided
  if (!isGoogleJobsConfigured()) {
    console.warn('Google Jobs API not configured. Using fallback job generation.');
    return generateFallbackGoogleJobs(params);
  }

  try {
    console.log('Searching Google Jobs API as fallback');
    // Build search query
    let searchQuery = `${params.query} jobs`;
    
    if (params.location && !params.remoteOnly) {
      searchQuery += ` in ${params.location}`;
    }
    
    if (params.remoteOnly) {
      searchQuery += ' remote';
    }
    
    if (params.jobType) {
      searchQuery += ` ${params.jobType.replace('-', ' ')}`;
    }
    
    if (params.experienceLevel) {
      searchQuery += ` ${params.experienceLevel} level`;
    }

    // Add site-specific searches for better results
    const jobSites = [
      'site:linkedin.com/jobs',
      'site:indeed.com',
      'site:glassdoor.com',
      'site:monster.com',
      'site:ziprecruiter.com',
      'site:simplyhired.com'
    ];

    const results: GoogleJobResult[] = [];

    // Search multiple job sites
    for (const site of jobSites.slice(0, 3)) { // Limit to 3 sites to avoid rate limits
      try {
        const siteQuery = `${searchQuery} ${site}`;
        const searchResults = await performGoogleSearch(siteQuery, params);
        results.push(...searchResults);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Error searching ${site}:`, error);
        continue;
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = removeDuplicateJobs(results);
    return uniqueResults.slice(0, 10); // Return top 10 results

  } catch (error) {
    console.error('Error searching Google Jobs:', error);
    return generateFallbackGoogleJobs(params);
  }
}

async function performGoogleSearch(query: string, params: GoogleJobsSearchParams): Promise<GoogleJobResult[]> {
  const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
  searchUrl.searchParams.set('key', GOOGLE_API_KEY!);
  searchUrl.searchParams.set('cx', GOOGLE_SEARCH_ENGINE_ID!);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('num', '10');
  
  // Add date filter
  if (params.datePosted) {
    const dateMap = {
      'today': 'd1',
      'week': 'w1',
      'month': 'm1'
    };
    searchUrl.searchParams.set('dateRestrict', dateMap[params.datePosted]);
  }

  const response = await fetch(searchUrl.toString());
  
  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.items) {
    return [];
  }

  return data.items.map((item: any) => parseGoogleSearchResult(item, params));
}

function parseGoogleSearchResult(item: any, params: GoogleJobsSearchParams): GoogleJobResult {
  const title = extractJobTitle(item.title);
  const company = extractCompany(item.title, item.snippet);
  const location = extractLocation(item.snippet, params.location);
  const description = cleanDescription(item.snippet);
  const requirements = extractRequirements(item.snippet);
  const salary = extractSalary(item.snippet);
  const postedDate = extractPostedDate(item.snippet);
  const isRemote = checkIfRemote(item.title, item.snippet);
  
  return {
    title,
    company,
    location: location || params.location || 'Location not specified',
    description,
    requirements,
    salary,
    applicationUrl: item.link,
    postedDate,
    isRemote,
    source: extractSource(item.link),
    jobType: 'Full-time'
  };
}

function extractJobTitle(title: string): string {
  // Remove common job site suffixes
  const cleanTitle = title
    .replace(/\s*-\s*(LinkedIn|Indeed|Glassdoor|Monster|ZipRecruiter|SimplyHired).*$/i, '')
    .replace(/\s*\|\s*.*$/i, '')
    .replace(/\s*at\s+.*$/i, '')
    .trim();
  
  return cleanTitle || 'Job Opportunity';
}

function extractCompany(title: string, snippet: string): string {
  // Try to extract company from title (usually after "at")
  const titleMatch = title.match(/\bat\s+([^-|]+)/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Try to extract from snippet
  const snippetMatch = snippet.match(/(?:Company|Employer|Organization):\s*([^.]+)/i);
  if (snippetMatch) {
    return snippetMatch[1].trim();
  }
  
  // Look for common company patterns
  const companyPatterns = [
    /([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Systems|Solutions))/,
    /([A-Z][a-zA-Z\s&]{2,20})\s+is\s+(?:hiring|looking|seeking)/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'Company not specified';
}

function extractLocation(snippet: string, defaultLocation?: string): string {
  // Look for location patterns
  const locationPatterns = [
    /(?:Location|Based in|Located in):\s*([^.]+)/i,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /(Remote|Work from home|Telecommute)/i,
    /([A-Z][a-zA-Z\s]+,\s*(?:USA|United States|US))/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return defaultLocation || 'Location not specified';
}

function cleanDescription(snippet: string): string {
  // Clean up the snippet to make it more readable
  return snippet
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?()-]/g, '')
    .trim()
    .substring(0, 300) + (snippet.length > 300 ? '...' : '');
}

function extractRequirements(snippet: string): string[] {
  const requirements: string[] = [];
  
  // Look for common requirement patterns
  const requirementPatterns = [
    /(?:Requirements?|Qualifications?|Skills?):\s*([^.]+)/i,
    /(?:Must have|Required|Need):\s*([^.]+)/i,
    /(\d+\+?\s*years?\s+(?:of\s+)?experience)/i,
    /(Bachelor'?s?\s+degree)/i,
    /(Master'?s?\s+degree)/i,
    /(?:Experience with|Knowledge of|Proficiency in)\s+([^.]+)/i
  ];
  
  for (const pattern of requirementPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      requirements.push(match[1].trim());
    }
  }
  
  // Add some default requirements if none found
  if (requirements.length === 0) {
    requirements.push(
      'Relevant experience in the field',
      'Strong communication skills',
      'Team collaboration abilities'
    );
  }
  
  return requirements.slice(0, 5); // Limit to 5 requirements
}

function extractSalary(snippet: string): string | undefined {
  // Look for salary patterns
  const salaryPatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+year|annually|\/year)/i,
    /(\d{1,3}(?:,\d{3})*)\s*(?:-|to)\s*(\d{1,3}(?:,\d{3})*)\s*(?:USD|dollars)/i
  ];
  
  for (const pattern of salaryPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      if (match[2]) {
        return `$${match[1]} - $${match[2]}`;
      } else {
        return `$${match[1]}`;
      }
    }
  }
  
  return undefined;
}

function extractPostedDate(snippet: string): string {
  // Look for date patterns
  const datePatterns = [
    /(?:Posted|Published|Listed)\s+(\d{1,2})\s+days?\s+ago/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/
  ];
  
  for (const pattern of datePatterns) {
    const match = snippet.match(pattern);
    if (match) {
      if (match[0].includes('days ago')) {
        const daysAgo = parseInt(match[1]);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
      } else {
        return match[1];
      }
    }
  }
  
  // Default to recent date
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // 0-7 days ago
  return date.toISOString().split('T')[0];
}

function checkIfRemote(title: string, snippet: string): boolean {
  const remoteKeywords = /remote|work from home|telecommute|distributed|anywhere/i;
  return remoteKeywords.test(title) || remoteKeywords.test(snippet);
}

function extractSource(url: string): string {
  try {
    const domain = new URL(url).hostname;
    if (domain.includes('linkedin.com')) return 'LinkedIn';
    if (domain.includes('indeed.com')) return 'Indeed';
    if (domain.includes('glassdoor.com')) return 'Glassdoor';
    if (domain.includes('monster.com')) return 'Monster';
    if (domain.includes('ziprecruiter.com')) return 'ZipRecruiter';
    if (domain.includes('simplyhired.com')) return 'SimplyHired';
    return domain;
  } catch {
    return 'Unknown';
  }
}

function removeDuplicateJobs(jobs: GoogleJobResult[]): GoogleJobResult[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Fallback function for when Google Jobs API is not available
export function generateFallbackGoogleJobs(params: GoogleJobsSearchParams): GoogleJobResult[] {
  console.log('Using fallback job generation for Google Jobs API', params);
  
  // This would use the existing realistic job generation logic
  // but formatted to match GoogleJobResult interface
  return [
    {
      title: `Software Engineer, ${params.query}`,
      company: 'Tech Solutions Inc.',
      location: params.location || 'Remote',
      description: 'Seeking a skilled software engineer to build and maintain scalable software solutions. Experience with React and Node.js preferred.',
      requirements: ['3+ years of experience in software development', 'Proficiency in JavaScript', 'Experience with cloud platforms (AWS, GCP, Azure)'],
      salary: '$120,000 - $160,000',
      applicationUrl: 'https://www.linkedin.com/jobs/',
      postedDate: new Date().toISOString().split('T')[0],
      isRemote: params.remoteOnly || (params.location || '').toLowerCase() === 'remote',
      source: 'LinkedIn (Fallback)',
      jobType: 'Full-time'
    },
    {
      title: `Product Manager, ${params.query}`,
      company: 'Innovate Co.',
      location: params.location || 'New York, NY',
      description: 'Join our team to lead the development of innovative products. Strong technical background and communication skills required.',
      requirements: ['5+ years of product management experience', 'Experience with Agile methodologies', 'Strong analytical skills'],
      salary: '$140,000 - $180,000',
      applicationUrl: 'https://www.indeed.com/jobs',
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
      isRemote: params.remoteOnly || false,
      source: 'Indeed (Fallback)',
      jobType: 'Full-time'
    }
  ];
}

// Adzuna API integration
async function searchAdzunaJobs(params: GoogleJobsSearchParams): Promise<GoogleJobResult[]> {
  const countryCode = ADZUNA_COUNTRY_CODES[params.countryCode as keyof typeof ADZUNA_COUNTRY_CODES];
  if (!countryCode) {
    throw new Error(`Unsupported country code: ${params.countryCode}`);
  }

  const searchUrl = new URL(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`);
  searchUrl.searchParams.set('app_id', ADZUNA_APP_ID);
  searchUrl.searchParams.set('app_key', ADZUNA_APP_KEY);
  searchUrl.searchParams.set('what', params.query);
  
  // Add location if provided
  if (params.location) {
    console.log(`Setting Adzuna location parameter: ${params.location}`);
    searchUrl.searchParams.set('where', params.location);
  } else {
    console.log('No location provided for Adzuna search');
  }
  
  // Add job type filter
  if (params.jobType) {
    const jobTypeMap = {
      'full-time': 'full_time',
      'part-time': 'part_time',
      'contract': 'contract',
      'internship': 'internship'
    };
    const adzunaJobType = jobTypeMap[params.jobType as keyof typeof jobTypeMap];
    if (adzunaJobType) {
      searchUrl.searchParams.set('contract_type', adzunaJobType);
    }
  }

  try {
    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((job: any) => parseAdzunaJobResult(job, countryCode));

  } catch (error) {
    console.error('Error searching Adzuna Jobs:', error);
    throw error;
  }
}

function parseAdzunaJobResult(job: any, countryCode: string): GoogleJobResult {
  const title = job.title || 'Job Opportunity';
  const company = job.company?.display_name || 'Company not specified';
  const location = job.location?.display_name || 'Location not specified';
  const description = cleanAdzunaDescription(job.description || '');
  const requirements = extractAdzunaRequirements(job.description || '');
  const salary = extractAdzunaSalary(job);
  const postedDate = job.created ? new Date(job.created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const isRemote = checkIfAdzunaRemote(job);
  const jobType = extractAdzunaJobType(job);
  
  return {
    title,
    company,
    location,
    description,
    requirements,
    salary,
    applicationUrl: job.redirect_url || `https://www.adzuna.${countryCode}/jobs`,
    postedDate,
    isRemote,
    source: 'Adzuna',
    jobType: jobType
  };
}

function cleanAdzunaDescription(description: string): string {
  // Clean up the description and remove HTML entities and unicode escapes
  return description
    .replace(/\\u[0-9a-fA-F]{4}/g, '') // Remove unicode escapes
    .replace(/\\n/g, ' ') // Replace newlines with spaces
    .replace(/\\r/g, ' ') // Replace carriage returns with spaces
    .replace(/\\"/g, '"') // Replace escaped quotes
    .replace(/\\'/g, "'") // Replace escaped apostrophes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?()-]/g, '') // Remove special characters but keep basic punctuation
    .trim();
}

function extractAdzunaRequirements(description: string): string[] {
  const requirements: string[] = [];
  
  // Look for common requirement patterns in Adzuna job descriptions
  const requirementPatterns = [
    /(?:Requirements?|Qualifications?|Skills?):\s*([^.]+)/i,
    /(?:Must have|Required|Need):\s*([^.]+)/i,
    /(\d+\+?\s*years?\s+(?:of\s+)?experience)/i,
    /(Bachelor'?s?\s+degree)/i,
    /(Master'?s?\s+degree)/i,
    /(?:Experience with|Knowledge of|Proficiency in)\s+([^.]+)/i,
    /(?:Looking for|Seeking)\s+([^.]+)/i,
    /(?:Experience|Exp):\s*(\d+\+?\s*years?)/i,
    /(?:Location|Based in|Located in):\s*([^.]+)/i,
    /(?:About|Company|Organization):\s*([^.]+)/i
  ];
  
  for (const pattern of requirementPatterns) {
    const match = description.match(pattern);
    if (match) {
      const requirement = match[1].trim();
      // Only add if it's not already in the list and is meaningful
      if (requirement.length > 3 && !requirements.includes(requirement)) {
        requirements.push(requirement);
      }
    }
  }
  
  // Extract specific technologies/skills mentioned
  const techPatterns = [
    /(?:JavaScript|JS|React|Vue|Angular|Node\.js|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|TypeScript|HTML|CSS|SQL|MongoDB|PostgreSQL|MySQL|AWS|Azure|GCP|Docker|Kubernetes|Git|Agile|Scrum)/gi
  ];
  
  for (const pattern of techPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const tech = match.trim();
        if (tech.length > 2 && !requirements.includes(tech)) {
          requirements.push(tech);
        }
      });
    }
  }
  
  // Add some default requirements if none found
  if (requirements.length === 0) {
    requirements.push(
      'Relevant experience in the field',
      'Strong communication skills',
      'Team collaboration abilities'
    );
  }
  
  return requirements.slice(0, 5); // Limit to 5 requirements
}

function extractAdzunaSalary(job: any): string | undefined {
  // Adzuna might have salary information in different fields
  if (job.salary_min && job.salary_max) {
    return `${job.salary_min} - ${job.salary_max}`;
  } else if (job.salary_min) {
    return `${job.salary_min}+`;
  } else if (job.salary_max) {
    return `Up to ${job.salary_max}`;
  }
  
  // Check if salary is predicted
  if (job.salary_is_predicted === "1") {
    return "Salary information available";
  }
  
  return undefined;
}

function checkIfAdzunaRemote(job: any): boolean {
  const remoteKeywords = /remote|work from home|telecommute|distributed|anywhere/i;
  const title = job.title || '';
  const description = job.description || '';
  const location = job.location?.display_name || '';
  
  return remoteKeywords.test(title) || 
         remoteKeywords.test(description) || 
         remoteKeywords.test(location);
}

function extractAdzunaJobType(job: any): string {
  // Check for contract_type in the job data
  if (job.contract_type) {
    const typeMap: { [key: string]: string } = {
      'full_time': 'Full-time',
      'part_time': 'Part-time',
      'contract': 'Contract',
      'internship': 'Internship',
      'temporary': 'Temporary'
    };
    return typeMap[job.contract_type] || 'Full-time';
  }
  
  // Try to extract from description
  const description = (job.description || '').toLowerCase();
  if (description.includes('part-time') || description.includes('part time')) {
    return 'Part-time';
  } else if (description.includes('contract') || description.includes('freelance')) {
    return 'Contract';
  } else if (description.includes('internship') || description.includes('intern')) {
    return 'Internship';
  } else if (description.includes('temporary') || description.includes('temp')) {
    return 'Temporary';
  }
  
  return 'Full-time'; // Default
}