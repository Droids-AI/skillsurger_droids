import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Search, FileText, Brain, Download, ExternalLink, Bookmark,
  BookmarkCheck, Trash2, AlertTriangle, Plus, X, Sparkles, Target, MapPin, BookOpen, ChevronDown, ChevronUp, Mail
} from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import CVEditor from './CVEditor';
import CVSuggestionManager from './CVSuggestionManager';
import {
  type CareerOption,
  type JobOpportunity,
  type CVSuggestion,
  generateCareerOptions,
  findJobOpportunities,
  generateCVSuggestions
} from '../lib/careerServices';
import { cleanTruncatedDescription } from '../lib/utils';
import { useUser } from '../context/UserContext';
import axios from 'axios';

interface AcceptedSuggestions {
  summary?: string;
  skills?: string[];
  experienceImprovements?: Array<{ original: string; improved: string }>;
  [key: string]: any;
}

interface ExperienceItem {
  id?: string;
  title?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  description: string;
}

interface CareerExplorerProps {
  onGenerateLearningPath: (job: JobOpportunity) => void;
  jobs: JobOpportunity[];
  setJobs: (jobs: JobOpportunity[]) => void;
  selectedCareer: string;
  setSelectedCareer: (career: string) => void;
}

export default function CareerExplorer({ onGenerateLearningPath, jobs, setJobs, selectedCareer, setSelectedCareer }: CareerExplorerProps) {
  const navigate = useNavigate();
  const { checkSubscriptionForAI } = useUser();
  const [careerOptions, setCareerOptions] = useState<CareerOption[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [cvSuggestions, setCvSuggestions] = useState<CVSuggestion | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingJob, setSavingJob] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showCVEditor, setShowCVEditor] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [getEditedData, setGetEditedData] = useState<(() => { summary: string; experienceImprovements: Array<{ original: string; improved: string }> }) | null>(null);
  // Remove acceptedSuggestions, rejectedSuggestions, and all Accept/Reject logic
  // Add a single button to apply all suggestions

  // New state for custom form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [referenceJobDescription, setReferenceJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  // Track which generation method was used for job finding
  const [lastGenerationMethod, setLastGenerationMethod] = useState<'profile' | 'interests'>('profile');
  const [lastCustomFormData, setLastCustomFormData] = useState<any>(null);
  const [jobSearchLoading, setJobSearchLoading] = useState(false);

  // Hiring manager feature state
  const [hiringManagerLoading, setHiringManagerLoading] = useState<string | null>(null);
  const [hiringManagerResults, setHiringManagerResults] = useState<{ [key: string]: any }>({});
  const [revealEmailLoading, setRevealEmailLoading] = useState<string | null>(null); // jobKey when loading
  const [revealedEmails, setRevealedEmails] = useState<{ [jobKey: string]: { foundEmail: string; emailVerification: any } }>({});
  const [showEmailDraft, setShowEmailDraft] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [expandedJobDescriptions, setExpandedJobDescriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUserData();
    loadSavedCareers();
    // Don't load saved jobs by default - we'll show actual job postings instead
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load comprehensive profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        console.log('Loaded complete profile data:', profileData);
      }

      // Load skills
      const { data: skills } = await supabase
        .from('user_skills')
        .select('skill')
        .eq('user_id', user.id);

      if (skills) {
        setUserSkills(skills.map(s => s.skill));
      }

      // Load interests
      const { data: interests } = await supabase
        .from('user_interests')
        .select('interest')
        .eq('user_id', user.id);

      if (interests) {
        setUserInterests(interests.map(i => i.interest));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async function loadSavedCareers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load only the latest careers (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: careers, error: careersError } = await supabase
        .from('generated_careers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5); // Only show latest 5 careers

      if (careersError) throw careersError;

      if (careers) {
        setCareerOptions(careers.map(career => ({
          id: career.id,
          title: career.title,
          description: career.description,
          requiredSkills: career.required_skills,
          potentialCompanies: career.potential_companies,
          growthPotential: career.growth_potential
        })));
      }
    } catch (error) {
      console.error('Error loading saved careers:', error);
    }
  }

  async function loadSavedJobs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load only the latest jobs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: savedJobs, error: jobsError } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      if (savedJobs) {
        // Create a set of saved job identifiers for quick lookup
        const savedJobIdentifiers = new Set(
          savedJobs.map(job => `${job.title}-${job.company}`)
        );
        setSavedJobIds(savedJobIdentifiers);

        setJobs(savedJobs.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          type: job.type,
          salary: job.salary
        })));
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  }

  async function saveCareerOptions(options: CareerOption[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete old careers (older than 30 days) to keep only latest
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await supabase
        .from('generated_careers')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

      const careersToSave = options.map(option => ({
        user_id: user.id,
        title: option.title,
        description: option.description,
        required_skills: option.requiredSkills,
        potential_companies: option.potentialCompanies,
        growth_potential: option.growthPotential
      }));

      const { error } = await supabase
        .from('generated_careers')
        .insert(careersToSave);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving career options:', error);
      throw error;
    }
  }

  // Helper function to save job to database (used for auto-save)
  async function saveJobToDatabase(job: JobOpportunity) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if job already exists
      const { data: existingJob } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', job.title)
        .eq('company', job.company)
        .single();

      if (existingJob) {
        console.log('Job already exists in database');
        return;
      }

      // Save the job
      const jobToSave = {
        user_id: user.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        type: job.type,
        salary: job.salary
      };

      const { error } = await supabase
        .from('saved_jobs')
        .insert([jobToSave]);

      if (error) throw error;
      console.log('Job auto-saved to database successfully');
    } catch (error) {
      console.error('Error auto-saving job to database:', error);
      // Don't throw error here as it shouldn't stop the CV suggestions generation
    }
  }

  async function saveJob(job: JobOpportunity) {
    try {
      setSavingJob(`${job.title}-${job.company}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const jobToSave = {
        user_id: user.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        type: job.type,
        salary: job.salary
      };

      const { error } = await supabase
        .from('saved_jobs')
        .insert([jobToSave]);

      if (error) throw error;

      // Update local state
      setSavedJobIds(prev => new Set([...prev, `${job.title}-${job.company}`]));

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Job "${job.title}" saved successfully!`;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error saving job:', error);
      setError('Failed to save job');
    } finally {
      setSavingJob(null);
    }
  }

  const handleDeleteCareer = async (careerIndex: number) => {
    const deleteKey = `career-${careerIndex}`;

    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const career = careerOptions[careerIndex];

      // Delete from database
      const { error } = await supabase
        .from('generated_careers')
        .delete()
        .eq('user_id', user.id)
        .eq('title', career.title);

      if (error) throw error;

      // Update local state
      setCareerOptions(prev => prev.filter((_, index) => index !== careerIndex));
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Career "${career.title}" deleted successfully!`;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting career:', error);
      setError('Failed to delete career option');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteJob = async (jobIndex: number) => {
    const deleteKey = `job-${jobIndex}`;

    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const job = jobs[jobIndex];

      // Delete from database
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('title', job.title)
        .eq('company', job.company);

      if (error) throw error;

      // Update local state
      const newJobs = jobs.filter((_, index) => index !== jobIndex);
      setJobs(newJobs);
      setSavedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${job.title}-${job.company}`);
        return newSet;
      });
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Job "${job.title}" deleted successfully!`;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllCareers = async () => {
    const deleteKey = 'all-careers';

    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all careers from database
      const { error } = await supabase
        .from('generated_careers')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCareerOptions([]);
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'All career options deleted successfully!';
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting all careers:', error);
      setError('Failed to delete all career options');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllJobs = async () => {
    const deleteKey = 'all-jobs';

    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all jobs from database
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setJobs([]);
      setSavedJobIds(new Set());
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'All saved jobs deleted successfully!';
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting all jobs:', error);
      setError('Failed to delete all saved jobs');
    } finally {
      setDeleting(null);
    }
  };

  const renderDeleteButton = (deleteKey: string, onDelete: () => void, label: string) => {
    const isConfirming = showDeleteConfirm === deleteKey;
    const isDeleting = deleting === deleteKey;

    if (!isConfirming) {
      return (
        <Button
          onClick={onDelete}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600">Delete {label}?</span>
        <Button
          onClick={onDelete}
          disabled={isDeleting}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? 'Deleting...' : 'Yes'}
        </Button>
        <Button
          onClick={() => setShowDeleteConfirm(null)}
          disabled={isDeleting}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    );
  };

  const isJobSaved = (job: JobOpportunity) => {
    return savedJobIds.has(`${job.title}-${job.company}`);
  };

  const generateJobApplicationUrl = (job: JobOpportunity) => {
    // If the job has an applicationUrl (from Adzuna API), use it directly
    if (job.applicationUrl) {
      return job.applicationUrl;
    }

    // Fallback to generating URLs for jobs without direct application links
    const companyName = job.company.toLowerCase().replace(/\s+/g, '');
    const jobTitle = job.title.toLowerCase().replace(/\s+/g, '-');

    // Common job board URLs based on company patterns
    const jobBoards = [
      `https://careers.${companyName}.com/jobs/${jobTitle}`,
      `https://jobs.lever.co/${companyName}/${jobTitle}`,
      `https://boards.greenhouse.io/${companyName}/jobs/${jobTitle}`,
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}`,
      `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title + ' ' + job.company)}`,
      `https://www.glassdoor.com/Jobs/${job.company.replace(/\s+/g, '-')}-jobs-SRCH_KE0,${job.company.length}.htm`
    ];

    // Return a random job board URL for demonstration
    return jobBoards[Math.floor(Math.random() * jobBoards.length)];
  };

  const handleGenerateCareerOptions = async () => {
    try {
      setLoading(true);
      setError('');

      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setLoading(false);
        return;
      }

      // Clear old career options to show only latest
      setCareerOptions([]);

      // Prepare comprehensive profile data for career generation
      const comprehensiveProfileData = {
        skills: userSkills,
        interests: userInterests,
        yearsOfExperience: profile?.years_of_experience || 0,
        currentRole: profile?.current_role || '',
        desiredRole: profile?.desired_role || '',
        location: {
          city: profile?.city || '',
          state: profile?.state || '',
          country: profile?.country || ''
        },
        workPreferences: {
          workType: profile?.preferred_work_type || '',
          remotePreference: profile?.remote_preference || '',
          willingToRelocate: profile?.willing_to_relocate || false,
          preferredLocations: profile?.preferred_locations || []
        },
        salaryExpectations: {
          min: profile?.min_salary_expectation || null,
          max: profile?.max_salary_expectation || null
        },
        education: profile?.education || [],
        experience: profile?.experience || [],
        languages: profile?.languages || [],
        summary: profile?.summary || ''
      };

      console.log('Generating latest careers with comprehensive data:', comprehensiveProfileData);

      const options = await generateCareerOptions(
        userSkills,
        userInterests,
        profile?.years_of_experience || 0,
        comprehensiveProfileData
      );

      await saveCareerOptions(options);
      setCareerOptions(options);
      setLastGenerationMethod('profile');

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Generated ${options.length} latest career options!`;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error generating career options:', error);
      setError('Failed to generate career options');
    } finally {
      setLoading(false);
    }
  };

  // Custom form handlers
  const handleAddCustomInterest = () => {
    if (customInterestInput.trim() && !customInterests.includes(customInterestInput.trim())) {
      setCustomInterests([...customInterests, customInterestInput.trim()]);
      setCustomInterestInput('');
    }
  };

  const handleRemoveCustomInterest = (index: number) => {
    setCustomInterests(customInterests.filter((_, i) => i !== index));
  };

  const handleGenerateCustomCareerOptions = async () => {
    if (customInterests.length === 0) {
      setError('Please add at least one interest');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setLoading(false);
        return;
      }

      // Clear old career options to show only latest
      setCareerOptions([]);

      // Create a custom profile data based on form inputs only
      const customProfileData = {
        skills: [], // No specific skills from form
        interests: customInterests,
        yearsOfExperience: experienceLevel ? parseInt(experienceLevel) : 0,
        currentRole: '',
        desiredRole: '',
        location: {
          city: customLocation.split(',')[0]?.trim() || '',
          state: customLocation.split(',')[1]?.trim() || '',
          country: customLocation.split(',')[2]?.trim() || customLocation
        },
        workPreferences: {
          workType: '',
          remotePreference: 'no_preference',
          willingToRelocate: false,
          preferredLocations: customLocation ? [customLocation] : []
        },
        salaryExpectations: {
          min: null,
          max: null
        },
        education: [],
        experience: [],
        languages: [],
        summary: referenceJobDescription || '',
        referenceJobDescription: referenceJobDescription
      };

      console.log('Generating careers with custom interests and job description:', customProfileData);

      const options = await generateCareerOptions(
        [], // No specific skills
        customInterests,
        experienceLevel ? parseInt(experienceLevel) : 0,
        customProfileData
      );

      await saveCareerOptions(options);
      setCareerOptions(options);
      setLastGenerationMethod('interests');

      // Store the custom form data for job finding
      setLastCustomFormData({
        interests: customInterests,
        experienceLevel: experienceLevel ? parseInt(experienceLevel) : 0,
        location: customLocation,
        referenceJobDescription: referenceJobDescription
      });

      // Reset form
      setCustomInterests([]);
      setCustomInterestInput('');
      setReferenceJobDescription('');
      setExperienceLevel('');
      setCustomLocation('');
      setShowCustomForm(false);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Generated ${options.length} career options based on your interests!`;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error generating custom career options:', error);
      setError('Failed to generate career options');
    } finally {
      setLoading(false);
    }
  };

  const autoSaveJobs = async (jobs: JobOpportunity[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping auto-save');
        return;
      }

      // First, clear all previous saved jobs for this user
      const { error: deleteError } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error clearing previous jobs:', deleteError);
        // Continue with saving new jobs even if clearing fails
      } else {
        console.log('Previous jobs cleared successfully');
      }

      // Prepare jobs for saving
      const jobsToSave = jobs.map(job => ({
        user_id: user.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements || [],
        type: job.type || 'Full-time',
        salary: job.salary || ''
      }));

      // Save all new jobs
      const { error: insertError } = await supabase
        .from('saved_jobs')
        .insert(jobsToSave);

      if (insertError) {
        console.error('Error auto-saving jobs:', insertError);
        setError('Jobs found but failed to save automatically. You can save them manually.');
      } else {
        console.log(`Successfully auto-saved ${jobs.length} jobs`);

        // Update local state
        const savedJobIdentifiers = new Set(
          jobs.map(job => `${job.title}-${job.company}`)
        );
        setSavedJobIds(savedJobIdentifiers);

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = `Auto-saved ${jobs.length} jobs successfully!`;
        document.body.appendChild(successDiv);

        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error in auto-save process:', error);
      setError('Jobs found but failed to save automatically. You can save them manually.');
    }
  };

  // Function to filter and sort jobs by location match - show matching location jobs at top
  const filterAndSortJobsByLocation = (jobs: JobOpportunity[], searchLocation: string): JobOpportunity[] => {
    if (!searchLocation || !searchLocation.trim()) {
      console.log('No search location provided, returning jobs as-is');
      return jobs; // No location, return as is
    }

    const searchLocationLower = searchLocation.toLowerCase().trim();
    console.log('🔍 Filtering jobs by location:', searchLocationLower);
    console.log('📊 Total jobs received:', jobs.length);

    // Handle city name variations (e.g., Bangalore/Bengaluru)
    const cityVariations: { [key: string]: string[] } = {
      'bangalore': ['bangalore', 'bengaluru'],
      'bengaluru': ['bangalore', 'bengaluru'],
      'mumbai': ['mumbai', 'bombay'],
      'bombay': ['mumbai', 'bombay'],
      'chennai': ['chennai', 'madras'],
      'madras': ['chennai', 'madras'],
      'kolkata': ['kolkata', 'calcutta'],
      'calcutta': ['kolkata', 'calcutta'],
      'pune': ['pune', 'poona'],
      'poona': ['pune', 'poona']
    };

    // Split by comma to get individual location parts (city, state, country)
    const locationParts = searchLocationLower.split(',').map(part => part.trim()).filter(Boolean);

    // Get the primary location part (usually the city) for more flexible matching
    const primaryLocation = locationParts[0] || searchLocationLower;

    // Get all variations of the primary location
    const primaryLocationVariations = cityVariations[primaryLocation] || [primaryLocation];

    console.log('📍 Primary location:', primaryLocation);
    console.log('🔄 Location variations:', primaryLocationVariations);

    // Separate jobs into matching and non-matching
    const matchingJobs: JobOpportunity[] = [];
    const nonMatchingJobs: JobOpportunity[] = [];

    jobs.forEach((job, index) => {
      const jobLocation = (job.location || '').toLowerCase().trim();

      if (!jobLocation) {
        nonMatchingJobs.push(job);
        return;
      }

      // Check if any variation of the primary location appears in the job location
      const matchesPrimaryLocation = primaryLocationVariations.some(variation =>
        jobLocation.includes(variation)
      );

      // Also check if any location part matches
      const matchesAnyPart = locationParts.some(part => {
        const partVariations = cityVariations[part] || [part];
        return partVariations.some(variation => jobLocation.includes(variation));
      });

      if (matchesPrimaryLocation || matchesAnyPart) {
        matchingJobs.push(job);
        if (index < 3) {
          console.log(`✅ Match ${index + 1}: "${job.title}" at "${job.location}"`);
        }
      } else {
        nonMatchingJobs.push(job);
        if (index < 3) {
          console.log(`❌ No match ${index + 1}: "${job.title}" at "${job.location}"`);
        }
      }
    });

    console.log('📈 Location filtering results:', {
      searchLocation: searchLocation,
      totalJobs: jobs.length,
      matchingJobs: matchingJobs.length,
      nonMatchingJobs: nonMatchingJobs.length,
      sampleMatchingLocations: matchingJobs.slice(0, 5).map(j => j.location),
      sampleNonMatchingLocations: nonMatchingJobs.slice(0, 5).map(j => j.location)
    });

    // Return only matching jobs when location is specified
    // Only include non-matching jobs if no matching jobs found
    if (matchingJobs.length > 0) {
      console.log('✅ Returning only location-matching jobs:', matchingJobs.length);
      return matchingJobs;
    }

    // If no matching jobs, return all jobs but log warning
    console.log('⚠️ No jobs match the location. Returning all jobs as fallback.');
    return nonMatchingJobs;
  };

  const handleFindJobs = async (careerTitle: string) => {
    try {
      setJobSearchLoading(true);
      setError('');
      setSelectedCareer(careerTitle);

      let location = '';

      // Priority order: lastCustomFormData > customLocation > profile data
      if (lastCustomFormData && lastCustomFormData.location) {
        location = lastCustomFormData.location;
      } else if (customLocation.trim()) {
        location = customLocation.trim();
      } else {
        // Fall back to profile data
        const preferredLocations = profile?.preferred_locations;
        if (preferredLocations && preferredLocations.length > 0) {
          location = preferredLocations[0];
        } else {
          location = profile?.city || '';
        }
      }

      // Normalize location - ensure Indian cities include country if not specified
      const locationLower = location.toLowerCase().trim();
      const indianCities = ['bangalore', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'kolkata', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar', 'amritsar', 'dhanbad', 'jodhpur', 'raipur', 'allahabad', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'madurai', 'guwahati', 'chandigarh', 'hubli', 'mysore', 'gurgaon', 'noida', 'kochi', 'bhubaneswar', 'dehradun', 'mangalore', 'belgaum', 'tiruchirappalli', 'bikaner', 'amravati', 'nanded', 'kolhapur', 'sangli', 'jalandhar', 'bathinda', 'panipat', 'karnal', 'hisar', 'rohtak', 'sonipat', 'dharamshala', 'shimla', 'solan', 'mandi', 'kullu', 'manali', 'dharamsala'];

      // Check if location is an Indian city without country specified
      if (indianCities.some(city => locationLower.includes(city)) && !locationLower.includes('india') && !locationLower.includes('in,')) {
        // Add India to the location if not already present
        if (locationLower.includes(',')) {
          // If it has a comma, check if country is missing
          const parts = location.split(',').map(p => p.trim());
          if (parts.length === 1 || (parts.length === 2 && !parts[1].toLowerCase().includes('india'))) {
            location = `${location}, India`;
          }
        } else {
          // If no comma, add city with India
          location = `${location}, India`;
        }
      }

      // Determine country code from location string or profile
      let countryCode = 'us'; // default

      // First try to detect from location string
      const locationLowerForCountry = location.toLowerCase();
      if (locationLowerForCountry.includes('india') || locationLowerForCountry.includes(', in')) {
        countryCode = 'in';
      } else if (locationLowerForCountry.includes('united states') || locationLowerForCountry.includes('usa') || locationLowerForCountry.includes(', us')) {
        countryCode = 'us';
      } else if (locationLowerForCountry.includes('united kingdom') || locationLowerForCountry.includes('uk') || locationLowerForCountry.includes(', uk')) {
        countryCode = 'uk';
      } else if (locationLowerForCountry.includes('australia') || locationLowerForCountry.includes(', au')) {
        countryCode = 'au';
      } else if (locationLowerForCountry.includes('canada') || locationLowerForCountry.includes(', ca')) {
        countryCode = 'ca';
      } else if (locationLowerForCountry.includes('germany') || locationLowerForCountry.includes(', de')) {
        countryCode = 'de';
      } else if (locationLowerForCountry.includes('france') || locationLowerForCountry.includes(', fr')) {
        countryCode = 'fr';
      } else if (locationLowerForCountry.includes('spain') || locationLowerForCountry.includes(', es')) {
        countryCode = 'es';
      } else if (locationLowerForCountry.includes('italy') || locationLowerForCountry.includes(', it')) {
        countryCode = 'it';
      } else if (locationLowerForCountry.includes('netherlands') || locationLowerForCountry.includes(', nl')) {
        countryCode = 'nl';
      } else if (locationLowerForCountry.includes('brazil') || locationLowerForCountry.includes(', br')) {
        countryCode = 'br';
      } else if (locationLowerForCountry.includes('mexico') || locationLowerForCountry.includes(', mx')) {
        countryCode = 'mx';
      } else if (locationLowerForCountry.includes('japan') || locationLowerForCountry.includes(', jp')) {
        countryCode = 'jp';
      } else if (locationLowerForCountry.includes('south korea') || locationLowerForCountry.includes('korea') || locationLowerForCountry.includes(', kr')) {
        countryCode = 'kr';
      } else if (locationLowerForCountry.includes('singapore') || locationLowerForCountry.includes(', sg')) {
        countryCode = 'sg';
      } else if (profile?.country) {
        // Fall back to profile country if location doesn't specify
        const countryMap: { [key: string]: string } = {
          'United States': 'us',
          'USA': 'us',
          'US': 'us',
          'United Kingdom': 'uk',
          'UK': 'uk',
          'India': 'in',
          'Australia': 'au',
          'Canada': 'ca',
          'Germany': 'de',
          'France': 'fr',
          'Spain': 'es',
          'Italy': 'it',
          'Netherlands': 'nl',
          'Brazil': 'br',
          'Mexico': 'mx',
          'Japan': 'jp',
          'South Korea': 'kr',
          'Singapore': 'sg'
        };
        countryCode = countryMap[profile.country] || 'us';
      }

      // Create job search context
      const jobSearchContext = {
        jobTitle: careerTitle,
        location: { city: location },
        workPreferences: {
          remotePreference: profile?.remote_preference || 'no_preference'
        },
        profile: {
          yearsOfExperience: profile?.years_of_experience || 0,
          skills: userSkills,
          interests: userInterests
        },
        countryCode: countryCode // Add country code for Adzuna API
      };

      console.log('🔍 Searching for jobs with context:', jobSearchContext);
      console.log('📍 Location being used for search:', location);
      console.log('📍 Location type:', typeof location, 'Length:', location?.length);

      const opportunities = await findJobOpportunities(jobSearchContext);
      console.log('📦 Jobs received from API:', opportunities.length);
      console.log('📦 First 3 job locations from API:', opportunities.slice(0, 3).map(j => j.location));

      // Filter and sort jobs by location - show matching location jobs at top
      const filteredAndSortedJobs = filterAndSortJobsByLocation(opportunities, location);

      console.log('✅ Final filtered jobs count:', filteredAndSortedJobs.length);
      console.log('✅ First 3 locations after filtering:', filteredAndSortedJobs.slice(0, 3).map(j => j.location));

      setJobs(filteredAndSortedJobs);

      if (filteredAndSortedJobs.length === 0) {
        setError('No job opportunities found for this career path. Try adjusting your search criteria.');
      } else {
        // Auto-save all fetched jobs and clear previous ones
        await autoSaveJobs(filteredAndSortedJobs);
      }
    } catch (error) {
      console.error('Error finding jobs:', error);
      setError('Failed to fetch job opportunities. Please try again.');
    } finally {
      setJobSearchLoading(false);
    }
  };

  const handleGenerateCVSuggestions = async (job: JobOpportunity) => {
    try {
      setLoading(true);
      setError('');

      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setLoading(false);
        return;
      }

      if (!profile) {
        setError('Please complete your profile first');
        return;
      }

      // Create comprehensive CV data including ALL profile fields
      const comprehensiveCVData = {
        personalInfo: {
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          location: [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
          linkedinUrl: profile.linkedin_url || ''
        },
        professional: {
          currentRole: profile.current_role || '',
          desiredRole: profile.desired_role || '',
          yearsOfExperience: profile.years_of_experience || 0,
          summary: profile.summary || ''
        },
        experience: profile.experience || [],
        education: profile.education || [],
        skills: [...(profile.skills || []), ...userSkills],
        projects: profile.projects || [],
        languages: profile.languages || [],
        preferences: {
          workType: profile.preferred_work_type || '',
          remotePreference: profile.remote_preference || '',
          salaryRange: {
            min: profile.min_salary_expectation || null,
            max: profile.max_salary_expectation || null
          }
        },
        interests: userInterests
      };

      console.log('Generating CV suggestions with comprehensive data:', comprehensiveCVData);

      // Auto-save the job first
      await saveJobToDatabase(job);

      const suggestions = await generateCVSuggestions(
        JSON.stringify(comprehensiveCVData),
        job
      );

      setCvSuggestions(suggestions);
      setSelectedJob(job);
      setShowSuggestions(true);
      setGetEditedData(null); // Reset edited data when new suggestions are generated
      // Remove acceptedSuggestions, rejectedSuggestions, and all Accept/Reject logic
      // Add a single button to apply all suggestions
    } catch (error) {
      console.error('Error generating CV suggestions:', error);
      setError('Failed to generate CV suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Remove acceptedSuggestions, rejectedSuggestions, and all Accept/Reject logic
  // Add a single button to apply all suggestions

  const handleUpdateCV = async (updatedData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedData.fullName,
          current_role: updatedData.title,
          email: updatedData.email,
          phone: updatedData.phone,
          city: updatedData.location.split(',')[0]?.trim(),
          state: updatedData.location.split(',')[1]?.trim(),
          country: updatedData.location.split(',')[2]?.trim(),
          summary: updatedData.summary,
          experience: updatedData.experience,
          education: updatedData.education,
          skills: updatedData.skills,
          languages: updatedData.languages
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Reload user data to reflect changes
      await loadUserData();

      // Show success notification
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'CV has been successfully updated!';
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error updating CV:', error);
      setError('Failed to update CV');
    }
  };

  const handleFindJobsBasedOnProfile = async () => {
    try {
      setJobSearchLoading(true);
      setError('');

      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setJobSearchLoading(false);
        return;
      }

      // Check if we have profile data
      if (!profile || (!profile.current_role && !userSkills.length)) {
        setError('Please complete your profile first to find jobs based on your information');
        setJobSearchLoading(false);
        return;
      }

      // Prepare job search context based on profile data
      const jobSearchContext = {
        jobTitle: profile.current_role || profile.cv_parsed_data?.current_role || '',
        location: {
          city: profile.city || profile.cv_parsed_data?.city || '',
          state: profile.state || profile.cv_parsed_data?.state || '',
          country: profile.country || profile.cv_parsed_data?.country || 'United States'
        },
        skills: userSkills,
        experience: profile.years_of_experience || profile.cv_parsed_data?.years_of_experience || 0,
        summary: profile.summary || profile.cv_parsed_data?.summary || ''
      };

      console.log('Searching for jobs based on profile:', jobSearchContext);

      // First get AI-powered job search recommendations
      const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';
      const apiUrl = `${apiBase}/openai/skillsurger`;

      let jobSearchRecommendations = null;
      try {
        const recommendationsResponse = await axios.post(apiUrl, {
          type: 'findJobsBasedOnProfile',
          profileData: jobSearchContext
        });
        jobSearchRecommendations = recommendationsResponse.data.data;
        console.log('AI Job Search Recommendations:', jobSearchRecommendations);
      } catch (recommendationError) {
        console.warn('Failed to get AI recommendations, proceeding with direct search:', recommendationError);
      }

      // Use AI recommendations to enhance job search if available
      let enhancedJobSearchContext = jobSearchContext;
      if (jobSearchRecommendations && jobSearchRecommendations.suggestedJobTitles?.length > 0) {
        // Use the first suggested job title for search
        enhancedJobSearchContext = {
          ...jobSearchContext,
          jobTitle: jobSearchRecommendations.suggestedJobTitles[0]
        };
      }

      // Find job opportunities directly
      const foundJobs = await findJobOpportunities(enhancedJobSearchContext);

      // Determine location to use for filtering
      const searchLocation = profile.city
        ? `${profile.city}${profile.state ? `, ${profile.state}` : ''}${profile.country ? `, ${profile.country}` : ''}`
        : '';

      // Filter and sort jobs by location - show matching location jobs at top
      const filteredAndSortedJobs = filterAndSortJobsByLocation(foundJobs, searchLocation);

      if (filteredAndSortedJobs.length === 0) {
        setError('No jobs found matching your profile. Try adjusting your search criteria or location.');
        setJobSearchLoading(false);
        return;
      }

      // Update jobs state with found jobs (filtered and sorted)
      setJobs(filteredAndSortedJobs);
      setLastGenerationMethod('profile');

      // Show success message with AI recommendations
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';

      let successMessage = `Found ${foundJobs.length} jobs based on your profile!`;
      if (jobSearchRecommendations) {
        successMessage += `\n\nAI Recommendations:\n• Experience Level: ${jobSearchRecommendations.experienceLevel || 'Not specified'}\n• Industry Focus: ${jobSearchRecommendations.industryFocus || 'Not specified'}`;
        if (jobSearchRecommendations.suggestedJobTitles?.length > 0) {
          successMessage += `\n• Suggested Roles: ${jobSearchRecommendations.suggestedJobTitles.slice(0, 2).join(', ')}`;
        }
      }

      successDiv.innerHTML = `
        <div class="font-medium">Job Search Complete!</div>
        <div class="text-sm mt-1 whitespace-pre-line">${successMessage}</div>
      `;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 5000);

    } catch (error) {
      console.error('Error finding jobs based on profile:', error);
      setError('Failed to find jobs based on your profile. Please try again.');
    } finally {
      setJobSearchLoading(false);
    }
  };

  const handleFindHiringManager = async (job: JobOpportunity) => {
    const jobKey = `${job.title}-${job.company}`;

    try {
      setHiringManagerLoading(jobKey);
      setError('');

      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setHiringManagerLoading(null);
        return;
      }

      // Extract and format location from job posting
      let formattedLocation = '';
      let cityName = '';
      let stateName = '';

      if (job.location) {
        // Clean and format location
        const locationParts = job.location.split(',').map(part => part.trim());

        // Extract city (first part)
        cityName = locationParts[0] || '';

        // Extract state (second part if exists)
        stateName = locationParts[1] || '';

        // Build formatted location with emphasis on India
        if (cityName) {
          formattedLocation = cityName;
          if (stateName) {
            formattedLocation += ` ${stateName}`;
          }
          formattedLocation += ' India';
        } else {
          formattedLocation = 'India';
        }
      } else {
        formattedLocation = 'India';
      }

      // Format LinkedIn search query with location emphasis: "{jobTitle} manager {company} {city} {state} India"
      // Prioritize location at the end for better filtering
      // Use simpler city name without commas for better LinkedIn search
      const cleanCityName = cityName.replace(/,/g, '').trim();
      const cleanStateName = stateName.replace(/,/g, '').trim();
      // Search for employees at the company who might provide a referral
      const linkedInSearchQuery = `${job.title} ${job.company} ${cleanCityName}${cleanStateName ? ` ${cleanStateName}` : ''} India`.trim();

      // Prepare job data for backend
      const jobData = {
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description,
        companyUrl: job.companyUrl,
        location: job.location || formattedLocation,
        city: cleanCityName,
        state: cleanStateName,
        country: 'India',
        linkedInSearchQuery: linkedInSearchQuery,
        searchLocation: formattedLocation, // Explicit location for filtering
        filterByLocation: true, // Flag to emphasize location filtering
        locationPriority: 'high', // High priority for location matching
        requirements: job.requirements || [],
        // Indicate we want a referral request message, not a hiring manager approach
        messageType: 'referral_request',
        messageInstructions: 'Generate a message asking for a referral and explaining why the candidate is a perfect fit for the role. Do not assume the person is a hiring manager - they could be anyone at the company who might refer the candidate.',
        profileData: {
          currentRole: profile?.current_role || profile?.cv_parsed_data?.current_role || '',
          skills: userSkills,
          experience: profile?.years_of_experience || profile?.cv_parsed_data?.years_of_experience || 0,
          summary: profile?.summary || profile?.cv_parsed_data?.summary || '',
          fullName: profile?.full_name || profile?.cv_parsed_data?.full_name || '',
          email: profile?.email || profile?.cv_parsed_data?.email || ''
        }
      };

      console.log('Finding contact for referral:', jobData);

      // Call backend API
      const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';
      const apiUrl = `${apiBase}/openai/skillsurger`;

      const response = await axios.post(apiUrl, {
        type: 'findHiringManager',
        jobData: jobData
      });

      const result = response.data.data;
      console.log('Contact for referral result:', result);

      // Store the result
      setHiringManagerResults(prev => ({
        ...prev,
        [jobKey]: result
      }));

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';

      const hasLinkedIn = !!result.linkedInProfileUrl;
      const hasEmailFromJob = !!result.emailFound;
      let successMessage = hasLinkedIn
        ? 'LinkedIn contact found. Referral message ready.'
        : 'Referral message ready.';
      if (hasEmailFromJob) successMessage += ' Email was in the job posting.';

      successDiv.innerHTML = `
        <div class="font-medium">${hasLinkedIn ? 'Contact found' : 'Message ready'}</div>
        <div class="text-sm mt-1 whitespace-pre-line">${successMessage}</div>
      `;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error finding contact for referral:', error);
      setError('Failed to find contact for referral. Please try again.');
    } finally {
      setHiringManagerLoading(null);
    }
  };

  const handleRevealEmail = async (jobKey: string) => {
    const result = hiringManagerResults[jobKey];
    if (!result?.linkedInProfileUrl || revealedEmails[jobKey]) return;
    try {
      setRevealEmailLoading(jobKey);
      setError('');
      const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';
      const response = await axios.post(`${apiBase}/openai/skillsurger`, {
        type: 'revealHiringManagerEmail',
        linkedInProfileUrl: result.linkedInProfileUrl
      });
      const data = response.data.data;
      if (data?.emailFound && data?.foundEmail) {
        setRevealedEmails(prev => ({ ...prev, [jobKey]: { foundEmail: data.foundEmail, emailVerification: data.emailVerification } }));
      } else {
        // Show message when no email found
        const infoDiv = document.createElement('div');
        infoDiv.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        infoDiv.textContent = 'No email found for this contact. Try reaching out via LinkedIn instead.';
        document.body.appendChild(infoDiv);

        setTimeout(() => {
          if (document.body.contains(infoDiv)) {
            document.body.removeChild(infoDiv);
          }
        }, 4000);
      }
    } catch (err) {
      console.error('Reveal email failed:', err);
      setError('Could not reveal email. Please try again.');
    } finally {
      setRevealEmailLoading(null);
    }
  };

  const handleCopyEmailDraft = (jobKey: string) => {
    const result = hiringManagerResults[jobKey];
    if (result && result.emailDraft) {
      navigator.clipboard.writeText(result.emailDraft).then(() => {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Email draft copied to clipboard!';
        document.body.appendChild(successDiv);

        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy email draft:', err);
        setError('Failed to copy email draft to clipboard');
      });
    }
  };

  if (!userSkills.length && !userInterests.length && !profile?.current_role) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Complete Your Profile First</h3>
          <p className="text-gray-600 mb-4">
            To get personalized career recommendations, please add your skills, interests, and career information to your profile.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowCustomForm(true)} className="mr-4">
              <Target className="w-4 h-4 mr-2" />
              Generate career path by Interests
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Or use the custom form to generate careers based on your interests and a reference job description
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showSuggestions && cvSuggestions) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">CV Optimization for {selectedJob?.title}</h2>
              <p className="text-gray-600 mt-1">at {selectedJob?.company}</p>
            </div>
            <Button variant="outline" onClick={() => setShowSuggestions(false)}>
              Back to Career Explorer
            </Button>
          </div>
        </div>

        <CVSuggestionManager
          suggestions={cvSuggestions}
          currentData={{
            summary: profile?.summary || '',
            skills: [...userSkills, ...(profile?.skills || [])],
            experience: profile?.experience || [],
            projects: profile?.projects || [],
            education: profile?.education || [],
            languages: profile?.languages || [],
            customSections: profile?.custom_sections || []
          }}
          onGetEditedData={(getData) => {
            setGetEditedData(() => getData);
          }}
          onAddCustomSection={async (section) => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  custom_sections: [...(profile?.custom_sections || []), section]
                })
                .eq('id', profile?.id);

              if (error) throw error;

              // Update profile state with new custom section
              setProfile((prev: any) => ({
                ...prev,
                custom_sections: [...(prev?.custom_sections || []), section]
              }));

              // Show success message
              const successDiv = document.createElement('div');
              successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
              successDiv.textContent = `"${section.title}" section added successfully!`;
              document.body.appendChild(successDiv);
              setTimeout(() => {
                if (document.body.contains(successDiv)) {
                  document.body.removeChild(successDiv);
                }
              }, 3000);
            } catch (error) {
              console.error('Error adding custom section:', error);
            }
          }}
          onAddCertification={async (certification) => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  certifications: [...(profile?.certifications || []), certification]
                })
                .eq('id', profile?.id);

              if (error) throw error;

              // Update profile state with new certification
              setProfile((prev: any) => ({
                ...prev,
                certifications: [...(prev?.certifications || []), certification]
              }));

              // Show success message
              const successDiv = document.createElement('div');
              successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
              successDiv.textContent = `"${certification.name}" certification added successfully!`;
              document.body.appendChild(successDiv);
              setTimeout(() => {
                if (document.body.contains(successDiv)) {
                  document.body.removeChild(successDiv);
                }
              }, 3000);
            } catch (error) {
              console.error('Error adding certification:', error);
            }
          }}
          onAddProject={async (project) => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  projects: [...(profile?.projects || []), project]
                })
                .eq('id', profile?.id);

              if (error) throw error;

              // Update profile state with new project
              setProfile((prev: any) => ({
                ...prev,
                projects: [...(prev?.projects || []), project]
              }));

              // Show success message
              const successDiv = document.createElement('div');
              successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
              successDiv.textContent = `"${project.name}" project added successfully!`;
              document.body.appendChild(successDiv);
              setTimeout(() => {
                if (document.body.contains(successDiv)) {
                  document.body.removeChild(successDiv);
                }
              }, 3000);
            } catch (error) {
              console.error('Error adding project:', error);
            }
          }}
        />

        <div className="mt-6 flex justify-end">
          <Button
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Get edited data if available, otherwise use original suggestions
                const editedData = getEditedData ? getEditedData() : null;
                const ai = cvSuggestions;
                const updates: any = {};

                // Summary - use edited if available, otherwise use original
                const summaryToUse = editedData?.summary || ai.summary;
                if (summaryToUse) updates.summary = summaryToUse;

                // Skills
                if (ai.highlightedSkills) {
                  const currentSkills = profile?.skills || [];
                  const newSkills = [...new Set([...currentSkills, ...ai.highlightedSkills])];
                  updates.skills = newSkills;
                  // Update user_skills table
                  await supabase.from('user_skills').delete().eq('user_id', user.id);
                  if (newSkills.length > 0) {
                    await supabase
                      .from('user_skills')
                      .insert(newSkills.map(skill => ({ user_id: user.id, skill })));
                  }
                }
                // Experience - use edited if available, otherwise use original
                const experienceImprovementsToUse = editedData?.experienceImprovements || ai.experienceImprovements;
                if (experienceImprovementsToUse && Array.isArray(experienceImprovementsToUse)) {
                  const improvedExp = experienceImprovementsToUse;
                  const normalize = (str: string) => str?.toLowerCase().replace(/\s+/g, ' ').trim();
                  const newExperience = (profile?.experience || []).map((exp: ExperienceItem) => {
                    // Try exact match
                    let improvement = improvedExp.find((imp: any) =>
                      imp.original && normalize(imp.original) === normalize(exp.description)
                    );
                    // Try substring match
                    if (!improvement) {
                      improvement = improvedExp.find((imp: any) =>
                        imp.original && (
                          normalize(exp.description).includes(normalize(imp.original)) ||
                          normalize(imp.original).includes(normalize(exp.description))
                        )
                      );
                    }
                    if (improvement) {
                      return { ...exp, description: improvement.improved };
                    }
                    return exp;
                  });
                  updates.experience = newExperience;
                  // Also update cv_parsed_data if present
                  if (profile?.cv_parsed_data) {
                    updates.cv_parsed_data = {
                      ...profile.cv_parsed_data,
                      experience: newExperience,
                      // Also update summary in cv_parsed_data
                      summary: summaryToUse || profile.cv_parsed_data.summary
                    };
                  }
                } else if (summaryToUse && profile?.cv_parsed_data) {
                  // If only summary is updated, also update cv_parsed_data.summary
                  updates.cv_parsed_data = {
                    ...profile.cv_parsed_data,
                    summary: summaryToUse
                  };
                }
                // Do NOT update additionalSections/sections
                if (Object.keys(updates).length > 0) {
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id);
                  if (updateError) throw updateError;
                }
                await loadUserData();
                setShowSuggestions(false);
                setCvSuggestions(null);
                setSelectedJob(null);
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                successDiv.textContent = 'CV optimizations have been successfully applied to your profile!';
                document.body.appendChild(successDiv);
                setTimeout(() => {
                  if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                  }
                }, 3000);
              } catch (error) {
                console.error('Error applying suggestions:', error);
                setError('Failed to apply CV optimizations');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {loading ? 'Applying...' : 'Apply All AI Suggestions'}
          </Button>
        </div>
      </div>
    );
  }

  if (showCVEditor && profile) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">CV Editor</h2>
            <Button variant="outline" onClick={() => setShowCVEditor(false)}>
              Back to Career Explorer
            </Button>
          </div>
        </div>
        <CVEditor
          initialData={{
            fullName: profile.full_name || '',
            title: profile.current_role || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
            summary: profile.summary || '',
            experience: profile.experience || [],
            projects: profile.projects || [],
            education: profile.education || [],
            skills: profile.skills || [],
            languages: profile.languages || []
          }}
          userType={profile.user_type}
          profileData={profile}
          onSave={handleUpdateCV}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-8">
        {/* <h2 className="text-2xl font-bold">Career Explorer</h2> */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Button
            onClick={handleFindJobsBasedOnProfile}
            disabled={jobSearchLoading}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <Search className="w-4 h-4 mr-2" />
            {jobSearchLoading ? 'Finding Jobs...' : 'Find Jobs Based on Profile'}
          </Button>
          <Button
            onClick={() => setShowCustomForm(true)}
            variant="outline"
            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Target className="w-4 h-4 mr-2" />
            Generate career path by Interests
          </Button>
          <Button onClick={handleGenerateCareerOptions} disabled={loading}>
            <Briefcase className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Career path from profile'}
          </Button>
          {jobs.length > 0 && (
            <Button
              onClick={() => {
                setJobs([]);
                localStorage.removeItem('careerExplorerJobs');
              }}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Jobs
            </Button>
          )}
        </div>
      </div>

      {/* Custom Interest Form Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Generate Careers by Interests
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Interests Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Interests
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    value={customInterestInput}
                    onChange={(e) => setCustomInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomInterest())}
                    placeholder="e.g., Artificial Intelligence, Web Development, Data Science"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomInterest}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {customInterests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {interest}
                        <button
                          onClick={() => handleRemoveCustomInterest(index)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {customInterests.length === 0 && (
                  <p className="text-sm text-gray-500">Add at least one interest to generate career options</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Preferred Location (Optional)
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA or Remote"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be used for job location preferences
                </p>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience (Optional)
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Select experience level</option>
                  <option value="0">Entry Level (0-1 years)</option>
                  <option value="2">Junior (2-3 years)</option>
                  <option value="5">Mid-Level (4-6 years)</option>
                  <option value="8">Senior (7-10 years)</option>
                  <option value="12">Expert (10+ years)</option>
                </select>
              </div>

              {/* Reference Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Job Description (Optional)
                </label>
                <textarea
                  value={referenceJobDescription}
                  onChange={(e) => setReferenceJobDescription(e.target.value)}
                  rows={6}
                  placeholder="Paste a job description that interests you to help generate more targeted career options..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This helps our AI understand the type of roles and requirements you're interested in
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateCustomCareerOptions}
                  disabled={customInterests.length === 0 || loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Career Options'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      {profile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Your Profile Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Experience:</span>
              <span className="ml-1 font-medium">{profile.years_of_experience || 0} years</span>
            </div>
            <div>
              <span className="text-gray-500">Current Role:</span>
              <span className="ml-1 font-medium">{profile.current_role || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <span className="ml-1 font-medium">
                {[profile.city, profile.state].filter(Boolean).join(', ') || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Skills:</span>
              <span className="ml-1 font-medium">{userSkills.length} skills</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing your profile and generating personalized career options...</span>
        </div>
      )}

      {careerOptions.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold">Latest Personalized Career Paths</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-sm text-gray-500">{careerOptions.length} careers</span>
              {renderDeleteButton('all-careers', handleDeleteAllCareers, 'all careers')}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {careerOptions.map((option, index) => (
              <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-xl font-semibold">{option.title}</h4>
                  {renderDeleteButton(`career-${index}`, () => handleDeleteCareer(index), 'career')}
                </div>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Required Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {option.requiredSkills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Potential Companies</p>
                    <p className="text-gray-700">{option.potentialCompanies.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Growth Potential</p>
                    <p className="text-gray-700">{option.growthPotential}</p>
                  </div>
                  <Button
                    onClick={() => handleFindJobs(option.title)}
                    className="w-full"
                    disabled={jobSearchLoading}
                  >
                    {jobSearchLoading && selectedCareer === option.title ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Latest Jobs
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold">
              Latest Job Opportunities {selectedCareer && `for ${selectedCareer}`}
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-sm text-gray-500">{jobs.length} jobs found</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJobs([])}
              >
                Clear Results
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div key={index} className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow overflow-hidden">
                <div className="text-gray-700 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    {job.companyLogo && (
                      <img src={job.companyLogo} alt={job.company} className="w-12 h-12 rounded-full border flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg sm:text-xl font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="break-words">{job.title}</span>
                        {job.seniority && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium self-start sm:self-auto">{job.seniority}</span>
                        )}
                      </h4>
                      <a href={job.companyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline text-sm font-medium break-all">
                        {job.company}
                      </a>
                    </div>
                  </div>
                  {/* <div className="flex flex-wrap gap-4 text-sm mb-2">
                    {job.organizationIndustry && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationIndustry}</span>
                    )}
                    {job.organizationSize && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationSize}</span>
                    )}
                    {job.organizationHeadquarters && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationHeadquarters}</span>
                    )}
                    {job.organizationFollowers && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationFollowers.toLocaleString()} followers</span>
                    )}
                    {job.organizationFounded && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">Founded: {job.organizationFounded}</span>
                    )}
                    {job.remote && (
                      <span className="bg-green-100 px-2 py-1 rounded text-green-700">Remote</span>
                    )}
                  </div> */}
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Location:</span> <span className="break-words">{job.location}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Employment Type:</span> <span className="break-words">{job.type}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Posted:</span> <span className="break-words">{job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Salary:</span> <span className="break-words">{job.salary || 'Not specified'}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Company Slogan:</span> <span className="break-words">{job.organizationSlogan}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Description:</span>
                    <div className="mt-1 break-words">
                      {expandedJobDescriptions.has(`${job.title}-${job.company}`) ? (
                        <div>
                          <p className="mb-2">{job.description}</p>
                          <button
                            onClick={() => {
                              const jobKey = `${job.title}-${job.company}`;
                              setExpandedJobDescriptions(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(jobKey);
                                return newSet;
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Show Less
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p>{job.description?.substring(0, 200)}...</p>
                          {job.description && job.description.length > 200 && (
                            <button
                              onClick={() => {
                                const jobKey = `${job.title}-${job.company}`;
                                setExpandedJobDescriptions(prev => new Set(prev).add(jobKey));
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                            >
                              Expand
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Specialties:</span>
                      <ul className="list-disc list-inside text-gray-700 ml-4">
                        {job.requirements.map((req, i) => (
                          <li key={i} className="break-words">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.recruiterName && (
                    <div className="mb-2 text-gray-600">
                      <span className="font-medium">Recruiter:</span> <span className="break-words">{job.recruiterName} {job.recruiterTitle && `(${job.recruiterTitle})`}</span>
                      {job.recruiterUrl && (
                        <a href={job.recruiterUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-700 hover:underline break-all">Profile</a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-lg font-semibold break-words">{job.salary}</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    {/* Save Job Button */}
                    <Button
                      onClick={() => saveJob(job)}
                      variant="outline"
                      size="sm"
                      disabled={isJobSaved(job) || savingJob === `${job.title}-${job.company}`}
                      className="w-full sm:w-auto"
                    >
                      {isJobSaved(job) ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 mr-2 text-green-600" />
                          Saved
                        </>
                      ) : savingJob === `${job.title}-${job.company}` ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4 mr-2" />
                          Save Job
                        </>
                      )}
                    </Button>

                    {/* Apply Now Button */}
                    <Button
                      onClick={() => window.open(generateJobApplicationUrl(job), '_blank')}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>

                    {/* CV Optimization Button */}
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleGenerateCVSuggestions(job);
                      }}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Optimize CV
                        </>
                      )}
                    </Button>

                    {/* Find Contact for Referral Button */}
                    <Button
                      onClick={() => handleFindHiringManager(job)}
                      variant="outline"
                      size="sm"
                      disabled={hiringManagerLoading === `${job.title}-${job.company}`}
                      className="w-full sm:w-auto bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      {hiringManagerLoading === `${job.title}-${job.company}` ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Finding...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Find Contact for Referral
                        </>
                      )}
                    </Button>

                    {/* Generate Learning Path Button */}
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        // Store job data in sessionStorage for the new tab
                        sessionStorage.setItem('learningPathJob', JSON.stringify(job));
                        // Open dashboard in new tab with learning section
                        const newTab = window.open('/dashboard?section=learning', '_blank');
                        // Trigger the handler in the new tab after a short delay
                        if (newTab) {
                          setTimeout(() => {
                            // The learning path will be generated when the new tab loads and reads from sessionStorage
                            onGenerateLearningPath(job);
                          }, 1000);
                        } else {
                          // Fallback: if popup blocked, use current window
                          onGenerateLearningPath(job);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 w-full sm:w-auto"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Create Learning Path
                    </Button>
                  </div>
                </div>

                {/* Contact & referral message */}
                {hiringManagerResults[`${job.title}-${job.company}`] && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-800">Contact & referral message</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const jobKey = `${job.title}-${job.company}`;
                            setShowEmailDraft(showEmailDraft === jobKey ? null : jobKey);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                        >
                          {showEmailDraft === `${job.title}-${job.company}` ? 'Hide' : 'Show'} message
                        </Button>
                        <Button
                          onClick={() => handleCopyEmailDraft(`${job.title}-${job.company}`)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Copy message
                        </Button>
                      </div>
                    </div>

                    {showEmailDraft !== `${job.title}-${job.company}` && (
                      <>
                        {/* LinkedIn first - always show when we have it */}
                        {hiringManagerResults[`${job.title}-${job.company}`].linkedInProfileUrl && (
                          <div className="mb-3 p-3 bg-blue-100 border border-blue-300 rounded text-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex-1 min-w-0">
                                <strong>LinkedIn:</strong>{' '}
                                <a
                                  href={hiringManagerResults[`${job.title}-${job.company}`].linkedInProfileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline break-all"
                                >
                                  {hiringManagerResults[`${job.title}-${job.company}`].linkedInProfileUrl}
                                </a>
                              </div>
                              <a
                                href={hiringManagerResults[`${job.title}-${job.company}`].linkedInProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-md hover:bg-[#005885] transition-colors text-sm font-medium whitespace-nowrap"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open LinkedIn
                              </a>
                            </div>
                            {/* Reveal email button - only when we have LinkedIn and email not yet shown */}
                            {(hiringManagerResults[`${job.title}-${job.company}`].emailFound || revealedEmails[`${job.title}-${job.company}`]) ? null : (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <Button
                                  onClick={() => handleRevealEmail(`${job.title}-${job.company}`)}
                                  disabled={revealEmailLoading === `${job.title}-${job.company}`}
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-700 border-blue-400 hover:bg-blue-50"
                                >
                                  {revealEmailLoading === `${job.title}-${job.company}` ? (
                                    <>Loading...</>
                                  ) : (
                                    <>Reveal email</>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Email - only when from job posting OR user revealed */}
                        {(hiringManagerResults[`${job.title}-${job.company}`].emailFound || revealedEmails[`${job.title}-${job.company}`]) && (
                          <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <strong>Email:</strong>{' '}
                                {revealedEmails[`${job.title}-${job.company}`]?.foundEmail ?? hiringManagerResults[`${job.title}-${job.company}`].foundEmail}
                              </div>
                              {(revealedEmails[`${job.title}-${job.company}`]?.emailVerification || hiringManagerResults[`${job.title}-${job.company}`].emailVerification) && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  (revealedEmails[`${job.title}-${job.company}`]?.emailVerification || hiringManagerResults[`${job.title}-${job.company}`].emailVerification)?.result === 'deliverable'
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-yellow-200 text-yellow-800'
                                }`}>
                                  {(revealedEmails[`${job.title}-${job.company}`]?.emailVerification || hiringManagerResults[`${job.title}-${job.company}`].emailVerification)?.result}
                                </span>
                              )}
                            </div>
                            {profile?.email && (
                              <div className="mt-2 pt-2 border-t border-green-200 flex flex-wrap items-center gap-2">
                                <a
                                  href={`mailto:${revealedEmails[`${job.title}-${job.company}`]?.foundEmail ?? hiringManagerResults[`${job.title}-${job.company}`].foundEmail}?subject=${encodeURIComponent(`Referral Request - ${job.title} at ${job.company}`)}&body=${encodeURIComponent(hiringManagerResults[`${job.title}-${job.company}`].emailDraft || '')}`}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                >
                                  <Mail className="w-4 h-4" />
                                  Compose email
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {!hiringManagerResults[`${job.title}-${job.company}`].linkedInProfileUrl && !hiringManagerResults[`${job.title}-${job.company}`].emailFound && !revealedEmails[`${job.title}-${job.company}`] && (
                          <div className="mb-3 p-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700">
                            No contact found. Use the message below to reach out on LinkedIn or other channels.
                          </div>
                        )}

                        <div className="bg-white p-3 rounded border">
                          <p className="text-xs text-gray-500 mb-1">Referral / connection message:</p>
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {hiringManagerResults[`${job.title}-${job.company}`].emailDraft}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message when no jobs are loaded */}
      {!jobSearchLoading && jobs.length === 0 && careerOptions.length > 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Find Jobs?</h3>
          <p className="text-gray-600 mb-4">
            Click "Find Latest Jobs" on any career path above to discover current job opportunities.
          </p>
        </div>
      )}
    </div>
  );
}