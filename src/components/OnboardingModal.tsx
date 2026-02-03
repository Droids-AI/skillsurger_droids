import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import Button from './Button';

const steps = [
  {
    title: 'Let\'s start',
    description: 'This will take less than 30 minutes. No studying. No guessing. Just a few simple steps to bring clarity to your job search.',
  },
  {
    title: 'Upload resume on profile',
    description: 'Let our AI analyze your resume and give you instant feedback to improve it.',
    why: 'Because small résumé gaps silently block good applications.',
    path: '/dashboard?section=profile',
  },
  {
    title: 'Match to a job role',
    description: 'Find jobs that actually match your skills and experience.',
    why: 'Because applying everywhere reduces your chances everywhere.',
    path: '/dashboard?section=career',
  },
  {
    title: 'Practice interview answers',
    description: 'Practice with AI and get real-time feedback on your answers.',
    why: 'Because confidence comes from practice, not memory.',
    path: '/mock-interview',
  },
];

export default function OnboardingModal() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem('onboarding_completed');

    // Show modal on /get-started or /dashboard if not completed
    if ((location.pathname === '/get-started' || location.pathname === '/dashboard') && !hasCompleted) {
      setIsOpen(true);
    }
  }, [location.pathname]);

  if (!isOpen) {
    return null;
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Navigate to the page if it has a path
      if (steps[nextStep].path) {
        setTimeout(() => {
          navigate(steps[nextStep].path);
        }, 500);
      }
    } else {
      // Complete onboarding
      localStorage.setItem('onboarding_completed', 'true');
      setIsOpen(false);
      navigate('/dashboard?section=profile');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsOpen(false);
    navigate('/dashboard');
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden">
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <div className="text-center mb-8">
            {/* Step indicator dots */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    index < currentStep
                      ? 'w-8 h-2 bg-green-500'
                      : index === currentStep
                      ? 'w-8 h-2 bg-blue-600'
                      : 'w-2 h-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {currentStepData.title}
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Why this matters */}
            {currentStepData.why && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Why {currentStepData.title.toLowerCase()}?
                </p>
                <p className="text-sm text-blue-800">
                  {currentStepData.why}
                </p>
              </div>
            )}

            {/* Checklist for welcome screen */}
            {currentStep === 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">
                  Here's what we'll do:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-gray-700">Upload your résumé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-gray-700">Match to a job role</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-gray-700">Practise interview answers</span>
                  </div>
                </div>
              </div>
            )}

            {/* Success message for last step */}
            {currentStep === steps.length - 1 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center text-green-800">
                  <p className="font-medium">Almost done! Click Finish to complete setup.</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkip}
              className="order-2 sm:order-1"
            >
              Skip
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white order-1 sm:order-2"
            >
              {currentStep === 0
                ? "Let's Get Started"
                : currentStep === steps.length - 1
                ? 'Finish'
                : 'Next'}
            </Button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Your progress is saved automatically
          </p>
        </div>
      </div>
    </div>
  );
}
