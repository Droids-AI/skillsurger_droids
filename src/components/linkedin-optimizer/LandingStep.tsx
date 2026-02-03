import { Award, CheckCircle, Zap, Target, TrendingUp, Eye, Lock, Linkedin } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function LandingStep({ onStart }: Props) {
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Award className="w-4 h-4 mr-2" />
            100% Free • No Credit Card Required
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Is Your LinkedIn Profile<br />Costing You Opportunities?
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get a recruiter's perspective on your profile in 5 minutes. Discover what's holding you back and get actionable tips to boost visibility and interview requests.
          </p>

          <div className="grid md:grid-cols-4 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Profile Score</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Keyword Analysis</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Headline Rewrite</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Recruiter Appeal</span>
            </div>
          </div>

          <button
            onClick={onStart}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            <Linkedin className="w-5 h-5 mr-2" />
            Analyze My LinkedIn Profile
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Used by 3,000+ professionals • Average score improvement: +18 points
          </p>
        </div>

        {/* What You'll Get Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-2xl mx-auto mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            What You'll Get:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>LinkedIn Profile Score (0-100)</strong> based on 6 key dimensions recruiters care about
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>6-Dimension breakdown</strong> covering headline, about section, experience, keywords, completeness, and recruiter appeal
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>Top 5 improvement recommendations</strong> with specific, actionable suggestions
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>Before/after headline examples</strong> showing how to transform generic headlines into magnets
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                <strong>Missing keyword insights</strong> to help you appear in more recruiter searches
              </span>
            </li>
          </ul>
        </div>

        {/* Trust Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Your Privacy is Protected
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• We analyze only the content you paste—never access your LinkedIn account</li>
                <li>• We don't store your LinkedIn password or login credentials</li>
                <li>• Your profile data is analyzed securely and deleted after 24 hours</li>
                <li>• No spam, no data sharing—your information stays private</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
