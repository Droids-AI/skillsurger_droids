import {
  Check,
  Shield,
  Clock,
  Search,
  Target,
  TrendingUp,
  FileText,
  Video,
  GraduationCap,
  BookOpen,
  BarChart3,
  Download,
  Star,
  MessageSquare,
  Rocket,
  ArrowRight,
  Brain,
  Briefcase,
  LineChart,
  Users,
  Zap,
  Award,
} from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { useState } from "react";
import HeroSection from "../components/landing/HeroSection";
import PainValidationCards from "../components/landing/PainValidationCards";
import HowItWorks from "../components/landing/HowItWorks";
import TrustSignals from "../components/landing/TrustSignals";
import FAQSection from "../components/landing/FAQSection";

const features = [
  {
    icon: Brain,
    title: "AI Career Agent",
    description:
      "Your personal AI agent that analyzes your profile and provides intelligent career guidance 24/7.",
    color: "blue",
  },
  {
    icon: Briefcase,
    title: "Smart Job Matching",
    description:
      "AI-powered job discovery with real-time matching to opportunities that fit your skills and goals.",
    color: "green",
  },
  {
    icon: GraduationCap,
    title: "Personalized Learning Paths",
    description:
      "Custom learning roadmaps with verified courses and resources tailored to your career objectives.",
    color: "purple",
  },
  {
    icon: MessageSquare,
    title: "AI Mentorship",
    description:
      "Get instant guidance from our AI mentor trained on industry best practices and career strategies.",
    color: "indigo",
  },
  {
    icon: Video,
    title: "Mock Interviews",
    description:
      "Practice with AI-powered mock interviews and receive detailed feedback to improve your performance.",
    color: "red",
  },
  {
    icon: FileText,
    title: "CV Optimization",
    description:
      "AI-enhanced CV suggestions with instant PDF generation for optimized professional documents.",
    color: "orange",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Track your career development with detailed analytics and achievement milestones.",
    color: "teal",
  },
  {
    icon: Search,
    title: "Career Explorer",
    description:
      "Discover new career paths with AI-generated opportunities based on your unique profile.",
    color: "pink",
  },
];

const stats = [
  { number: "5,000+", label: "Careers Transformed" },
  { number: "98%", label: "Success Rate" },
  { number: "24/7", label: "AI Agent Support" },
  { number: "500+", label: "Companies Hiring" },
];

