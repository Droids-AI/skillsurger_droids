import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Clock, Download, BarChart3, Check, RefreshCcw, CheckCircle, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";
import { trackEvent, EVENTS } from "../lib/analytics";

// In-app subscription plans. Public /pricing visits go to the Job Switch Copilot offer instead.
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
    cta: "Upgrade to Monthly",
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
    cta: "Upgrade to Yearly · Save 17%",
    popular: false,
    url: "https://checkout.dodopayments.com/buy/pdt_zFZMrKwafzRr12jun9Lfj?quantity=1&redirect_url=https://skillsurger.com%2Fdashboard",
  },
];

export default function Upgrade() {
  useEffect(() => {
    trackEvent(EVENTS.PRICING_VIEWED, { page: "upgrade" });
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-gray-50 min-h-screen">
      <SEO
        title="Upgrade Your Plan | Skillsurger"
        description="Upgrade your Skillsurger plan to keep using AI career guidance, mock interviews, CV optimization and job matching."
        canonicalUrl="/upgrade"
        noIndex
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Upgrade your plan</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Keep full access to your AI career agent. Your profile, CVs and progress stay as they are.
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

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                href={plan.url}
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
            <Link to="/job-switch-copilot" className="text-blue-600 hover:text-blue-500 font-medium">
              See the Job Switch Copilot programme
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
