import { reportError } from './safeLogging';
import { supabase } from './supabase';
import { openai, isOpenAIConfigured } from './openaiConfig';
import axios from 'axios';

import { extractResumeText } from './resumeText';
import { getCVSignedUrl } from './cvStorage';

export async function extractTextFromPdf(file: File): Promise<string> {
  return extractResumeText(file);
}

export async function uploadCV(file: File, userId: string): Promise<string> {
  try {
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Please upload a PDF file only.');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB.');
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) throw new Error('Sign in to upload your own CV.');

    const filePath = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    // Check if any existing CV files
    const { data: existingFiles } = await supabase.storage
      .from('cvs')
      .list(userId);

    // Remove all existing CV files for this user
    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage
        .from('cvs')
        .remove(filesToRemove);
    }

    // Upload new file
    const { data, error } = await supabase.storage
      .from('cvs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf'
      });

    if (error) {
      reportError('pdf', 'operation_failed');
      throw new Error('Failed to upload CV. Please try again.');
    }

    return data.path;
  } catch (error) {
    reportError('pdf', 'operation_failed');
    throw error;
  }
}

export interface ParsedCV {
  years_of_experience: number;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  current_role?: string;
  languages?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

// Enhanced text parsing functions
function extractEmail(text: string): string {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : '';
}

function extractPhone(text: string): string {
  // Enhanced phone regex to catch various formats
  const phonePatterns = [
    /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    /(?:\+?91[-.\s]?)?[6-9]\d{9}/g, // Indian phone numbers
    /(?:\+?44[-.\s]?)?[1-9]\d{8,10}/g, // UK phone numbers
    /(?:\+?\d{1,3}[-.\s]?)?\d{6,14}/g // General international format
  ];
  
  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      return matches[0];
    }
  }
  return '';
}

function extractName(text: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Look for name in the first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip lines that look like contact info or headers
    if (line.includes('@') || 
        line.includes('http') || 
        line.includes('www.') ||
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) ||
        line.toLowerCase().includes('curriculum') ||
        line.toLowerCase().includes('resume') ||
        line.toLowerCase().includes('cv')) {
      continue;
    }
    
    // Look for a line with 2-4 words that could be a name
    const words = line.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 2 && words.length <= 4) {
      // Check if all words look like names (start with capital letter, contain only letters)
      const isValidName = words.every(word => 
        /^[A-Z][a-z]+$/.test(word) || /^[A-Z]\.?$/.test(word)
      );
      
      if (isValidName) {
        return line;
      }
    }
  }
  return '';
}

function extractLocation(text: string): { city: string; state: string; country: string } {
  // Enhanced location patterns
  const locationPatterns = [
    /([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})?/g, // US format: City, ST 12345
    /([A-Za-z\s]+),\s*([A-Za-z\s]+),\s*([A-Za-z\s]+)/g, // City, State, Country
    /([A-Za-z\s]+),\s*([A-Za-z\s]+)/g // City, State/Country
  ];
  
  for (const pattern of locationPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const parts = matches[0].split(',').map(part => part.trim());
      if (parts.length >= 2) {
        return {
          city: parts[0] || '',
          state: parts[1] || '',
          country: parts[2] || (parts[1].length === 2 ? 'USA' : parts[1])
        };
      }
    }
  }
  
  return { city: '', state: '', country: '' };
}

