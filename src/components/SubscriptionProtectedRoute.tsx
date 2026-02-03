import React, { useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
}

export default function SubscriptionProtectedRoute({ children }: SubscriptionProtectedRouteProps) {
  const { loading, checkSubscriptionForAI } = useUser();
  const hasChecked = useRef(false);

  // Prevent redirect flash on tab switch
  useEffect(() => {
    if (!loading) {
      hasChecked.current = true;
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Check if user has valid subscription for AI features
  if (!checkSubscriptionForAI()) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
