import { useState, useEffect } from 'react';

import { ArrowRight, Shield, Clock, Globe, Sparkles } from 'lucide-react';
import Button from '../Button';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function HeroSection() {

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
