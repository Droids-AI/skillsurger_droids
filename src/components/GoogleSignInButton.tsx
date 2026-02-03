import { useState } from 'react';
import { Chrome } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  text?: string;
}

export default function GoogleSignInButton({ 
  onSuccess, 
  onError, 
  disabled = false,
  text = "Continue with Google"
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }

      // The redirect will happen automatically
      // onSuccess will be called after redirect
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      onError?.(error.message || 'Failed to initiate Google sign-in');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      variant="outline"
      className="flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
    >
      <Chrome className="w-5 h-5 text-blue-500" />
      <span>{loading ? 'Connecting...' : text}</span>
    </Button>
  );
}