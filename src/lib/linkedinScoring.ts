import {
  ParsedProfile,
  DimensionScores,
  ProfileAnalysis,
  Improvement,
  HeadlineExample,
} from '../components/linkedin-optimizer/types';

// Keyword banks for detection
const TECH_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'MongoDB',
  'API', 'REST', 'GraphQL', 'Microservices', 'CI/CD', 'DevOps', 'Agile', 'Scrum',
  'Machine Learning', 'AI', 'Data Science', 'Analytics', 'Cloud', 'Serverless'
];

const ACTION_VERBS = [
  'led', 'drove', 'increased', 'decreased', 'improved', 'built', 'developed',
  'launched', 'scaled', 'managed', 'created', 'designed', 'implemented',
  'optimized', 'achieved', 'delivered', 'spearheaded', 'established', 'transformed',
  'reduced', 'accelerated', 'streamlined', 'generated', 'executed'
];

const ROLE_KEYWORDS = [
  'Engineer', 'Developer', 'Manager', 'Director', 'Lead', 'Senior', 'Principal',
  'Architect', 'Consultant', 'Specialist', 'Analyst', 'Designer', 'VP', 'Head',
  'Chief', 'Founder', 'Co-founder', 'Product', 'Technical', 'Software', 'Data'
];

// Parse LinkedIn profile text into structured data
export function parseLinkedInProfile(text: string): ParsedProfile {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract headline (first 1-2 lines, typically < 220 chars)
  let headline = '';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    if (lines[i].length < 220 && lines[i].length > 10) {
      headline = lines[i];
      break;
    }
  }

  // Extract about section
  let about = '';
  const aboutIndex = text.toLowerCase().indexOf('about');
  const experienceIndex = text.toLowerCase().indexOf('experience');

  if (aboutIndex !== -1) {
    const endIndex = experienceIndex !== -1 && experienceIndex > aboutIndex
      ? experienceIndex
      : text.length;
    about = text.substring(aboutIndex, endIndex).replace(/about/i, '').trim();
    // Limit to first 1000 characters of about section
    about = about.substring(0, 1000);
  } else {
    // If no "About" marker, take first paragraph after headline
    const paragraphs = text.split('\n\n');
    if (paragraphs.length > 1) {
      about = paragraphs[1].trim();
    }
  }

  // Extract experience bullets
  const experienceBullets: string[] = [];
  const bulletRegex = /^[\u2022\u2023\u25E6\u2043\u2219\-\*\d+.]/;

  for (const line of lines) {
    if (bulletRegex.test(line) || line.match(/^(led|drove|increased|built|developed|managed|created)/i)) {
      experienceBullets.push(line);
    }
  }

  // Extract skills
  const skills: string[] = [];
  const skillsIndex = text.toLowerCase().indexOf('skills');

  if (skillsIndex !== -1) {
    const skillsSection = text.substring(skillsIndex, skillsIndex + 500);
    const skillLines = skillsSection.split('\n');

    for (const line of skillLines) {
      // Check for comma-separated skills
      if (line.includes(',')) {
        const extractedSkills = line.split(',').map(s => s.trim()).filter(s => s.length > 2 && s.length < 50);
        skills.push(...extractedSkills);
      }
      // Check for bullet points
      else if (bulletRegex.test(line)) {
        const skill = line.replace(bulletRegex, '').trim();
        if (skill.length > 2 && skill.length < 50) {
          skills.push(skill);
        }
      }
    }
  }

  return {
    headline,
    about,
    experienceBullets,
    skills: skills.slice(0, 20), // Limit to 20 skills
    rawText: text,
  };
}

