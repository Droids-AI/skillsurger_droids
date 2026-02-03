import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Zap, FileText, TrendingUp, Search, Eye, Lock,
  ArrowRight, AlertCircle, Target, Award
} from 'lucide-react';
import { ProfileAnalysis } from './types';

interface Props {
  analysis: ProfileAnalysis;
}

export default function ResultsStep({ analysis }: Props) {
  const navigate = useNavigate();
  const [showConversionModal, setShowConversionModal] = useState(false);

  const getScoreLevel = (score: number) => {
    if (score >= 85) return { label: 'Elite LinkedIn Profile', color: 'purple', emoji: '⭐' };
    if (score >= 70) return { label: 'Strong Profile', color: 'green', emoji: '✓' };
    if (score >= 50) return { label: 'Good Foundation', color: 'blue', emoji: '📈' };
    return { label: 'Needs Optimization', color: 'orange', emoji: '⚠️' };
  };

  const scoreLevel = getScoreLevel(analysis.overallScore);

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        {/* Main Score Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4 mr-2" />
              Analysis Complete
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your LinkedIn Profile Score
            </h1>

            {/* Score Circle */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(analysis.overallScore / 100) * 552.64} 552.64`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-gray-900">{analysis.overallScore}</span>
                <span className="text-gray-500 text-lg">/100</span>
              </div>
            </div>

            <div className="mb-6">
              <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
                scoreLevel.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                scoreLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                scoreLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {scoreLevel.emoji} {scoreLevel.label}
              </span>
            </div>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {analysis.recruiterMessage}
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your 6-Dimension Breakdown
            </h3>

            <div className="space-y-4">
              <ScoreBar
                icon={<Zap className="w-5 h-5" />}
                label="Headline Strength"
                score={analysis.scores.headlineStrength}
                color="blue"
              />
              <ScoreBar
                icon={<FileText className="w-5 h-5" />}
                label="About Section Quality"
                score={analysis.scores.aboutSectionQuality}
                color="green"
              />
              <ScoreBar
                icon={<TrendingUp className="w-5 h-5" />}
                label="Experience Impact"
                score={analysis.scores.experienceImpact}
                color="purple"
              />
              <ScoreBar
                icon={<Search className="w-5 h-5" />}
                label="Keyword Optimization"
                score={analysis.scores.keywordOptimization}
                color="orange"
              />
              <ScoreBar
                icon={<CheckCircle className="w-5 h-5" />}
                label="Profile Completeness"
                score={analysis.scores.profileCompleteness}
                color="blue"
              />
              <ScoreBar
                icon={<Eye className="w-5 h-5" />}
                label="Recruiter Appeal"
                score={analysis.scores.recruiterAppeal}
                color="green"
              />
            </div>
          </div>

          {/* Top 5 Improvements */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Top 5 Improvements to Boost Your Score
            </h3>

            <div className="space-y-4">
              {analysis.topImprovements.map((improvement, index) => (
                <ImprovementCard key={index} improvement={improvement} />
              ))}
            </div>
          </div>

          {/* Before/After Headline Examples */}
          {analysis.headlineExamples.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Headline Transformation Examples
              </h3>

              <div className="space-y-6">
                {analysis.headlineExamples.map((example, index) => (
                  <HeadlineComparison key={index} example={example} />
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Keywords Recruiters Are Searching For
              </h3>

              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Add these to your headline, about section, or skills to appear in more recruiter searches:
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 bg-white border-2 border-blue-200 text-blue-800 rounded-lg font-medium text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversion Hook */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <div className="mb-4">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <h3 className="text-2xl font-bold mb-2">
                Ready to Go from {analysis.overallScore} → 90+?
              </h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Sign up free (no credit card) to unlock AI-powered profile rewrites, keyword optimization, and recruiter visibility tools.
              </p>
            </div>

            <div className="mb-6 text-left max-w-2xl mx-auto">
              <div className="space-y-3">
                <PremiumFeature text="AI-generated headline rewrites (3 custom options)" />
                <PremiumFeature text="Complete about section rewrite with impact metrics" />
                <PremiumFeature text="Experience bullet optimizer with action verbs" />
                <PremiumFeature text="Target role alignment tool" />
                <PremiumFeature text="Monthly profile health check and score tracking" />
              </div>
            </div>

            <button
              onClick={() => setShowConversionModal(true)}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Zap className="w-5 h-5 mr-2" />
              Unlock My Profile Optimizer - Free for 7 Days
            </button>

            <p className="text-sm text-blue-100 mt-4">
              ✓ No credit card required • ✓ Full access for 7 days • ✓ Your score is saved
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Modal */}
      {showConversionModal && (
        <ConversionModal
          onClose={() => setShowConversionModal(false)}
          score={analysis.overallScore}
        />
      )}
    </div>
  );
}

// ScoreBar Component
function ScoreBar({ icon, label, score, color }: {
  icon: React.ReactNode;
  label: string;
  score: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-100 text-${color}-600 mr-4 flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-900">{score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-1000 ease-out`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// ImprovementCard Component
function ImprovementCard({ improvement }: { improvement: any }) {
  const categoryIcons: Record<string, React.ReactNode> = {
    headline: <Zap className="w-5 h-5 text-blue-600" />,
    about: <FileText className="w-5 h-5 text-green-600" />,
    experience: <TrendingUp className="w-5 h-5 text-purple-600" />,
    keywords: <Search className="w-5 h-5 text-orange-600" />,
    completeness: <CheckCircle className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm mr-4">
          {categoryIcons[improvement.category] || <Target className="w-5 h-5 text-gray-600" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold text-gray-900">{improvement.title}</h4>
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
              +{improvement.impact} pts
            </span>
          </div>
        </div>
      </div>

      <div className="ml-14">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-600 mb-1">Current State:</p>
          <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200">
            {improvement.currentState}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Suggested Improvement:</p>
          <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200">
            {improvement.suggestion}
          </p>
        </div>
      </div>
    </div>
  );
}

// HeadlineComparison Component
function HeadlineComparison({ example }: { example: any }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-blue-200">
      <div className="space-y-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-2xl mr-3">❌</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 mb-1">Before:</p>
              <p className="text-gray-700 font-medium">{example.before}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-2xl mr-3">✅</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">After:</p>
              <p className="text-gray-700 font-medium">{example.after}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Why it works:</p>
          <p className="text-sm text-blue-800">{example.explanation}</p>
        </div>
      </div>
    </div>
  );
}

// PremiumFeature Component
function PremiumFeature({ text }: { text: string }) {
  return (
    <div className="flex items-start">
      <CheckCircle className="w-5 h-5 text-blue-100 mr-3 mt-0.5 flex-shrink-0" />
      <span className="text-blue-50">{text}</span>
    </div>
  );
}

// ConversionModal Component
function ConversionModal({ onClose, score }: { onClose: () => void; score: number }) {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Go from {score} → 90+?
          </h2>
          <p className="text-lg text-gray-600">
            Sign up free (no credit card) to unlock AI-powered profile optimization tools.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Feature
            icon={<Zap className="w-6 h-6 text-blue-600" />}
            title="AI-generated headline rewrites"
            description="Get 3 custom headline options optimized for your role and industry"
          />
          <Feature
            icon={<FileText className="w-6 h-6 text-purple-600" />}
            title="Complete about section rewrite"
            description="Transform your about section with compelling storytelling and metrics"
          />
          <Feature
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            title="Experience bullet optimizer"
            description="Turn weak bullets into powerful achievement statements"
          />
          <Feature
            icon={<Target className="w-6 h-6 text-orange-600" />}
            title="Target role alignment"
            description="Paste job descriptions and optimize your profile to match"
          />
          <Feature
            icon={<Award className="w-6 h-6 text-pink-600" />}
            title="Monthly profile health check"
            description="Track your score over time and get ongoing recommendations"
          />
        </div>

        <button
          onClick={handleSignup}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 mb-4"
        >
          <div className="flex items-center justify-center">
            Start Free 7-Day Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </div>
        </button>

        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            No credit card required
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            Full access for 7 days
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          84% of users improve their profile score within 48 hours
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 mr-4">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
