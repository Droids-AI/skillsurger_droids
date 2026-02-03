import { CheckCircle, Linkedin } from 'lucide-react';

export default function AnalyzingStep() {
  const steps = [
    'Extracting profile sections',
    'Analyzing headline strength',
    'Evaluating about section quality',
    'Checking keyword optimization',
    'Calculating recruiter appeal score',
  ];

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
            <Linkedin className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Analyzing Your LinkedIn Profile...
          </h2>
          <p className="text-gray-600">
            Evaluating against recruiter best practices
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              {index < 4 ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 mr-3 flex-shrink-0">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <span className={`${index < 4 ? 'text-gray-700' : 'text-blue-600 font-semibold'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800">
            <strong>Did you know?</strong> 97% of recruiters use LinkedIn to find candidates, but only 3% of profiles are optimized for recruiter search.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Analysis Progress</span>
            <span>80%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
              style={{ width: '80%' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
