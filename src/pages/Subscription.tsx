import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { CheckCircle, XCircle, Zap, Star, RefreshCcw, AlertCircle } from 'lucide-react';
import { calculateSubscriptionExpiry, isSubscriptionValid, getTrialDaysRemaining } from '../lib/subscriptionUtils';
import SEO from '../components/SEO';

const PLAN_COLORS: Record<string, string> = {
  trial: 'bg-yellow-100 text-yellow-800',
  pro: 'bg-blue-100 text-blue-800',
  premium: 'bg-purple-100 text-purple-800',
  lite: 'bg-teal-100 text-teal-800',
  sprint: 'bg-orange-100 text-orange-800',
  default: 'bg-gray-100 text-gray-800',
};

const Subscription: React.FC = () => {
  const { subscription, loading } = useUser();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  // Calculate refund eligibility (example: 30 days for paid plans)
  const calculateRefundEligibility = () => {
    if (!subscription) return { eligible: false, daysRemaining: 0, deadline: null };

    const tier = (subscription.subscription_tier || '').toLowerCase();
    // Trials are not eligible for refunds
    if (tier.includes('trial')) {
      return { eligible: false, daysRemaining: 0, deadline: null };
    }

    const refundWindowDays = 30; // 30-day refund window for paid plans
    const purchaseDate = subscription.updated_at
      ? new Date(subscription.updated_at)
      : new Date(subscription.created_at);

    const deadlineDate = new Date(purchaseDate);
    deadlineDate.setDate(deadlineDate.getDate() + refundWindowDays);

    const now = new Date();
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      eligible: daysRemaining > 0,
      daysRemaining: Math.max(0, daysRemaining),
      deadline: deadlineDate
    };
  };

  const refundEligibility = calculateRefundEligibility();

  const handleRefundRequest = () => {
    // This would integrate with your payment processor (DodoPayments)
    console.log('Refund requested with reason:', refundReason);
    // TODO: Implement actual refund API call
    alert('Refund request submitted! You will receive confirmation shortly.');
    setShowRefundModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg font-medium text-blue-700">Loading subscription...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <XCircle className="w-14 h-14 text-red-400 mb-4" />
        <h2 className="text-3xl font-bold mb-2">No Subscription Found</h2>
        <p className="text-gray-600 mb-6 text-lg">You do not have an active subscription. Please visit the pricing page to purchase a plan.</p>
        <a
          href="/pricing"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition text-lg"
        >
          View Plans
        </a>
      </div>
    );
  }

  const expiry = calculateSubscriptionExpiry(subscription);
  const tier = (subscription.subscription_tier || '').toLowerCase();
  const planColor =
    PLAN_COLORS[
      tier.includes('trial')
        ? 'trial'
        : tier.includes('sprint')
        ? 'sprint'
        : tier.includes('lite')
        ? 'lite'
        : tier.includes('premium')
        ? 'premium'
        : tier.includes('pro')
        ? 'pro'
        : 'default'
    ];
  const isActive = isSubscriptionValid(subscription);
  const trialDaysRemaining = getTrialDaysRemaining(subscription);

  return (
    <div className="flex flex-col items-center min-h-[70vh] via-white to-purple-50 py-12 px-2 rounded-lg">
      <SEO 
        title="Subscription | Manage Your Plan | Skillsurger"
        description="Manage your Skillsurger subscription. View plan details, upgrade options, and subscription status."
        keywords="subscription management, plan details, upgrade subscription"
        canonicalUrl="/subscription"
        noIndex={true}
      />
      <div className="w-full max-w-3xl md:w-[70vw] bg-white/90 rounded-2xl shadow-xl border border-blue-100 p-10 relative flex flex-col items-center">
        {/* Icon/Illustration */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full p-4 shadow-lg">
          <Zap className="w-10 h-10 text-white" />
        </div>
        {/* Plan Badge */}
        <span className={`px-4 py-1 rounded-full text-sm font-semibold mb-4 mt-6 ${planColor} shadow-sm uppercase tracking-wide`}>{subscription.subscription_tier}</span>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-center text-blue-900">Your Subscription</h2>
        <p className="text-gray-500 text-center mb-8 text-lg">View your current plan and subscription status below.</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-2 bg-blue-50/60 rounded-lg p-5 border border-blue-100">
            <span className="font-medium text-gray-700 flex items-center">Plan <Star className="w-4 h-4 ml-2 text-yellow-500" /></span>
            <span className="text-blue-700 font-bold text-lg capitalize">{subscription.subscription_tier}</span>
          </div>
          <div className="flex flex-col gap-2 bg-blue-50/60 rounded-lg p-5 border border-blue-100">
            <span className="font-medium text-gray-700 flex items-center">Status {isActive ? <CheckCircle className="w-4 h-4 ml-2 text-green-500" /> : <XCircle className="w-4 h-4 ml-2 text-red-500" />}</span>
            <span className={isActive ? 'text-green-600 font-bold text-lg' : 'text-red-600 font-bold text-lg'}>
              {subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-5 border border-gray-100">
            <span className="font-medium text-gray-700">Started On</span>
            <span className="text-gray-800 font-semibold">{new Date(subscription.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-5 border border-gray-100">
            <span className="font-medium text-gray-700">Expires On</span>
            <span className="text-gray-800 font-semibold">{expiry ? expiry.toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
        {subscription.subscription_status !== "active" && (
          <div className="mt-2 text-center">
            <span className="text-red-600 font-semibold text-lg">Your subscription is not active.</span>
          </div>
        )}
        {tier.includes('trial') && (
          <div className="mt-4 text-center">
            {trialDaysRemaining > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold">
                  ⏰ {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in your trial
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Upgrade to continue using all features after your trial expires
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">
                  ⚠️ Your trial has expired
                </p>
                <p className="text-red-700 text-sm mt-1">
                  Please upgrade to continue using all features
                </p>
              </div>
            )}
          </div>
        )}
        {tier.includes('trial') && trialDaysRemaining > 0 && (
          <div className="mt-2 text-center">
            <span className="text-yellow-600 font-semibold text-lg">Your 7-day Trial is live</span>
          </div>
        )}

        {/* Refund Eligibility Section */}
        {!tier.includes('trial') && (
          <div className="mt-8 w-full">
            {refundEligibility.eligible ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <RefreshCcw className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      One-Click Refund Available
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Not satisfied? You have <span className="font-bold text-green-700">{refundEligibility.daysRemaining} days remaining</span> to request a full refund with a single click.
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Refund deadline: <span className="font-semibold">{refundEligibility.deadline?.toLocaleDateString()}</span>
                    </p>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="inline-flex items-center px-6 py-3 bg-white border-2 border-green-600 text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Request One-Click Refund
                    </button>
                  </div>
                </div>
                <div className="flex items-start text-sm text-gray-600 bg-white/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>No questions asked. Your refund will be processed immediately and credited within 5-7 business days.</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <RefreshCcw className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  The refund window for this subscription has expired.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upgrade Plan Button */}
        <div className="mt-10 flex justify-center w-full">
          <a
            href="/pricing"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg text-lg transition transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Upgrade Plan
          </a>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowRefundModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCcw className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Your Refund</h2>
              <p className="text-gray-600">
                We're sorry to see you go! Your refund will be processed immediately and credited back to your original payment method within 5-7 business days.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Refund amount:</span>
                <span className="font-semibold text-gray-900">
                  {tier.includes('monthly') ? '$10' : tier.includes('yearly') ? '$100' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original payment date:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(subscription?.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for refund (optional)
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a reason...</option>
                <option value="not-what-expected">Not what I expected</option>
                <option value="too-expensive">Too expensive</option>
                <option value="found-alternative">Found an alternative</option>
                <option value="technical-issues">Technical issues</option>
                <option value="other">Other</option>
              </select>
            </div>

            <p className="text-sm text-gray-600 text-center mb-6">
              This won't affect your account—you're welcome back anytime.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundRequest}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription; 