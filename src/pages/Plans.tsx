import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Clock, Download, BarChart3, Check, RefreshCcw, CheckCircle, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";
import { trackEvent, EVENTS } from "../lib/analytics";
import { JOB_SWITCH_PROGRAM } from "../lib/constants/jobSwitchProgram";
import { indianCheckoutUrl } from "../lib/checkout";

// Subscription plans: public at /pricing (with the free trial) and for signed-in users at /upgrade.
const plans = [
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
    cta: "Get Monthly Pro",
    popular: true,
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
    cta: "Get Yearly Pro · Save 17%",
    popular: false,
    url: "https://checkout.dodopayments.com/buy/pdt_zFZMrKwafzRr12jun9Lfj?quantity=1&redirect_url=https://skillsurger.com%2Fdashboard",
  },
];

const freeTrial = {
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
  ],
};

export default function Plans({ publicPage = false }: { publicPage?: boolean }) {
  useEffect(() => {
    trackEvent(EVENTS.PRICING_VIEWED, { page: publicPage ? "pricing" : "upgrade" });
  }, [publicPage]);

  return (
    <section className="py-16 sm:py-20 bg-gray-50 min-h-screen">
      {publicPage ? (
        <SEO
          title="Pricing Plans | Skillsurger AI Career Coach"
          description="Skillsurger pricing: free 7-day trial, Monthly Pro at ₹799, Yearly Pro at ₹7,999, and the 30-day Job Switch Copilot programme at ₹5,000 incl. GST."
          keywords="AI career coach pricing India, resume builder cost, career development pricing, job search tools pricing India"
          canonicalUrl="/pricing"
        />
      ) : (
        <SEO
          title="Upgrade Your Plan | Skillsurger"
          description="Upgrade your Skillsurger plan to keep using AI career guidance, mock interviews, CV optimization and job matching."
          canonicalUrl="/upgrade"
          noIndex
        />
      )}
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{publicPage ? "Choose your career growth plan" : "Upgrade your plan"}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {publicPage
              ? "Start with a free 7-day trial. No credit card needed. Upgrade when you're ready."
              : "Keep full access to your AI career agent. Your profile, CVs and progress stay as they are."}
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12 bg-white border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <RefreshCcw className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-bold text-gray-900">Risk-free purchase with one-click refund</h2>
            <p className="text-gray-600 text-sm">
              Within your refund window, request a refund from your dashboard's subscription section. No emails, no questions asked.
            </p>
          </div>
        </div>

        {publicPage && (
          <div className="max-w-6xl mx-auto mb-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 sm:p-8 text-white grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-100 mb-1">AI + human coaching</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{JOB_SWITCH_PROGRAM.name}: {JOB_SWITCH_PROGRAM.priceLabel} <span className="text-base font-medium text-blue-100">{JOB_SWITCH_PROGRAM.taxNote}</span></h2>
              <p className="text-blue-50">{JOB_SWITCH_PROGRAM.durationLabel} for {JOB_SWITCH_PROGRAM.audience}. {JOB_SWITCH_PROGRAM.format}.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link to="/job-search-bootcamp" onClick={() => trackEvent(EVENTS.PLAN_SELECTED, { plan: JOB_SWITCH_PROGRAM.name })} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50">View Program <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/free-resume-audit" className="inline-flex items-center justify-center rounded-lg border border-white/60 px-6 py-3 font-semibold text-white hover:bg-white/10">Free Career Audit</Link>
            </div>
          </div>
        )}

        <div className={`grid gap-8 mx-auto ${publicPage ? "md:grid-cols-2 lg:grid-cols-3 max-w-6xl" : "md:grid-cols-2 max-w-4xl"}`}>
          {publicPage && (
            <div className="relative rounded-2xl border-2 border-gray-200 bg-white p-8 hover:border-gray-300 transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{freeTrial.name}</h3>
                <p className="text-gray-600 mb-4">{freeTrial.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">₹{freeTrial.price}</span>
                  <span className="text-gray-600 ml-2">/{freeTrial.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {freeTrial.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                onClick={() => trackEvent(EVENTS.PLAN_SELECTED, { plan: freeTrial.name })}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center justify-center text-sm text-gray-600 mt-3 font-medium">
                <Shield className="w-4 h-4 mr-1.5 text-green-500" />
                No credit card required
              </div>
            </div>
          )}
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 bg-white ${
                plan.popular ? "border-blue-500 shadow-xl" : "border-gray-200 hover:border-gray-300"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={indianCheckoutUrl(plan.url)}
                onClick={() => {
                  trackEvent(EVENTS.PLAN_SELECTED, { plan: plan.name });
                  trackEvent(EVENTS.PAYMENT_INITIATED, { plan: plan.name });
                }}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
              <div className="flex items-center justify-center text-sm text-gray-600 mt-3 font-medium">
                <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
                One-click refund available
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">All plans include:</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center"><Shield className="w-4 h-4 mr-1" /> Enterprise Security</span>
            <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 24/7 Support</span>
            <span className="flex items-center"><Download className="w-4 h-4 mr-1" /> CV Downloads</span>
            <span className="flex items-center"><BarChart3 className="w-4 h-4 mr-1" /> Analytics</span>
          </div>
          <p className="text-sm text-gray-500 mt-8">
            Looking for hands-on help with a job switch?{" "}
            <Link to="/job-search-bootcamp" className="text-blue-600 hover:text-blue-500 font-medium">
              See the Job Switch Copilot programme
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
