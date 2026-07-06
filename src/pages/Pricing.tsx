import { useEffect } from "react";
import { Shield, Clock, Download, BarChart3, Check, RefreshCcw, CheckCircle } from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { trackEvent, EVENTS } from "../lib/analytics";
import PricingTiers from "../components/jobSwitchCopilot/PricingTiers";

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
    url: "/dashboard", // Redirect to dashboard after trial
  },
  {
    name: "Monthly Pro",
    price: "799",
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
    price: "7,999",
    period: "year",
    description: "Best value for serious career growth",
    features: [
      "Everything in Monthly Pro",
      "2 months free (save ₹1,589)",
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

const Pricing = () => {
  useEffect(() => {
    trackEvent(EVENTS.PRICING_VIEWED);
  }, []);

  return (
    <section id="pricing" className="py-20 bg-white">
      <SEO
        title="Pricing Plans | Skillsurger AI Career Coach"
        description="Choose the best plan for your career growth. Start with a free 7-day trial. Affordable AI-powered career coaching from just ₹799/month."
        keywords="AI career coach pricing India, resume builder cost, career development pricing, job search tools pricing India"
        canonicalUrl="/pricing"
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Career Growth Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our free trial and experience the full power of AI-driven
            career development.
          </p>
        </div>

        {/* Refund Assurance Section */}
        <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <RefreshCcw className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              100% Risk-Free Purchase with One-Click Refund
            </h3>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Not satisfied? Get a full refund with a single click—no emails, no waiting, no questions asked. Just go to your dashboard, click "Request Refund," and we'll process it immediately. We want you to try Skillsurger completely risk-free.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
              <span className="font-medium">One-click refund from dashboard</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
              <span className="font-medium">No questions asked</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
              <span className="font-medium">Processed immediately</span>
            </div>
          </div>
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
                    ₹{plan.price}
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

              <Link
                to={plan.url}
                className="block"
                onClick={() => {
                  trackEvent(EVENTS.PLAN_SELECTED, { plan: plan.name });
                  if (plan.url.startsWith('http')) {
                    trackEvent(EVENTS.PAYMENT_INITIATED, { plan: plan.name });
                  }
                }}
              >
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
              {(plan.name === "Monthly Pro" || plan.name === "Yearly Pro") && (
                <div className="flex items-center justify-center text-sm text-gray-600 mt-2 font-medium">
                  <RefreshCcw className="w-4 h-4 mr-1.5 text-green-500" />
                  One-click refund available
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

        {/* Job Switch Copilot Plans */}
        <div className="mt-20 pt-16 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Job Switch Copilot Plans</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A separate, structured job-search system for tech professionals actively switching roles —
              from a free resume audit to a focused 30-day recovery sprint.
            </p>
          </div>
          <PricingTiers />
          <p className="text-center text-sm text-gray-500 mt-8">
            No guaranteed placement, interviews, or salary outcomes — these plans improve the quality and
            consistency of your job search.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16 bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                <RefreshCcw className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                How does the one-click refund work?
              </h4>
              <p className="text-gray-700 leading-relaxed pl-7">
                We believe in making refunds as easy as signing up. If you're within the refund window (check your dashboard for your specific deadline), simply click "Request Refund" in your subscription settings. No forms to fill out, no customer service emails required. Your refund is processed instantly and will appear in your account within 5-7 business days. We don't ask why—though we'd love your feedback to improve.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                What is the refund window?
              </h4>
              <p className="text-gray-700 leading-relaxed">
                Our refund window varies by plan. Check your subscription dashboard to see your specific refund deadline. We'll always show you clearly whether you're eligible for a refund.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Can I come back after requesting a refund?
              </h4>
              <p className="text-gray-700 leading-relaxed">
                Absolutely! Requesting a refund won't affect your account. You're welcome back anytime, and all your progress will be saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
