import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Internal links to add to blogs
const internalLinks = [
  {
    text: 'AI Resume Builder',
    url: '/ai-resume-builder',
    keywords: ['resume', 'Resume']
  },
  {
    text: 'Mock Interview',
    url: '/mock-interview',
    keywords: ['interview', 'Interview', 'interviews', 'Interviews']
  },
  {
    text: 'Job Search',
    url: '/job-search',
    keywords: ['job search', 'Job Search', 'job hunting', 'Job Hunting']
  },
  {
    text: 'Career Explorer',
    url: '/dashboard',
    keywords: ['career guidance', 'Career Guidance', 'career planning', 'Career Planning']
  },
  {
    text: 'Skill Assessment',
    url: '/dashboard',
    keywords: ['skill gap', 'Skill Gap', 'skill assessment', 'Skill Assessment']
  }
];

// Read the blogs file
const blogsPath = path.join(__dirname, '../src/content/blogs.generated.ts');
let content = fs.readFileSync(blogsPath, 'utf8');

console.log('File read successfully. Content length:', content.length);

// Function to add internal links to content
function addInternalLinks(htmlContent) {
  let modifiedContent = htmlContent;
  let linksAdded = 0;
  
  internalLinks.forEach(link => {
    link.keywords.forEach(keyword => {
      // Simple string replacement for the first occurrence
      const index = modifiedContent.indexOf(keyword);
      if (index !== -1) {
        console.log(`Found keyword: "${keyword}" at index ${index}`);
        const before = modifiedContent.substring(0, index);
        const after = modifiedContent.substring(index + keyword.length);
        modifiedContent = before + `<a href="${link.url}" class="internal-link">${keyword}</a>` + after;
        linksAdded++;
      }
    });
  });
  
  return { content: modifiedContent, linksAdded };
}

// Process each blog post - use a different approach to extract content
const blogMatches = content.match(/"content":\s*"([^"]*(?:\\"[^"]*)*)"/g);
let newContent = content;
let totalLinksAdded = 0;
let blogCount = 0;

if (blogMatches) {
  blogMatches.forEach((match, index) => {
    blogCount++;
    console.log(`Processing blog ${blogCount}`);
    
    // Extract the content part from the match
    const contentMatch = match.match(/"content":\s*"(.+)"/);
    if (contentMatch && contentMatch[1]) {
      let originalContent = contentMatch[1];
      
      // Unescape the content
      originalContent = originalContent.replace(/\\"/g, '"').replace(/\\n/g, '\n');
      
      console.log(`Blog content length: ${originalContent.length}`);
      
      // Check if content contains any of our keywords
      const hasResume = originalContent.includes('resume') || originalContent.includes('Resume');
      const hasInterview = originalContent.includes('interview') || originalContent.includes('Interview');
      console.log(`Contains resume: ${hasResume}, Contains interview: ${hasInterview}`);
      
      const result = addInternalLinks(originalContent);
      
      if (result.linksAdded > 0) {
        // Escape the content back for replacement
        const escapedOriginal = originalContent.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const escapedNew = result.content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        newContent = newContent.replace(escapedOriginal, escapedNew);
        totalLinksAdded += result.linksAdded;
      }
    }
  });
}

console.log(`Total blogs processed: ${blogCount}`);

// Write the updated content back to the file
fs.writeFileSync(blogsPath, newContent, 'utf8');

console.log(`Internal links added to blog posts successfully! Total links added: ${totalLinksAdded}`);
