import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, ExternalLink, RefreshCw, Trash2, Archive, ChevronDown, ChevronUp, Star, Clock, Award, Shield, MessageSquare, Send } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { generateLearningPlan } from '../lib/openai';
import axios from 'axios';

interface LearningPath {
  id: string;
  career_path: string;
  job_title: string;
  skills_to_learn: string[];
  resources: Array<{
    type: string;
    title: string;
    url: string;
    description: string;
    completed?: boolean;
    verified?: boolean;
    fallbackUrl?: string;
    completedAt?: string;
    timeSpent?: number;
    price?: string;
    rating?: number;
    provider?: string;
    difficulty?: string;
    duration?: string;
  }>;
  progress: number;
  created_at: string;
}

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string[];
  type?: string;
  salary?: string;
}

interface Career {
  title: string;
  jobs: SavedJob[];
}

interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyUrl?: string;
  location: string;
  description: string;
  requirements?: string[];
  type?: string;
  salary?: string;
  applicationUrl?: string;
  postedDate?: string;
  seniority?: string;
  organizationSize?: string;
  organizationIndustry?: string;
}

interface LearningPathsProps {
  job: JobOpportunity | null;
}

export default function LearningPaths({ job }: LearningPathsProps) {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [historicalPaths, setHistoricalPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [careers, setCareers] = useState<Career[]>([]);
  const [, setAllJobs] = useState<SavedJob[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [feedbackTexts, setFeedbackTexts] = useState<{[key: string]: string}>({});
  const [updatingPath, setUpdatingPath] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<string>('');
  const [showFeedbackForm, setShowFeedbackForm] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadData();
  }, []);

  // Removed automatic generation - let user control when to generate
  // useEffect(() => {
  //   if (job) {
  //     handleGenerateLearningPath(job);
  //   }
  // }, [job]);

  // Helper function to save job to database
  async function saveJobToDatabase(job: JobOpportunity, userId: string) {
    try {
      // Check if job already exists
      const { data: existingJob } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('title', job.title)
        .eq('company', job.company)
        .single();

      if (existingJob) {
        console.log('Job already exists in database');
        return;
      }

      // Save the job
      const jobToSave = {
        user_id: userId,
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
      console.log('Job saved to database successfully');
    } catch (error) {
      console.error('Error saving job to database:', error);
      // Don't throw error here as it shouldn't stop the learning path generation
    }
  }

  // Helper function to convert SavedJob to JobOpportunity
  function convertSavedJobToJobOpportunity(savedJob: SavedJob): JobOpportunity {
    return {
      id: savedJob.id,
      title: savedJob.title,
      company: savedJob.company,
      location: savedJob.location,
      description: savedJob.description,
      requirements: savedJob.requirements || [],
      type: savedJob.type,
      salary: savedJob.salary
    };
  }

  // Helper function to determine career path based on job
  function determineCareerPath(job: JobOpportunity): string {
    const title = job.title.toLowerCase();
    const description = job.description.toLowerCase();
    const requirements = Array.isArray(job.requirements) ? job.requirements.join(' ').toLowerCase() : '';

    // Define career path mappings
    const careerMappings = [
      { keywords: ['software engineer', 'software developer', 'full stack', 'frontend', 'backend', 'web developer', 'mobile developer'], career: 'Software Development' },
      { keywords: ['data scientist', 'data analyst', 'data engineer', 'machine learning', 'ai engineer', 'ml engineer'], career: 'Data Science' },
      { keywords: ['product manager', 'product owner', 'product lead'], career: 'Product Management' },
      { keywords: ['ui designer', 'ux designer', 'designer', 'graphic designer', 'visual designer'], career: 'Design' },
      { keywords: ['marketing manager', 'digital marketing', 'growth marketing', 'content marketing'], career: 'Marketing' },
      { keywords: ['sales manager', 'sales representative', 'business development'], career: 'Sales' },
      { keywords: ['devops', 'site reliability', 'cloud engineer', 'infrastructure'], career: 'DevOps & Cloud' },
      { keywords: ['cybersecurity', 'security engineer', 'security analyst'], career: 'Cybersecurity' },
      { keywords: ['project manager', 'program manager', 'scrum master'], career: 'Project Management' },
      { keywords: ['business analyst', 'data analyst', 'financial analyst'], career: 'Business Analysis' }
    ];

    // Check job title first
    for (const mapping of careerMappings) {
      if (mapping.keywords.some(keyword => title.includes(keyword))) {
        return mapping.career;
      }
    }

    // Check job description and requirements
    for (const mapping of careerMappings) {
      if (mapping.keywords.some(keyword => 
        description.includes(keyword) || requirements.includes(keyword)
      )) {
        return mapping.career;
      }
    }

    // Default fallback
    return 'General Technology';
  }

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load careers and jobs
      const [{ data: careerData }, { data: jobData }] = await Promise.all([
        supabase.from('generated_careers').select('title').eq('user_id', user.id),
        supabase.from('saved_jobs').select('id, title, company, location, description, requirements, type, salary').eq('user_id', user.id)
      ]);

      if (jobData) {
        setAllJobs(jobData);
      }

      if (careerData && jobData) {
        // Create career objects with their related jobs using intelligent matching
        const uniqueCareers = Array.from(new Set(careerData.map(c => c.title)));
        const usedJobs = new Set<string>(); // Track which jobs have been assigned
        const careersWithJobs: Career[] = [];

        // First, try to match jobs to specific career paths
        for (const careerTitle of uniqueCareers) {
          const relatedJobs = jobData.filter(job => {
            const jobKey = `${job.title}-${job.company}`;
            if (usedJobs.has(jobKey)) return false; // Skip if already assigned

            // Use the same logic as determineCareerPath for consistency
            const jobOpportunity = convertSavedJobToJobOpportunity(job);
            const determinedCareer = determineCareerPath(jobOpportunity);
            return determinedCareer === careerTitle;
          });

          // Mark these jobs as used
          relatedJobs.forEach(job => {
            usedJobs.add(`${job.title}-${job.company}`);
          });

          if (relatedJobs.length > 0) {
            careersWithJobs.push({
              title: careerTitle,
              jobs: relatedJobs
            });
          }
        }

        // Add any remaining unmatched jobs to a "Other Jobs" category
        const unmatchedJobs = jobData.filter(job => 
          !usedJobs.has(`${job.title}-${job.company}`)
        );

        if (unmatchedJobs.length > 0) {
          careersWithJobs.push({
            title: 'Other Jobs',
            jobs: unmatchedJobs
          });
        }

        // Also add a "All Jobs" category that includes all saved jobs
        careersWithJobs.unshift({
          title: 'All Saved Jobs',
          jobs: jobData
        });

        setCareers(careersWithJobs);
      }

      // Load learning paths
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paths) {
        // Separate recent and historical paths
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPaths = paths.filter(path => 
          new Date(path.created_at) >= thirtyDaysAgo
        );
        
        const historicalPathsData = paths.filter(path => 
          new Date(path.created_at) < thirtyDaysAgo
        );

        setLearningPaths(recentPaths);
        setHistoricalPaths(historicalPathsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  }

  const handleDeletePath = async (pathId: string, isHistorical = false) => {
    const deleteKey = `path-${pathId}`;
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete from database
      const { error } = await supabase
        .from('learning_paths')
        .delete()
        .eq('id', pathId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      if (isHistorical) {
        setHistoricalPaths(prev => prev.filter(path => path.id !== pathId));
      } else {
        setLearningPaths(prev => prev.filter(path => path.id !== pathId));
      }
      
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Learning path deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting learning path:', error);
      setError(error.message || 'Failed to delete learning path');
    } finally {
      setDeleting(null);
    }
  };

  const handleArchivePath = async (pathId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Move to historical by updating created_at to be older than 30 days
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const { error } = await supabase
        .from('learning_paths')
        .update({ created_at: oldDate.toISOString() })
        .eq('id', pathId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Move from current to historical in local state
      const pathToMove = learningPaths.find(path => path.id === pathId);
      if (pathToMove) {
        setLearningPaths(prev => prev.filter(path => path.id !== pathId));
        setHistoricalPaths(prev => [{ ...pathToMove, created_at: oldDate.toISOString() }, ...prev]);
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Learning path archived successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error archiving learning path:', error);
      setError(error.message || 'Failed to archive learning path');
    }
  };

  const handleDeleteAllPaths = async (isHistorical = false) => {
    const deleteKey = isHistorical ? 'all-historical-paths' : 'all-recent-paths';
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const pathsToDelete = isHistorical ? historicalPaths : learningPaths;
      const pathIds = pathsToDelete.map(path => path.id);

      if (pathIds.length === 0) return;

      // Delete from database
      const { error } = await supabase
        .from('learning_paths')
        .delete()
        .eq('user_id', user.id)
        .in('id', pathIds);

      if (error) throw error;

      // Update local state
      if (isHistorical) {
        setHistoricalPaths([]);
      } else {
        setLearningPaths([]);
      }
      
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `All ${isHistorical ? 'historical' : 'recent'} learning paths deleted successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting all learning paths:', error);
      setError(error.message || 'Failed to delete all learning paths');
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

  async function handleGenerateLearningPath(selectedJob: JobOpportunity) {
    if (!selectedJob) {
      setError('Please select a job first to generate a learning path.');
      return;
    }

    try {
      setGeneratingPlan(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Auto-save the job first
      await saveJobToDatabase(selectedJob, user.id);

      // Determine the appropriate career path for this job
      const careerPath = determineCareerPath(selectedJob);

      // Check if a learning path already exists for this job
      const { data: existingPath } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_title', selectedJob.title)
        .eq('company', selectedJob.company)
        .single();

      if (existingPath) {
        setError(`A learning path for "${selectedJob.title}" at ${selectedJob.company} already exists. Please delete the existing one first or choose a different job.`);
        return;
      }

      const plan = await generateLearningPlan(
        selectedJob.title, 
        selectedJob.description, 
        selectedJob.requirements
      );

      // Remove duplicates from the generated plan
      const uniquePlan = plan.filter((resource, index, arr) => {
        return arr.findIndex(r => 
          r.url === resource.url || 
          r.title.toLowerCase() === resource.title.toLowerCase()
        ) === index;
      });

      // Save the new path to the database
      const { data: savedPath, error: saveError } = await supabase
        .from('learning_paths')
        .insert({
          user_id: user.id,
          career_path: careerPath,
          job_title: selectedJob.title,
          company: selectedJob.company,
          skills_to_learn: selectedJob.requirements,
          resources: uniquePlan,
          progress: 0,
        })
        .select()
        .single();
        
      if (saveError) throw saveError;

      // Add new path to the top of the list
      setLearningPaths(prev => [savedPath, ...prev]);
      
      // Reload data to show the saved job in the dropdown
      await loadData();
      
    } catch (error: any) {
      console.error('Error generating learning path:', error);
      setError(error.message || 'Failed to generate learning path');
    } finally {
      setGeneratingPlan(false);
    }
  }



  async function handleGeneratePersonalizedLearningPath() {
    try {
      setGeneratingPlan(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Unable to fetch your profile data. Please try again.');
        return;
      }

      // Create a job-like object from profile data to use the same API flow
      const jobTitle = profile.current_role || 'General Professional';
      const jobDescription = profile.summary || profile.cv_parsed_data?.summary || 
        `Professional with ${profile.years_of_experience || 0} years of experience in ${jobTitle}.`;
      
      // Extract requirements from profile skills and experience
      const requirements: string[] = [];
      if (profile.skills && Array.isArray(profile.skills)) {
        requirements.push(...profile.skills.slice(0, 5));
      }
      if (profile.cv_parsed_data?.skills && Array.isArray(profile.cv_parsed_data.skills)) {
        requirements.push(...profile.cv_parsed_data.skills.slice(0, 5));
      }
      // Get skills from user_skills table
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select('skill')
        .eq('user_id', user.id);
      
      if (userSkills && userSkills.length > 0) {
        requirements.push(...userSkills.map(s => s.skill).slice(0, 5));
      }

      // Create a job opportunity object similar to what's used in Option 2
      const profileJob: JobOpportunity = {
        id: 'personalized',
        title: jobTitle,
        company: 'Personalized Learning Path',
        location: profile.preferred_locations?.[0] || 'Remote',
        description: jobDescription,
        requirements: [...new Set(requirements)].slice(0, 10), // Remove duplicates and limit
        type: 'Full-time',
        salary: undefined
      };

      // Check if a personalized learning path already exists (use maybeSingle to avoid PGRST116 error)
      const { data: existingPath } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('career_path', 'Personalized')
        .eq('job_title', jobTitle)
        .maybeSingle();

      if (existingPath) {
        setError('A personalized learning path already exists for your current role.');
        setGeneratingPlan(false);
        return;
      }

      // Use the same API flow as handleGenerateLearningPath
      const plan = await generateLearningPlan(
        profileJob.title, 
        profileJob.description, 
        profileJob.requirements
      );

      // Remove duplicates from the generated plan
      const uniquePlan = plan.filter((resource, index, arr) => {
        return arr.findIndex(r => 
          r.url === resource.url || 
          r.title.toLowerCase() === resource.title.toLowerCase()
        ) === index;
      });

      // Save the new path to the database
      const { data: savedPath, error: saveError } = await supabase
        .from('learning_paths')
        .insert({
          user_id: user.id,
          career_path: 'Personalized',
          job_title: profileJob.title,
          company: profileJob.company,
          skills_to_learn: profileJob.requirements,
          resources: uniquePlan,
          progress: 0,
        })
        .select()
        .single();
        
      if (saveError) throw saveError;

      // Add new path to the top of the list
      setLearningPaths(prev => [savedPath, ...prev]);
      
    } catch (error: any) {
      console.error('Error generating personalized learning path:', error);
      setError(error.message || 'Failed to generate personalized learning path');
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function handleUpdateProgress(pathId: string, newProgress: number, updatedResources?: any[]) {
    try {
      const updateData: any = { progress: newProgress };
      
      // If updatedResources is provided, also update the resources array
      if (updatedResources) {
        updateData.resources = updatedResources;
      }

      const { error: updateError } = await supabase
        .from('learning_paths')
        .update(updateData)
        .eq('id', pathId);

      if (updateError) throw updateError;

      setLearningPaths(prev =>
        prev.map(path =>
          path.id === pathId 
            ? { 
                ...path, 
                progress: newProgress,
                ...(updatedResources && { resources: updatedResources })
              } 
            : path
        )
      );
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress');
    }
  }

  async function handleSubmitFeedback(pathId: string) {
    const feedback = feedbackTexts[pathId]?.trim();
    if (!feedback) {
      setError('Please provide feedback before submitting');
      return;
    }

    try {
      setUpdatingPath(pathId);
      setUpdateProgress('Initiating learning path update...');
      setError('');

      const path = learningPaths.find(p => p.id === pathId);
      if (!path) {
        setError('Learning path not found');
        return;
      }

      const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';

      // Step 1: Initiate the update (returns immediately with task ID)
      setUpdateProgress('Submitting your feedback...');
      const initiateResponse = await axios.post(`${apiBase}/openai/skillsurger`, {
        type: 'initiateLearningPathUpdate',
        currentPath: {
          jobTitle: path.job_title,
          careerPath: path.career_path,
          company: path.company,
          skillsToLearn: path.skills_to_learn,
          resources: path.resources,
          progress: path.progress
        },
        userFeedback: feedback
      }, {
        timeout: 10000 // 10 seconds - just for initiating
      });

      if (!initiateResponse.data.success) {
        throw new Error(initiateResponse.data.message || 'Failed to initiate learning path update');
      }

      const taskId = initiateResponse.data.data.taskId;

      // Step 2: Poll for status updates
      setUpdateProgress('Processing your request...');
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
      let lastProgress = '';

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls

        try {
          const statusResponse = await axios.post(`${apiBase}/openai/skillsurger`, {
            type: 'getLearningPathUpdateStatus',
            taskId
          }, {
            timeout: 10000
          });

          if (statusResponse.data.success) {
            const status = statusResponse.data.data;

            // Update loading message with progress
            if (status.progress !== lastProgress) {
              lastProgress = status.progress;
              setUpdateProgress(status.progress);
              console.log(`[Learning Path Update] ${status.progress}`);
            }

            if (status.status === 'completed') {
              completed = true;
              const updatedResources = status.resources;

              if (updatedResources && updatedResources.length > 0) {
                // Update the learning path in the database
                const { error: updateError } = await supabase
                  .from('learning_paths')
                  .update({
                    resources: updatedResources,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', pathId);

                if (updateError) throw updateError;

                // Update local state
                setLearningPaths(prev =>
                  prev.map(p =>
                    p.id === pathId
                      ? { ...p, resources: updatedResources }
                      : p
                  )
                );

                // Clear feedback and close form
                setFeedbackTexts(prev => ({ ...prev, [pathId]: '' }));
                setShowFeedbackForm(prev => ({ ...prev, [pathId]: false }));

                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                successDiv.textContent = 'Learning path updated based on your feedback!';
                document.body.appendChild(successDiv);

                setTimeout(() => {
                  if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                  }
                }, 3000);
              } else {
                throw new Error('No updated resources received');
              }
            } else if (status.status === 'failed') {
              throw new Error(status.error || 'Learning path update failed');
            }
            // If status is 'processing', continue polling
          }
        } catch (pollError: any) {
          console.error('Error polling status:', pollError);
          // Continue polling unless it's a critical error
          if (pollError.message?.includes('Task not found')) {
            throw new Error('Update task not found. Please try again.');
          }
        }

        attempts++;
      }

      if (!completed) {
        throw new Error('Learning path update timed out. Please try again.');
      }

    } catch (error: any) {
      console.error('Error updating learning path from feedback:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update learning path from feedback');
    } finally {
      setUpdatingPath(null);
      setUpdateProgress('');
    }
  }

  const getPriceColor = (price: string) => {
    switch (price?.toLowerCase()) {
      case 'free': return 'text-green-600 bg-green-100';
      case 'freemium': return 'text-blue-600 bg-blue-100';
      case 'paid': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const emptyStateContent = !job && learningPaths.length === 0 ? (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Learning Path Generated</h3>
      <p className="text-gray-600 mb-6">
        Generate a personalized learning path by selecting either:
      </p>
      <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Option 1: Personalized Learning Path</h4>
            <p className="text-sm text-blue-700 mb-3">
              Generate a comprehensive learning path based on your current role, experience, and CV data
            </p>
            <Button
              onClick={() => handleGeneratePersonalizedLearningPath()}
              disabled={generatingPlan}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {generatingPlan ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Generate My Learning Path
                </>
              )}
            </Button>
          </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">Option 2: Specific Job Learning</h4>
          <p className="text-sm text-purple-700 mb-3">
            Select a specific job from the "Career Explorer" to get a targeted learning path for that role
          </p>
          <p className="text-xs text-purple-600">
            Go to Career Explorer → Find Jobs → Select a job → Create Learning Path
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {emptyStateContent}
      <div className="space-y-8">
        {/* Job from Career Explorer */}
        {job && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Generate Learning Path for Selected Job
          </h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900">{job.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{job.description}</p>
            {job.requirements && job.requirements.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Key Requirements:</p>
                <ul className="text-sm text-gray-600 mt-1">
                  {job.requirements.slice(0, 3).map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {req}
                    </li>
                  ))}
                  {job.requirements.length > 3 && (
                    <li className="text-gray-500">... and {job.requirements.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <Button
            onClick={() => handleGenerateLearningPath(job)}
            disabled={generatingPlan}
            className="w-full"
          >
            {generatingPlan ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Learning Path...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Generate Learning Path for "{job.title}"
              </>
            )}
          </Button>
        </div>
      )}

      {/* Generate New Learning Path */}
      <div className="bg-white rounded-lg shadow-lg p-6 cursor-default">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
          Generate Verified Learning Path
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Enhanced Link Verification</h4>
              <p className="text-sm text-blue-700 mt-1">
                All learning resources are now verified for availability and quality. We prioritize free and low-cost options from trusted educational platforms.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Career Path</label>
            <select
              value={selectedCareer}
              onChange={(e) => {
                setSelectedCareer(e.target.value);
                setSelectedJob('');
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a career path</option>
              {careers.map(career => (
                <option key={career.title} value={career.title}>
                  {career.title} ({career.jobs.length} jobs)
                </option>
              ))}
            </select>
          </div>

          {selectedCareer && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a job title</option>
                {careers
                  .find(c => c.title === selectedCareer)
                  ?.jobs.map(job => {
                    const jobDisplayName = `${job.title} at ${job.company}`;
                    return (
                      <option key={job.id} value={jobDisplayName}>
                        {jobDisplayName}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}

          {selectedCareer && careers.find(c => c.title === selectedCareer)?.jobs.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                No saved jobs found for this career path. Please save some jobs in the Career Explorer first, or select "All Saved Jobs" to see all available positions.
              </p>
            </div>
          )}

          <Button
            onClick={() => {
              const selectedCareerData = careers.find(c => c.title === selectedCareer);
              const selectedJobData = selectedCareerData?.jobs.find(j => 
                `${j.title} at ${j.company}` === selectedJob
              );
              if (selectedJobData) {
                handleGenerateLearningPath(selectedJobData);
              }
            }}
            disabled={!selectedCareer || !selectedJob || generatingPlan}
            className="w-full"
          >
            {generatingPlan ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Verified Learning Path...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Generate Verified Learning Path
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Recent Learning Paths */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Recent Learning Paths (Last 30 Days)
          </h3>
          {learningPaths.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{learningPaths.length} paths</span>
              {renderDeleteButton('all-recent-paths', () => handleDeleteAllPaths(false), 'all recent paths')}
            </div>
          )}
        </div>
        
        {learningPaths.length > 0 ? (
          <div className="space-y-6">
            {learningPaths.map(path => (
              <div key={path.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">
                      {path.job_title || `${path.career_path} Learning Path`}
                    </h4>
                    <p className="text-gray-600">
                      {path.job_title ? path.career_path : 'Comprehensive Career Development'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(path.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Progress:</span>
                      <span className="font-medium ml-1">{path.progress}%</span>
                      <span className="text-xs text-gray-500 block">
                        ({path.resources.filter(r => r.completed).length}/{path.resources.length} courses)
                      </span>
                      {path.progress === 100 && (
                        <CheckCircle className="w-5 h-5 text-green-600 inline ml-1" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Button
                        onClick={() => handleArchivePath(path.id)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive
                      </Button>
                      {renderDeleteButton(`path-${path.id}`, () => handleDeletePath(path.id, false), 'path')}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${path.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Skills */}
                {path.skills_to_learn && path.skills_to_learn.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {path.skills_to_learn.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center">
                    <Shield className="w-4 h-4 mr-1 text-green-600" />
                    Verified Learning Resources
                  </h5>
                  {path.resources.map((resource, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 transition-colors ${
                        resource.completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2 flex-wrap gap-2">
                            <h6 className="font-medium">{resource.title}</h6>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {resource.type}
                            </span>
                            {resource.verified && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </span>
                            )}
                            {resource.price && (
                              <span className={`px-2 py-1 rounded text-xs ${getPriceColor(resource.price)}`}>
                                {resource.price}
                              </span>
                            )}
                            {resource.difficulty && (
                              <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(resource.difficulty)}`}>
                                {resource.difficulty}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                          
                          {/* Resource metadata */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            {resource.provider && (
                              <span className="flex items-center">
                                <Award className="w-3 h-3 mr-1" />
                                {resource.provider}
                              </span>
                            )}
                            {resource.rating && (
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-500" />
                                {resource.rating}/5
                              </span>
                            )}
                            {resource.duration && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {resource.duration}
                              </span>
                            )}
                          </div>
                          
                          {resource.completed && resource.completedAt && (
                            <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
                              ✅ Completed on {new Date(resource.completedAt).toLocaleDateString()}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center bg-blue-50 px-3 py-1 rounded"
                            >
                              Access Course/Resource
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                            {resource.fallbackUrl && (
                              <a
                                href={resource.fallbackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:underline text-sm flex items-center bg-gray-50 px-3 py-1 rounded"
                              >
                                Alternative Link
                                <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updatedResources = [...path.resources];
                            updatedResources[index] = {
                              ...updatedResources[index],
                              completed: !updatedResources[index].completed,
                              completedAt: !updatedResources[index].completed ? new Date().toISOString() : undefined
                            };
                            
                            const completedCount = updatedResources.filter(r => r.completed).length;
                            const newProgress = Math.round((completedCount / updatedResources.length) * 100);
                            
                            // Update database with both progress and resources
                            handleUpdateProgress(path.id, newProgress, updatedResources);
                          }}
                          className={`p-2 rounded-full transition-colors ml-4 ${
                            resource.completed 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={resource.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                      Provide Feedback to Improve This Learning Path
                    </h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFeedbackForm(prev => ({ ...prev, [path.id]: !prev[path.id] }))}
                    >
                      {showFeedbackForm[path.id] ? 'Hide Feedback' : 'Give Feedback'}
                    </Button>
                  </div>
                  {showFeedbackForm[path.id] && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-3">
                        Share your thoughts about this learning path. We'll use your feedback to update and improve the resources and structure.
                      </p>
                      <textarea
                        value={feedbackTexts[path.id] || ''}
                        onChange={(e) => setFeedbackTexts(prev => ({ ...prev, [path.id]: e.target.value }))}
                        placeholder="E.g., 'I'd like more advanced topics', 'Add more hands-on projects', 'Include resources on specific technology X', etc."
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-3 p-3"
                        rows={4}
                      />
                      {updatingPath === path.id && updateProgress && (
                        <div className="mb-3 p-3 bg-blue-100 border border-blue-300 rounded-md">
                          <div className="flex items-center">
                            <RefreshCw className="w-4 h-4 mr-2 text-blue-600 animate-spin" />
                            <span className="text-sm text-blue-800 font-medium">{updateProgress}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSubmitFeedback(path.id)}
                          disabled={!feedbackTexts[path.id]?.trim() || updatingPath === path.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          {updatingPath === path.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              {updateProgress || 'Updating...'}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Update Learning Path
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {path.progress === 100 && (
                  <div className="mt-6 flex items-center justify-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <span className="text-green-600 font-medium">Learning Path Completed! 🎉</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Learning Paths</h3>
            <p className="text-gray-600 mb-4">
              Generate your first verified learning path to get started
            </p>
            <p className="text-sm text-gray-500">
              Make sure you have saved some jobs in Career Explorer first
            </p>
          </div>
        )}
      </div>

      {/* Historical Learning Paths */}
      {historicalPaths.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center">
              <Archive className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-700">
                Historical Learning Paths ({historicalPaths.length})
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {renderDeleteButton('all-historical-paths', () => handleDeleteAllPaths(true), 'all historical paths')}
              {showHistorical ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </button>
          
          {showHistorical && (
            <div className="mt-6 space-y-6">
              {historicalPaths.map(path => (
                <div key={path.id} className="bg-white rounded-lg shadow-lg p-6 opacity-90">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center">
                        <h4 className="text-lg font-semibold">
                          {path.job_title || `${path.career_path} Learning Path`}
                        </h4>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center">
                          <Archive className="w-3 h-3 mr-1" />
                          Historical
                        </span>
                      </div>
                      <p className="text-gray-600">{path.career_path}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(path.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Progress:</span>
                        <span className="font-medium ml-1">{path.progress}%</span>
                        <span className="text-xs text-gray-500 block">
                          ({path.resources.filter(r => r.completed).length}/{path.resources.length} courses)
                        </span>
                        {path.progress === 100 && (
                          <CheckCircle className="w-5 h-5 text-green-600 inline ml-1" />
                        )}
                      </div>
                      <div className="flex flex-col space-y-1">
                        {renderDeleteButton(`path-${path.id}`, () => handleDeletePath(path.id, true), 'path')}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${path.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {path.skills_to_learn.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center">
                      Historical Learning Resources
                    </h5>
                    {path.resources.map((resource, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-colors ${
                          resource.completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2 flex-wrap gap-2">
                              <h6 className="font-medium">{resource.title}</h6>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {resource.type}
                              </span>
                              {resource.verified && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                            
                            {resource.completed && resource.completedAt && (
                              <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
                                ✅ Completed on {new Date(resource.completedAt).toLocaleDateString()}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center bg-blue-50 px-3 py-1 rounded"
                              >
                                Access Course/Resource
                                <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            </div>
                          </div>
                          <div className="ml-4">
                            {resource.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {path.progress === 100 && (
                    <div className="mt-6 flex items-center justify-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      <span className="text-green-600 font-medium">Learning Path Completed! 🎉</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      </div>

    </>
  );
}