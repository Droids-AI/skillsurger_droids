import React, { useEffect, useState } from 'react';
import { FileText, Check, Brain, Target, Zap, ArrowRight, X } from 'lucide-react';
import Button from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

const AIResumeBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is logged in, redirect to dashboard with career section
        navigate('/dashboard?section=career');
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="AI Resume Builder | Beat ATS Filters | Skillsurger"
        description="Create ATS-optimized resumes using AI. Tailor CVs to job roles instantly, get 95% ATS pass rate. Free trial—build your perfect resume in minutes."
        keywords="AI resume builder, ATS optimization, resume maker, CV builder, keyword optimization, resume templates"
        canonicalUrl="/ai-resume-builder"
      />
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered ATS Optimization
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              AI Resume Builder to Pass ATS
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create ATS-optimized resumes using Skillsurger's AI builder. Tailor CVs to job roles instantly and increase interview calls. Try it free!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg w-full sm:w-auto"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex items-center text-sm text-gray-600">
                <Check className="w-4 h-4 mr-1.5 text-green-500" />
                No credit card required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Our AI Resume Builder Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intelligent system creates ATS-optimized resumes in minutes, not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Upload Your CV</h3>
              <p className="text-gray-600">Upload your existing resume or start from scratch. Our AI will analyze and optimize it for ATS systems.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. AI Analysis & Optimization</h3>
              <p className="text-gray-600">Our AI analyzes job descriptions, injects relevant keywords, and ensures ATS compliance with instant scoring.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Download & Apply</h3>
              <p className="text-gray-600">Download your professionally formatted, ATS-optimized PDF and start applying with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ATS Optimization Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  ATS Optimization & Keyword Injection
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Beat the bots and get your resume in front of human recruiters with our advanced ATS optimization technology.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Keyword Analysis</h4>
                      <p className="text-gray-600">AI scans job descriptions and identifies the most important keywords for your target role.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ATS Compliance</h4>
                      <p className="text-gray-600">Ensures your resume passes through 95% of ATS systems with proper formatting and structure.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Real-time Scoring</h4>
                      <p className="text-gray-600">Get instant feedback on your resume's ATS compatibility and optimization suggestions.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">ATS Success Rate</h3>
                  <div className="text-5xl font-bold text-blue-600 mb-2">95%</div>
                  <p className="text-gray-600">of resumes pass through ATS systems</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Compare: AI Resume Builder vs. Manual Editing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI-powered approach saves time and increases success rates.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 rounded-xl p-8 border border-red-200">
                <h3 className="text-2xl font-bold text-red-800 mb-6">Manual Editing</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Hours of research and keyword guessing</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">No ATS compliance guarantee</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Generic templates that look outdated</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Low interview callback rates</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-green-800 mb-6">AI Resume Builder</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Instant keyword analysis and injection</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">95% ATS compliance guarantee</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Professional, modern templates</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">3x higher interview callback rates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              FAQs About AI Resume Builders
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about AI-powered resume optimization.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Will fancy templates break ATS filters?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Only if they rely on text boxes or embedded images. Our AI builder exports "clean" PDFs that pass through all major ATS systems.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                How many keywords should I add?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Aim for a 70–80% match to the job ad. Our AI optimizes keyword density automatically to avoid spam filters while maximizing relevance.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Do employers frown on AI-written resumes?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Recruiters care about clarity and relevance. AI tools simply accelerate tailoring; substance still comes from your achievements.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                How long does it take to create an optimized resume?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Our AI builder creates ATS-optimized resumes in under 5 minutes. Upload your CV, select a job description, and get instant optimization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Beat ATS Filters?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of job seekers who are getting more interviews with our AI-powered resume builder.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-blue-100 mt-4">No credit card required • 7-day free trial</p>
        </div>
      </section>
    </div>
  );
};

export default AIResumeBuilder; 