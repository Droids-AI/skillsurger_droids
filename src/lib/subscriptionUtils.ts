import { SubscriptionData } from '../context/UserContext';

/**
 * Calculate the expiry date for a subscription based on its tier and creation/update date
 * For paid plans, uses updated_at if available (for renewals), otherwise created_at
 * For trials, always uses created_at
 */
export function calculateSubscriptionExpiry(subscription: SubscriptionData): Date | null {
  if (!subscription) return null;
  
  const tier = (subscription.subscription_tier || '').toLowerCase();
  
  // For trials, always calculate from created_at
  if (tier.includes('trial')) {
    const created = new Date(subscription.created_at);
    const expiry = new Date(created);
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }
  
  // For paid plans (Monthly/Yearly Pro), use updated_at if available for renewal handling
  // Otherwise fall back to created_at
  const baseDate = subscription.updated_at 
    ? new Date(subscription.updated_at) 
    : new Date(subscription.created_at);
  
  if (tier.includes('annual pro') || tier.includes('yearly pro')) {
    const expiry = new Date(baseDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  } else if (tier.includes('monthly pro')) {
    const expiry = new Date(baseDate);
    expiry.setMonth(expiry.getMonth() + 1);
    return expiry;
  }
  
  return null;
}

/**
 * Check if a subscription is currently valid and not expired
 */
export function isSubscriptionValid(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  
  // Check if subscription is active
  if (subscription.subscription_status !== 'active') return false;
  
  const tier = (subscription.subscription_tier || '').toLowerCase();
  
  // For paid plans (Monthly/Yearly Pro), if status is active, trust the backend
  // The backend should handle renewals and update the status accordingly
  if (tier.includes('monthly pro') || tier.includes('yearly pro') || tier.includes('annual pro')) {
    // Only check expires_on if it exists and is valid
    if (subscription.expires_on) {
      try {
        const expiryDate = new Date(subscription.expires_on);
        const currentYear = new Date().getFullYear();
        // Check if the date is valid (not NaN and not a date in the far future indicating corruption)
        if (!isNaN(expiryDate.getTime()) && expiryDate.getFullYear() < currentYear + 100) {
          if (new Date() > expiryDate) return false;
        }
      } catch (e) {
        // If parsing fails, ignore and trust the active status
        console.warn('Invalid expires_on date, trusting subscription_status for paid plan');
      }
    }
    // For active paid subscriptions, trust the status from backend
    return true;
  }
  
  // For trials, strictly check expiration
  if (tier.includes('trial')) {
    const calculatedExpiry = calculateSubscriptionExpiry(subscription);
    if (calculatedExpiry && new Date() > calculatedExpiry) return false;
  }
  
  return true;
}

/**
 * Check if user has access to AI features
 */
export function hasAIFeatureAccess(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  
  const tier = subscription.subscription_tier?.toLowerCase();
  if (!tier || tier === 'free') return false;
  
  return isSubscriptionValid(subscription);
}

/**
 * Check if user has access to profile and subscription pages
 * This allows access even for expired trials/plans
 */
export function hasProfileAccess(subscription: SubscriptionData | null): boolean {
  // Always allow access to profile and subscription pages if user has any subscription record
  return subscription !== null;
}

/**
 * Get subscription status message for display
 */
export function getSubscriptionStatusMessage(subscription: SubscriptionData | null): string {
  if (!subscription) return 'No subscription found';
  
  if (!isSubscriptionValid(subscription)) {
    const tier = subscription.subscription_tier?.toLowerCase();
    if (tier === 'trial') {
      return 'Your trial has expired';
    }
    return 'Your subscription is not active';
  }
  
  return 'Active subscription';
}

/**
 * Get days remaining for trial subscription
 */
export function getTrialDaysRemaining(subscription: SubscriptionData | null): number {
  if (!subscription) return 0;
  
  const tier = subscription.subscription_tier?.toLowerCase();
  if (!tier.includes('trial')) return 0;
  
  const expiry = calculateSubscriptionExpiry(subscription);
  if (!expiry) return 0;
  
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}
