import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useState } from 'react';
import Header from './components/Header';
import MobileNavigation from './components/MobileNavigation';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobSearchPage from './pages/JobSearchPage';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute';
import ProfileProtectedRoute from './components/ProfileProtectedRoute';
import { UserProvider } from './context/UserContext';
import Pricing from './pages/Pricing';
import Subscription from './pages/Subscription';
import AIResumeBuilder from "./pages/AIResumeBuilder";
import MockInterview from "./pages/MockInterview";
import BlogPost from "./pages/BlogPost";
import JobReadinessIndex from "./pages/JobReadinessIndex";
import LinkedInProfileOptimizer from "./pages/LinkedInProfileOptimizer";
import WhatsAppChat from './components/WhatsAppChat';
import Footer from './components/Footer';
import AnalyticsTracking from './components/AnalyticsTracking';
import PerformanceMonitor from './components/PerformanceMonitor';
import UserTypeSelection from './components/UserTypeSelection';
import OnboardingForm from './components/OnboardingForm';
import Onboarding from './pages/Onboarding';
import OnboardingModal from './components/OnboardingModal';
import ScrollToTop from './components/ScrollToTop';
import Training from './pages/Training';
import ThankYouPage from './pages/ThankYouPage';
import JobSwitchCopilot from './pages/JobSwitchCopilot';
import FreeResumeAudit from './pages/FreeResumeAudit';
import SuccessStories from './pages/SuccessStories';
import ResumeExamples from './pages/ResumeExamples';
import ForColleges from './pages/ForColleges';
import ForEdtechPartners from './pages/ForEdtechPartners';
import BookACall from './pages/BookACall';
import SEOLandingPage from './pages/seo/SEOLandingPage';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <UserProvider>
          {/* Analytics Tracking */}
          <AnalyticsTracking />
          {/* Performance Monitoring */}
          <PerformanceMonitor />
        
        <div className="min-h-screen bg-gray-50">
          <Header onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <MobileNavigation 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)} 
          />
          <OnboardingModal />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/get-started" element={<Onboarding />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/job-readiness-index" element={<JobReadinessIndex />} />
              <Route path="/linkedin-profile-optimizer" element={<LinkedInProfileOptimizer />} />
              <Route 
                path="/subscription" 
                element={
                  <ProtectedRoute>
                    <ProfileProtectedRoute>
                      <Subscription />
                    </ProfileProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route path="/auth/callback" element={<GoogleAuthCallback />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/blog" element={<Blog />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <ProfileProtectedRoute>
                      <DashboardPage />
                    </ProfileProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-search"
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <JobSearchPage />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/callback/google" element={<GoogleAuthCallback />} />
              <Route 
                path="/ai-resume-builder" 
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <AIResumeBuilder />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mock-interview" 
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <MockInterview />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/user-type-selection" element={<UserTypeSelection />} />
              <Route path="/onboarding" element={<OnboardingForm />} />
              <Route path="/training" element={<Training />} />
              <Route path="/thank-you" element={<ThankYouPage />} />

              {/* Job Switch Copilot — additive product line */}
              <Route path="/job-switch-copilot" element={<JobSwitchCopilot />} />
              <Route path="/free-resume-audit" element={<FreeResumeAudit />} />
              <Route path="/success-stories" element={<SuccessStories />} />
              <Route path="/resume-examples" element={<ResumeExamples />} />
              <Route path="/for-colleges" element={<ForColleges />} />
              <Route path="/for-edtech-partners" element={<ForEdtechPartners />} />
              <Route path="/book-a-call" element={<BookACall />} />

              {/* SEO landing pages — single template, data-driven */}
              <Route path="/software-engineer-resume" element={<SEOLandingPage slug="software-engineer-resume" />} />
              <Route path="/devops-resume" element={<SEOLandingPage slug="devops-resume" />} />
              <Route path="/data-engineer-resume" element={<SEOLandingPage slug="data-engineer-resume" />} />
              <Route path="/job-search-after-layoff" element={<SEOLandingPage slug="job-search-after-layoff" />} />
              <Route path="/ats-resume-checker-india" element={<SEOLandingPage slug="ats-resume-checker-india" />} />
              <Route path="/cloud-engineer-resume" element={<SEOLandingPage slug="cloud-engineer-resume" />} />
              <Route path="/ai-ml-engineer-resume" element={<SEOLandingPage slug="ai-ml-engineer-resume" />} />
              <Route path="/product-manager-resume" element={<SEOLandingPage slug="product-manager-resume" />} />
              <Route path="/business-analyst-resume" element={<SEOLandingPage slug="business-analyst-resume" />} />
              <Route path="/software-engineer-mock-interview" element={<SEOLandingPage slug="software-engineer-mock-interview" />} />
              <Route path="/system-design-interview-prep" element={<SEOLandingPage slug="system-design-interview-prep" />} />
              <Route path="/notice-period-job-search" element={<SEOLandingPage slug="notice-period-job-search" />} />
              <Route path="/resume-review-india" element={<SEOLandingPage slug="resume-review-india" />} />
              <Route path="/career-coach-for-tech-professionals" element={<SEOLandingPage slug="career-coach-for-tech-professionals" />} />
              <Route path="/linkedin-profile-optimization-india" element={<SEOLandingPage slug="linkedin-profile-optimization-india" />} />

              {/* 404 Not Found - Must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          
          {/* WhatsApp Chat - Fixed position on all pages */}
          <WhatsAppChat 
            phoneNumber="+917310768702"
            message="Hi! I'm interested in Skillsurger's career services."
          />
          
          {/* Footer */}
          <Footer />
        </div>
      </UserProvider>
    </Router>
    </HelmetProvider>
  );
}

export default App;