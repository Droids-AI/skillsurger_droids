import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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

  return <div className="min-h-[70vh] px-4 py-16 flex justify-center items-start">
    <SEO title="Reset password | Skillsurger" description="Recover access to your Skillsurger account." canonicalUrl={reset ? '/reset-password' : '/forgot-password'} noIndex />
    <section className="w-full max-w-md bg-white rounded-2xl shadow p-6 sm:p-8">
      <h1 className="text-3xl font-bold mb-5">{reset ? 'Set a new password' : 'Forgot your password?'}</h1>
      {message && <p role="status" className="text-green-800 mb-5">{message}</p>}
      {error && <p role="alert" className="text-red-700 mb-5">{error}</p>}
      {!done && <form onSubmit={submit} className="space-y-5">
        {reset ? <>
          <label className="block">New password<input aria-label="New password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} className="block border rounded-lg p-3 w-full mt-1" disabled={!ready || busy} /></label>
          <label className="block">Confirm password<input aria-label="Confirm password" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} className="block border rounded-lg p-3 w-full mt-1" disabled={!ready || busy} /></label>
          {!ready && !error && <p role="status">Checking your reset link…</p>}
        </> : <label className="block">Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="block border rounded-lg p-3 w-full mt-1" disabled={busy} /></label>}
        <button disabled={busy || !ready} className="bg-blue-600 text-white rounded-lg py-3 px-5 w-full disabled:opacity-50">{busy ? 'Please wait…' : reset ? 'Update password' : 'Send reset link'}</button>
      </form>}
      <div className="mt-6 flex flex-wrap gap-4"><Link className="text-blue-700 underline" to="/login">Back to sign in</Link>{reset && <Link className="text-blue-700 underline" to="/forgot-password">Request a new reset link</Link>}</div>
    </section>
  </div>;
}
