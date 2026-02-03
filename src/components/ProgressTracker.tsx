import { useState, useEffect } from 'react';
import { Trophy, Star, Target, Award, TrendingUp, BookOpen, Briefcase, FileText } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof icons;
  progress: number;
  maxProgress: number;
  completed: boolean;
  section: 'profile' | 'mock-interviews' | 'skills' | 'mentorship' | 'learning';
}

interface ProgressStats {
  level: number;
  experience: number;
  nextLevelExperience: number;
  completedTasks: number;
  skillsLearned: number;
  learningPathsGenerated: number;
  jobsSaved: number;
  cvAnalyses: number;
}

const icons = {
  Trophy,
  Star,
  Target,
  Award,
  TrendingUp,
  BookOpen,
  Briefcase,
  FileText
};

export default function ProgressTracker() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Profile Master',
      description: 'Complete your professional profile',
      icon: 'Star',
      progress: 0,
      maxProgress: 5,
      completed: false,
      section: 'profile'
    },
    {
      id: '2',
      title: 'Interview Pro',
      description: 'Complete 5 mock interviews',
      icon: 'Trophy',
      progress: 0,
      maxProgress: 5,
      completed: false,
      section: 'mock-interviews'
    },
    {
      id: '3',
      title: 'Skill Builder',
      description: 'Learn 10 new skills',
      icon: 'Target',
      progress: 0,
      maxProgress: 10,
      completed: false,
      section: 'skills'
    },
    {
      id: '4',
      title: 'Networking Champion',
      description: 'Connect with 3 mentors',
      icon: 'Award',
      progress: 0,
      maxProgress: 3,
      completed: false,
      section: 'mentorship'
    },
    {
      id: '5',
      title: 'Learning Path Creator',
      description: 'Generate 3 learning paths',
      icon: 'BookOpen',
      progress: 0,
      maxProgress: 3,
      completed: false,
      section: 'learning'
    },
    {
      id: '6',
      title: 'CV Optimizer',
      description: 'Analyze and optimize your CV',
      icon: 'FileText',
      progress: 0,
      maxProgress: 1,
      completed: false,
      section: 'profile'
    }
  ]);

  const [stats, setStats] = useState<ProgressStats>({
    level: 1,
    experience: 0,
    nextLevelExperience: 1000,
    completedTasks: 0,
    skillsLearned: 0
  });

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: skills },
        { data: interviews },
        { data: mentorships },
        { data: learningPlans },
        { data: learningPaths },
        { data: savedJobs },
        { data: profile }
      ] = await Promise.all([
        supabase.from('user_skills').select('*').eq('user_id', user.id),
        supabase.from('mock_interviews').select('*').eq('user_id', user.id),
        supabase.from('mentorship_sessions').select('*').eq('mentee_id', user.id),
        supabase.from('learning_plans').select('*').eq('user_id', user.id),
        supabase.from('learning_paths').select('*').eq('user_id', user.id),
        supabase.from('saved_jobs').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('cv_url, cv_parsed_data, cv_analyses_count').eq('id', user.id).single()
      ]);

      const updatedAchievements = achievements.map(achievement => {
        switch (achievement.id) {
          case '1': // Profile Master
            const profileProgress = calculateProfileProgress();
            return {
              ...achievement,
              progress: profileProgress,
              completed: profileProgress === achievement.maxProgress
            };
          case '2': // Interview Pro
            const interviewCount = interviews?.length || 0;
            return {
              ...achievement,
              progress: Math.min(interviewCount, achievement.maxProgress),
              completed: interviewCount >= achievement.maxProgress
            };
          case '3': // Skill Builder
            const skillCount = skills?.length || 0;
            return {
              ...achievement,
              progress: Math.min(skillCount, achievement.maxProgress),
              completed: skillCount >= achievement.maxProgress
            };
          case '4': // Networking Champion
            const mentorCount = mentorships?.length || 0;
            return {
              ...achievement,
              progress: Math.min(mentorCount, achievement.maxProgress),
              completed: mentorCount >= achievement.maxProgress
            };
          case '5': // Learning Path Creator
            const learningPathCount = learningPaths?.length || 0;
            return {
              ...achievement,
              progress: Math.min(learningPathCount, achievement.maxProgress),
              completed: learningPathCount >= achievement.maxProgress
            };
          case '6': // CV Optimizer
            const cvAnalysisCount = profile?.cv_analyses_count || 0;
            return {
              ...achievement,
              progress: Math.min(cvAnalysisCount, achievement.maxProgress),
              completed: cvAnalysisCount >= achievement.maxProgress
            };
          default:
            return achievement;
        }
      });

      setAchievements(updatedAchievements);

      const totalTasks = (learningPlans?.length || 0) + (interviews?.length || 0);
      const totalSkills = skills?.length || 0;
      const learningPathsGenerated = learningPaths?.length || 0;
      const jobsSaved = savedJobs?.length || 0;
      const cvAnalyses = profile?.cv_analyses_count || 0; // Count CV analyses
      const experience = calculateExperience(totalTasks, totalSkills, learningPathsGenerated, cvAnalyses);
      const level = Math.floor(experience / 1000) + 1;

      setStats({
        level,
        experience: experience % 1000,
        nextLevelExperience: 1000,
        completedTasks: totalTasks,
        skillsLearned: totalSkills,
        learningPathsGenerated,
        jobsSaved,
        cvAnalyses
      });
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }

  function calculateProfileProgress(): number {
    return 3; // Placeholder value
  }

  function calculateExperience(tasks: number, skills: number, learningPaths: number, cvAnalyses: number): number {
    return (tasks * 100) + (skills * 200) + (learningPaths * 150) + (cvAnalyses * 300);
  }

  const handleAchievementClick = (section: string) => {
    // Navigate to parent component and trigger section change
    window.dispatchEvent(new CustomEvent('changeSection', { detail: section }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Your Progress</h2>
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <span className="text-2xl font-bold">Level {stats.level}</span>
        </div>
      </div>

      {/* Experience Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Experience</span>
          <span className="text-sm font-medium">{stats.experience} / {stats.nextLevelExperience}</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${(stats.experience / stats.nextLevelExperience) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Tasks Completed</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.completedTasks}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-medium">Skills Learned</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.skillsLearned}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Learning Paths</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.learningPathsGenerated}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-orange-600" />
            <span className="font-medium">Jobs Saved</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.jobsSaved}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="font-medium">CV Analyses</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.cvAnalyses}</p>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        <div className="space-y-4">
          {achievements.map(achievement => {
            const Icon = icons[achievement.icon];
            return (
              <button
                key={achievement.id}
                onClick={() => handleAchievementClick(achievement.section)}
                className={`w-full text-left border rounded-lg p-4 transition-colors hover:bg-gray-50 ${
                  achievement.completed ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    achievement.completed ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      achievement.completed ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-gray-500">{achievement.description}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          Progress: {achievement.progress}/{achievement.maxProgress}
                        </span>
                        {achievement.completed && (
                          <span className="text-xs text-blue-600 font-medium">
                            Completed!
                          </span>
                        )}
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            achievement.completed ? 'bg-blue-600' : 'bg-gray-400'
                          }`}
                          style={{
                            width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}