import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Button from '../Button';
import { jobSwitchCopilotPricing } from '../../lib/constants/jobSwitchCopilotPricing';
import { trackEvent, EVENTS } from '../../lib/analytics';

export default function PricingTiers() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {jobSwitchCopilotPricing.map((tier) => (
        <div
          key={tier.name}
          className={`relative rounded-2xl border-2 p-6 flex flex-col bg-white transition-all duration-300 ${
            tier.popular ? 'border-blue-500 shadow-xl lg:scale-105' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          {tier.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
              Most Popular
            </span>
          )}
          <h3 className="text-lg font-bold text-gray-900 mb-2 mt-2">{tier.name}</h3>
          <div className="mb-3">
            <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
            <span className="text-gray-500 text-sm">{tier.period}</span>
          </div>
          <p className="text-sm text-gray-600 mb-5 flex-1">{tier.bestFor}</p>
          <Link
            to={tier.ctaHref}
            onClick={() => trackEvent(EVENTS.PLAN_SELECTED, { plan: tier.name, source: 'job_switch_copilot' })}
          >
            <Button className="w-full mb-3" variant={tier.popular ? 'primary' : 'outline'}>
              {tier.ctaLabel}
            </Button>
          </Link>
          <div className="flex items-start gap-1.5 text-xs text-gray-500">
            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{tier.objectionHandling}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
