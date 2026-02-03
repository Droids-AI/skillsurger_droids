import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface ProfileProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProfileProtectedRoute({ children }: ProfileProtectedRouteProps) {
  const { loading, subscription } = useUser();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Add a small delay to prevent rapid redirects during tab switching
    if (!loading && subscription === null) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    } else {
      setShouldRedirect(false);
    }
  }, [loading, subscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Allow access to profile pages if user has any subscription record (including expired)
  // This prevents redirects during tab switching when subscription might be temporarily null
  if (shouldRedirect) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
