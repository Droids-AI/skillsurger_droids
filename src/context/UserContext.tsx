import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchUserSubscription } from '../lib/subscription';
import { useNavigate } from 'react-router-dom';
import { hasAIFeatureAccess, hasProfileAccess } from '../lib/subscriptionUtils';

export interface SubscriptionData {
  id: string;
  user_id: string;
  subscription_id: string;
  subscription_status: string;
  subscription_tier: 'free' | 'trial' | 'Monthly Pro' | 'Yearly Pro';
  created_at: string;
  updated_at: string;
  expires_on: string;
  is_active: boolean;
}

interface UserContextType {
  user: any;
  subscription: SubscriptionData | null;
  loading: boolean;
  checkSubscriptionForAI: () => boolean;
  checkProfileAccess: () => boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  subscription: null,
  loading: true,
  checkSubscriptionForAI: () => false,
  checkProfileAccess: () => false,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkSubscriptionForAI = (): boolean => {
    // Use the utility function to check AI feature access
    if (!hasAIFeatureAccess(subscription)) {
      navigate('/pricing');
      return false;
    }

    return true;
  };

  const checkProfileAccess = (): boolean => {
    // Use the utility function to check profile access (allows expired users)
    if (!hasProfileAccess(subscription)) {
      navigate('/pricing');
      return false;
    }

    return true;
  };

  useEffect(() => {
    let isSubscribed = true;

    const getUserAndSubscription = async (shouldSetLoading = true) => {
      if (shouldSetLoading) {
        setLoading(true);
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!isSubscribed) return;

      if (!session?.user) {
        setUser(null);
        setSubscription(null);
        setLoading(false);
        return;
      }
      setUser(session.user);

      try {
        const subRes = await fetchUserSubscription(session.user.id);

        if (!isSubscribed) return;

        if (subRes.success && subRes.data) {
          setSubscription(subRes.data);
        } else {
          setSubscription(null);
        }
      } catch (e) {
        if (!isSubscribed) return;
        setSubscription(null);
      }
      setLoading(false);
    };

    getUserAndSubscription(true);

    // Listen for auth changes - but filter out TOKEN_REFRESHED events to prevent tab-switch reloads
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore TOKEN_REFRESHED events - these happen when tabs switch and don't require a full reload
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed - updating session without reload');
        if (session?.user && isSubscribed) {
          setUser(session.user);
        }
        return;
      }

      // Only reload data for significant auth events
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        console.log('Auth event:', event, '- fetching user data');
        getUserAndSubscription(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        if (isSubscribed) {
          setUser(null);
          setSubscription(null);
        }
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []); // Removed navigate dependency to prevent unnecessary re-renders

  return (
    <UserContext.Provider value={{ user, subscription, loading, checkSubscriptionForAI, checkProfileAccess }}>
      {children}
    </UserContext.Provider>
  );
}; 