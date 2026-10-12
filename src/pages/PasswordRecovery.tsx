import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import SEO from '../components/SEO';

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [ready, setReady] = useState(!reset);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!reset) return;
    let active = true;
    let verified = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === 'PASSWORD_RECOVERY' && session) { verified = true; setReady(true); setError(''); }
    });
    // Supabase resolves PKCE automatically. A normal signed-in session is not
    // sufficient: this page must have a recent recovery confirmation.
    const timeout = window.setTimeout(() => {
      if (active && !verified) setError('This reset link is missing, invalid, or expired. Request a new link below.');
    }, 8000);
    supabase.auth.getSession().then(({ data }) => {
      try {
        const marker = JSON.parse(sessionStorage.getItem('skillsurger-recovery') || 'null');
        if (active && data.session && marker?.userId === data.session.user.id && marker.expires > Date.now()) {
          verified = true; setReady(true); setError('');
        }
      } catch { /* Wait for the recovery auth event. */ }
    });
    return () => { active = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, [reset]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    setError('');
    if (reset && (!ready || password.length < 12 || password !== confirm)) {
      setError('Use at least 12 characters and make sure both passwords match.'); return;
    }
    lock.current = true; setBusy(true);
    try {
      if (reset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        setMessage('Your password has been updated. Sign in with your new password.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage('If an account exists for this email, a password reset link will arrive shortly. Check your spam folder too.');
      }
      setDone(true);
    } catch { setError(reset ? 'Could not update your password. Request a new reset link and try again.' : 'Could not send the reset request. Please try again shortly.'); }
    finally { lock.current = false; setBusy(false); }
  }

  const inputClass = 'appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 sm:text-sm';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Reset password | Skillsurger" description="Recover access to your Skillsurger account." canonicalUrl={reset ? '/reset-password' : '/forgot-password'} noIndex />
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {reset ? 'Set a new password' : 'Forgot your password?'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {reset ? 'Choose a new password with at least 12 characters.' : "Enter your account email and we'll send you a reset link."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div role="status" className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          )}

          {!done && (
            <form className="space-y-6" onSubmit={submit}>
              {reset ? (
                <>
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New password</label>
                    <div className="mt-1">
                      <input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} disabled={!ready || busy} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm password</label>
                    <div className="mt-1">
                      <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} disabled={!ready || busy} />
                    </div>
                  </div>
                  {!ready && !error && <p role="status" className="text-sm text-gray-600">Checking your reset link…</p>}
                </>
              ) : (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                  <div className="mt-1">
                    <input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className={inputClass} disabled={busy} />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={busy || !ready}>
                {busy ? 'Please wait…' : reset ? 'Update password' : 'Send reset link'}
              </Button>
            </form>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link className="font-medium text-blue-600 hover:text-blue-500" to="/login">Back to sign in</Link>
            {reset && <Link className="font-medium text-blue-600 hover:text-blue-500" to="/forgot-password">Request a new reset link</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
