import {
  Check,
  Clock,
  Search,
  FileText,
  Video,
  GraduationCap,
  BookOpen,
  BarChart3,
  MessageSquare,
  Rocket,
  ArrowRight,
  Brain,
  Briefcase,
} from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { useEffect, useState } from "react";
import HeroSection from "../components/landing/HeroSection";
import PainValidationCards from "../components/landing/PainValidationCards";
import HowItWorks from "../components/landing/HowItWorks";
import TrustSignals from "../components/landing/TrustSignals";
import FAQSection from "../components/landing/FAQSection";
import CTASection from "../components/landing/CTASection";
import { AiVsHumanSection, ProgramOfferSection, ProgramProofSection, StickyAuditBar } from "../components/landing/JobSwitchOffer";
import RoleTrackCard from "../components/roleTracks/RoleTrackCard";
import { roleTracks } from "../lib/constants/roleTracks";
import { WEBINAR } from "../lib/constants/webinar";
import { submitLead } from "../lib/googleSheets";
import { getAttribution } from "../lib/attribution";

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
  { number: "Resume", label: "ATS feedback and improvements" },
  { number: "Jobs", label: "Search by role and location" },
  { number: "Practice", label: "AI mock interviews" },
  { number: "Learn", label: "Skill-based resources" },
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
  const [submitError, setSubmitError] = useState("");
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await submitLead({ ...contactForm, source: "home_contact", pageUrl: window.location.href, ...getAttribution() }, "contact_message");
      setSubmitSuccess(true);
      setContactForm({ name: "", email: "", company: "", message: "" });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch {
      setSubmitError("We could not send your message. Please try again, or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Job Switch Copilot for Indian Tech Professionals | Skillsurger"
        description="A 30-day AI + human job switch programme for Indian tech professionals with 3–12 years of experience. ₹5,000 incl. GST. Start with a free career audit."
        keywords="job switch program India, career coach for tech professionals, resume positioning, interview preparation, job switch copilot"
        canonicalUrl="/"
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Paid offer and free entry points, above feature exploration */}
      <ProgramOfferSection />
      <AiVsHumanSection />
      <ProgramProofSection />

      {/* Job Switch Copilot: Built for Indian Tech Job Switchers */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for tech professionals switching to better roles
            </h2>
            <p className="text-xl text-gray-600">
              Skillsurger helps Indian tech professionals structure their job search across resume
              improvement, applications, recruiter outreach, and interview readiness.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {roleTracks.slice(0, 3).map((track) => (
              <RoleTrackCard key={track.id} track={track} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/job-search-bootcamp">
              <Button size="lg">
                Explore Job Switch Copilot
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Job Switch Copilot: Why Generic Applications Fail + Product Modules */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-0 max-w-6xl mx-auto">
            <div className="text-center md:pr-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                More applications do not always mean better outcomes
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Most job seekers apply with the same resume, weak positioning, no tracking, and no
                follow-up system. Skillsurger helps you turn job search into a structured pipeline.
              </p>
              <Link to="/free-resume-audit">
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                  Get Free Resume Audit
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="text-center md:pl-12 md:border-l md:border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Modules</h2>
              <p className="text-lg text-gray-600 mb-8">
                Resume Audit, Resume Tailoring, Role-Fit Matching, Application Tracker, Recruiter
                Outreach, Mock Interview Prep, and Career Diagnosis — all part of one system.
              </p>
              <Link to="/job-search-bootcamp">
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                  Explore Job Switch Copilot
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Job Switch Copilot: Final CTA */}
      <CTASection
        title="Stop applying randomly. Build a structured job-search system."
        subtitle={`${WEBINAR.schedule}: join a free one-hour webinar on planning your next job switch and targeting 1.5x to 5x salary growth.`}
        ctaLabel="Reserve my free webinar seat"
        ctaHref="/job-search-copilot-webinar#webinar"
        footnote="No guaranteed outcomes — just a structured system to improve your job search."
      />

      {/* Free AI tools: a secondary path, below the programme */}
      <section className="pt-16 pb-4 bg-white border-t">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-2">Not ready for the programme?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Use the free AI career tools</h2>
          <p className="text-lg text-gray-600">Resume tools, job matching, learning paths, mock interviews and career exploration, with 7 days of free platform access.</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <p className="text-2xl sm:text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
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

      <section className="py-10 bg-blue-50 border-y border-blue-100">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Start with our free career tools</h2>
          <p className="text-gray-600 mb-4">Find your next step with Job Readiness Index™, FREE CV Score, or a Free Resume Audit. Explore all tools from the Tools menu.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-blue-700 font-semibold">
            <Link to="/job-readiness-index" className="underline">Job Readiness Index™</Link>
            <Link to="/dashboard?section=cv-scoring" className="underline">FREE CV Score</Link>
            <Link to="/free-resume-audit" className="underline">Free Resume Audit</Link>
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
                          Human follow-up
                        </h4>
                        <p className="text-gray-600">
                          Free audit requests are reviewed and followed up by our
                          team, not left in an inbox.
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
                    {submitError && (
                      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input id="contact-name"
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
                        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input id="contact-email"
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
                      <label htmlFor="contact-company" className="block text-sm font-medium text-gray-700 mb-2">
                        Company (Optional)
                      </label>
                      <input id="contact-company"
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
                      <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea id="contact-message"
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
            Prepare your next career move with resume feedback, job search, and interview practice
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
      <StickyAuditBar visible={showStickyBar} />
    </div>
  );
}