const pricingPlans = [
  {
    name: "Free Trial",
    price: "0",
    period: "7 days",
    description: "Experience the full power of our AI career agent",
    features: [
      "Complete AI career analysis",
      "Personalized learning paths",
      "Mock interview sessions",
      "CV optimization",
      "Job matching",
      "AI mentorship chat",
      "Progress tracking",
      "All premium features",
    ],
    cta: "Start Free Trial",
    popular: false,
    color: "gray",
    url: "/dashboard",
  },
  {
    name: "Monthly Pro",
    price: "10",
    period: "month",
    description: "Full access to your AI career agent",
    features: [
      "Unlimited AI career guidance",
      "Advanced job matching",
      "Premium learning resources",
      "Unlimited mock interviews",
      "CV optimization & download",
      "Priority AI mentorship",
      "Detailed analytics",
      "Career roadmap planning",
      "Industry insights",
      "Email support",
    ],
    cta: "Get Started",
    popular: true,
    color: "blue",
    url: "https://checkout.dodopayments.com/buy/pdt_VksHXCMm4d8t5TZMiUKfY?quantity=1&redirect_url=https://skillsurger.com%2Fdashboard",
  },
  {
    name: "Yearly Pro",
    price: "100",
    period: "year",
    description: "Best value for serious career growth",
    features: [
      "Everything in Monthly Pro",
      "2 months free (save $20)",
      "Priority feature access",
      "Advanced analytics",
      "Career strategy sessions",
      "Industry expert insights",
      "Custom learning paths",
      "Premium support",
      "Early access to new features",
      "Industry expert 1-1 sessions on finding jobs",
      "Support team to apply 100s of jobs for you",
      "Real industry person mock interview",
    ],
    cta: "Save 17%",
    popular: false,
    color: "green",
    url: "https://checkout.dodopayments.com/buy/pdt_zFZMrKwafzRr12jun9Lfj?quantity=1&redirect_url=https://skillsurger.com%2Fdashboard",
  },
];

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitSuccess(true);
    setContactForm({ name: "", email: "", company: "", message: "" });
    setIsSubmitting(false);

    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="AI Career Coach for Job Seekers | Skillsurger"
        description="Get job-ready with AI: scan your CV, match to real jobs, and ace interviews. Free 7-day trial."
        keywords="AI career coach, resume scanner, job matching, mock interviews, career development, ATS optimization"
        canonicalUrl="/"
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <p className="text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </p>
                <p className="text-gray-600 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Validation Section */}
      <PainValidationCards />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Trust Signals / Testimonials Section */}
      <TrustSignals />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by AI that understands your career goals and guides you every step of the way
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gray-50 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex p-3 rounded-lg bg-${feature.color}-100 text-${feature.color}-600 mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Resume Builder Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Beat ATS Filters & Get More Interview Calls
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI ensures your resume passes through 95% of ATS systems and lands on recruiter's desks
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Upload your existing CV or start from scratch</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>AI analyzes job descriptions and injects relevant keywords</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Get instant ATS compliance scoring and optimization suggestions</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Download professionally formatted PDFs ready for submission</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <div className="text-center">
                <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">ATS Optimization & Keyword Injection</h4>
                <p className="text-gray-600">Our AI ensures your resume passes through applicant tracking systems with targeted keyword optimization.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Matching Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Find Jobs That Actually Match Your Skills
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop wasting time on irrelevant job listings. Let AI find perfect matches for you, including hidden opportunities not listed on job boards.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Job Discovery</h3>
              <p className="text-gray-600">AI analyzes your profile and finds jobs that match your skills, experience, and career goals.</p>
            </div>
            <div className="text-center p-6">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hidden Job Openings</h3>
              <p className="text-gray-600">Discover unlisted opportunities and positions that aren't publicly advertised. Get ahead of the competition.</p>
            </div>
            <div className="text-center p-6">
              <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-gray-600">Receive instant notifications when new matching jobs are posted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Job Finder Tool Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-6">
              <Search className="w-4 h-4 mr-2" />
              Free Tool
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Find Your Perfect Job Match - Free
            </h2>
            <p className="text-lg sm:text-xl text-blue-50 mb-10 max-w-2xl mx-auto">
              Use our free AI-powered job finder to discover opportunities that match your interests and skills. No signup required.
            </p>
            <Link to="/dashboard?section=career">
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-gray-50 px-12 py-6 text-lg font-bold shadow-xl transform hover:scale-105 transition-all"
              >
                <Search className="w-5 h-5 mr-2" />
                Find Jobs For Me - It's Free
              </Button>
            </Link>
            <p className="text-sm text-blue-100 mt-6 font-medium">
              ✓ 100% Free  ✓ Based on your interests  ✓ No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Hiring Manager Feature Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Users className="w-4 h-4 mr-2" />
                Exclusive Feature
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Find Hiring Managers Directly
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Skip the application black hole. Connect directly with hiring managers and decision-makers at your target companies.
              </p>
              <ul className="space-y-4 text-lg mb-8">
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Find hiring manager emails and LinkedIn profiles</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>AI-generated personalized email drafts ready to send</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Email verification to ensure deliverability</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>One-click compose button opens your email client</span>
                </li>
              </ul>
              <Link to="/dashboard?section=career">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
                  Try It Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <div className="text-center">
                <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Direct Contact Made Easy</h4>
                <p className="text-gray-600">Our AI finds the right people and helps you reach out professionally. Stand out from the hundreds of online applicants.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Resume Templates Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Free ATS-Friendly Resume Templates (MS Word Format)
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Download professionally designed, ATS-optimized resume templates in MS Word format. Ready to customize and start applying.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-center">Modern Professional</h3>
              <p className="text-gray-600 mb-4 text-center">Clean, modern design perfect for tech and creative roles</p>
              <a
                href="/Modern Professional CV Resume.pdf"
                download="Modern Professional CV Resume.pdf"
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download Template
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-center">Professional Modern</h3>
              <p className="text-gray-600 mb-4 text-center">Professional format ideal for corporate and management positions</p>
              <a
                href="/Professional Modern CV Resume.pdf"
                download="Professional Modern CV Resume.pdf"
                className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download Template
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <FileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-center">Professional Resume</h3>
              <p className="text-gray-600 mb-4 text-center">Classic professional design for all industries and career levels</p>
              <a
                href="/Professional Resume.pdf"
                download="Professional Resume.pdf"
                className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download Template
              </a>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">All templates are ATS-friendly, available in MS Word format, and optimized for applicant tracking systems</p>
            <Link to="/dashboard?section=cv-scoring">
              <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                Or Create Your Resume with AI
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mock Interviews Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Practice Interviews & Never Feel Nervous Again
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get AI feedback on your answers, body language, and confidence—just like a real interview coach
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl">
              <div className="text-center">
                <Video className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Practice Top Interview Questions by Role</h4>
                <p className="text-gray-600">Get role-specific questions and practice with our AI interviewer.</p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">AI Feedback on Speech, Confidence & Clarity</h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Instant feedback on your communication style</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Confidence and body language analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Content quality and STAR method coaching</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Track progress and improve with replays</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Upskill Smarter, Not Harder
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI creates personalized learning paths that get you job-ready faster
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Personalized Roadmaps</h3>
              <p className="text-gray-600">AI creates custom learning paths based on your current skills and career goals.</p>
            </div>
            <div className="text-center p-6">
              <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verified Resources</h3>
              <p className="text-gray-600">Curated courses from top platforms like Coursera, Udemy, and industry experts.</p>
            </div>
            <div className="text-center p-6">
              <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-600">Monitor your learning progress and see how skills translate to job opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start Free, Upgrade When You're Ready
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Try everything free for 7 days. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? "border-blue-500 bg-blue-50 scale-105 shadow-xl"
                    : "border-gray-200 bg-white hover:border-gray-300"
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={plan.url} className="block">
                  <Button
                    className={`w-full py-3 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                {plan.name === "Free Trial" && (
                  <div className="flex items-center justify-center text-sm text-gray-600 mt-2 font-medium">
                    <Shield className="w-4 h-4 mr-1.5 text-green-500" />
                    No credit card required
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include:</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span className="flex items-center">
                <Shield className="w-4 h-4 mr-1" /> Enterprise Security
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" /> 24/7 Support
              </span>
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-1" /> CV Downloads
              </span>
              <span className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" /> Analytics
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Questions? We're Here to Help
              </h2>
              <p className="text-xl text-gray-600">
                Get in touch with our team—real humans who care about your success
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    Get Started Today
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          AI-Powered Support
                        </h4>
                        <p className="text-gray-600">
                          Get instant answers from our AI agent or connect with
                          our human experts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          24/7 Availability
                        </h4>
                        <p className="text-gray-600">
                          Your AI career agent is always available to provide
                          guidance and support.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Fast Results
                        </h4>
                        <p className="text-gray-600">
                          Most users see career improvements within the first 30
                          days of using our platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                  <h4 className="font-semibold mb-2">Enterprise Solutions</h4>
                  <p className="text-blue-100 mb-4">
                    Looking to transform your entire organization's career
                    development?
                  </p>
                  <Button
                    variant="outline"
                    className="bg-white text-blue-600 border-white hover:bg-blue-50"
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  Send us a Message
                </h3>

                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Message Sent!
                    </h4>
                    <p className="text-gray-600">
                      We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            company: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            message: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us about your career goals and how we can help..."
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of job seekers who've transformed their careers with AI-powered guidance
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-blue-100 text-sm">
            No credit card required • 7-day free trial • Cancel anytime
          </div>
        </div>
      </section>
    </div>
  );
}
