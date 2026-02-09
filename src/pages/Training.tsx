import React from 'react';
import { Brain, CheckCircle2, ShieldCheck, Zap, Users, Trophy, Star, ArrowRight, XCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import SEO from '../components/SEO';

const reasons = [
  {
    title: 'Proven for Top Earners',
    description: '1000+ professionals earning 15–80 LPA+ landed 3–7 job offers in 2025 alone.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=250&fit=crop'
  },
  {
    title: 'Repeatable Results',
    description: 'From top tech firms to global MNCs—our clients land offers without playing the job lottery.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop'
  },
  {
    title: 'Execution-Focused',
    description: "You don't just get advice—you get execution: AI tools, 1-click Resume Builder, and dedicated Career Coaching.",
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop'
  },
  {
    title: 'Value-First Approach',
    description: 'No gimmicks. No pitch mid-video. Just pure, actionable value for your career.',
    image: 'https://images.unsplash.com/photo-1553484771-047a44eee27b?w=400&h=250&fit=crop'
  },
  {
    title: 'Data-Driven Intelligence',
    description: 'Built by industry veterans who reverse-engineered hiring systems to beat them at their own game.',
    image: 'https://images.unsplash.com/photo-1551288049-bbbda5366392?w=400&h=250&fit=crop'
  }
];

const testimonials = [
  { name: 'Sandip', result: 'From 0 to 35+ interview calls', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop' },
  { name: 'Gopi', result: 'Secured dream job at Microsoft', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop' },
  { name: 'Rebecca', result: '400% hike in just 75 days', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop' },
  { name: 'Vishnu', result: 'Secured dream job at Microsoft', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' },
  { name: 'Pooja', result: 'Dream job in < 3 months', avatar: 'https://images.unsplash.com/photo-1589386417686-0d34b5903d23?w=150&h=150&fit=crop' },
  { name: 'Sudhish', result: 'Job Offer from global MNC', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop' },
  { name: 'Mayur', result: 'Leadership role in < 3 months', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop' },
  { name: 'Chaitra', result: '20% hike in < 2 months', avatar: 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=150&h=150&fit=crop' }
];

const learningPoints = [
  'How to land 3 to 7 job offers without applying on job boards',
  'Why recruiters ghost you— and how to reverse it',
  'How to automate 90% of your job search using AI + expert support',
  'Why this works best for those earning ₹15LPA+ in strategic roles',
  'The 3-step system top pros use to attract dream roles',
  'The secret to achieving 2–4X salary hikes in under 90 days'
];

const targetAudience = [
  'Senior managers, directors, AVPs, CXOs',
  'Serious about a change in 60–90 days',
  'Making ₹15LPA to ₹80LPA+',
  'Want multiple offers so you can choose, not settle',
  'Tired of being ignored by recruiters',
  'Ready to stop winging it and follow a system'
];

export default function Training() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <SEO 
        title="Skillsurger Training | Land Your Dream Job in 90 Days"
        description="Learn the 3-step strategy to land 3+ dream offers in 90 days. Masterclass for professionals earning 15+ LPA."
        keywords="job search training, career masterclass, senior professional jobs, AI job search"
        canonicalUrl="/training"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-white border-b overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop&fm=webp&q=50&auto=format"
          alt="Career training background"
          className="absolute inset-0 w-full h-full object-cover opacity-5"
        />
        <div className="container relative mx-auto px-4 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full">
            Free Masterclass
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
            If You're Earning 15+ LPA, You're Wasting Time Doing Job Search the <span className="text-blue-600">Old Way</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Still applying on job boards? Top talent isn't. Learn how senior professionals are automating their job search and landing 200% hikes—without chasing recruiters.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14">
              Watch Free Masterclass <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-gray-500 font-medium">
              Land 3+ Dream Offers in 90 Days
            </p>
          </div>
        </div>
      </section>

      {/* 5 Reasons Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            5 reasons why you need to Partner with Skillsurger!
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reasons.map((reason, index) => (
              <div key={index} className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {reason.image && (
                  <img src={reason.image} alt={reason.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{reason.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 bg-blue-600 rounded-3xl transform rotate-3 -z-10 opacity-10"></div>
              <img 
                src="/Mentors.png" 
                alt="Skillsurger Mentors" 
                className="w-full h-auto rounded-3xl shadow-lg object-cover"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-blue-600 font-bold mb-4 uppercase tracking-wider">Meet your Mentors</h2>
              <h3 className="text-4xl font-bold mb-6 text-gray-900">Industry Experts dedicated to Your Success</h3>
              <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                <p>
                  "Our mission? Get India's top professionals multiple offers, faster than they imagined—and with 2–4x hikes."
                </p>
                <p>
                  At Skillsurger, we've brought together veterans who have co-founded tech startups and built hiring tools used by hundreds of global companies.
                </p>
                <p>
                  During the pandemic, our experts helped over 20,000 professionals navigate career chaos and land their dream roles.
                </p>
                <p>
                  Now, we've reverse-engineered hiring algorithms to empower mid and senior professionals to land 3-5 job offers with higher salaries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What others are saying</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {testimonials.map((t, index) => (
              <div key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full border border-gray-600" />
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <h4 className="font-bold text-lg mb-1">{t.name}</h4>
                <p className="text-blue-400 text-sm">{t.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">The Difference is Clear</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Old Way */}
            <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
              <h3 className="text-2xl font-bold text-red-600 mb-8 flex items-center">
                <XCircle className="w-6 h-6 mr-3" /> The Old Way
              </h3>
              <ul className="space-y-6">
                {[
                  'Spraying resumes on job boards',
                  'Waiting for recruiters to call back',
                  'Getting ghosted after interviews',
                  'Settling for a 10-20% hike',
                  'Wing it approach to interviews'
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-gray-700">
                    <span className="text-red-400 mr-3 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* New Way */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 ring-2 ring-blue-600 ring-offset-4">
              <h3 className="text-2xl font-bold text-blue-600 mb-8 flex items-center">
                <CheckCircle className="w-6 h-6 mr-3" /> The Smarter Way
              </h3>
              <ul className="space-y-6">
                {[
                  'Automated job targeting with AI',
                  'Reverse-engineered hiring algorithms',
                  'Personal assistant for outreach',
                  'Commanding 50-200% hikes',
                  'Military precision execution'
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-gray-900 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
            <h2 className="text-3xl font-bold mb-10 text-gray-900 text-center">
              What You'll Learn in the Free Masterclass
            </h2>
            <div className="grid md:grid-cols-1 gap-6">
              {learningPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-4 text-lg text-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Zap className="w-4 h-4" />
                  </div>
                  {point}
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button size="lg" className="px-12 h-14 text-lg">
                Register Now for Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Who is this For? */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-8 text-gray-900 text-center md:text-left">Who is this For?</h2>
              <div className="space-y-4">
                {targetAudience.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-800 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 bg-blue-600 rounded-3xl p-10 text-white">
              <h3 className="text-2xl font-bold mb-6">Ready to Make Your Next Move Your Best One?</h3>
              <p className="text-blue-100 mb-8 text-lg">
                Stop playing the job portal lottery. Join the elite club of professionals who attract dream offers with ease.
              </p>
              <Button variant="secondary" size="lg" className="w-full h-14 text-blue-600 font-bold hover:bg-white">
                Join Free Masterclass
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