function extractSkills(text: string): string[] {
  const skills: string[] = [];
  
  // Look for skills section
  const skillsSectionMatch = text.match(/(?:SKILLS|TECHNICAL SKILLS|TECHNOLOGIES|COMPETENCIES|EXPERTISE)[\s\S]*?(?=\n[A-Z]{2,}|\n\n|$)/i);
  let skillsText = skillsSectionMatch ? skillsSectionMatch[0] : text;
  
  // Common technical skills patterns
  const skillPatterns = [
    // Programming languages
    /\b(?:JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|Scala|R|MATLAB|Perl|Shell|Bash)\b/gi,
    // Web technologies
    /\b(?:React|Angular|Vue\.?js|Node\.?js|Express|Django|Flask|Spring|Laravel|Rails|ASP\.NET|jQuery|Bootstrap|Tailwind)\b/gi,
    // Databases
    /\b(?:MySQL|PostgreSQL|MongoDB|Redis|SQLite|Oracle|SQL Server|Cassandra|DynamoDB|Firebase)\b/gi,
    // Cloud & DevOps
    /\b(?:AWS|Azure|GCP|Google Cloud|Docker|Kubernetes|Jenkins|Git|GitHub|GitLab|CI\/CD|Terraform|Ansible)\b/gi,
    // Data & Analytics
    /\b(?:Pandas|NumPy|Scikit-learn|TensorFlow|PyTorch|Tableau|Power BI|Excel|Spark|Hadoop|Kafka)\b/gi,
    // Design & Tools
    /\b(?:Figma|Sketch|Adobe|Photoshop|Illustrator|InDesign|Canva|Wireframing|Prototyping)\b/gi,
    // Project Management
    /\b(?:Agile|Scrum|Kanban|Jira|Confluence|Trello|Asana|Monday\.com)\b/gi
  ];
  
  skillPatterns.forEach(pattern => {
    const matches = skillsText.match(pattern);
    if (matches) {
      skills.push(...matches.map(skill => skill.trim()));
    }
  });
  
  // Also look for comma-separated skills
  const commaSkillsMatch = skillsText.match(/(?:Skills?|Technologies?|Tools?):\s*([^.\n]+)/gi);
  if (commaSkillsMatch) {
    commaSkillsMatch.forEach(match => {
      const skillsList = match.replace(/^[^:]+:\s*/, '').split(/[,;|]/);
      skills.push(...skillsList.map(skill => skill.trim()).filter(skill => skill.length > 1));
    });
  }
  
  // Remove duplicates and filter out common words
  const filteredSkills = [...new Set(skills)]
    .filter(skill => skill.length > 1 && !/^(and|or|the|with|in|on|at|for|to|of|a|an)$/i.test(skill))
    .slice(0, 20); // Limit to 20 skills
  
  return filteredSkills;
}

function extractExperience(text: string): Array<{
  title: string;
  company: string;
  duration: string;
  description: string;
}> {
  const experiences: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }> = [];
  
  // Look for experience section
  const experienceMatch = text.match(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|PROFESSIONAL EXPERIENCE)[\s\S]*?(?=\n(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|[A-Z]{2,})|\n\n\n|$)/i);
  if (!experienceMatch) return experiences;
  
  const experienceText = experienceMatch[0];
  
  // Split by potential job entries (look for patterns like "Job Title at Company" or dates)
  const jobEntries = experienceText.split(/\n(?=[A-Z][a-zA-Z\s]+(?:\s+at\s+|\s+@\s+|\s+\|\s+|\s+-\s+)[A-Z])/);
  
  jobEntries.forEach(entry => {
    const lines = entry.split('\n').filter(line => line.trim());
    if (lines.length < 2) return;
    
    const firstLine = lines[0].trim();
    
    // Try to extract title, company, and dates from the first line
    const patterns = [
      /^(.+?)\s+at\s+(.+?)(?:\s+\|\s+|\s+-\s+|\s+\()?(.+?)(?:\)|$)/i,
      /^(.+?)\s+@\s+(.+?)(?:\s+\|\s+|\s+-\s+|\s+\()?(.+?)(?:\)|$)/i,
      /^(.+?)\s+\|\s+(.+?)(?:\s+\|\s+|\s+-\s+|\s+\()?(.+?)(?:\)|$)/i,
      /^(.+?)\s+-\s+(.+?)(?:\s+\|\s+|\s+-\s+|\s+\()?(.+?)(?:\)|$)/i
    ];
    
    let title = '', company = '', duration = '';
    
    for (const pattern of patterns) {
      const match = firstLine.match(pattern);
      if (match) {
        title = match[1].trim();
        company = match[2].trim();
        duration = match[3] ? match[3].trim() : '';
        break;
      }
    }
    
    // If no pattern matched, try to extract from separate lines
    if (!title && lines.length >= 2) {
      title = lines[0].trim();
      const secondLine = lines[1].trim();
      
      // Look for company in second line
      const companyMatch = secondLine.match(/^(.+?)(?:\s+\|\s+|\s+-\s+|\s+\()?(.+?)(?:\)|$)/);
      if (companyMatch) {
        company = companyMatch[1].trim();
        duration = companyMatch[2] ? companyMatch[2].trim() : '';
      }
    }
    
    // Extract description from remaining lines
    const descriptionLines = lines.slice(title && company ? 2 : 1);
    const description = descriptionLines
      .filter(line => !line.match(/^\d{4}/) && !line.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i))
      .join(' ')
      .trim();
    
    // Look for dates in the text if not found
    if (!duration) {
      const dateMatch = entry.match(/(\d{4}.*?(?:\d{4}|present|current))/i);
      if (dateMatch) {
        duration = dateMatch[1];
      }
    }
    
    if (title && company) {
      experiences.push({
        title: title.replace(/[^\w\s-]/g, '').trim(),
        company: company.replace(/[^\w\s-]/g, '').trim(),
        duration: duration.replace(/[^\w\s-]/g, '').trim(),
        description: description.substring(0, 500) // Limit description length
      });
    }
  });
  
  return experiences.slice(0, 5); // Limit to 5 experiences
}

