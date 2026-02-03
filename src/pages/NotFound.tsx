import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, Compass } from 'lucide-react';
import Button from '../components/Button';
import SEO from '../components/SEO';

const NotFound = () => {
  return (
    <>
      <SEO
        title="404 - Page Not Found | Skillsurger"
        description="The page you're looking for doesn't exist. Explore Skillsurger's AI-powered career tools and resources."
        canonicalUrl="/404"
        noIndex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 rounded-full mb-6">
              <Compass className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-8xl font-bold text-gray-800 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-700 mb-4">
              Page Not Found
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Oops! The page you're looking for seems to have taken a career break.
              Let's get you back on track!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
            <Link to="/blog">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Search className="w-5 h-5 mr-2" />
                Browse Blog
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Popular Pages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/ai-resume-builder"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">AI</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Resume Builder</p>
                  <p className="text-sm text-gray-600">Create ATS-friendly CVs</p>
                </div>
              </Link>

              <Link
                to="/mock-interview"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">MI</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Mock Interview</p>
                  <p className="text-sm text-gray-600">Practice with AI</p>
                </div>
              </Link>

              <Link
                to="/pricing"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">$</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Pricing</p>
                  <p className="text-sm text-gray-600">View our plans</p>
                </div>
              </Link>

              <Link
                to="/contact"
                className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">?</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Contact Us</p>
                  <p className="text-sm text-gray-600">Get help & support</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to previous page
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
