import React, { useEffect, useState } from 'react';
import { Video, Check, Brain, Target, Zap, ArrowRight, MessageSquare, BarChart3 } from 'lucide-react';
import Button from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

const MockInterview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is logged in, redirect to dashboard with mentorship section
        navigate('/dashboard?section=mentorship');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="AI Mock Interview Practice | Instant Feedback | Skillsurger"
        description="Practice interviews with AI-powered feedback on speech, confidence, and clarity. Get instant feedback and improve your interview skills. Free trial available."
        keywords="mock interview, AI interview practice, interview preparation, interview feedback, video interview"
        canonicalUrl="/mock-interview"
      />
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <Video className="w-4 h-4 mr-2" />
              AI-Powered Interview Practice
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              AI Mock Interview Practice with Instant Feedback
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Practice real job interview questions with AI. Get instant feedback on communication, content, and confidence. Prepare smarter, faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg w-full sm:w-auto"
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

      {/* Practice Questions Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Practice Top Interview Questions by Role
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get role-specific questions and practice with our AI interviewer for any position.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Technical Roles</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Software Engineering</li>
                <li>• Data Science</li>
                <li>• Product Management</li>
                <li>• DevOps & Cloud</li>
                <li>• AI & Machine Learning</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-xl p-8 border border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Business Roles</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Marketing & Sales</li>
                <li>• Finance & Accounting</li>
                <li>• Human Resources</li>
                <li>• Operations</li>
                <li>• Consulting</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-xl p-8 border border-purple-200">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Creative Roles</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Design & UX</li>
                <li>• Content Creation</li>
                <li>• Digital Marketing</li>
                <li>• Social Media</li>
                <li>• Brand Management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Feedback Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  AI Feedback on Speech, Confidence & Clarity
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Get comprehensive feedback on every aspect of your interview performance with our advanced AI analysis.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Communication Analysis</h4>
                      <p className="text-gray-600">AI evaluates your speaking pace, tone, and clarity to help you communicate more effectively.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Confidence Scoring</h4>
                      <p className="text-gray-600">Get feedback on your confidence level, body language cues, and overall presence.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Content Quality</h4>
                      <p className="text-gray-600">AI analyzes your answers for relevance, structure, and STAR method implementation.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Interview Readiness Score</h3>
                  <div className="text-5xl font-bold text-green-600 mb-2">85%</div>
                  <p className="text-gray-600">average improvement after 5 sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Tracking Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Track Progress & Improve with Replays
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Monitor your interview performance over time and see measurable improvements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Performance Analytics</h3>
              <p className="text-gray-600">Track your interview scores, improvement areas, and overall readiness over time.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Session Replays</h3>
              <p className="text-gray-600">Review your practice sessions with detailed feedback and improvement suggestions.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Goal Setting</h3>
              <p className="text-gray-600">Set specific interview goals and track your progress toward achieving them.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              FAQs About AI Mock Interviews
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about AI-powered interview practice.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                How realistic are the AI interview questions?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Our AI generates questions based on real job descriptions and industry standards. Questions are tailored to your specific role and experience level.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What kind of feedback do I receive?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                You get comprehensive feedback on communication style, confidence, content quality, STAR method usage, and specific improvement suggestions.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I practice for specific companies?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Yes! You can input specific job descriptions or company names, and our AI will generate relevant questions and feedback for that particular role.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                How many practice sessions should I do?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We recommend 3-5 practice sessions per role to see significant improvement. Each session focuses on different aspects of interview performance.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Is the feedback confidential?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Absolutely. All your practice sessions and feedback are private and secure. We never share your interview data with third parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Join thousands of job seekers who are landing offers with our AI-powered interview practice.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-green-100 mt-4">No credit card required • 7-day free trial</p>
        </div>
      </section>
    </div>
  );
};

export default MockInterview; 