function extractEducation(text: string): Array<{
  degree: string;
  institution: string;
  year: string;
}> {
  const education: Array<{
    degree: string;
    institution: string;
    year: string;
  }> = [];
  
  // Look for education section
  const educationMatch = text.match(/(?:EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS)[\s\S]*?(?=\n(?:EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|[A-Z]{2,})|\n\n\n|$)/i);
  if (!educationMatch) return education;
  
  const educationText = educationMatch[0];
  const lines = educationText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // Look for degree patterns
    const degreePatterns = [
      /(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|MBA|B\.Tech|M\.Tech|B\.E\.|M\.E\.).*?(?:in\s+)?([^,\d]+).*?(\d{4})/i,
      /([^,\d]+)\s+(?:from\s+)?([^,\d]+)\s+(\d{4})/i
    ];
    
    for (const pattern of degreePatterns) {
      const match = line.match(pattern);
      if (match) {
        let degree = match[1].trim();
        let institution = match[2].trim();
        const year = match[3];
        
        // If the first match looks like an institution, swap them
        if (degree.length > 50 || institution.toLowerCase().includes('university') || institution.toLowerCase().includes('college')) {
          [degree, institution] = [institution, degree];
        }
        
        education.push({
          degree: degree.substring(0, 100),
          institution: institution.substring(0, 100),
          year: year
        });
        break;
      }
    }
  });
  
  return education.slice(0, 3); // Limit to 3 education entries
}

function calculateYearsOfExperience(experiences: Array<{ duration: string }>): number {
  let totalYears = 0;
  
  experiences.forEach(exp => {
    const duration = exp.duration.toLowerCase();
    
    // Look for year ranges
    const yearMatches = duration.match(/\d{4}/g);
    
    if (yearMatches && yearMatches.length >= 2) {
      const startYear = parseInt(yearMatches[0]);
      const endYear = parseInt(yearMatches[1]);
      if (endYear > startYear) {
        totalYears += endYear - startYear;
      }
    } else if (yearMatches && yearMatches.length === 1 && (duration.includes('present') || duration.includes('current'))) {
      const startYear = parseInt(yearMatches[0]);
      const currentYear = new Date().getFullYear();
      if (currentYear > startYear) {
        totalYears += currentYear - startYear;
      }
    }
    
    // Look for explicit year mentions
    const yearMentions = duration.match(/(\d+)\s*(?:years?|yrs?)/i);
    if (yearMentions) {
      totalYears += parseInt(yearMentions[1]);
    }
  });
  
  return Math.max(0, Math.min(totalYears, 50)); // Cap at 50 years
}

function extractSummary(text: string): string {
  const summaryPatterns = [
    /(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT|OVERVIEW)[\s\S]*?(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|[A-Z]{2,})|\n\n)/i,
    /^[\s\S]*?(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|[A-Z]{2,}))/
  ];
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      let summary = match[0]
        .replace(/(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT|OVERVIEW)/i, '')
        .trim();
      
      // Clean up the summary
      summary = summary
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?()-]/g, '')
        .trim();
      
      if (summary.length > 50 && summary.length < 1000) {
        return summary.substring(0, 500);
      }
    }
  }
  
  return '';
}

function extractCurrentRole(experiences: Array<{ title: string; duration: string }>): string {
  // Look for current role (most recent or containing "present"/"current")
  for (const exp of experiences) {
    if (exp.duration.toLowerCase().includes('present') || 
        exp.duration.toLowerCase().includes('current')) {
      return exp.title;
    }
  }
  
  // If no current role found, return the first experience
  return experiences.length > 0 ? experiences[0].title : '';
}

