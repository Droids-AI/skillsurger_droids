import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isSubscribed) {
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    // Filter auth state changes to prevent tab-switch reloads
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore TOKEN_REFRESHED - this happens on tab switch and doesn't mean user changed
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user && isSubscribed) {
          setUser(session.user);
        }
        return;
      }

      // Only update user state for significant events
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        if (isSubscribed) {
          setUser(session?.user || null);
        }
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}