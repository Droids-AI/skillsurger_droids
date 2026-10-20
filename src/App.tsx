import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import SiteLayout from './components/SiteLayout';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute';
import ProfileProtectedRoute from './components/ProfileProtectedRoute';
import { UserProvider } from './context/UserContext';
import AnalyticsTracking from './components/AnalyticsTracking';
import PerformanceMonitor from './components/PerformanceMonitor';
import ScrollToTop from './components/ScrollToTop';

// Pages load on demand so the homepage only downloads its own code.
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const JobSearchPage = lazy(() => import('./pages/JobSearchPage'));
const GoogleAuthCallback = lazy(() => import('./pages/GoogleAuthCallback'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Blog = lazy(() => import('./pages/Blog'));
const Plans = lazy(() => import('./pages/Plans'));
const Subscription = lazy(() => import('./pages/Subscription'));
const AIResumeBuilder = lazy(() => import('./pages/AIResumeBuilder'));
const MockInterview = lazy(() => import('./pages/MockInterview'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const JobReadinessIndex = lazy(() => import('./pages/JobReadinessIndex'));
const LinkedInProfileOptimizer = lazy(() => import('./pages/LinkedInProfileOptimizer'));
const UserTypeSelection = lazy(() => import('./components/UserTypeSelection'));
const OnboardingForm = lazy(() => import('./components/OnboardingForm'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const JobSwitchCopilot = lazy(() => import('./pages/JobSwitchCopilot'));
const JobSearchBootcamp = lazy(() => import('./pages/JobSearchBootcamp'));
const FreeResumeAudit = lazy(() => import('./pages/FreeResumeAudit'));
const SuccessStories = lazy(() => import('./pages/SuccessStories'));
const ResumeExamples = lazy(() => import('./pages/ResumeExamples'));
const ForColleges = lazy(() => import('./pages/ForColleges'));
const ForEdtechPartners = lazy(() => import('./pages/ForEdtechPartners'));
const BookACall = lazy(() => import('./pages/BookACall'));
const SEOLandingPage = lazy(() => import('./pages/seo/SEOLandingPage'));
const PasswordRecovery = lazy(() => import('./pages/PasswordRecovery'));
const FDECourse = lazy(() => import('./pages/FDECourse'));


// Old ad URLs retain every query parameter while resolving to free registration.
function WebinarRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: '/job-search-copilot-webinar', search, hash: hash === '#programme' ? '#webinar' : hash }} replace />;
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <UserProvider>
          {/* Analytics Tracking */}
          <AnalyticsTracking />
          {/* Performance Monitoring */}
          <PerformanceMonitor />
        
        <SiteLayout>
            <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<PasswordRecovery />} />
              <Route path="/reset-password" element={<PasswordRecovery reset />} />
              <Route path="/book-diagnosis" element={<Navigate to="/book-a-call" replace />} />
              <Route path="/courses/forward-deployed-ai-engineer" element={<FDECourse />} />
              <Route path="/forward-deployed-ai-engineer" element={<Navigate to="/courses/forward-deployed-ai-engineer" replace />} />
              <Route path="/get-started" element={<Onboarding />} />
              <Route path="/pricing" element={<Plans publicPage />} />
              <Route path="/upgrade" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
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
              <Route path="/job-search" element={<JobSearchPage />} />
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
              <Route path="/training" element={<WebinarRedirect />} />
              <Route path="/thank-you" element={<ThankYouPage />} />

              {/* Job Switch Copilot — additive product line */}
              <Route path="/job-switch-copilot" element={<WebinarRedirect />} />
              <Route path="/job-search-copilot" element={<WebinarRedirect />} />
              <Route path="/job-search-copilot-webinar" element={<JobSwitchCopilot />} />
              <Route path="/job-search-bootcamp" element={<JobSearchBootcamp />} />
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
            </Suspense>
        </SiteLayout>
      </UserProvider>
    </Router>
    </HelmetProvider>
  );
}

export default App;
