import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CheckCircle2, ShieldCheck, Zap, Users, Trophy, Star, ArrowRight, XCircle, CheckCircle, Target, Rocket, BookOpen, Briefcase, TrendingUp, Award, Clock, MessageSquare, ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import SEO from '../components/SEO';

const tabs = [
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'execution', label: 'Execution', icon: Rocket },
  { id: 'tools', label: 'AI Tools', icon: Brain },
  { id: 'results', label: 'Results', icon: TrendingUp },
];

const tabContent: Record<string, { title: string; points: string[]; stat: string; statLabel: string }> = {
  strategy: {
    title: 'Career Strategy Blueprint',
    points: [
      'Reverse-engineered hiring algorithms to position you ahead of 95% of applicants',
      'Personal branding framework that makes recruiters reach out to you',
      'Hidden job market access — 70% of top roles are never posted publicly',
      'Strategic networking playbook used by CXOs and senior leaders',
    ],
    stat: '3-7',
    statLabel: 'Job offers on average',
  },
  execution: {
    title: 'Execution-First Framework',
    points: [
      'Week-by-week action plan — no guesswork, just execution',
      'Done-for-you resume and LinkedIn optimization by experts',
      'Mock interviews with industry-specific feedback loops',
      'Dedicated career coach assigned to drive your results',
    ],
    stat: '90',
    statLabel: 'Days to dream offer',
  },
  tools: {
    title: 'AI-Powered Arsenal',
    points: [
      '1-Click AI Resume Builder tailored to each job description',
      'Automated job matching — AI finds roles you didn\'t know existed',
      'Smart outreach templates with 40%+ response rates',
      'Interview prep AI that simulates real company scenarios',
    ],
    stat: '90%',
    statLabel: 'Job search automated',
  },
  results: {
    title: 'Proven Track Record',
    points: [
      '1000+ professionals placed at top companies in 2024-25',
      'Average salary hike of 50-200% for our clients',
      'Clients placed at Google, Microsoft, Amazon, and 200+ companies',
      '95% client satisfaction rate with money-back guarantee',
    ],
    stat: '200%',
    statLabel: 'Average salary hike',
  },
};

const roadmapSteps = [
  {
    week: 'Week 1-2',
    title: 'Foundation & Strategy',
    description: 'Profile audit, resume overhaul, LinkedIn optimization, and personal branding setup.',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-400',
  },
  {
    week: 'Week 3-4',
    title: 'Market Attack',
    description: 'AI-powered job matching, strategic applications, and recruiter outreach campaigns.',
    icon: Target,
    color: 'from-purple-500 to-pink-400',
  },
  {
    week: 'Week 5-8',
    title: 'Interview Domination',
    description: 'Mock interviews, salary negotiation prep, and company-specific preparation.',
    icon: Briefcase,
    color: 'from-orange-500 to-yellow-400',
  },
  {
    week: 'Week 9-12',
    title: 'Offer & Negotiate',
    description: 'Multiple offer management, counter-offer strategies, and 2-4X salary negotiation.',
    icon: Trophy,
    color: 'from-green-500 to-emerald-400',
  },
];

const testimonials = [
  {
    name: 'Sandip Mehta',
    role: 'Senior Engineering Manager',
    company: 'Previously at Infosys → Now at Microsoft',
    result: 'From 0 interview calls to 35+ calls in just 6 weeks. Landed a role with 180% salary hike.',
    rating: 5,
    initials: 'SM',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Gopi Krishnan',
    role: 'Product Manager',
    company: 'Previously at Wipro → Now at Google',
    result: 'Secured my dream role at Google with a package I never thought possible. The AI tools were game-changing.',
    rating: 5,
    initials: 'GK',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Rebecca Thomas',
    role: 'Director of Operations',
    company: 'Previously at TCS → Now at Amazon',
    result: '400% hike in just 75 days. The structured approach eliminated all the guesswork from my job search.',
    rating: 5,
    initials: 'RT',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    name: 'Vishnu Sharma',
    role: 'Staff Software Engineer',
    company: 'Previously at HCL → Now at Microsoft',
    result: 'Got 5 offers simultaneously. The negotiation coaching alone was worth 10X the investment.',
    rating: 5,
    initials: 'VS',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Pooja Reddy',
    role: 'Data Science Lead',
    company: 'Previously at Cognizant → Now at Meta',
    result: 'Dream job in under 3 months. The mentor support and weekly check-ins kept me accountable.',
    rating: 5,
    initials: 'PR',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'Sudhish Nair',
    role: 'VP Engineering',
    company: 'Previously at Startup → Now at Uber',
    result: 'Landed a VP role at a global MNC with 3X compensation. The executive branding strategy was brilliant.',
    rating: 5,
    initials: 'SN',
    gradient: 'from-teal-500 to-cyan-500',
  },
];

