import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Upload, Linkedin } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { generateCareerSuggestions, generateLearningPlan } from '../lib/openai';
import { generateFresherCV, generateFresherLearningPlan } from '../lib/careerServices';
import { uploadCV, parseCV } from '../lib/pdf';

type WizardStep = 'credentials' | 'profile' | 'interests' | 'career' | 'complete';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  userType: 'experienced' | 'fresher';
  cv: FileList;
  linkedinUrl: string;
  interests: string | string[];
  skills: string | string[];
  // Education fields for freshers
  degree: string;
  institution: string;
  graduationYear: string;
  fieldOfStudy: string;
  gpa: string;
  // Areas of interest for freshers
  careerInterests: string | string[];
}

export default function SignUpWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('credentials');
  const [userType, setUserType] = useState<'experienced' | 'fresher'>('experienced');
  const [careerSuggestions, setCareerSuggestions] = useState<string>('');
  const [learningPlan, setLearningPlan] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpData>();

  // Helper function to safely convert string/array fields
  const convertToStringArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    if (typeof value === 'string') {
      return value.split(',').map((item: string) => item.trim()).filter(Boolean);
    }
    return value;
  };

  const onSubmit = async (data: SignUpData) => {
    try {
      setError('');
      setUploading(true);

      // Create user account
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please log in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (!signUpData.user) {
        setError('Failed to create account. Please try again.');
        return;
      }

      let cvUrl = '';
      let parsedCvData = null;

      // Handle CV based on user type
      if (userType === 'experienced' && data.cv?.[0]) {
        // Parse and upload CV for experienced professionals
        parsedCvData = await parseCV(data.cv[0]);
        cvUrl = await uploadCV(data.cv[0], signUpData.user.id);
      } else if (userType === 'fresher') {
        // Generate AI CV for freshers
        const educationData = {
          degree: data.degree,
          institution: data.institution,
          graduationYear: data.graduationYear,
          fieldOfStudy: data.fieldOfStudy,
          gpa: data.gpa
        };
        
        const careerInterestsArray = convertToStringArray(data.careerInterests);
        const skillsArray = convertToStringArray(data.skills);
        const interestsArray = convertToStringArray(data.interests);

        parsedCvData = await generateFresherCV(
          educationData,
          careerInterestsArray,
          skillsArray,
          interestsArray
        );
      }

      // Check if parsed CV data is valid (not image-based PDF)
      const isValidParsedData = parsedCvData &&
        parsedCvData.summary &&
        !parsedCvData.summary.includes('image-based PDF') &&
        !parsedCvData.summary.includes('selectable text') &&
        (
          (parsedCvData.experience && parsedCvData.experience.length > 0) ||
          (parsedCvData.education && parsedCvData.education.length > 0) ||
          (parsedCvData.full_name && parsedCvData.full_name.trim().length > 0)
        );

      // Create profile with defaults if CV data is valid (first SkillSurger API call)
      const profileData: any = {
        id: signUpData.user.id,
        full_name: data.fullName,
        linkedin_url: data.linkedinUrl,
        cv_url: cvUrl,
        years_of_experience: userType === 'fresher' ? 0 : Math.round(Number(parsedCvData?.years_of_experience) || 0),
        current_role: userType === 'experienced' ? (parsedCvData?.current_role || '') : null, // Let freshers decide their role later
        summary: parsedCvData?.summary || '',
        experience: parsedCvData?.experience || [],
        projects: parsedCvData?.projects || [],
        skills: parsedCvData?.skills || [],
        education: parsedCvData?.education || [],
        cv_parsed_data: parsedCvData || {},
        cv_analyses_count: parsedCvData ? 1 : 0,
        user_type: userType // Add user type to profile
      };

      // Save as defaults on first signup if CV data is valid
      if (isValidParsedData) {
        console.log('✅ First signup with valid CV - saving as default values');
        profileData.summary_default = parsedCvData.summary;
        profileData.experience_default = parsedCvData.experience;
        profileData.projects_default = parsedCvData.projects;
        profileData.education_default = parsedCvData.education;
        profileData.certifications_default = parsedCvData.certifications;
        profileData.cv_parsed_data_default = parsedCvData;
        profileData.languages_default = parsedCvData.languages;
        profileData.full_name_default = parsedCvData.full_name;
        profileData.email_default = parsedCvData.email;
        profileData.phone_default = parsedCvData.phone;
        profileData.city_default = parsedCvData.city;
        profileData.state_default = parsedCvData.state;
        profileData.country_default = parsedCvData.country;
        profileData.current_role_default = parsedCvData.current_role;
        profileData.years_of_experience_default = Math.round(Number(parsedCvData.years_of_experience) || 0);
        profileData.skills_default = parsedCvData.skills;
      }

      // Add education data for freshers
      if (userType === 'fresher') {
        profileData.education = [{
          degree: data.degree,
          institution: data.institution,
          year: data.graduationYear
        }];
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        setError('Error creating profile. Please try again.');
        return;
      }

      // Add skills
      const skillsArray = convertToStringArray(data.skills);
      if (skillsArray.length > 0) {
        const { error: skillsError } = await supabase
          .from('user_skills')
          .insert(
            skillsArray.map((skill: string) => ({
              user_id: signUpData.user!.id,
              skill: skill
            }))
          );

        if (skillsError) {
          console.error('Error adding skills:', skillsError);
        }
      }

      // Add interests
      const interestsArray = convertToStringArray(data.interests);
      if (interestsArray.length > 0) {
        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(
            interestsArray.map((interest: string) => ({
              user_id: signUpData.user!.id,
              interest: interest
            }))
          );

        if (interestsError) {
          console.error('Error adding interests:', interestsError);
        }
      }

      // Generate career suggestions
      const suggestions = await generateCareerSuggestions(
        skillsArray,
        interestsArray
      );

      await supabase
        .from('career_suggestions')
        .insert([{
          user_id: signUpData.user.id,
          suggestion: suggestions
        }]);

      setCareerSuggestions(suggestions);

      // Generate learning plan based on user type
      let plan;
      if (userType === 'fresher') {
        const careerInterestsArray = convertToStringArray(data.careerInterests);
        
        // Generate learning plan for freshers based on career interests and education
        plan = await generateFresherLearningPlan(
          data.fieldOfStudy,
          careerInterestsArray,
          skillsArray
        );
      } else {
        plan = await generateLearningPlan(
          skillsArray[0] || ''
        );
      }

      await supabase
        .from('learning_plans')
        .insert([{
          user_id: signUpData.user.id,
          plan_content: plan
        }]);

      setLearningPlan(typeof plan === 'string' ? plan : JSON.stringify(plan));
      setCurrentStep('complete');

    } catch (error) {
      console.error('Error during sign up:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {currentStep === 'credentials' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
            <form onSubmit={handleSubmit(() => setCurrentStep('profile'))}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    {...register('password', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Professional Profile</h2>
            
            {/* Tab Switch */}
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setUserType('experienced')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    userType === 'experienced'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💼 Experienced Professional
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('fresher')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    userType === 'fresher'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🎓 Fresher
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(() => setCurrentStep('interests'))}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    {...register('fullName', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {userType === 'experienced' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upload CV (PDF)</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                              <span>Upload a file</span>
                              <input
                                type="file"
                                accept=".pdf"
                                className="sr-only"
                                {...register('cv')}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PDF up to 10MB</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LinkedIn Profile</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Linkedin className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          {...register('linkedinUrl')}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                    </div>
                  </>
                )}

                {userType === 'fresher' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Degree/Qualification</label>
                      <select
                        {...register('degree', { required: true })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                      <input
                        type="text"
                        {...register('fieldOfStudy', { required: true })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Computer Science, Business Administration, Engineering..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institution/University</label>
                      <input
                        type="text"
                        {...register('institution', { required: true })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Stanford University, MIT, IIT..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
                        <input
                          type="number"
                          {...register('graduationYear', { required: true })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="2024"
                          min="1990"
                          max="2030"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">GPA/Percentage (Optional)</label>
                        <input
                          type="text"
                          {...register('gpa')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g., 3.8/4.0 or 85%"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? 'Processing...' : 'Next'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'interests' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {userType === 'fresher' ? 'Career Interests & Skills' : 'Skills & Interests'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                {userType === 'fresher' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Career Areas of Interest</label>
                    <input
                      type="text"
                      {...register('careerInterests')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Software Development, Data Science, Marketing, Finance, Healthcare..."
                    />
                    <p className="text-sm text-gray-500 mt-1">What career paths interest you most?</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
                  <input
                    type="text"
                    {...register('skills')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder={userType === 'fresher' ? 'Programming, Problem Solving, Communication...' : 'JavaScript, Python, Project Management...'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interests (comma-separated)</label>
                  <input
                    type="text"
                    {...register('interests')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="AI, Web Development, Data Science..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? 'Processing...' : userType === 'fresher' ? 'Generate My CV & Complete Sign Up' : 'Complete Sign Up'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'complete' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Welcome to Skillsurger!</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Suggested Career Paths</h3>
                <div className="prose max-w-none">
                  {careerSuggestions}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Your Learning Plan</h3>
                <div className="prose max-w-none">
                  {learningPlan}
                </div>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}