import { useState } from 'react';
import SEO from '../components/SEO';
import LandingStep from '../components/linkedin-optimizer/LandingStep';
import ProfileInputStep from '../components/linkedin-optimizer/ProfileInputStep';
import AnalyzingStep from '../components/linkedin-optimizer/AnalyzingStep';
import ResultsStep from '../components/linkedin-optimizer/ResultsStep';
import { Step, ProfileAnalysis } from '../components/linkedin-optimizer/types';
import { analyzeLinkedInProfile } from '../lib/linkedinScoring';

export default function LinkedInProfileOptimizer() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);

  const handleAnalyze = (profileText: string) => {
    setCurrentStep('analyzing');

    // Simulate analysis delay (3-5 seconds)
    setTimeout(() => {
      const result = analyzeLinkedInProfile(profileText);
      setAnalysis(result);
      setCurrentStep('results');
    }, 3500);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'landing':
        return <LandingStep onStart={() => setCurrentStep('input')} />;

      case 'input':
        return (
          <ProfileInputStep
            onAnalyze={handleAnalyze}
            onBack={() => setCurrentStep('landing')}
          />
        );

      case 'analyzing':
        return <AnalyzingStep />;

      case 'results':
        return analysis ? <ResultsStep analysis={analysis} /> : null;

      default:
        return <LandingStep onStart={() => setCurrentStep('input')} />;
    }
  };

  return (
    <>
      <SEO
        title="Free LinkedIn Profile Checker & Optimizer | Get Your Recruiter Score"
        description="Paste your LinkedIn profile to get a free assessment with recruiter insights. Discover what's holding you back and get actionable tips to boost visibility and interview requests."
        keywords="linkedin profile checker, linkedin optimizer, linkedin headline generator, recruiter score, linkedin assessment, profile analysis"
        canonicalUrl="/linkedin-profile-optimizer"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 pt-24">
        {renderStep()}
      </div>
    </>
  );
}
