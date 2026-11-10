import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import ResumeUpload from '../components/job-readiness/ResumeUpload';
import SkillQuiz from '../components/job-readiness/SkillQuiz';
import ScoreReveal from '../components/job-readiness/ScoreReveal';
import { Upload, CheckCircle, Award, TrendingUp } from 'lucide-react';

export type ResumeAnalysis = {
  skills: string[];
  experience: string[];
  jobTitle: string;
  resumeQuality: number;
  atsCompatibility: number;
  resumeText: string;
};

export type QuizResult = {
  correctAnswers: number;
  totalQuestions: number;
  skillsVerified: string[];
  skillsFailed: string[];
};

export type JobReadinessScore = {
  overall: number;
  resumeQuality: number;
  atsCompatibility: number;
  skillVerification: number;
  roleAlignment: number;
  badges: string[];
};

type Step = 'landing' | 'upload' | 'processing' | 'quiz' | 'results';

export default function JobReadinessIndex() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [readinessScore, setReadinessScore] = useState<JobReadinessScore | null>(null);

  const handleResumeAnalyzed = (analysis: ResumeAnalysis) => {
    setResumeAnalysis(analysis);
    setCurrentStep('quiz');
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setReadinessScore(calculateReadinessScore(resumeAnalysis!, result));
    setCurrentStep('results');
  };

  const calculateReadinessScore = (analysis: ResumeAnalysis, quiz: QuizResult): JobReadinessScore => {
    // Scoring formula from design doc
    const skillVerificationScore = quiz.totalQuestions > 0 ? (quiz.correctAnswers / quiz.totalQuestions) * 100 : 0;

    // Role alignment calculation
    const roleAlignment = calculateRoleAlignment(analysis);

    // Overall score calculation
    const overall = Math.round(
      (analysis.resumeQuality * 0.30) +
      (analysis.atsCompatibility * 0.25) +
      (skillVerificationScore * 0.30) +
      (roleAlignment * 0.15)
    );

    // Badge calculation
    const badges = calculateBadges(overall, analysis.atsCompatibility, skillVerificationScore, quiz);

    return {
      overall,
      resumeQuality: analysis.resumeQuality,
      atsCompatibility: analysis.atsCompatibility,
      skillVerification: skillVerificationScore,
      roleAlignment,
      badges,
    };
  };

  const calculateRoleAlignment = (analysis: ResumeAnalysis): number => {
    // Simplified role alignment calculation
    // In production, this would use a more sophisticated matching algorithm
    const hasJobTitle = analysis.jobTitle ? 20 : 0;
    const skillsScore = Math.min((analysis.skills.length / 10) * 60, 60);
    const experienceScore = Math.min((analysis.experience.length / 3) * 20, 20);

    return Math.round(hasJobTitle + skillsScore + experienceScore);
  };

  const calculateBadges = (
    overall: number,
    atsScore: number,
    skillScore: number,
    quiz: QuizResult
  ): string[] => {
    const badges: string[] = [];

    if (atsScore >= 85) badges.push('ATS Optimized');
    if (skillScore >= 80) badges.push('Skill Verified');
    if (overall >= 80) badges.push('Interview-Ready');
    if (overall >= 90) badges.push('Elite Candidate');
    if (quiz.correctAnswers === quiz.totalQuestions) badges.push('Quiz: Perfect Score');

    return badges;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'landing':
        return <LandingSection onStart={() => setCurrentStep('upload')} />;
      case 'upload':
        return (
          <ResumeUpload
            onAnalysisComplete={handleResumeAnalyzed}
            onBack={() => setCurrentStep('landing')}
          />
        );
      case 'quiz':
        return (
          <SkillQuiz
            skills={resumeAnalysis!.skills}
            jobTitle={resumeAnalysis!.jobTitle}
            onQuizComplete={handleQuizComplete}
          />
        );
      case 'results':
        return (
          <ScoreReveal
            score={readinessScore!}
            resumeAnalysis={resumeAnalysis!}
            quizResult={quizResult!}
          />
        );
      default:
        return <LandingSection onStart={() => setCurrentStep('upload')} />;
    }
  };

  return (
    <>
      <SEO
        title="Free Job Readiness Index | Find Out If You're Truly Job-Ready"
        description="Upload your resume and take a quick skills quiz to get your personalized Job Readiness Score. Free ATS check, skill verification, and career insights in 5 minutes."
        keywords="job readiness assessment, resume checker, ATS scanner, skill verification, career readiness score"
        canonicalUrl="/job-readiness-index"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 pt-24">
        {renderStep()}
      </div>
    </>
  );
}

// Landing Section Component
function LandingSection({ onStart }: { onStart: () => void }) {
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Award className="w-4 h-4 mr-2" />
            100% Free • No Credit Card Required
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover Your<br />Job Readiness Index™
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find out if you're truly job-ready in 5 minutes. Upload your resume and take a quick skills quiz to get your personalized readiness score.
          </p>

          <div className="grid md:grid-cols-4 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">ATS Compatibility</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Skill Verification</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Readiness Score</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Career Insights</span>
            </div>
          </div>

          <button
            onClick={onStart}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Resume to Start
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Review your resume, test your skills, and find areas to improve
          </p>
          <p className="text-xs text-gray-500 mt-2 max-w-xl mx-auto">
            A quick rule-based check that runs in your browser: it looks at keywords, length and structure, plus your quiz answers. It is not an AI review. For AI feedback against a target role, use CV Scoring in your dashboard.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            What You'll Get:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>Job Readiness Score (0-100)</strong> based on resume quality, ATS compatibility, and verified skills
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>Personalized skill quiz</strong> to verify your claimed expertise
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>Unlockable badges</strong> like "ATS Optimized" and "Interview-Ready"
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>Detailed breakdown</strong> of your strengths and improvement areas
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

