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
import { UserProvider, useUser } from '../context/UserContext';
import { hasAIFeatureAccess } from '../lib/subscriptionUtils';
import SEO from '../components/SEO';
import DashboardSkeleton from '../components/DashboardSkeleton';

type DashboardSection = 'overview' | 'profile' | 'career' | 'cv-scoring' | 'mentorship' | 'learning' | 'subscription';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  
  // Debug: Track activeSection changes
  useEffect(() => {
    console.log(`activeSection changed to: ${activeSection}`);
    console.log(`localStorage at this moment: ${localStorage.getItem('dashboardActiveSection')}`);
    console.trace('activeSection change stack trace');
  }, [activeSection]);
  const [selectedJobForLearning, setSelectedJobForLearning] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  // Persist job suggestions and selected career for CareerExplorer
  const [careerExplorerJobs, setCareerExplorerJobs] = useState<any[]>(() => {
    // Load jobs from localStorage on mount
    try {
      const savedJobs = localStorage.getItem('careerExplorerJobs');
      return savedJobs ? JSON.parse(savedJobs) : [];
    } catch (error) {
      console.error('Error loading jobs from localStorage:', error);
      return [];
    }
  });
  const [careerExplorerSelectedCareer, setCareerExplorerSelectedCareer] = useState<string>('');

  const { subscription, loading: contextLoading } = useUser();
  
  // Save jobs to localStorage whenever they change
  useEffect(() => {
    if (careerExplorerJobs.length > 0) {
      localStorage.setItem('careerExplorerJobs', JSON.stringify(careerExplorerJobs));
    }
  }, [careerExplorerJobs]);

  // Check if user has AI access
  const hasAI = hasAIFeatureAccess(subscription);

  useEffect(() => {
    // Read section directly from window.location to avoid stale searchParams
    const urlParams = new URLSearchParams(window.location.search);
    const sectionFromQuery = urlParams.get('section');
    console.log(`Dashboard useEffect: URL section=${sectionFromQuery}, activeSection=${activeSection}`);
    
    // Only update if the URL section is different from current activeSection
    // AND the activeSection is not already set correctly (prevent loops)
    if (sectionFromQuery && ['overview', 'profile', 'career', 'cv-scoring', 'mentorship', 'learning', 'subscription'].includes(sectionFromQuery)) {
      if (activeSection !== sectionFromQuery) {
        console.log(`Setting section from URL: ${sectionFromQuery} (was ${activeSection})`);
        setActiveSection(sectionFromQuery as DashboardSection);
        localStorage.setItem('dashboardActiveSection', sectionFromQuery);
      } else {
        console.log(`Section already matches URL: ${sectionFromQuery}`);
      }
    } else {
      // If no URL param, only restore from localStorage if activeSection is still 'overview' (initial state)
      // This prevents overriding user selections
      if (activeSection === 'overview') {
        const savedSection = localStorage.getItem('dashboardActiveSection') as DashboardSection;
        console.log(`No URL section, checking localStorage: ${savedSection}`);
        if (savedSection && ['overview', 'profile', 'career', 'mentorship', 'learning', 'subscription'].includes(savedSection)) {
          console.log(`Restoring section from localStorage: ${savedSection}`);
          setActiveSection(savedSection);
          // Update URL to match localStorage
          const newSearchParams = new URLSearchParams(window.location.search);
          newSearchParams.set('section', savedSection);
          const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
          window.history.replaceState({}, '', newUrl);
        }
      } else {
        console.log(`No URL section but activeSection is ${activeSection}, keeping current section`);
      }
    }
    
    checkUser();

    // Listen for section change events from achievements
    const handleSectionChange = (event: CustomEvent) => {
      const section = event.detail;
      switch (section) {
        case 'profile':
          setActiveSection('profile');
          break;
        case 'mock-interviews':
        case 'mentorship':
          setActiveSection('mentorship');
          break;
        case 'skills':
        case 'learning':
          setActiveSection('learning');
          break;
        case 'subscription':
          setActiveSection('subscription');
          break;
      }
      setIsMobileMenuOpen(false);
    };

    window.addEventListener('changeSection', handleSectionChange as EventListener);

    return () => {
      window.removeEventListener('changeSection', handleSectionChange as EventListener);
    };
  }, [searchParams]); // Only depend on searchParams - read fresh values from window.location

  // Update URL when activeSection changes - simplified approach
  useEffect(() => {
    console.log(`URL update effect triggered: activeSection=${activeSection}`);
    
    // Skip if activeSection is not initialized yet
    if (!activeSection) {
      console.log('Skipping URL update - activeSection not initialized');
      return;
    }
    
    // Only update URL if we have a valid activeSection and it's different from URL
    if (activeSection && activeSection !== 'overview') {
      const urlParams = new URLSearchParams(window.location.search);
      const currentSection = urlParams.get('section');
      
      console.log(`URL update check: currentSection=${currentSection}, activeSection=${activeSection}`);
      
      if (currentSection !== activeSection) {
        console.log(`Updating URL: ${currentSection} -> ${activeSection}`);
        const newSearchParams = new URLSearchParams(window.location.search);
        newSearchParams.set('section', activeSection);
        localStorage.setItem('dashboardActiveSection', activeSection);
        console.log(`Updated localStorage to: ${activeSection}`);
        
        const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
        console.log(`Updated URL to: ${newUrl}`);
      } else {
        console.log(`URL already matches activeSection: ${activeSection}`);
      }
    } else if (activeSection === 'overview') {
      // For overview, only remove section if URL currently has a section
      // This prevents unnecessary URL changes during initial render
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('section')) {
        console.log('Removing section from URL for overview');
        urlParams.delete('section');
        localStorage.removeItem('dashboardActiveSection');
        
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [activeSection]);

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
      <UserProvider>
        <SEO 
          title="Dashboard | Skillsurger"
          description="Access your personalized career dashboard. Track progress, optimize your resume, practice interviews, and explore career opportunities."
          keywords="career dashboard, user dashboard, career progress"
          canonicalUrl="/dashboard"
          noIndex={true}
        />
        <div className="min-h-screen bg-gray-50 flex">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
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
            } lg:translate-x-0 transition-transform duration-200 ease-in-out z-30 w-64 bg-white border-r shadow-lg lg:shadow-none pt-24 h-screen overflow-y-auto`}
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
          <div className="flex-1 pt-24 pb-12 px-4 lg:px-8 lg">
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
                        href="/pricing"
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
                        href="/pricing"
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
                        href="/pricing"
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
                        href="/pricing"
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
      </UserProvider>
    </OnboardingCheck>
  );
}