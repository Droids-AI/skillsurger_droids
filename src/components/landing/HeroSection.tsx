import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Globe, Sparkles, Star, Upload, Award, TrendingUp, BarChart3, CheckCircle2, Bot, Trophy } from 'lucide-react';
import Button from '../Button';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function HeroSection() {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

      const handleCVScoringClick = () => {    if (isLoggedIn) {
      navigate('/dashboard?section=cv-scoring');
    } else {
      navigate('/signup');
    }
  };

  return (
    <>
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop&fm=webp&q=50&auto=format"
          alt="Career growth background"
          className="absolute inset-0 w-full h-full object-cover opacity-5"
          width="1920"
          height="1080"
          fetchPriority="high"
          loading="eager"
        />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI Technology
            </div>

            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              One Stop Solution for Career Growth
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get AI-powered resume optimization, discover hidden job openings, find hiring managers directly, and unlock personalized career insights—all in one platform. No credit card. No commitment. Just results.
            </p>

            {/* Free Benefits Bullets */}
            <div className="flex flex-wrap justify-center gap-6 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center text-gray-700">
                <Shield className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                <span className="font-medium">Generate unlimited resumes—Free AI-powered builder</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Shield className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                <span className="font-medium">Smart job matching—Personalized recommendations</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Shield className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                <span className="font-medium">Full platform access—7 days, completely free</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <div className="flex flex-col items-center w-full sm:w-auto">
                <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="w-full">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg w-full sm:w-auto"
                  >
                    Start Free Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center text-sm text-gray-600 mt-2 font-medium">
                  <Shield className="w-4 h-4 mr-1.5 text-green-500" />
                  No payment info needed. Your 7-day free access starts immediately.
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-2 w-full sm:w-auto"
                onClick={() => setShowDemoModal(true)}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                24/7 AI Support
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                Global Job Market
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Readiness Index CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-6">
              <Award className="w-4 h-4 mr-2" />
              New Free Tool
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Discover Your Job Readiness Index™
            </h2>
            <p className="text-lg sm:text-xl text-blue-50 mb-10 max-w-3xl mx-auto">
              Upload your resume, take a quick skills quiz, and get your personalized Job Readiness Score (0-100). Find out if you're truly job-ready in 5 minutes.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Readiness Score</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Skill Verification</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">ATS Check</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Earn Badges</p>
              </div>
            </div>

            <Link to="/job-readiness-index" className="inline-block">
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-gray-50 px-12 py-6 text-lg font-bold shadow-xl transform hover:scale-105 transition-all"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Get My Readiness Score
              </Button>
            </Link>
            <p className="text-sm text-blue-100 mt-6 font-medium">
              ✓ 100% Free  ✓ Takes 5 minutes  ✓ No signup required
            </p>
          </div>
        </div>
      </section>

      {/* CV Scoring CTA */}
      <section className="py-20 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-6">
              <Star className="w-4 h-4 mr-2" />
              Most Popular Feature
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Get Your FREE CV Score in 30 Seconds
            </h2>
            <p className="text-lg sm:text-xl text-green-50 mb-10 max-w-2xl mx-auto">
              Upload your resume and get instant ATS compatibility score, keyword analysis, and expert suggestions to beat applicant tracking systems.
            </p>
            <button onClick={handleCVScoringClick} className="inline-block">
              <Button
                size="lg"
                className="bg-white text-green-700 hover:bg-gray-50 px-12 py-6 text-lg font-bold shadow-xl transform hover:scale-105 transition-all"
              >
                <Upload className="w-5 h-5 mr-2" />
                Score My CV Now - It's Free
              </Button>
            </button>
            <p className="text-sm text-green-100 mt-6 font-medium">
              ✓ No credit card required  ✓ Instant results  ✓ Used by 5,000+ job seekers
            </p>
          </div>
        </div>
      </section>


      {/* Demo Video Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <button
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowDemoModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="p-4">
              <video
                src="https://firebasestorage.googleapis.com/v0/b/odiartcentre-e273f.appspot.com/o/media%2Fdemo.mp4?alt=media&token=777e943e-86e5-4741-9e1a-dc0107d69462"
                controls
                autoPlay
                muted
                loading="lazy"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: "70svh" }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
