import { useState, useEffect } from 'react';

import { ArrowRight, Shield, Clock, Globe, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import Button from '../Button';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { WEBINAR } from '../../lib/constants/webinar';

export default function HeroSection() {

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const webinarUpcoming = Date.now() < new Date(WEBINAR.endsAt).getTime();

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
      <section className="relative pt-24 pb-14 sm:pt-32 sm:pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
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
            {webinarUpcoming ? (
              <Link
                to="/job-switch-copilot#webinar"
                className="inline-flex max-w-full items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-2xl sm:rounded-full text-xs sm:text-sm font-semibold text-left mb-5 sm:mb-6 hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Free job switch webinar · {WEBINAR.schedule}</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium mb-5 sm:mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Powered by Advanced AI Technology
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
              One Stop Solution for Career Growth
            </h1>

            <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Get AI-powered resume optimization, discover hidden job openings, find hiring managers directly, and unlock personalized career insights—all in one platform. No credit card. No commitment. Just results.
            </p>

            {/* Free Benefits Bullets */}
            <ul className="mx-auto mb-8 flex max-w-sm flex-col gap-3 text-left sm:max-w-3xl sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-3">
              {[
                ["Generate unlimited resumes", "Free AI-powered builder"],
                ["Smart job matching", "Personalized recommendations"],
                ["Full platform access", "7 days, completely free"],
              ].map(([title, detail]) => (
                <li key={title} className="flex items-start gap-2.5 rounded-xl bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200/70 sm:bg-transparent sm:p-0 sm:text-base sm:shadow-none sm:ring-0">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span><span className="font-semibold text-gray-900">{title}</span> — {detail}</span>
                </li>
              ))}
            </ul>

            <div className="mx-auto mb-10 flex max-w-sm flex-col items-stretch gap-3 sm:mb-12 sm:max-w-none sm:flex-row sm:items-start sm:justify-center sm:gap-4">
              <div className="flex flex-col items-center">
                <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="block w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-base sm:text-lg w-full sm:w-auto"
                  >
                    {isLoggedIn ? "Go to Dashboard" : "Start Free Now"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                {!isLoggedIn && (
                  <p className="mt-2 flex items-center justify-center text-center text-xs sm:text-sm text-gray-600 font-medium">
                    <Shield className="w-4 h-4 mr-1.5 flex-shrink-0 text-green-500" />
                    No payment info needed. 7-day free access starts now.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-base sm:text-lg border-2 w-full sm:w-auto bg-white/70"
                onClick={() => setShowDemoModal(true)}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1.5" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5" />
                24/7 AI Support
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-1.5" />
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
