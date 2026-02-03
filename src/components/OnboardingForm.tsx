import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, Briefcase, Award } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import SEO from './SEO';

interface OnboardingData {
  fullName: string;
  currentRole: string;
  yearsOfExperience: string;
  workPreference: string;
  preferredLocations: string;
  // Education fields for freshers
  degree: string;
  institution: string;
  graduationYear: string;
  fieldOfStudy: string;
  gpa: string;
}

const workPreferences = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote_only', label: 'Remote' },
  { value: 'office_only', label: 'Office' }
];

export default function OnboardingForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'experienced' | 'fresher' | null>(null);
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    currentRole: '',
    yearsOfExperience: '',
    workPreference: 'hybrid',
    preferredLocations: '',
    // Education fields for freshers
    degree: '',
    institution: '',
    graduationYear: '',
    fieldOfStudy: '',
    gpa: ''
  });

  useEffect(() => {
    // Get user type from localStorage
    const selectedUserType = localStorage.getItem('selectedUserType') as 'experienced' | 'fresher' | null;
    if (selectedUserType) {
      setUserType(selectedUserType);
    } else {
      // If no user type selected, redirect back to selection
      navigate('/user-type-selection');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Prepare profile data based on user type
      const profileUpdateData: any = {
        full_name: formData.fullName,
        current_role: userType === 'experienced' ? formData.currentRole : null, // Let freshers decide their role later
        years_of_experience: userType === 'fresher' ? 0 : (parseInt(formData.yearsOfExperience, 10) || 0),
        remote_preference: formData.workPreference,
        preferred_locations: formData.preferredLocations.split(',').map(loc => loc.trim()).filter(Boolean),
        onboarding_completed: true,
        user_type: userType
      };

      // Add education data for freshers
      if (userType === 'fresher') {
        profileUpdateData.education = [{
          degree: formData.degree,
          institution: formData.institution,
          year: formData.graduationYear
        }];
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      // Clear the selected user type from localStorage
      localStorage.removeItem('selectedUserType');
      
      navigate('/dashboard?section=profile');
      window.location.reload();

    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const baseValid = formData.fullName.trim() && formData.preferredLocations.trim();
    
    if (userType === 'experienced') {
      return baseValid && formData.currentRole.trim() && formData.yearsOfExperience.trim();
    } else {
      return baseValid && formData.degree.trim() && formData.institution.trim() && formData.graduationYear.trim() && formData.fieldOfStudy.trim();
    }
  };


  // Show loading while determining user type
  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <SEO 
        title="Complete Your Profile | Skillsurger"
        description="Complete your profile to get personalized career recommendations and AI-powered guidance."
        canonicalUrl="/onboarding"
        noIndex={true}
      />
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Skillsurger!</h1>
          <p className="text-gray-600">Just a few more details to personalize your experience.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                userType === 'experienced' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <User className={`w-8 h-8 ${
                  userType === 'experienced' ? 'text-blue-600' : 'text-green-600'
                }`} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Final Touches</h2>
              <p className="text-gray-600 mt-2">
                {userType === 'experienced' 
                  ? 'The rest of your profile will be populated from your CV.' 
                  : 'Complete your profile to get started with your career journey.'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {userType === 'experienced' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Role *</label>
                    <div className="relative">
                      <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.currentRole}
                        onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Software Engineer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                    <div className="relative">
                      <Award className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter a number"
                      />
                    </div>
                  </div>
                </>
              )}

              {userType === 'fresher' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree/Qualification *</label>
                    <select
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select your degree</option>
                      <option value="High School">High School</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study *</label>
                    <input
                      type="text"
                      value={formData.fieldOfStudy}
                      onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Computer Science, Business Administration, Engineering..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution/University *</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Stanford University, MIT, IIT..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year *</label>
                      <input
                        type="number"
                        value={formData.graduationYear}
                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="2024"
                        min="1990"
                        max="2030"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GPA/Percentage (Optional)</label>
                      <input
                        type="text"
                        value={formData.gpa}
                        onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., 3.8/4.0 or 85%"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Preference</label>
                <select
                  value={formData.workPreference}
                  onChange={(e) => setFormData({ ...formData, workPreference: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {workPreferences.map(pref => (
                    <option key={pref.value} value={pref.value}>
                      {pref.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Working Locations *</label>
                <input
                  type="text"
                  value={formData.preferredLocations}
                  onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., New York, Remote, San Francisco"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple locations with commas</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Saving...' : 'Save and Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}