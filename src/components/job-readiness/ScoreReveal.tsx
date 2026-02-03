import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, Shield, CheckCircle, TrendingUp, Lock, Zap,
  FileText, Target, Star, AlertCircle, ArrowRight
} from 'lucide-react';
import { JobReadinessScore, ResumeAnalysis, QuizResult } from '../../pages/JobReadinessIndex';

type Props = {
  score: JobReadinessScore;
  resumeAnalysis: ResumeAnalysis;
  quizResult: QuizResult;
};

export default function ScoreReveal({ score, resumeAnalysis, quizResult }: Props) {
  const navigate = useNavigate();
  const [showConversionModal, setShowConversionModal] = useState(false);

  const getScoreLevel = (overall: number) => {
    if (overall >= 90) return { label: 'Elite Candidate', color: 'purple', emoji: '⭐' };
    if (overall >= 80) return { label: 'Highly Competitive', color: 'green', emoji: '🎯' };
    if (overall >= 60) return { label: 'Job-Ready', color: 'blue', emoji: '✓' };
    if (overall >= 40) return { label: 'Getting There', color: 'orange', emoji: '📈' };
    return { label: 'Needs Work', color: 'red', emoji: '⚠️' };
  };

  const scoreLevel = getScoreLevel(score.overall);

  const handleUpgradeClick = () => {
    setShowConversionModal(true);
  };

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
              Your Job Readiness Index
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
                  strokeDasharray={`${(score.overall / 100) * 552.64} 552.64`}
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
                <span className="text-6xl font-bold text-gray-900">{score.overall}</span>
                <span className="text-gray-500 text-lg">/100</span>
              </div>
            </div>

            <div className="mb-6">
              <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
                scoreLevel.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                scoreLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                scoreLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                scoreLevel.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {scoreLevel.emoji} {scoreLevel.label}
              </span>
            </div>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {score.overall >= 80
                ? "Excellent! You're ready to impress recruiters and land interviews."
                : score.overall >= 60
                ? "You're on the right track! A few improvements will make you even stronger."
                : "You have a solid foundation. Let's optimize your profile to boost your chances."}
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your Breakdown
            </h3>

            <div className="space-y-4">
              <ScoreBar
                icon={<FileText className="w-5 h-5" />}
                label="Resume Quality"
                score={score.resumeQuality}
                color="blue"
              />
              <ScoreBar
                icon={<Shield className="w-5 h-5" />}
                label="ATS Compatibility"
                score={score.atsCompatibility}
                color="green"
              />
              <ScoreBar
                icon={<CheckCircle className="w-5 h-5" />}
                label="Skill Verification"
                score={score.skillVerification}
                color="purple"
              />
              <ScoreBar
                icon={<Target className="w-5 h-5" />}
                label={`Role Match (${resumeAnalysis.jobTitle})`}
                score={score.roleAlignment}
                color="orange"
              />
            </div>
          </div>

          {/* Badges */}
          {score.badges.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Badges Earned
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {score.badges.map((badge, index) => (
                  <Badge key={index} name={badge} />
                ))}
              </div>
            </div>
          )}

          {/* Skills Verified */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-900">Skills Verified</h4>
              </div>
              <div className="space-y-2">
                {quizResult.skillsVerified.map((skill, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {quizResult.skillsFailed.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Needs Review</h4>
                </div>
                <div className="space-y-2">
                  {quizResult.skillsFailed.map((skill, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <AlertCircle className="w-4 h-4 text-orange-600 mr-2 flex-shrink-0" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA to unlock detailed insights */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <div className="mb-4">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <h3 className="text-2xl font-bold mb-2">
                Ready to Go from {score.overall} → 90+?
              </h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Sign up free (no credit card) to unlock your personalized action plan,
                AI-powered resume improver, and targeted interview prep.
              </p>
            </div>

            <button
              onClick={handleUpgradeClick}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Zap className="w-5 h-5 mr-2" />
              Unlock My Action Plan
            </button>

            <p className="text-sm text-blue-100 mt-4">
              ✓ No credit card required • ✓ Full access for 7 days • ✓ Your score is saved
            </p>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How You Compare
          </h3>

          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Your Score</span>
                <span className="font-bold text-blue-600">{score.overall}/100</span>
              </div>
              <div className="text-center py-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">You're performing better than</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.min(Math.round((score.overall / 100) * 85), 85)}%
                </p>
                <p className="text-sm text-gray-600">of users with similar experience</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Average scores by role:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{resumeAnalysis.jobTitle}:</span>
                  <span className="font-semibold">
                    72/100 {score.overall > 72 && <span className="text-green-600 ml-1">🎉</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">All roles:</span>
                  <span className="font-semibold">68/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What's Next?
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Improve Your Resume</h4>
              <p className="text-sm text-gray-600">
                Get line-by-line feedback and AI-powered suggestions to boost your score
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Close Skill Gaps</h4>
              <p className="text-sm text-gray-600">
                Access personalized learning paths for the skills you missed
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Practice Interviews</h4>
              <p className="text-sm text-gray-600">
                Prepare for real interviews with AI-powered mock sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Modal */}
      {showConversionModal && (
        <ConversionModal onClose={() => setShowConversionModal(false)} score={score} />
      )}
    </div>
  );
}

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

function Badge({ name }: { name: string }) {
  const badgeConfig: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
    'ATS Optimized': {
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-green-100 text-green-700 border-green-300',
      description: 'Your resume will pass most ATS systems'
    },
    'Skill Verified': {
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      description: "You've proven your skills are real"
    },
    'Interview-Ready': {
      icon: <Award className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      description: "You're ready to impress recruiters"
    },
    'Elite Candidate': {
      icon: <Star className="w-6 h-6" />,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      description: 'Top 10% of all job seekers'
    },
    'Perfect Score': {
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-pink-100 text-pink-700 border-pink-300',
      description: 'Aced the skill verification quiz!'
    }
  };

  const config = badgeConfig[name] || badgeConfig['Skill Verified'];

  return (
    <div className="group relative">
      <div className={`flex flex-col items-center p-4 rounded-xl border-2 ${config.color} transition-all hover:scale-110`}>
        {config.icon}
        <span className="text-sm font-bold mt-2">{name}</span>
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
          {config.description}
        </div>
      </div>
    </div>
  );
}

function ConversionModal({ onClose, score }: { onClose: () => void; score: JobReadinessScore }) {
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
            Ready to Go from {score.overall} → 90+?
          </h2>
          <p className="text-lg text-gray-600">
            Sign up free (no credit card) to unlock everything you need to get job-ready faster.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Feature
            icon={<FileText className="w-6 h-6 text-blue-600" />}
            title="Your personalized action plan"
            description="Fix these 3 things to add +8 points to your score"
          />
          <Feature
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            title="AI-powered resume improver"
            description="We'll rewrite weak sections for you in seconds"
          />
          <Feature
            icon={<Target className="w-6 h-6 text-green-600" />}
            title="Interview prep for your role"
            description="Practice the questions you got wrong with AI mock interviews"
          />
          <Feature
            icon={<Award className="w-6 h-6 text-orange-600" />}
            title="Job matching based on your score"
            description="Apply to roles you're 85%+ ready for"
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
          💡 93% of users improve their score within the first week
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
