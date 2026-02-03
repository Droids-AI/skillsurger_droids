// Enhanced learning resource generation with verified links
import { verifyLink, generateFallbackUrl, getPlatformInfo } from './linkVerification';
import axios from 'axios';

export interface VerifiedResource {
  type: string;
  title: string;
  description: string;
  url: string;
  verified: boolean;
  lastVerified: string;
  fallbackUrl?: string;
  price: 'free' | 'freemium' | 'paid';
  rating?: number;
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
}

// Curated 2024-2025 learning resources with verified links
const VERIFIED_LEARNING_RESOURCES = {
  // Software Development
  'software_development': {
    'javascript': [
      {
        type: 'Course',
        title: 'JavaScript Algorithms and Data Structures',
        description: 'Learn JavaScript fundamentals and computer science concepts through interactive coding challenges.',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
        provider: 'freeCodeCamp',
        price: 'free',
        rating: 4.8,
        difficulty: 'beginner',
        duration: '300 hours'
      },
      {
        type: 'Course',
        title: 'The Complete JavaScript Course 2024',
        description: 'Master modern JavaScript from fundamentals to advanced concepts including ES6+, async/await, and DOM manipulation.',
        url: 'https://www.udemy.com/course/the-complete-javascript-course/',
        provider: 'Udemy',
        price: 'paid',
        rating: 4.7,
        difficulty: 'beginner',
        duration: '69 hours'
      },
      {
        type: 'Tutorial',
        title: 'JavaScript Tutorial for Beginners',
        description: 'Complete JavaScript tutorial covering all fundamentals with practical examples.',
        url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        provider: 'YouTube',
        price: 'free',
        rating: 4.6,
        difficulty: 'beginner',
        duration: '3 hours'
      },
      {
        type: 'Documentation',
        title: 'MDN JavaScript Guide',
        description: 'Comprehensive JavaScript documentation and tutorials from Mozilla.',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
        provider: 'MDN',
        price: 'free',
        rating: 4.9,
        difficulty: 'intermediate',
        duration: 'Self-paced'
      }
    ],
    'react': [
      {
        type: 'Course',
        title: 'React - The Complete Guide 2024',
        description: 'Deep dive into React 18+ with hooks, context, Redux, and Next.js. Build modern, scalable applications.',
        url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
        provider: 'Udemy',
        price: 'paid',
        rating: 4.6,
        difficulty: 'intermediate',
        duration: '48 hours'
      },
      {
        type: 'Tutorial',
        title: 'React Tutorial for Beginners',
        description: 'Learn React fundamentals including components, props, state, and hooks.',
        url: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
        provider: 'YouTube',
        price: 'free',
        rating: 4.7,
        difficulty: 'beginner',
        duration: '2 hours'
      },
      {
        type: 'Course',
        title: 'Front End Development Libraries',
        description: 'Learn React, Redux, and other front-end libraries through hands-on projects.',
        url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/',
        provider: 'freeCodeCamp',
        price: 'free',
        rating: 4.8,
        difficulty: 'intermediate',
        duration: '300 hours'
      },
      {
        type: 'Documentation',
        title: 'React Official Documentation',
        description: 'Official React documentation with tutorials and API reference.',
        url: 'https://react.dev/learn',
        provider: 'React Team',
        price: 'free',
        rating: 4.9,
        difficulty: 'intermediate',
        duration: 'Self-paced'
      }
    ],
    'python': [
      {
        type: 'Course',
        title: 'Scientific Computing with Python',
        description: 'Learn Python programming fundamentals and scientific computing libraries.',
        url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
        provider: 'freeCodeCamp',
        price: 'free',
        rating: 4.8,
        difficulty: 'beginner',
        duration: '300 hours'
      },
      {
        type: 'Course',
        title: 'Complete Python Bootcamp 2024',
        description: 'Learn Python from scratch with hands-on projects and real-world applications.',
        url: 'https://www.udemy.com/course/complete-python-bootcamp/',
        provider: 'Udemy',
        price: 'paid',
        rating: 4.6,
        difficulty: 'beginner',
        duration: '22 hours'
      },
      {
        type: 'Tutorial',
        title: 'Python Tutorial for Beginners',
        description: 'Complete Python programming tutorial covering all fundamentals.',
        url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        provider: 'YouTube',
        price: 'free',
        rating: 4.7,
        difficulty: 'beginner',
        duration: '6 hours'
      },
      {
        type: 'Practice',
        title: 'Python Exercises on HackerRank',
        description: 'Practice Python programming with coding challenges and exercises.',
        url: 'https://www.hackerrank.com/domains/python',
        provider: 'HackerRank',
        price: 'free',
        rating: 4.5,
        difficulty: 'intermediate',
        duration: 'Self-paced'
      }
    ]
  },

  // Data Science
  'data_science': {
    'python_data': [
      {
        type: 'Course',
        title: 'Data Analysis with Python',
        description: 'Learn data analysis using Python, pandas, NumPy, and matplotlib.',
        url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
        provider: 'freeCodeCamp',
        price: 'free',
        rating: 4.8,
        difficulty: 'intermediate',
        duration: '300 hours'
      },
      {
        type: 'Course',
        title: 'Python for Data Science and Machine Learning',
        description: 'Complete data science bootcamp with Python, pandas, NumPy, matplotlib, and scikit-learn.',
        url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
        provider: 'Udemy',
        price: 'paid',
        rating: 4.6,
        difficulty: 'intermediate',
        duration: '25 hours'
      },
      {
        type: 'Course',
        title: 'Introduction to Data Science in Python',
        description: 'Learn data manipulation, analysis, and visualization with Python.',
        url: 'https://www.coursera.org/learn/python-data-analysis',
        provider: 'Coursera',
        price: 'freemium',
        rating: 4.5,
        difficulty: 'intermediate',
        duration: '4 weeks'
      }
    ],
    'machine_learning': [
      {
        type: 'Course',
        title: 'Machine Learning with Python',
        description: 'Learn machine learning algorithms and implementation using Python and scikit-learn.',
        url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/',
        provider: 'freeCodeCamp',
        price: 'free',
        rating: 4.7,
        difficulty: 'advanced',
        duration: '300 hours'
      },
      {
        type: 'Course',
        title: 'Machine Learning A-Z',
        description: 'Comprehensive machine learning course covering supervised and unsupervised learning.',
        url: 'https://www.udemy.com/course/machinelearning/',
        provider: 'Udemy',
        price: 'paid',
        rating: 4.5,
        difficulty: 'intermediate',
        duration: '44 hours'
      },
      {
        type: 'Course',
        title: 'Machine Learning Course by Andrew Ng',
        description: 'Stanford\'s famous machine learning course taught by Andrew Ng.',
        url: 'https://www.coursera.org/learn/machine-learning',
        provider: 'Coursera',
        price: 'freemium',
        rating: 4.9,
        difficulty: 'intermediate',
        duration: '11 weeks'
      }
    ],
    'sql': [
      {
        type: 'Course',
        title: 'Relational Database Course',
        description: 'Learn SQL and relational database concepts through hands-on projects.',
        url: 'https://www.freecodecamp.org/learn/relational-database/',
        provider: 'freeCodeCamp',
        price: 'free',
        rating: 4.8,
        difficulty: 'beginner',
        duration: '300 hours'
      },
      {
        type: 'Course',
        title: 'The Complete SQL Bootcamp 2024',
        description: 'Master SQL from beginner to advanced with PostgreSQL.',
        url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
        provider: 'Udemy',
        price: 'paid',
        rating: 4.6,
        difficulty: 'beginner',
        duration: '9 hours'
      },
      {
        type: 'Practice',
        title: 'SQL Exercises on W3Schools',
        description: 'Practice SQL with interactive exercises and examples.',
        url: 'https://www.w3schools.com/sql/sql_exercises.asp',
        provider: 'W3Schools',
        price: 'free',
        rating: 4.3,
        difficulty: 'beginner',
        duration: 'Self-paced'
      }
    ]
  },

  // Design
  'design': {
    'ui_ux': [
      {
        type: 'Course',
        title: 'Google UX Design Professional Certificate',
        description: 'Industry-recognized UX design certification covering the complete design process.',
        url: 'https://www.coursera.org/professional-certificates/google-ux-design',
        provider: 'Coursera',
        price: 'paid',
        rating: 4.8,
        difficulty: 'beginner',
        duration: '6 months'
      },
      {
        type: 'Course',
        title: 'UI/UX Design Specialization',
        description: 'Complete UX design process from user research to prototyping.',
        url: 'https://www.coursera.org/specializations/ui-ux-design',
        provider: 'Coursera',
        price: 'freemium',
        rating: 4.6,
        difficulty: 'intermediate',
        duration: '4 months'
      },
      {
        type: 'Tutorial',
        title: 'Figma UI Design Tutorial',
        description: 'Complete Figma tutorial covering design basics to advanced features.',
        url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8',
        provider: 'YouTube',
        price: 'free',
        rating: 4.7,
        difficulty: 'beginner',
        duration: '4 hours'
      }
    ],
    'figma': [
      {
        type: 'Course',
        title: 'Figma Masterclass',
        description: 'Master Figma from basics to advanced features including prototyping and design systems.',
        url: 'https://www.udemy.com/course/figma-ux-ui-design-user-experience-tutorial-course/',
        provider: 'Udemy',
        price: 'paid',
        rating: 4.5,
        difficulty: 'beginner',
        duration: '12 hours'
      },
      {
        type: 'Tutorial',
        title: 'Figma Tutorial for Beginners',
        description: 'Learn Figma basics including components, auto-layout, and prototyping.',
        url: 'https://www.youtube.com/watch?v=3q3FV65ZrUs',
        provider: 'YouTube',
        price: 'free',
        rating: 4.6,
        difficulty: 'beginner',
        duration: '2 hours'
      }
    ]
  },

  // Marketing
  'marketing': {
    'digital_marketing': [
      {
        type: 'Certification',
        title: 'Google Digital Marketing & E-commerce Certificate',
        description: 'Comprehensive digital marketing certification covering SEO, SEM, social media, and analytics.',
        url: 'https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce',
        provider: 'Coursera',
        price: 'paid',
        rating: 4.7,
        difficulty: 'beginner',
        duration: '6 months'
      },
      {
        type: 'Course',
        title: 'Digital Marketing Specialization',
        description: 'Learn digital marketing strategy, social media, SEO, and analytics.',
        url: 'https://www.coursera.org/specializations/digital-marketing',
        provider: 'Coursera',
        price: 'freemium',
        rating: 4.5,
        difficulty: 'intermediate',
        duration: '8 months'
      },
      {
        type: 'Course',
        title: 'HubSpot Content Marketing Course',
        description: 'Free comprehensive course on content marketing strategy and execution.',
        url: 'https://academy.hubspot.com/courses/content-marketing',
        provider: 'HubSpot',
        price: 'free',
        rating: 4.6,
        difficulty: 'beginner',
        duration: '4 hours'
      }
    ]
  }
};

