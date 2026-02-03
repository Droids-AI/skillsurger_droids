import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { AlertCircle, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleAuthMessage, setGoogleAuthMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for Google auth parameters
    const googleUser = searchParams.get('google_user');
    const errorParam = searchParams.get('error');
    
    if (googleUser === 'true') {
      const googleEmail = sessionStorage.getItem('google_user_email');
      const googleName = sessionStorage.getItem('google_user_name');
      
      if (googleEmail) {
        setGoogleAuthMessage(`Welcome back ${googleName}! Please sign in with your email: ${googleEmail}`);
        setEmail(googleEmail);
        sessionStorage.removeItem('google_user_email');
        sessionStorage.removeItem('google_user_name');
      }
    }
    
    if (errorParam === 'google_auth_failed') {
      setError('Google authentication failed. Please try signing in with your email and password.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile && (!profileError || profileError.code === 'PGRST116')) {
          // Profile doesn't exist, create one
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              full_name: '',
              email: email,
              years_of_experience: 0,
              summary: '',
              experience: [],
              projects: [],
              skills: [],
              education: [],
              cv_parsed_data: {}
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
          }
        }

        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO 
        title="Login | Access Your Account | Skillsurger"
        description="Login to your Skillsurger account. Access your AI career coach, resume builder, and interview practice tools."
        keywords="login, sign in, account access, user login"
        canonicalUrl="/login"
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {googleAuthMessage && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-blue-600 text-sm">{googleAuthMessage}</p>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="mb-6 flex justify-center">
            <GoogleSignInButton
              text="Sign in with Google"
              onError={handleGoogleSignInError}
              disabled={loading}
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}