// Score individual dimensions
export function scoreHeadlineStrength(profile: ParsedProfile): number {
  const headline = profile.headline;
  if (!headline) return 0;

  let score = 0;

  // Has role/title (30 pts)
  const hasRole = ROLE_KEYWORDS.some(keyword =>
    headline.toLowerCase().includes(keyword.toLowerCase())
  );
  if (hasRole) score += 30;

  // Has value proposition (30 pts) - more than just title
  const hasSpecialty = headline.includes('|') || headline.includes('•') || headline.split(' ').length > 5;
  if (hasSpecialty) score += 30;

  // Has keywords (20 pts) - contains 2+ technical/industry keywords
  const keywordCount = TECH_KEYWORDS.filter(keyword =>
    headline.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  if (keywordCount >= 2) score += 20;
  else if (keywordCount === 1) score += 10;

  // Character count 50-120 (20 pts) - optimal length
  const length = headline.length;
  if (length >= 50 && length <= 120) score += 20;
  else if (length >= 30 && length <= 150) score += 10;

  return Math.min(score, 100);
}

export function scoreAboutSectionQuality(profile: ParsedProfile): number {
  const about = profile.about;
  if (!about) return 0;

  let score = 0;

  // Has content (25 pts) - minimum 200 characters
  if (about.length >= 200) score += 25;
  else if (about.length >= 100) score += 15;
  else if (about.length >= 50) score += 5;

  // Hook strength (25 pts) - compelling opening
  const firstSentence = about.split('.')[0];
  if (firstSentence.length > 30 && firstSentence.length < 100) score += 15;
  if (firstSentence.toLowerCase().match(/(help|expert|passionate|specialized|transform|drive)/)) {
    score += 10;
  }

  // Includes numbers/metrics (25 pts)
  const numberMatches = about.match(/\d+[\+%\$kKmM]?/g);
  if (numberMatches && numberMatches.length >= 3) score += 25;
  else if (numberMatches && numberMatches.length >= 2) score += 15;
  else if (numberMatches && numberMatches.length >= 1) score += 10;

  // Has call-to-action (25 pts) - contact invite
  const lastSentences = about.slice(-200).toLowerCase();
  if (lastSentences.match(/(connect|reach out|contact|email|let's talk|message me|get in touch)/)) {
    score += 25;
  }

  return Math.min(score, 100);
}

export function scoreExperienceImpact(profile: ParsedProfile): number {
  const bullets = profile.experienceBullets;
  const experienceText = bullets.join(' ').toLowerCase();

  let score = 0;

  // Action verbs (20 pts)
  const actionVerbCount = ACTION_VERBS.filter(verb =>
    experienceText.includes(verb.toLowerCase())
  ).length;
  if (actionVerbCount >= 5) score += 20;
  else if (actionVerbCount >= 3) score += 15;
  else if (actionVerbCount >= 1) score += 10;

  // Quantification (30 pts) - numbers, %, $
  const numberMatches = experienceText.match(/\d+[\+%\$kKmMbB]?/g);
  if (numberMatches && numberMatches.length >= 5) score += 30;
  else if (numberMatches && numberMatches.length >= 3) score += 20;
  else if (numberMatches && numberMatches.length >= 1) score += 10;

  // Bullet count (25 pts) - at least 3 experience entries
  if (bullets.length >= 6) score += 25;
  else if (bullets.length >= 3) score += 15;
  else if (bullets.length >= 1) score += 10;

  // Achievement focus (25 pts) - result-oriented language
  const achievementWords = ['achieved', 'delivered', 'resulted', 'improved', 'increased', 'reduced', 'generated'];
  const achievementCount = achievementWords.filter(word =>
    experienceText.includes(word)
  ).length;
  if (achievementCount >= 3) score += 25;
  else if (achievementCount >= 2) score += 15;
  else if (achievementCount >= 1) score += 10;

  return Math.min(score, 100);
}

export function scoreKeywordOptimization(profile: ParsedProfile): number {
  const fullText = profile.rawText.toLowerCase();

  let score = 0;

  // Technical keywords (30 pts)
  const techKeywordCount = TECH_KEYWORDS.filter(keyword =>
    fullText.includes(keyword.toLowerCase())
  ).length;
  if (techKeywordCount >= 8) score += 30;
  else if (techKeywordCount >= 5) score += 20;
  else if (techKeywordCount >= 3) score += 15;
  else if (techKeywordCount >= 1) score += 10;

  // Role keywords (30 pts)
  const roleKeywordCount = ROLE_KEYWORDS.filter(keyword =>
    fullText.includes(keyword.toLowerCase())
  ).length;
  if (roleKeywordCount >= 5) score += 30;
  else if (roleKeywordCount >= 3) score += 20;
  else if (roleKeywordCount >= 2) score += 15;
  else if (roleKeywordCount >= 1) score += 10;

  // Skills listed (20 pts)
  if (profile.skills.length >= 10) score += 20;
  else if (profile.skills.length >= 5) score += 15;
  else if (profile.skills.length >= 3) score += 10;

  // Keyword density (20 pts) - not stuffed, good distribution
  const wordCount = fullText.split(/\s+/).length;
  const totalKeywords = techKeywordCount + roleKeywordCount;
  const density = totalKeywords / wordCount;

  if (density > 0.02 && density < 0.08) score += 20; // Sweet spot
  else if (density >= 0.01 && density <= 0.10) score += 10;

  return Math.min(score, 100);
}

export function scoreProfileCompleteness(profile: ParsedProfile): number {
  let score = 0;

  // Has headline (20 pts)
  if (profile.headline && profile.headline.length > 10) score += 20;

  // Has about section (20 pts)
  if (profile.about && profile.about.length > 100) score += 20;
  else if (profile.about && profile.about.length > 50) score += 10;

  // Has experience (20 pts)
  if (profile.experienceBullets.length >= 3) score += 20;
  else if (profile.experienceBullets.length >= 1) score += 10;

  // Has skills (20 pts)
  if (profile.skills.length >= 5) score += 20;
  else if (profile.skills.length >= 3) score += 15;
  else if (profile.skills.length >= 1) score += 10;

  // Has education (20 pts) - check for education mentions
  const hasEducation = profile.rawText.toLowerCase().includes('education') ||
                       profile.rawText.toLowerCase().includes('university') ||
                       profile.rawText.toLowerCase().includes('college') ||
                       profile.rawText.toLowerCase().includes('degree');
  if (hasEducation) score += 20;

  return Math.min(score, 100);
}

export function scoreRecruiterAppeal(profile: ParsedProfile): number {
  const text = profile.rawText;

  let score = 0;

  // Content richness (30 pts) - total character count > 1500
  if (text.length >= 2500) score += 30;
  else if (text.length >= 1500) score += 20;
  else if (text.length >= 1000) score += 15;
  else if (text.length >= 500) score += 10;

  // Section variety (30 pts) - multiple sections filled
  const sections = ['about', 'experience', 'skills', 'education', 'projects', 'certifications'];
  const presentSections = sections.filter(section =>
    text.toLowerCase().includes(section)
  ).length;
  if (presentSections >= 5) score += 30;
  else if (presentSections >= 4) score += 20;
  else if (presentSections >= 3) score += 15;
  else if (presentSections >= 2) score += 10;

  // Professional language (20 pts) - formal tone
  const casualWords = ['like', 'stuff', 'things', 'cool', 'awesome', 'basically', 'literally'];
  const casualCount = casualWords.filter(word =>
    text.toLowerCase().includes(word)
  ).length;
  if (casualCount === 0) score += 20;
  else if (casualCount <= 2) score += 10;

  // Active indicators (20 pts) - content freshness suggested
  const currentWords = ['currently', 'present', 'ongoing', 'recent', '2024', '2025', '2026'];
  const hasCurrentIndicators = currentWords.some(word =>
    text.toLowerCase().includes(word)
  );
  if (hasCurrentIndicators) score += 20;

  return Math.min(score, 100);
}

// Generate improvements based on scores
export function generateImprovements(
  profile: ParsedProfile,
  scores: DimensionScores
): Improvement[] {
  const improvements: Improvement[] = [];

  // Headline improvement
  if (scores.headlineStrength < 70) {
    const currentHeadline = profile.headline || 'No headline found';
    improvements.push({
      priority: 1,
      category: 'headline',
      title: 'Transform Your Headline into a Magnet',
      currentState: `Current: "${currentHeadline.substring(0, 100)}${currentHeadline.length > 100 ? '...' : ''}"`,
      suggestion: 'Add your seniority level, key skills (2-3), and the value you deliver. Use | or • to separate sections for clarity.',
      impact: Math.min(30 - scores.headlineStrength, 20),
    });
  }

  // Experience quantification
  if (scores.experienceImpact < 70) {
    const hasNumbers = profile.experienceBullets.join(' ').match(/\d+/);
    improvements.push({
      priority: 2,
      category: 'experience',
      title: 'Add Quantified Achievements',
      currentState: hasNumbers ? 'You have some numbers, but could use more' : 'Your experience bullets lack measurable impact',
      suggestion: 'Include specific metrics: "Increased sales by 40%", "Reduced load time from 5s to 1.2s", "Managed team of 8 engineers"',
      impact: Math.min(30 - scores.experienceImpact, 15),
    });
  }

  // Keyword optimization
  if (scores.keywordOptimization < 70) {
    const missingKeywords = TECH_KEYWORDS.filter(keyword =>
      !profile.rawText.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 5);

    improvements.push({
      priority: 3,
      category: 'keywords',
      title: 'Add Missing Keywords Recruiters Search For',
      currentState: 'Your profile lacks critical search terms',
      suggestion: `Consider adding: ${missingKeywords.join(', ')}. Include these naturally in your headline, about section, or skills.`,
      impact: Math.min(30 - scores.keywordOptimization, 12),
    });
  }

  // About section improvement
  if (scores.aboutSectionQuality < 70) {
    improvements.push({
      priority: 4,
      category: 'about',
      title: 'Strengthen Your About Section Hook',
      currentState: profile.about.length < 100 ? 'Your about section is too short' : 'Your about section could be more compelling',
      suggestion: 'Start with a powerful opening that shows your expertise. Include 2-3 specific achievements with numbers. End with a clear call-to-action.',
      impact: Math.min(30 - scores.aboutSectionQuality, 12),
    });
  }

  // Profile completeness
  if (scores.profileCompleteness < 80) {
    const missingSections = [];
    if (!profile.headline || profile.headline.length < 20) missingSections.push('headline');
    if (!profile.about || profile.about.length < 100) missingSections.push('about section');
    if (profile.skills.length < 5) missingSections.push('skills (aim for 10+)');
    if (!profile.rawText.toLowerCase().includes('education')) missingSections.push('education');

    improvements.push({
      priority: 5,
      category: 'completeness',
      title: 'Complete Missing Profile Sections',
      currentState: `Missing or incomplete: ${missingSections.slice(0, 3).join(', ')}`,
      suggestion: 'Complete profiles get 40% more recruiter views. Add all missing sections to maximize visibility.',
      impact: Math.min(20 - (scores.profileCompleteness - 60), 10),
    });
  }

  // Sort by impact and return top 5
  return improvements.sort((a, b) => b.impact - a.impact).slice(0, 5);
}

// Generate headline examples
export function generateHeadlineExamples(profile: ParsedProfile): HeadlineExample[] {
  const examples: HeadlineExample[] = [];
  const currentHeadline = profile.headline || 'Software Engineer';

  // Detect role from headline or text
  let detectedRole = 'Professional';
  for (const role of ROLE_KEYWORDS) {
    if (profile.rawText.toLowerCase().includes(role.toLowerCase())) {
      detectedRole = role;
      break;
    }
  }

  // Example 1: Generic to specific
  examples.push({
    before: currentHeadline.length > 50 ? currentHeadline.substring(0, 50) + '...' : currentHeadline,
    after: `Senior ${detectedRole} | Specialized Skills | Driving Measurable Business Impact`,
    explanation: 'Includes seniority, specialization, and value proposition',
  });

  // Example 2: Add technical skills
  const skills = profile.skills.slice(0, 3).join(' & ') || 'Key Technologies';
  examples.push({
    before: `${detectedRole} at Company`,
    after: `${detectedRole} | ${skills} Expert | Building Solutions for Industry Leaders`,
    explanation: 'Highlights specific technical skills and client caliber',
  });

  // Example 3: Achievement-focused
  examples.push({
    before: `Experienced ${detectedRole}`,
    after: `${detectedRole} | Increased Revenue 40% | Led 10+ Successful Projects`,
    explanation: 'Leads with quantifiable achievements that prove impact',
  });

  return examples;
}

// Get missing keywords based on profile analysis
export function getMissingKeywords(profile: ParsedProfile): string[] {
  const text = profile.rawText.toLowerCase();
  const missing: string[] = [];

  // Find missing technical keywords
  for (const keyword of TECH_KEYWORDS) {
    if (!text.includes(keyword.toLowerCase()) && missing.length < 10) {
      missing.push(keyword);
    }
  }

  // Add some action verbs if experience is weak
  if (profile.experienceBullets.length < 3) {
    const missingVerbs = ACTION_VERBS.filter(verb =>
      !text.includes(verb)
    ).slice(0, 5);
    missing.push(...missingVerbs.map(v => v.charAt(0).toUpperCase() + v.slice(1)));
  }

  return missing.slice(0, 10);
}

// Get recruiter message based on score
export function getRecruiterMessage(overallScore: number, scores: DimensionScores): string {
  if (overallScore >= 85) {
    return "Excellent! Your profile is in the top 10% of LinkedIn users. Recruiters will notice you immediately. Keep your content fresh and you'll continue attracting opportunities.";
  } else if (overallScore >= 70) {
    return "Strong profile! You're ahead of most candidates, but a few strategic improvements could make you even more discoverable. Focus on the areas highlighted below to reach the top tier.";
  } else if (overallScore >= 50) {
    return "Good foundation, but you're missing opportunities. Optimize the highlighted areas to stand out to recruiters. Profiles scoring 70+ get 3x more recruiter views.";
  } else {
    const weakest = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b)[0];
    return `Your profile needs significant work. Most recruiters won't find you in searches. Start by improving your ${weakest.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}, then work through the other recommendations.`;
  }
}

// Main analysis function
export function analyzeLinkedInProfile(rawText: string): ProfileAnalysis {
  // Parse profile
  const profile = parseLinkedInProfile(rawText);

  // Calculate dimension scores
  const scores: DimensionScores = {
    headlineStrength: scoreHeadlineStrength(profile),
    aboutSectionQuality: scoreAboutSectionQuality(profile),
    experienceImpact: scoreExperienceImpact(profile),
    keywordOptimization: scoreKeywordOptimization(profile),
    profileCompleteness: scoreProfileCompleteness(profile),
    recruiterAppeal: scoreRecruiterAppeal(profile),
  };

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    scores.headlineStrength * 0.20 +
    scores.aboutSectionQuality * 0.20 +
    scores.experienceImpact * 0.20 +
    scores.keywordOptimization * 0.15 +
    scores.profileCompleteness * 0.15 +
    scores.recruiterAppeal * 0.10
  );

  // Generate improvements
  const topImprovements = generateImprovements(profile, scores);

  // Generate headline examples
  const headlineExamples = generateHeadlineExamples(profile);

  // Get missing keywords
  const missingKeywords = getMissingKeywords(profile);

  // Get recruiter message
  const recruiterMessage = getRecruiterMessage(overallScore, scores);

  return {
    overallScore,
    scores,
    topImprovements,
    headlineExamples,
    missingKeywords,
    recruiterMessage,
  };
}
