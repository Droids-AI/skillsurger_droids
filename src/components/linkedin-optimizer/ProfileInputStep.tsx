import { useState } from 'react';
import { ArrowLeft, Linkedin, AlertCircle, Info } from 'lucide-react';

interface Props {
  onAnalyze: (profileText: string) => void;
  onBack: () => void;
}

export default function ProfileInputStep({ onAnalyze, onBack }: Props) {
  const [profileText, setProfileText] = useState('');
  const [error, setError] = useState('');

  const MIN_CHARS = 500;
  const charCount = profileText.length;
  const isValid = charCount >= MIN_CHARS;

  const handleAnalyze = () => {
    if (!isValid) {
      setError(`Please paste at least ${MIN_CHARS} characters including your headline and about section.`);
      return;
    }

    // Basic validation - check for some content
    if (!profileText.toLowerCase().includes('experience') &&
        !profileText.toLowerCase().includes('about') &&
        profileText.split('\n').length < 5) {
      setError('Please include more profile content. Make sure to copy your headline, about section, and experience from LinkedIn.');
      return;
    }

    setError('');
    onAnalyze(profileText);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button
                onClick={onBack}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            </div>

            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Linkedin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Paste Your LinkedIn Profile
                </h2>
                <p className="text-gray-600 mt-1">
                  Copy your profile content from LinkedIn and paste it below
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <strong>How to copy your profile:</strong>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Go to your LinkedIn profile page</li>
                    <li>Select and copy everything from your headline down through your experience</li>
                    <li>Paste it in the box below</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="mb-6">
            <label htmlFor="profile-text" className="block text-sm font-semibold text-gray-700 mb-2">
              Profile Content
            </label>
            <textarea
              id="profile-text"
              rows={16}
              value={profileText}
              onChange={(e) => {
                setProfileText(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Paste your LinkedIn profile content here...

Include:
• Your headline
• About/Summary section
• Work experience descriptions
• Skills (optional but recommended)
• Education (optional)

Tip: Go to your LinkedIn profile, select all content, and paste it here. The more complete your profile content, the more accurate your assessment will be."
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-sm">
                {charCount >= MIN_CHARS ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-700 font-medium">
                      Ready to analyze ({charCount.toLocaleString()} characters)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-orange-700">
                      {charCount.toLocaleString()} / {MIN_CHARS.toLocaleString()} characters minimum
                    </span>
                  </>
                )}
              </div>

              <div className="text-sm text-gray-500">
                {charCount.toLocaleString()} characters
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-start bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Unable to analyze</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleAnalyze}
              disabled={!isValid}
              className={`inline-flex items-center px-8 py-4 font-bold rounded-xl shadow-lg transform transition-all ${
                isValid
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Linkedin className="w-5 h-5 mr-2" />
              Analyze Profile
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="w-12 h-1 bg-blue-200"></div>
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="w-12 h-1 bg-gray-200"></div>
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Step 1 of 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
