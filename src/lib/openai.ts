import { openai, isOpenAIConfigured } from './openaiConfig';
import { generateCareerOptions, findJobOpportunities, generateCVSuggestions } from './careerServices';
import { extractJsonFromMarkdown } from './utils';
import { generateVerifiedLearningResources, type VerifiedResource } from './enhancedLearningResources';

export async function generateCareerSuggestions(skills: string[], interests: string[]) {
  try {
    if (!isOpenAIConfigured()) {
      return 'AI-powered career suggestions are currently disabled. Please configure your OpenAI API key to enable this feature.';
    }

    const careerOptions = await generateCareerOptions(skills, interests, 0);
    const formattedSuggestions = careerOptions.map(option => `
Career Path: ${option.title}

${option.description}

Required Skills:
${option.requiredSkills.map(skill => `- ${skill}`).join('\n')}

Potential Companies:
${option.potentialCompanies.map(company => `- ${company}`).join('\n')}

Average Salary: ${option.averageSalary}
Growth Potential: ${option.growthPotential}
`).join('\n---\n');

    return formattedSuggestions || 'No suggestions generated.';
  } catch (error: any) {
    console.error('Error generating career suggestions:', error);
    return 'Unable to generate career suggestions at this time. Please try again later.';
  }
}

export async function generateLearningPlan(
  jobTitle: string,
  jobDescription: string = '',
  requirements: string[] = []
): Promise<Array<{
  type: string;
  title: string;
  description: string;
  url: string;
  completed: boolean;
  verified: boolean;
  fallbackUrl?: string;
  price?: string;
  rating?: number;
  provider?: string;
  difficulty?: string;
  duration?: string;
}>> {
  console.log('Generating learning plan for:', jobTitle);

  // Use the enhanced verified learning resources
  const verifiedResources = await generateVerifiedLearningResources(jobTitle, jobDescription, requirements);
  
  // Convert VerifiedResource to the expected format
  const learningPlan = verifiedResources.map(resource => ({
    type: resource.type,
    title: resource.title,
    description: resource.description,
    url: resource.url,
    completed: false,
    verified: resource.verified,
    fallbackUrl: resource.fallbackUrl,
    price: resource.price,
    rating: resource.rating,
    provider: resource.provider,
    difficulty: resource.difficulty,
    duration: resource.duration
  }));

  if (learningPlan.length === 0) {
    console.warn(`No learning resources could be generated for "${jobTitle}". The generated plan will be empty.`);
  } else {
    console.log('Generated verified learning plan with', learningPlan.length, 'resources');
  }
  
  return learningPlan;
}

export async function generateVerifiedCareerPathLearningResources(
  careerPath: string
): Promise<Array<{
  type: string;
  title: string;
  url: string;
  description: string;
  verified: boolean;
  fallbackUrl?: string;
  price?: string;
  rating?: number;
  provider?: string;
  difficulty?: string;
  duration?: string;
}>> {
  if (!isOpenAIConfigured()) {
    console.log('OpenAI not configured, returning fallback career path resources');
    return getFallbackCareerPathResources(careerPath);
  }

  try {
    const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';
    const response = await axios.post(`${apiBase}/openai/skillsurger`, {
      type: "generateVerifiedCareerPathLearningResources",
      careerPath: careerPath
    });

    if (!response.data.success) {
      console.log('No response from OpenAI, using fallback career path resources');
      return getFallbackCareerPathResources(careerPath);
    }

    const resources = response.data.data;
    console.log('Generated career path learning resources:', resources.length);
    return resources;
  } catch (error) {
    console.error('Error generating career path learning resources:', error);
    return getFallbackCareerPathResources(careerPath);
  }
}