export async function generateVerifiedLearningResources(
  jobTitle: string,
  jobDescription: string = '',
  requirements: string[] = []
): Promise<VerifiedResource[]> {
  try {
    console.log('Generating verified learning resources for:', jobTitle);
    const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';
    const apiUrl = `${apiBase}/openai/skillsurger`;
    const response = await axios.post(apiUrl, {
      type: "generateVerifiedLearningResources",
      jobTitle,
      jobDescription,
      requirements
    });

    console.log('Backend response:', response.data);
    const content = response.data;
    if (!content.success) {
      console.error('Backend returned unsuccessful response:', content);
      throw new Error('No content received from OpenAI');
    }

    const parsedJson = content.data;
    console.log('Parsed JSON from backend:', parsedJson);
    
    if (!parsedJson.resources || !Array.isArray(parsedJson.resources)) {
        throw new Error("Invalid JSON structure from OpenAI. Missing 'resources' array.");
    }
    
    const resources = parsedJson.resources;
    console.log('Resources from backend:', resources);

    // Remove duplicates based on URL and title before verification
    const uniqueResources = resources.filter((resource: any, index: number, arr: any[]) => {
      return arr.findIndex(r => 
        r.url === resource.url || 
        r.title.toLowerCase() === resource.title.toLowerCase()
      ) === index;
    });

    console.log(`Removed ${resources.length - uniqueResources.length} duplicate resources.`);
    console.log('Unique resources after deduplication:', uniqueResources);

    // Asynchronously verify and enrich each resource
    const verifiedResources = await Promise.all(
      uniqueResources.map(async (resource: any) => {
        const { isValid } = await verifyLink(resource.url);
        const platformInfo = getPlatformInfo(resource.url);

        return {
          ...resource,
          verified: isValid,
          lastVerified: new Date().toISOString(),
          fallbackUrl: !isValid ? generateFallbackUrl(resource.url, resource.type, resource.title) : undefined,
          provider: resource.provider || (platformInfo ? platformInfo.name : 'Unknown'),
          rating: resource.rating || (platformInfo ? platformInfo.rating : undefined),
        };
      })
    );

    // Final deduplication after verification to catch any remaining duplicates
    const finalResources = verifiedResources.filter((resource, index, arr) => {
      return arr.findIndex(r => 
        r.url === resource.url || 
        r.title.toLowerCase() === resource.title.toLowerCase()
      ) === index;
    });

    console.log(`Generated and verified ${finalResources.length} unique resources for ${jobTitle}.`);
    console.log('Final resources being returned:', finalResources);
    return finalResources;

  } catch (error) {
    console.error('Error in generateVerifiedLearningResources:', error);
    // In case of any error (API call, parsing, etc.), return an empty array.
    // The higher-level function will handle this case.
    return [];
  }
}

