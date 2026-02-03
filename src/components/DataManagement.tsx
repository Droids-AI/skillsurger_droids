import { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw, Database, FileText, Briefcase, BookOpen, Brain, Users, Target } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';

interface DataStats {
  profiles: number;
  skills: number;
  interests: number;
  careers: number;
  jobs: number;
  learningPaths: number;
  learningPlans: number;
  careerSuggestions: number;
  mockInterviews: number;
  aiSessions: number;
  learningRecommendations: number;
  cvFiles: number;
}

interface DeleteOperation {
  type: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  confirmText: string;
  tables: string[];
  storageCleanup?: boolean;
}

export default function DataManagement() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const deleteOperations: DeleteOperation[] = [
    {
      type: 'profile_data',
      label: 'Profile Data',
      description: 'Personal information, contact details, work preferences, and salary expectations',
      icon: FileText,
      color: 'blue',
      confirmText: 'DELETE PROFILE DATA',
      tables: ['profiles'],
      storageCleanup: true
    },
    {
      type: 'skills_interests',
      label: 'Skills & Interests',
      description: 'All your skills and interests data',
      icon: Target,
      color: 'green',
      confirmText: 'DELETE SKILLS & INTERESTS',
      tables: ['user_skills', 'user_interests']
    },
    {
      type: 'career_data',
      label: 'Career Explorations',
      description: 'Generated career options and career suggestions',
      icon: Briefcase,
      color: 'purple',
      confirmText: 'DELETE CAREER DATA',
      tables: ['generated_careers', 'career_suggestions']
    },
    {
      type: 'job_data',
      label: 'Saved Jobs',
      description: 'All saved job opportunities and applications',
      icon: Database,
      color: 'orange',
      confirmText: 'DELETE JOB DATA',
      tables: ['saved_jobs']
    },
    {
      type: 'learning_data',
      label: 'Learning Paths & Plans',
      description: 'Learning paths, plans, and recommendations',
      icon: BookOpen,
      color: 'indigo',
      confirmText: 'DELETE LEARNING DATA',
      tables: ['learning_paths', 'learning_plans', 'learning_recommendations']
    },
    {
      type: 'interview_data',
      label: 'Interview Data',
      description: 'Mock interviews, feedback, and metrics',
      icon: Users,
      color: 'red',
      confirmText: 'DELETE INTERVIEW DATA',
      tables: ['mock_interviews', 'interview_feedback_metrics']
    },
    {
      type: 'ai_sessions',
      label: 'AI Mentorship Sessions',
      description: 'All AI mentorship conversations and sessions',
      icon: Brain,
      color: 'pink',
      confirmText: 'DELETE AI SESSIONS',
      tables: ['ai_mentorship_sessions']
    },
    {
      type: 'cv_files',
      label: 'CV Files',
      description: 'Uploaded CV files and parsed data',
      icon: FileText,
      color: 'gray',
      confirmText: 'DELETE CV FILES',
      tables: [],
      storageCleanup: true
    },
    {
      type: 'all_data',
      label: 'ALL DATA',
      description: 'Complete account data deletion (IRREVERSIBLE)',
      icon: AlertTriangle,
      color: 'red',
      confirmText: 'DELETE EVERYTHING',
      tables: [
        'user_skills', 'user_interests', 'generated_careers', 'career_suggestions',
        'saved_jobs', 'learning_paths', 'learning_plans', 'learning_recommendations',
        'mock_interviews', 'interview_feedback_metrics', 'ai_mentorship_sessions'
      ],
      storageCleanup: true
    }
  ];

  const loadDataStats = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get counts for each data type
      const [
        { count: profileCount },
        { count: skillsCount },
        { count: interestsCount },
        { count: careersCount },
        { count: jobsCount },
        { count: learningPathsCount },
        { count: learningPlansCount },
        { count: careerSuggestionsCount },
        { count: mockInterviewsCount },
        { count: aiSessionsCount },
        { count: learningRecommendationsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id', user.id),
        supabase.from('user_skills').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_interests').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('generated_careers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('learning_paths').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('learning_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('career_suggestions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('mock_interviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ai_mentorship_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('learning_recommendations').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      // Get CV files count
      const { data: cvFiles } = await supabase.storage
        .from('cvs')
        .list(user.id);

      setStats({
        profiles: profileCount || 0,
        skills: skillsCount || 0,
        interests: interestsCount || 0,
        careers: careersCount || 0,
        jobs: jobsCount || 0,
        learningPaths: learningPathsCount || 0,
        learningPlans: learningPlansCount || 0,
        careerSuggestions: careerSuggestionsCount || 0,
        mockInterviews: mockInterviewsCount || 0,
        aiSessions: aiSessionsCount || 0,
        learningRecommendations: learningRecommendationsCount || 0,
        cvFiles: cvFiles?.length || 0
      });

    } catch (error: any) {
      console.error('Error loading data stats:', error);
      setError(error.message || 'Failed to load data statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (operation: DeleteOperation) => {
    if (confirmDelete !== operation.type) {
      setConfirmDelete(operation.type);
      return;
    }

    try {
      setDeleting(operation.type);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete from database tables
      for (const table of operation.tables) {
        let query = supabase.from(table).delete();
        
        // Use appropriate user field for each table
        if (table === 'profiles') {
          query = query.eq('id', user.id);
        } else if (table === 'mentorship_sessions') {
          query = query.eq('mentee_id', user.id);
        } else if (table === 'interview_feedback_metrics') {
          // For this table, we need to delete based on interview ownership
          const { data: userInterviews } = await supabase
            .from('mock_interviews')
            .select('id')
            .eq('user_id', user.id);
          
          if (userInterviews && userInterviews.length > 0) {
            const interviewIds = userInterviews.map(interview => interview.id);
            query = query.in('interview_id', interviewIds);
          } else {
            continue; // Skip if no interviews
          }
        } else {
          query = query.eq('user_id', user.id);
        }

        const { error: deleteError } = await query;
        if (deleteError) {
          console.error(`Error deleting from ${table}:`, deleteError);
          throw new Error(`Failed to delete ${table} data: ${deleteError.message}`);
        }
      }

      // Clean up storage if needed
      if (operation.storageCleanup) {
        try {
          const { data: files } = await supabase.storage
            .from('cvs')
            .list(user.id);

          if (files && files.length > 0) {
            const filePaths = files.map(file => `${user.id}/${file.name}`);
            const { error: storageError } = await supabase.storage
              .from('cvs')
              .remove(filePaths);

            if (storageError) {
              console.error('Storage cleanup error:', storageError);
              // Don't throw here as the main data deletion succeeded
            }
          }
        } catch (storageError) {
          console.error('Storage cleanup error:', storageError);
          // Continue as main deletion succeeded
        }
      }

      // Clear local storage for learning resource tracker
      if (operation.type === 'learning_data' || operation.type === 'all_data') {
        try {
          localStorage.removeItem('learningResourceTracker');
        } catch (localStorageError) {
          console.error('Local storage cleanup error:', localStorageError);
        }
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `${operation.label} deleted successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

      // Reload stats
      await loadDataStats();
      setConfirmDelete(null);

    } catch (error: any) {
      console.error('Error deleting data:', error);
      setError(error.message || `Failed to delete ${operation.label}`);
    } finally {
      setDeleting(null);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 text-blue-800',
      green: 'border-green-200 bg-green-50 text-green-800',
      purple: 'border-purple-200 bg-purple-50 text-purple-800',
      orange: 'border-orange-200 bg-orange-50 text-orange-800',
      indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
      red: 'border-red-200 bg-red-50 text-red-800',
      pink: 'border-pink-200 bg-pink-50 text-pink-800',
      gray: 'border-gray-200 bg-gray-50 text-gray-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const getButtonColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      orange: 'bg-orange-600 hover:bg-orange-700',
      indigo: 'bg-indigo-600 hover:bg-indigo-700',
      red: 'bg-red-600 hover:bg-red-700',
      pink: 'bg-pink-600 hover:bg-pink-700',
      gray: 'bg-gray-600 hover:bg-gray-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const getDataCount = (operation: DeleteOperation): number => {
    if (!stats) return 0;
    
    switch (operation.type) {
      case 'profile_data':
        return stats.profiles;
      case 'skills_interests':
        return stats.skills + stats.interests;
      case 'career_data':
        return stats.careers + stats.careerSuggestions;
      case 'job_data':
        return stats.jobs;
      case 'learning_data':
        return stats.learningPaths + stats.learningPlans + stats.learningRecommendations;
      case 'interview_data':
        return stats.mockInterviews;
      case 'ai_sessions':
        return stats.aiSessions;
      case 'cv_files':
        return stats.cvFiles;
      case 'all_data':
        return Object.values(stats).reduce((sum, count) => sum + count, 0);
      default:
        return 0;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Database className="w-6 h-6 mr-2 text-red-600" />
            Data Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and delete your profile data and generated assets
          </p>
        </div>
        <Button
          onClick={loadDataStats}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh Stats'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Warning Notice */}
      <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Warning</h3>
            <div className="text-yellow-700 space-y-2">
              <p>• <strong>Data deletion is permanent and cannot be undone</strong></p>
              <p>• Make sure to download any important data before deletion</p>
              <p>• Some operations may affect related data in other sections</p>
              <p>• Consider backing up your CV and important profile information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Overview */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Profile Data</p>
                <p className="text-2xl font-bold text-blue-800">{stats.profiles}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Skills & Interests</p>
                <p className="text-2xl font-bold text-green-800">{stats.skills + stats.interests}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Career Data</p>
                <p className="text-2xl font-bold text-purple-800">{stats.careers + stats.careerSuggestions}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600">Learning Data</p>
                <p className="text-2xl font-bold text-indigo-800">{stats.learningPaths + stats.learningPlans}</p>
              </div>
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* Delete Operations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Delete Operations</h3>
        {deleteOperations.map((operation) => {
          const Icon = operation.icon;
          const dataCount = getDataCount(operation);
          const isConfirming = confirmDelete === operation.type;
          const isDeleting = deleting === operation.type;
          
          return (
            <div
              key={operation.type}
              className={`border rounded-lg p-6 ${getColorClasses(operation.color)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Icon className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg">{operation.label}</h4>
                    <p className="text-sm opacity-80 mt-1">{operation.description}</p>
                    {stats && (
                      <p className="text-sm font-medium mt-2">
                        {dataCount > 0 ? `${dataCount} items found` : 'No data found'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {!isConfirming ? (
                    <Button
                      onClick={() => handleDelete(operation)}
                      disabled={!stats || dataCount === 0 || isDeleting}
                      className={`${getButtonColorClasses(operation.color)} text-white`}
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Type to confirm:</p>
                      <p className="text-xs font-mono bg-white px-2 py-1 rounded border">
                        {operation.confirmText}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleDelete(operation)}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          {isDeleting ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Confirm Delete
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setConfirmDelete(null)}
                          disabled={isDeleting}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <h4 className="font-semibold text-gray-900 mb-3">What happens when you delete data?</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• <strong>Profile Data:</strong> Removes personal information, work preferences, and contact details</p>
          <p>• <strong>Skills & Interests:</strong> Deletes all your skills and interests entries</p>
          <p>• <strong>Career Data:</strong> Removes generated career options and suggestions</p>
          <p>• <strong>Job Data:</strong> Deletes all saved job opportunities</p>
          <p>• <strong>Learning Data:</strong> Removes learning paths, plans, and recommendations</p>
          <p>• <strong>Interview Data:</strong> Deletes mock interviews and feedback</p>
          <p>• <strong>AI Sessions:</strong> Removes all AI mentorship conversations</p>
          <p>• <strong>CV Files:</strong> Deletes uploaded CV files from storage</p>
          <p>• <strong>ALL DATA:</strong> Complete account data deletion (keeps login credentials)</p>
        </div>
      </div>
    </div>
  );
}