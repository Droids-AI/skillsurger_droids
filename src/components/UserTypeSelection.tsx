import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import Button from './Button';
import SEO from './SEO';

export default function UserTypeSelection() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'experienced' | 'fresher' | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      // Store the user type in localStorage to pass to the onboarding form
      localStorage.setItem('selectedUserType', selectedType);
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <SEO 
        title="Choose Your Profile Type | Skillsurger"
        description="Select your professional experience level to personalize your Skillsurger experience."
        canonicalUrl="/user-type-selection"
        noIndex={true}
      />
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Skillsurger!</h1>
          <p className="text-xl text-gray-600">Let's get to know you better. Are you an experienced professional or just starting your career?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Experienced Professional Option */}
          <div
            onClick={() => setSelectedType('experienced')}
            className="relative cursor-pointer transition-all duration-300 transform hover:scale-105"
          >
            <div className={`bg-white rounded-2xl shadow-lg p-8 h-full border-2 transition-all duration-300 ${
              selectedType === 'experienced'
                ? 'border-blue-500 shadow-2xl'
                : 'border-transparent hover:border-blue-200'
            }`}>
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  selectedType === 'experienced' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Briefcase className={`w-10 h-10 ${
                    selectedType === 'experienced' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Experienced Professional</h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  I have work experience and want to upload my CV for career optimization and growth opportunities.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Upload and analyze your existing CV
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Get personalized career suggestions
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Optimize your profile for better opportunities
                  </div>
                </div>
              </div>
            </div>
            
            {selectedType === 'experienced' && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          {/* Fresher Option */}
          <div
            onClick={() => setSelectedType('fresher')}
            className="relative cursor-pointer transition-all duration-300 transform hover:scale-105"
          >
            <div className={`bg-white rounded-2xl shadow-lg p-8 h-full border-2 transition-all duration-300 ${
              selectedType === 'fresher'
                ? 'border-green-500 shadow-2xl'
                : 'border-transparent hover:border-green-200'
            }`}>
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  selectedType === 'fresher' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <GraduationCap className={`w-10 h-10 ${
                    selectedType === 'fresher' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Fresher</h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  I'm starting my career and want to create a professional CV based on my education and interests.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    AI-generated professional CV
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Career-focused learning paths
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Entry-level job recommendations
                  </div>
                </div>
              </div>
            </div>
            
            {selectedType === 'fresher' && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className={`px-8 py-4 text-lg font-semibold ${
              selectedType
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