const stats = [
  { value: '1000+', label: 'Professionals Placed' },
  { value: '200%', label: 'Avg. Salary Hike' },
  { value: '90', label: 'Days to Offer' },
  { value: '95%', label: 'Satisfaction Rate' },
];

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = Math.floor(eased * value);
            setCount(start);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Training() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('strategy');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-[#020420] text-white">
      <SEO
        title="Skillsurger Training | Land Your Dream Job in 90 Days"
        description="Learn the 3-step strategy to land 3+ dream offers in 90 days. Masterclass for professionals earning 15+ LPA."
        keywords="job search training, career masterclass, senior professional jobs, AI job search"
        canonicalUrl="/training"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>

        {/* Animated ring */}
        <div className="absolute top-32 right-20 hidden lg:block">
          <div className="w-32 h-32 rounded-full border-2 border-blue-500/20 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500/40 animate-spin-reverse" />
        </div>

        <div className="container relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-sm animate-fade-in">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Free Masterclass — Limited Seats
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 max-w-5xl mx-auto leading-tight tracking-tight">
            Stop Chasing Jobs.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Let Them Chase You.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The proven system that helps professionals earning 15+ LPA land 3-7 dream offers with 50-200% salary hikes — in under 90 days.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => navigate('/login')} className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-lg font-semibold transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-105">
              Watch Free Masterclass
              <ArrowRight className="inline-block ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity -z-10" />
            </button>
            <span className="text-sm text-gray-500">No credit card required</span>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section id="tabs-section" data-animate className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent" />
        <div className="container relative mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('tabs-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Win</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete career transformation system — not just another course.
            </p>
          </div>

          {/* Tab buttons */}
          <div className={`flex flex-wrap justify-center gap-2 mb-12 transition-all duration-700 delay-200 ${isVisible('tabs-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className={`max-w-5xl mx-auto transition-all duration-700 delay-300 ${isVisible('tabs-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500" key={activeTab}>
                <h3 className="text-2xl font-bold mb-6 animate-fade-in">{tabContent[activeTab].title}</h3>
                <ul className="space-y-4">
                  {tabContent[activeTab].points.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 animate-fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-center" key={`stat-${activeTab}`}>
                <div className="relative">
                  <div className="w-56 h-56 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in">
                    <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {tabContent[activeTab].stat}
                    </span>
                    <span className="text-gray-400 text-sm mt-2 text-center px-4">{tabContent[activeTab].statLabel}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl -z-10 animate-pulse-slow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap-section" data-animate className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('roadmap-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Your 90-Day{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Roadmap</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A structured, week-by-week plan to go from stuck to offer-in-hand.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-green-500/50 hidden md:block" />
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-green-500/50 md:hidden" />

            {roadmapSteps.map((step, index) => {
              const Icon = step.icon;
              const isLeft = index % 2 === 0;
              return (
                <div
                  key={index}
                  className={`relative flex items-center mb-12 last:mb-0 transition-all duration-700 ${
                    isVisible('roadmap-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start gap-4 w-full pl-14">
                    <div className={`absolute left-0 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg z-10`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex-1 hover:bg-white/[0.07] transition-colors">
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{step.week}</span>
                      <h3 className="text-lg font-bold mt-1 mb-2">{step.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex items-center w-full">
                    {isLeft ? (
                      <>
                        <div className="w-1/2 pr-12 text-right">
                          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 inline-block text-left hover:bg-white/[0.07] transition-colors hover:border-white/20">
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{step.week}</span>
                            <h3 className="text-xl font-bold mt-1 mb-2">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                        <div className={`absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg z-10`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-1/2" />
                      </>
                    ) : (
                      <>
                        <div className="w-1/2" />
                        <div className={`absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg z-10`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-1/2 pl-12">
                          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors hover:border-white/20">
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{step.week}</span>
                            <h3 className="text-xl font-bold mt-1 mb-2">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mentor Section */}
      <section id="mentor-section" data-animate className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 to-transparent" />
        <div className="container relative mx-auto px-4">
          <div className={`flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto transition-all duration-700 ${isVisible('mentor-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="md:w-1/2 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl" />
              <img
                src="/Mentors.png"
                alt="Skillsurger Mentors"
                className="relative w-full h-auto rounded-3xl border border-white/10 shadow-2xl"
              />
            </div>
            <div className="md:w-1/2">
              <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">Meet your Mentors</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">
                Industry Experts Dedicated to{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Your Success</span>
              </h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  "Our mission? Get India's top professionals multiple offers, faster than they imagined — and with 2-4X hikes."
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
              <button className="mt-8 flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300 transition-colors group">
                Learn more about our team
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison-section" data-animate className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('comparison-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              The Difference is{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Clear</span>
            </h2>
          </div>
          <div className={`grid md:grid-cols-2 gap-6 transition-all duration-700 delay-200 ${isVisible('comparison-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Old Way */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center">
                <XCircle className="w-6 h-6 mr-3" /> The Old Way
              </h3>
              <ul className="space-y-4">
                {[
                  'Spraying resumes on job boards',
                  'Waiting for recruiters to call back',
                  'Getting ghosted after interviews',
                  'Settling for a 10-20% hike',
                  'Wing it approach to interviews',
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-gray-400">
                    <span className="text-red-500/60 mr-3 mt-1">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* New Way */}
            <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-xs font-semibold rounded-bl-xl">RECOMMENDED</div>
              <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-3" /> The Smarter Way
              </h3>
              <ul className="space-y-4">
                {[
                  'Automated job targeting with AI',
                  'Reverse-engineered hiring algorithms',
                  'Personal assistant for outreach',
                  'Commanding 50-200% hikes',
                  'Military precision execution',
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" data-animate className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent" />
        <div className="container relative mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('testimonials-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Real People.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Real Results.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Don't take our word for it — hear from professionals who transformed their careers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((t, index) => (
              <div
                key={index}
                className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500 ${
                  isVisible('testimonials-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-blue-400/80 mb-3">{t.company}</p>
                <div className="flex text-yellow-400 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{t.result}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section id="learn-section" data-animate className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className={`bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 transition-all duration-700 ${isVisible('learn-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              What You'll Learn in the{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Free Masterclass</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'How to land 3 to 7 job offers without applying on job boards',
                'Why recruiters ghost you — and how to reverse it',
                'How to automate 90% of your job search using AI + expert support',
                'Why this works best for those earning ₹15LPA+ in strategic roles',
                'The 3-step system top pros use to attract dream roles',
                'The secret to achieving 2-4X salary hikes in under 90 days',
              ].map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button onClick={() => navigate('/login')} className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-lg font-semibold transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-105">
                Register Now for Free
                <ArrowRight className="inline-block ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Who is this For? */}
      <section id="audience-section" data-animate className="py-20 relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className={`flex flex-col md:flex-row gap-8 items-stretch transition-all duration-700 ${isVisible('audience-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                Who is this{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">For?</span>
              </h2>
              <div className="space-y-3">
                {[
                  'Senior managers, directors, AVPs, CXOs',
                  'Serious about a change in 60-90 days',
                  'Making ₹15LPA to ₹80LPA+',
                  'Want multiple offers so you can choose, not settle',
                  'Tired of being ignored by recruiters',
                  'Ready to stop winging it and follow a system',
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-10 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
              <div className="relative">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Make Your Next Move Your Best One?</h3>
                <p className="text-blue-100/80 mb-8 text-lg leading-relaxed">
                  Stop playing the job portal lottery. Join the elite club of professionals who attract dream offers with ease.
                </p>
                <button onClick={() => navigate('/login')} className="w-full py-4 bg-white text-blue-600 font-bold rounded-xl text-lg hover:bg-blue-50 transition-colors">
                  Join Free Masterclass
                </button>
                <p className="text-blue-200/60 text-sm mt-4 text-center">
                  Join 1000+ professionals who transformed their careers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 to-transparent" />
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto">
            Your Dream Career is{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">90 Days Away</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Don't let another quarter pass by. Take the first step today.
          </p>
          <button onClick={() => navigate('/login')} className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-lg font-semibold transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-105">
            Start Your Transformation
            <ArrowRight className="inline-block ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
}