function getFallbackCareerPathResources(careerPath: string): Array<{
  type: string;
  title: string;
  url: string;
  description: string;
  verified: boolean;
  fallbackUrl?: string;
  price?: string;
  rating?: number;
  provider?: string;
  difficulty?: string;
  duration?: string;
}> {
  const fallbackResources: { [key: string]: any[] } = {
    'Software Development': [
      {
        type: 'Course',
        title: 'Complete Web Development Bootcamp',
        url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more in this comprehensive web development course.',
        verified: true,
        price: 'Paid',
        provider: 'Udemy',
        difficulty: 'Beginner',
        duration: '55 hours',
        rating: 4.7
      },
      {
        type: 'Course',
        title: 'CS50: Introduction to Computer Science',
        url: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
        description: 'Harvard\'s introduction to computer science and programming. Covers algorithms, data structures, and software engineering principles.',
        verified: true,
        price: 'Free',
        provider: 'edX',
        difficulty: 'Beginner',
        duration: '12 weeks',
        rating: 4.8
      },
      {
        type: 'Tutorial',
        title: 'freeCodeCamp Full Stack Development',
        url: 'https://www.freecodecamp.org/',
        description: 'Free comprehensive curriculum covering front-end, back-end, and full-stack development with hands-on projects.',
        verified: true,
        price: 'Free',
        provider: 'freeCodeCamp',
        difficulty: 'Beginner',
        duration: '3000+ hours',
        rating: 4.9
      }
    ],
    'Data Science & Analytics': [
      {
        type: 'Course',
        title: 'Data Science Specialization',
        url: 'https://www.coursera.org/specializations/jhu-data-science',
        description: 'Comprehensive data science program covering R programming, statistical analysis, machine learning, and data visualization.',
        verified: true,
        price: 'Paid',
        provider: 'Coursera',
        difficulty: 'Intermediate',
        duration: '10 months',
        rating: 4.5
      },
      {
        type: 'Course',
        title: 'Python for Data Science and Machine Learning',
        url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
        description: 'Learn Python, NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, and TensorFlow for data science and machine learning.',
        verified: true,
        price: 'Paid',
        provider: 'Udemy',
        difficulty: 'Beginner',
        duration: '25 hours',
        rating: 4.6
      }
    ],
    'Product Management': [
      {
        type: 'Course',
        title: 'Digital Product Management Specialization',
        url: 'https://www.coursera.org/specializations/product-management',
        description: 'Learn the fundamentals of digital product management, including strategy, development, and launch.',
        verified: true,
        price: 'Paid',
        provider: 'Coursera',
        difficulty: 'Beginner',
        duration: '6 months',
        rating: 4.4
      }
    ]
  };

  return fallbackResources[careerPath] || [
    {
      type: 'Course',
      title: `${careerPath} Fundamentals`,
      url: 'https://www.coursera.org/',
      description: `Comprehensive introduction to ${careerPath} covering key concepts, skills, and industry best practices.`,
      verified: true,
      price: 'Paid',
      provider: 'Coursera',
      difficulty: 'Beginner',
      duration: '4-6 weeks',
      rating: 4.3
    }
  ];
}

export async function generateCareerPathLearningPlan(
  careerPath: string
): Promise<Array<{
  type: string;
  title: string;
  description: string;
  url: string;
  completed: boolean;
  verified: boolean;
  fallbackUrl?: string;
  price?: string;
  rating?: number;
  provider?: string;
  difficulty?: string;
  duration?: string;
}>> {
  console.log('Generating career path learning plan for:', careerPath);

  // Use the enhanced verified learning resources for career paths
  const verifiedResources = await generateVerifiedCareerPathLearningResources(careerPath);
  
  // Convert VerifiedResource to the expected format
  const learningPlan = verifiedResources.map(resource => ({
    type: resource.type,
    title: resource.title,
    description: resource.description,
    url: resource.url,
    completed: false,
    verified: resource.verified,
    fallbackUrl: resource.fallbackUrl,
    price: resource.price,
    rating: resource.rating,
    provider: resource.provider,
    difficulty: resource.difficulty,
    duration: resource.duration
  }));

  if (learningPlan.length === 0) {
    console.warn(`No learning resources could be generated for career path "${careerPath}". The generated plan will be empty.`);
  } else {
    console.log('Generated verified career path learning plan with', learningPlan.length, 'resources');
  }
  
  return learningPlan;
}

/**
 * Generates suggestions for improving a CV based on a job description.
 * @param cvText The text content of the user's CV.
 */
export async function generateCVSuggestionsForJob(cvText: string, jobDescription: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    return 'CV suggestions are currently disabled. Please configure your OpenAI API key.';
  }
}

/*
 * Generates suggestions for improving a CV based on a job description.
 * @param cvText The text content of the user's CV.
 * @param jobDescription The description of the target job.
 * @returns A string containing CV improvement suggestions.
export async function generateCVSuggestions(cvText: string, jobDescription: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    return 'CV suggestions are currently disabled. Please configure your OpenAI API key.';
  }

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an expert career coach. Analyze the provided CV and job description, then provide specific, actionable suggestions for improvement. Focus on tailoring the CV to the job. Provide a concise list of 3-5 key recommendations. Use markdown for formatting.`
      },
      {
        role: "user",
        content: `CV:\n${cvText}\n\nJob Description:\n${jobDescription}`
      }
    ],
    temperature: 0.6,
    max_tokens: 800
  });

  return response.choices[0]?.message?.content || 'No suggestions generated.';
}
*/

/**
 * Given a job title, use OpenAI to generate 3-4 synonyms or related job titles.
 * Returns an array of strings. Falls back to the original if OpenAI is not configured or fails.
 */
export async function getJobTitleSynonymsWithOpenAI(jobTitle: string): Promise<string[]> {
  if (!isOpenAIConfigured()) {
    return [jobTitle];
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in job market analysis. Given a job title, provide 3-4 synonyms or closely related job titles that a candidate should also search for. Respond with only a JSON array of strings.'
        },
        {
          role: 'user',
          content: `Job Title: ${jobTitle}`
        }
      ],
      temperature: 0.4,
      max_tokens: 100
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return [jobTitle];
    // Try to parse as JSON array
    let parsed: string[] = [];
    try {
      parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(s => s.trim()).filter(Boolean);
      }
    } catch {
      // fallback: try to extract array from markdown
      try {
        const cleaned = extractJsonFromMarkdown(content);
        parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => s.trim()).filter(Boolean);
        }
      } catch {}
    }
    return [jobTitle];
  } catch (e) {
    return [jobTitle];
  }
  return [jobTitle];
}
