export type Step = 'landing' | 'input' | 'analyzing' | 'results';

export interface ParsedProfile {
  headline: string;
  about: string;
  experienceBullets: string[];
  skills: string[];
  rawText: string;
}

export interface DimensionScores {
  headlineStrength: number;
  aboutSectionQuality: number;
  experienceImpact: number;
  keywordOptimization: number;
  profileCompleteness: number;
  recruiterAppeal: number;
}

export interface Improvement {
  priority: number;
  category: 'headline' | 'about' | 'experience' | 'keywords' | 'completeness';
  title: string;
  currentState: string;
  suggestion: string;
  impact: number; // Points gained
}

export interface HeadlineExample {
  before: string;
  after: string;
  explanation: string;
}

export interface ProfileAnalysis {
  overallScore: number;
  scores: DimensionScores;
  topImprovements: Improvement[];
  headlineExamples: HeadlineExample[];
  missingKeywords: string[];
  recruiterMessage: string;
}
