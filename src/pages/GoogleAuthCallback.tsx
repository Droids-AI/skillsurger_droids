import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      setStatus('loading');

      // Get the session from the URL hash
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (data.session) {
        const user = data.session.user;
        
        // Check if profile exists, if not create one
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile && (!profileError || profileError.code === 'PGRST116')) {
          // Profile doesn't exist, create one
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              email: user.email || '',
              years_of_experience: 0,
              summary: '',
              experience: [],
              projects: [],
              skills: [],
              education: [],
              cv_parsed_data: {}
            }]);

          if (createError) {
            console.error('Error creating profile:', createError);
          }
        } else if (existingProfile) {
          // Update existing profile with latest info from Google
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.full_name,
              email: user.email || existingProfile.email
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
          }
        }

        setStatus('success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        // No session found, redirect to login
        navigate('/login?error=auth_failed');
      }

    } catch (error: any) {
      console.error('Auth callback error:', error);
      setError(error.message || 'Authentication failed');
      setStatus('error');
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login?error=auth_callback_failed');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO 
        title="Authenticating | Skillsurger"
        description="Processing your authentication. Please wait..."
        canonicalUrl="/auth/callback"
        noIndex={true}
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Completing Sign-In
                </h2>
                <p className="text-gray-600">
                  Please wait while we set up your account...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Sign-In Successful!
                </h2>
                <p className="text-gray-600">
                  Redirecting you to your dashboard...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Authentication Failed
                </h2>
                <p className="text-red-600 mb-4">{error}</p>
                <p className="text-gray-600">
                  Redirecting you back to login...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}