/**
 * Retrieves a predefined list of learning resources based on a category.
 * This can be used as a fallback or for browsing generic paths.
 * @param category The category of resources to retrieve (e.g., 'software_development').
 * @returns An array of resource objects.
 */
export function getResourcesByCategory(category: string): any[] {
  switch (category.toLowerCase()) {
    case 'software_development':
    case 'programming':
      return [
        ...VERIFIED_LEARNING_RESOURCES.software_development.javascript,
        ...VERIFIED_LEARNING_RESOURCES.software_development.react,
        ...VERIFIED_LEARNING_RESOURCES.software_development.python
      ];
    case 'data_science':
    case 'analytics':
      return [
        ...VERIFIED_LEARNING_RESOURCES.data_science.python_data,
        ...VERIFIED_LEARNING_RESOURCES.data_science.machine_learning,
        ...VERIFIED_LEARNING_RESOURCES.data_science.sql
      ];
    case 'design':
      return [
        ...VERIFIED_LEARNING_RESOURCES.design.ui_ux,
        ...VERIFIED_LEARNING_RESOURCES.design.figma
      ];
    case 'marketing':
      return VERIFIED_LEARNING_RESOURCES.marketing.digital_marketing;
    default:
      return VERIFIED_LEARNING_RESOURCES.software_development.javascript;
  }
}