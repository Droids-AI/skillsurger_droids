import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OnboardingCheck from '../components/OnboardingCheck';
import {
  User,
  BarChart,
  Briefcase,
  Users,
  Menu,
  X,
  LogOut,
  BookOpen,
  FileCheck
} from 'lucide-react';
import MentorshipHub from '../components/MentorshipHub';
import CareerExplorer from '../components/CareerExplorer';
import ProgressTracker from '../components/ProgressTracker';
import ProfileSection from '../components/ProfileSection';
import LearningPaths from '../components/LearningPaths';
import CVScoring from '../components/CVScoring';
import Subscription from './Subscription';
import TrialWarning from '../components/TrialWarning';
import { useUser } from '../context/UserContext';
import { hasAIFeatureAccess } from '../lib/subscriptionUtils';
import SEO from '../components/SEO';
import DashboardSkeleton from '../components/DashboardSkeleton';

type DashboardSection = 'overview' | 'profile' | 'career' | 'cv-scoring' | 'mentorship' | 'learning' | 'subscription';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sections: DashboardSection[] = ['overview', 'profile', 'career', 'cv-scoring', 'mentorship', 'learning', 'subscription'];
  const requestedSection = searchParams.get('section') as DashboardSection;
  const activeSection = sections.includes(requestedSection) ? requestedSection : 'overview';
  const setActiveSection = (section: DashboardSection) => {
    navigate(`/dashboard?section=${section}`);
    setIsMobileMenuOpen(false);
  };
  const [selectedJobForLearning, setSelectedJobForLearning] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [careerExplorerJobs, setCareerExplorerJobs] = useState<any[]>([]);
  const [careerExplorerSelectedCareer, setCareerExplorerSelectedCareer] = useState('');
  const { subscription, loading: contextLoading } = useUser();
  const hasAI = hasAIFeatureAccess(subscription);

  useEffect(() => { checkUser(); }, []);
  useEffect(() => {
    const handleSectionChange = (event: Event) => {
      const section = (event as CustomEvent).detail;
      const aliases: Record<string, DashboardSection> = { 'mock-interviews': 'mentorship', skills: 'learning' };
      const target = aliases[section] || section;
      if (sections.includes(target)) setActiveSection(target);
    };
    window.addEventListener('changeSection', handleSectionChange);
    return () => window.removeEventListener('changeSection', handleSectionChange);
  }, [navigate]);

  async function checkUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        navigate('/login');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking user session:', error);
      navigate('/login');
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear localStorage when logging out
      localStorage.removeItem('dashboardActiveSection');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
    {
      id: 'career',
      label: 'Career Explorer',
      icon: Briefcase,
    },
    {
      id: 'cv-scoring',
      label: 'CV Scoring',
      icon: FileCheck,
    },
    {
      id: 'mentorship',
      label: 'Mentorship Hub',
      icon: Users,
    },
    {
      id: 'learning',
      label: 'Learning Paths',
      icon: BookOpen,
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: BarChart, // You can use a more appropriate icon if desired
    },
  ];

  if (loading || contextLoading) {
    return <DashboardSkeleton />;
  }


  return (
    <OnboardingCheck>
      <>
        <SEO 
          title="Dashboard | Skillsurger"
          description="Access your personalized career dashboard. Track progress, optimize your resume, practice interviews, and explore career opportunities."
          keywords="career dashboard, user dashboard, career progress"
          canonicalUrl="/dashboard"
          noIndex={true}
        />
        <div className="min-h-screen bg-gray-50 flex w-full">
          {/* Mobile Menu Button */}
          <button
            aria-label={isMobileMenuOpen ? "Close dashboard menu" : "Open dashboard menu"}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden fixed top-20 left-4 z-40 p-2 bg-white rounded-lg shadow-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>

          {/* Sidebar - Always visible on desktop, toggleable on mobile */}
          <div
            className={`fixed lg:static inset-y-0 left-0 transform ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 transition-transform duration-200 ease-in-out z-30 w-64 shrink-0 bg-white border-r shadow-lg lg:shadow-none pt-24 h-screen overflow-y-auto overflow-x-hidden`}
          >
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      console.log(`Menu clicked: ${item.id}, current section: ${activeSection}`);
                      console.log(`Before setActiveSection: localStorage=${localStorage.getItem('dashboardActiveSection')}`);
                      setActiveSection(item.id as DashboardSection);
                      console.log(`After setActiveSection: localStorage=${localStorage.getItem('dashboardActiveSection')}`);
                      // localStorage will be updated by the URL update effect
                      // Don't close menu on desktop
                      if (window.innerWidth < 1024) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Main Content - Adjusted padding for fixed sidebar */}
          <div className="flex-1 min-w-0 pt-24 pb-12 px-4 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Trial Warning */}
              <TrialWarning />
              
              {activeSection === 'overview' && (
                <>
                  <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                  <ProgressTracker />
                </>
              )}

              {activeSection === 'profile' && (
                <>
                  <h1 className="text-2xl font-bold">Profile Management</h1>
                  <ProfileSection />
                </>
              )}

              {activeSection === 'career' && (
                <>
                  <h1 className="text-2xl font-bold">Career Explorer</h1>
                  {!hasAI ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">AI Features Require Active Subscription</h3>
                      <p className="text-yellow-700 mb-4">
                        Your trial or subscription has expired. To access Career Explorer and other AI-powered features, please upgrade your plan.
                      </p>
                      <a
                        href="/upgrade"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
                      >
                        Upgrade Now
                      </a>
                    </div>
                  ) : (
                    <CareerExplorer
                      onGenerateLearningPath={(job) => {
                        setSelectedJobForLearning(job);
                        setActiveSection('learning');
                        // localStorage will be updated by the URL update effect
                      }}
                      jobs={careerExplorerJobs}
                      setJobs={setCareerExplorerJobs}
                      selectedCareer={careerExplorerSelectedCareer}
                      setSelectedCareer={setCareerExplorerSelectedCareer}
                    />
                  )}
                </>
              )}

              {activeSection === 'cv-scoring' && (
                <>
                  {!hasAI ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">AI Features Require Active Subscription</h3>
                      <p className="text-yellow-700 mb-4">
                        Your trial or subscription has expired. To access CV Scoring and other AI-powered features, please upgrade your plan.
                      </p>
                      <a
                        href="/upgrade"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
                      >
                        Upgrade Now
                      </a>
                    </div>
                  ) : (
                    <CVScoring />
                  )}
                </>
              )}

              {activeSection === 'mentorship' && (
                <>
                  <h1 className="text-2xl font-bold">Mentorship Hub</h1>
                  {!hasAI ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">AI Features Require Active Subscription</h3>
                      <p className="text-yellow-700 mb-4">
                        Your trial or subscription has expired. To access Mentorship Hub and other AI-powered features, please upgrade your plan.
                      </p>
                      <a
                        href="/upgrade"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
                      >
                        Upgrade Now
                      </a>
                    </div>
                  ) : (
                    <MentorshipHub />
                  )}
                </>
              )}

              {activeSection === 'learning' && (
                <>
                  <h1 className="text-2xl font-bold">Learning Paths</h1>
                  {!hasAI ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">AI Features Require Active Subscription</h3>
                      <p className="text-yellow-700 mb-4">
                        Your trial or subscription has expired. To access Learning Paths and other AI-powered features, please upgrade your plan.
                      </p>
                      <a
                        href="/upgrade"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
                      >
                        Upgrade Now
                      </a>
                    </div>
                  ) : (
                    <LearningPaths job={selectedJobForLearning} />
                  )}
                </>
              )}

              {activeSection === 'subscription' && (
                <>
                  <h1 className="text-2xl font-bold">Subscription</h1>
                  <Subscription />
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}
        </div>
      </>
    </OnboardingCheck>
  );
}