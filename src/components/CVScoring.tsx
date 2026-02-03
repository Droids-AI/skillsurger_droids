import { useState, useEffect } from 'react';
import { Upload, FileText, Zap, CheckCircle, AlertCircle, Loader2, TrendingUp, Download, User, Save } from 'lucide-react';
import Button from './Button';
import { backendApi, type CVScore, type CVEnhancement } from '../lib/backendApi';
import { extractTextFromPdf } from '../lib/pdf';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

export default function CVScoring() {
  const { checkSubscriptionForAI } = useUser();
  const [cvText, setCvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [score, setScore] = useState<CVScore | null>(null);
  const [enhancedCV, setEnhancedCV] = useState<CVEnhancement | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'score' | 'enhanced'>('upload');
  const [useProfileCV, setUseProfileCV] = useState(false);
  const [profileCVUrl, setProfileCVUrl] = useState<string | null>(null);
  const [loadingProfileCV, setLoadingProfileCV] = useState(false);
  const [applyingToProfile, setApplyingToProfile] = useState(false);
  const [existingProjects, setExistingProjects] = useState<Array<any>>([]);

  useEffect(() => {
    loadProfileCV();
  }, []);

  const loadProfileCV = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('cv_url, projects')
        .eq('id', user.id)
        .single();

      if (profile?.cv_url) {
        setProfileCVUrl(profile.cv_url);
      }
      
      // Load existing projects to merge when enhancing
      if (profile?.projects && Array.isArray(profile.projects)) {
        setExistingProjects(profile.projects);
        console.log(`Loaded ${profile.projects.length} existing projects from profile`);
      }
    } catch (error) {
      console.error('Error loading profile CV:', error);
    }
  };

  const handleLoadProfileCV = async () => {
    if (!profileCVUrl) {
      setError('No CV found in your profile. Please upload a CV first.');
      return;
    }

    try {
      setLoadingProfileCV(true);
      setError('');

      // Fetch the CV file from the URL
      const response = await fetch(profileCVUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch CV from profile');
      }

      const blob = await response.blob();
      const fileName = profileCVUrl.split('/').pop() || 'profile-cv.pdf';
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // Extract text from PDF
      const text = await extractTextFromPdf(file);
      if (!text || text.trim().length === 0) {
        setError('Could not extract text from your profile CV.');
        return;
      }

      setFile(file);
      setCvText(text);
      setUseProfileCV(true);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Profile CV loaded successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (err: any) {
      console.error('Error loading profile CV:', err);
      setError(err.message || 'Failed to load profile CV');
    } finally {
      setLoadingProfileCV(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ['text/plain', 'application/pdf'];
    const validExtensions = ['.txt', '.pdf'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setError('Please upload a .txt or .pdf file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setLoading(true);
    setUseProfileCV(false);

    try {
      let text: string;

      if (selectedFile.type === 'application/pdf' || fileExtension === '.pdf') {
        // Extract text from PDF
        text = await extractTextFromPdf(selectedFile);
        if (!text || text.trim().length === 0) {
          setError('Could not extract text from PDF. Please ensure the PDF contains selectable text.');
          setLoading(false);
          return;
        }
      } else {
        // Read text file
        text = await selectedFile.text();
      }

      setCvText(text);
    } catch (err: any) {
      console.error('File reading error:', err);
      setError(err.message || 'Failed to read file');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreCV = async () => {
    if (!cvText.trim()) {
      setError('Please upload or paste your CV first');
      return;
    }

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Use streaming for scoring with progress updates
      const onProgress = (message: string, step?: number) => {
        console.log(`CV Scoring Progress: ${message} (${step}%)`);
      };
      
      const result = await backendApi.scoreCVText(cvText, onProgress);
      setScore(result);
      setActiveTab('score');
    } catch (err: any) {
      setError(err.message || 'Failed to score CV');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceCV = async () => {
    if (!cvText.trim()) {
      setError('Please upload or paste your CV first');
      return;
    }

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      setEnhancing(true);
      setError('');
      
      // Pass existing projects from profile to merge with CV projects
      const projectsToMerge = existingProjects.length > 0 ? existingProjects : undefined;
      if (projectsToMerge) {
        console.log(`Merging ${projectsToMerge.length} existing projects with CV projects`);
      }
      
      // Progress callback for streaming updates
      const onProgress = (message: string, step?: number) => {
        console.log(`CV Enhancement Progress: ${message} (${step}%)`);
        // Update progress message if needed (you can add state for this)
      };
      
      const result = await backendApi.enhanceCVText(
        cvText, 
        targetRole || undefined, 
        projectsToMerge,
        onProgress // Enable streaming
      );
      setEnhancedCV(result);
      
      // Automatically score the enhanced CV
      const newScore = await backendApi.scoreCVText(result.enhancedCV);
      setScore(newScore);
      setCvText(result.enhancedCV);
      
      setActiveTab('enhanced');
    } catch (err: any) {
      setError(err.message || 'Failed to enhance CV');
    } finally {
      setEnhancing(false);
    }
  };

  const downloadEnhancedCV = () => {
    if (!enhancedCV) return;

    const blob = new Blob([enhancedCV.enhancedCV], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enhanced-cv.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyToProfile = async () => {
    if (!enhancedCV) return;

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      setApplyingToProfile(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Use the enhanced parsed data directly (no need to re-parse)
      console.log('Applying enhanced CV data to profile...');
      const parsedData = enhancedCV.parsedData;

      // Check if this is the first AI enhancement (no valid defaults exist yet)
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('cv_parsed_data_default')
        .eq('id', user.id)
        .single();

      // Check if defaults are valid (not empty/image-based PDF)
      const hasValidDefaults = currentProfile?.cv_parsed_data_default &&
        currentProfile.cv_parsed_data_default.summary &&
        !currentProfile.cv_parsed_data_default.summary.includes('image-based PDF') &&
        !currentProfile.cv_parsed_data_default.summary.includes('selectable text') &&
        (
          (currentProfile.cv_parsed_data_default.experience && currentProfile.cv_parsed_data_default.experience.length > 0) ||
          (currentProfile.cv_parsed_data_default.education && currentProfile.cv_parsed_data_default.education.length > 0) ||
          (currentProfile.cv_parsed_data_default.full_name && currentProfile.cv_parsed_data_default.full_name.trim().length > 0)
        );

      // This is the FIRST valid AI enhancement - save as defaults
      const isFirstEnhancement = !hasValidDefaults;

      // Prepare update object
      const updateData: any = {
        summary: parsedData.summary,
        experience: parsedData.experience,
        projects: parsedData.projects,
        education: parsedData.education,
        certifications: parsedData.certifications,
        cv_parsed_data: parsedData,
        languages: parsedData.languages,
        ...(parsedData.full_name && { full_name: parsedData.full_name }),
        ...(parsedData.email && { email: parsedData.email }),
        ...(parsedData.phone && { phone: parsedData.phone }),
        ...(parsedData.city && {
          city: parsedData.city,
          state: parsedData.state,
          country: parsedData.country
        }),
        ...(parsedData.current_role && { current_role: parsedData.current_role }),
        ...(parsedData.years_of_experience && { years_of_experience: Math.round(Number(parsedData.years_of_experience) || 0) })
      };

      // Save as defaults ONLY on first enhancement
      if (isFirstEnhancement) {
        console.log('✅ First AI enhancement - saving as default values:', parsedData);
        updateData.summary_default = parsedData.summary;
        updateData.experience_default = parsedData.experience;
        updateData.projects_default = parsedData.projects;
        updateData.education_default = parsedData.education;
        updateData.certifications_default = parsedData.certifications;
        updateData.cv_parsed_data_default = parsedData;
        updateData.languages_default = parsedData.languages;
        updateData.full_name_default = parsedData.full_name;
        updateData.email_default = parsedData.email;
        updateData.phone_default = parsedData.phone;
        updateData.city_default = parsedData.city;
        updateData.state_default = parsedData.state;
        updateData.country_default = parsedData.country;
        updateData.current_role_default = parsedData.current_role;
        updateData.years_of_experience_default = Math.round(Number(parsedData.years_of_experience) || 0);
        updateData.skills_default = parsedData.skills;
      } else {
        console.log('ℹ️ Subsequent enhancement - defaults preserved, only updating current data');
      }

      // Update profile with enhanced data
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update skills if available
      if (parsedData.skills && parsedData.skills.length > 0) {
        // Get existing skills
        const { data: existingSkills } = await supabase
          .from('user_skills')
          .select('skill')
          .eq('user_id', user.id);

        const currentSkills = existingSkills?.map(s => s.skill) || [];
        const allSkills = [...new Set([...currentSkills, ...parsedData.skills])];

        // Delete existing skills and insert merged skills
        await supabase.from('user_skills').delete().eq('user_id', user.id);

        if (allSkills.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
            .insert(allSkills.map(skill => ({ user_id: user.id, skill })));

          if (skillsError) throw skillsError;
        }
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Enhanced CV applied to your profile successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (err: any) {
      console.error('Error applying enhanced CV to profile:', err);
      setError(err.message || 'Failed to apply enhanced CV to profile');

      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to apply enhanced CV. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setApplyingToProfile(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI CV Scoring & Enhancement</h1>
        <p className="text-gray-600">Upload your CV to get an AI-powered score and automatic enhancements</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* CV Score Section - Full Width at Top */}
        {score && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold">CV Analysis Results</h2>
              </div>
              {enhancedCV && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  ✨ Enhanced
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-6 gap-6 mb-8">
              {/* Overall Score - Large */}
              <div className="md:col-span-2 flex flex-col items-center justify-center">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(score.overallScore)} border-4 ${score.overallScore >= 80 ? 'border-green-600' : score.overallScore >= 60 ? 'border-yellow-600' : 'border-red-600'}`}>
                  <span className={`text-5xl font-bold ${getScoreColor(score.overallScore)}`}>
                    {score.overallScore}
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-700 mt-3">Overall Score</p>
                <p className="text-sm text-gray-500">
                  {score.overallScore >= 80 ? 'Excellent' : score.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>

              {/* Detailed Scores */}
              <div className="md:col-span-4 space-y-4">
                {Object.entries(score.scores).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-900 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`font-bold ${getScoreColor(value)}`}>
                        {value}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          value >= 80 ? 'bg-green-600' : value >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Strengths */}
              {score.strengths.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-base font-bold text-green-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {score.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start">
                        <span className="text-green-600 mr-2 font-bold">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {score.weaknesses.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-base font-bold text-red-900 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {score.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-red-800 flex items-start">
                        <span className="text-red-600 mr-2 font-bold">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {score.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-base font-bold text-blue-900 mb-3 flex items-center">
                    <Zap className="w-5 h-5 text-blue-600 mr-2" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {score.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start">
                        <span className="text-blue-600 mr-2 font-bold">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Section - Full Width Below Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <Upload className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold">Upload & Analyze Your CV</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Upload Column */}
              <div className="md:col-span-1 space-y-4">
                {/* Use Profile CV Button */}
                {profileCVUrl && (
                  <div>
                    <Button
                      onClick={handleLoadProfileCV}
                      disabled={loadingProfileCV || loading}
                      variant="outline"
                      className="w-full"
                    >
                      {loadingProfileCV ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 mr-2" />
                          Use Profile CV
                        </>
                      )}
                    </Button>
                    {useProfileCV && (
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Using CV from profile
                      </p>
                    )}
                  </div>
                )}

                <div className="text-center text-gray-500 text-sm py-2">
                  {profileCVUrl ? 'OR Upload New CV' : 'Upload CV'}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CV File (.txt or .pdf)
                  </label>
                  <input
                    type="file"
                    accept=".txt,.pdf,application/pdf,text/plain"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  {file && !useProfileCV && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {file.name}
                    </p>
                  )}
                  {loading && !score && (
                    <p className="text-sm text-blue-600 mt-2 flex items-center">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Extracting text from PDF...
                    </p>
                  )}
                </div>

                <div className="text-center text-gray-500 text-sm py-2">Options</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleScoreCV}
                    disabled={loading || !cvText.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scoring...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Score CV
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleEnhanceCV}
                    disabled={enhancing || !cvText.trim()}
                    variant="secondary"
                    className="w-full"
                  >
                    {enhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Enhance CV
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* CV Text Column */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CV Text Preview
                </label>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your CV content here or upload a file..."
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cvText.length} characters
                </p>
              </div>
            </div>
        </div>

        {/* Enhanced CV Section - Full Width */}
        {enhancedCV && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Zap className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-xl font-bold">Enhanced CV</h2>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleApplyToProfile}
                  disabled={applyingToProfile}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {applyingToProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Apply to Profile
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadEnhancedCV}
                  size="sm"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Changes Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 mb-3">✨ Key Improvements Made</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {enhancedCV.changesSummary.map((change, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-800">{change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced CV Preview */}
            <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {enhancedCV.enhancedCV}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

