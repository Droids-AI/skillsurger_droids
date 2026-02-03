import React from 'react';
import { useUser } from '../context/UserContext';
import { getTrialDaysRemaining } from '../lib/subscriptionUtils';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';

export default function TrialWarning() {
  const { subscription } = useUser();
  
  if (!subscription) return null;
  
  const tier = subscription.subscription_tier?.toLowerCase();
  if (!tier?.includes('trial')) return null;
  
  const daysRemaining = getTrialDaysRemaining(subscription);
  
  if (daysRemaining <= 0) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold text-sm">
              Your trial has expired
            </p>
            <p className="text-red-700 text-xs">
              <Link to="/pricing" className="underline hover:text-red-900">
                Upgrade now
              </Link> to continue using all features
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (daysRemaining <= 3) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-yellow-400 mr-2" />
          <div className="flex-1">
            <p className="text-yellow-800 font-semibold text-sm">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your trial
            </p>
            <p className="text-yellow-700 text-xs">
              <Link to="/pricing" className="underline hover:text-yellow-900">
                Upgrade now
              </Link> to avoid losing access to features
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