function extractCertifications(text: string): Array<{
  name: string;
  issuer: string;
  date: string;
}> {
  const certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }> = [];
  
  // Look for certifications section
  const certMatch = text.match(/(?:CERTIFICATIONS|CERTIFICATES|PROFESSIONAL CERTIFICATIONS|LICENSES)[\s\S]*?(?=\n(?:EDUCATION|EXPERIENCE|SKILLS|PROJECTS|[A-Z]{2,})|\n\n\n|$)/i);
  if (!certMatch) return certifications;
  
  const certText = certMatch[0];
  const lines = certText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // Look for certification patterns
    const certPatterns = [
      /^(.+?)\s*[-|]\s*(.+?)\s*[-|]\s*(\d{4}|\w+\s+\d{4})/i,
      /^(.+?)\s*,\s*(.+?)\s*,\s*(\d{4}|\w+\s+\d{4})/i,
      /^(.+?)\s*from\s+(.+?)\s*[-|]\s*(\d{4}|\w+\s+\d{4})/i
    ];
    
    for (const pattern of certPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1].trim();
        const issuer = match[2].trim();
        const date = match[3].trim();
        
        // Skip if it looks like a header
        if (name.toLowerCase().includes('certification') || 
            name.toLowerCase().includes('certificate') ||
            name.length > 100) {
          continue;
        }
        
        certifications.push({
          name: name.substring(0, 100),
          issuer: issuer.substring(0, 100),
          date: date
        });
        break;
      }
    }
  });
  
  return certifications.slice(0, 10); // Limit to 10 certifications
}

// Helper: Call Backend API to analyze extracted CV text with AI
async function analyzeCVTextWithOpenAI(text: string): Promise<ParsedCV> {
  try {
    const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';
    const apiUrl = `${apiBase}/openai/skillsurger`;

    const response = await axios.post(
      apiUrl,
      {
        type: "analyzeCVText",
        text: text
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    // Parse the JSON response
    const content = response.data.data;
    if (!content) {
      reportError('pdf', 'operation_failed');
      throw new Error('No response data from backend API.');
    }

    // Ensure all required keys exist with proper defaults
    return {
      full_name: content.full_name || '',
      email: content.email || '',
      phone: content.phone || '',
      city: content.city || '',
      state: content.state || '',
      country: content.country || '',
      current_role: content.current_role || '',
      years_of_experience: Math.round(Number(content.years_of_experience) || 0),
      summary: content.summary || '',
      experience: Array.isArray(content.experience) ? content.experience : [],
      projects: Array.isArray(content.projects) ? content.projects : [],
      skills: Array.isArray(content.skills) ? content.skills : [],
      education: Array.isArray(content.education) ? content.education : [],
      languages: Array.isArray(content.languages) ? content.languages : [],
      certifications: Array.isArray(content.certifications) ? content.certifications : []
    };
  } catch (error: any) {
    reportError('pdf', 'operation_failed');
    reportError('pdf', 'operation_failed');

    throw new Error(`Failed to analyze CV with AI: ${error.message}`);
  }
}

export async function parseCV(file: File): Promise<ParsedCV> {
  try {
    if (!file) {
      throw new Error('No CV file provided');
    }
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Please upload a PDF smaller than 10MB.');
    }
    
    // Extract text using PDF.js first
    let pdfText: string;
    try {
      pdfText = await extractTextFromPdf(file);
    } catch (pdfError) {
      reportError('pdf', 'operation_failed');
      // For image-based PDFs, provide a fallback structure
      if (pdfError instanceof Error && pdfError.message.includes('image-based')) {
        return {
          full_name: '',
          email: '',
          phone: '',
          city: '',
          state: '',
          country: '',
          current_role: '',
          years_of_experience: 0,
          summary: 'This appears to be an image-based PDF. Please ensure your CV contains selectable text for better parsing results.',
          experience: [],
          projects: [],
          skills: [],
          education: [],
          languages: [],
          certifications: []
        };
      }
      throw new Error('Failed to extract text from PDF. The file might be corrupted, password-protected, or contain only images. Please try a different PDF file.');
    }
    
    if (pdfText && pdfText.trim() && !pdfText.includes('This appears to be an image-based PDF')) {
      // Use Backend AI to analyze the extracted text
      const result = await analyzeCVTextWithOpenAI(pdfText);
      return result;
    } else if (pdfText && pdfText.includes('This appears to be an image-based PDF')) {
      // Handle image-based PDF case
      return {
        full_name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        country: '',
        current_role: '',
        years_of_experience: 0,
        summary: 'This appears to be an image-based PDF. Please ensure your CV contains selectable text for better parsing results.',
        experience: [],
        projects: [],
        skills: [],
        education: [],
        languages: [],
        certifications: []
      };
    }
    
    throw new Error('No text could be extracted from the PDF');
  } catch (error: any) {
    reportError('pdf', 'operation_failed');
    throw error;
  }
}

export async function downloadCV(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(await getCVSignedUrl(url));
    if (!response.ok) {
      throw new Error('Failed to fetch CV file');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    reportError('pdf', 'operation_failed');
    throw new Error('Failed to download CV. Please try again.');
  }
}
