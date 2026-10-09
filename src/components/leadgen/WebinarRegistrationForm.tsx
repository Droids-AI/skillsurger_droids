import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import { submitLead } from '../../lib/googleSheets';
import { trackEvent, EVENTS } from '../../lib/analytics';

export default function WebinarRegistrationForm({ dark = false }: { dark?: boolean }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(false);
  const muted = dark ? 'text-slate-300' : 'text-gray-600';
  const finePrint = dark ? 'text-slate-400' : 'text-gray-500';
  const inputClass = `w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 ${dark ? 'bg-[#0a0f2c] border-white/15 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'}`;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phoneNumber') || '').replace(/[\s()-]/g, '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+?\d{7,15}$/.test(phone)) {
      setError('Please enter your name, a valid email, and a phone number with 7–15 digits.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await submitLead({ name, email, phoneNumber: phone, webinarTitle: 'How to switch jobs and target 1.5x to 5x salary growth', durationMinutes: 60, source: 'job-switch-copilot', pageUrl: window.location.href }, 'webinar_registration');
      trackEvent(EVENTS.LEAD_FORM_SUBMITTED, { form: 'webinar_registration' });
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: 'Free job switch webinar' });
      navigate('/thank-you?type=webinar');
    } catch {
      setError('We could not save your registration. Please try again.');
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit} onFocus={() => {
    if (!started.current) { started.current = true; trackEvent(EVENTS.LEAD_FORM_STARTED, { form: 'webinar_registration' }); }
  }} className="space-y-5">
    <h3 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Reserve your free webinar seat</h3>
    <p className={muted}>1 hour online · Free registration. Session timing and joining details will be shared using your contact details.</p>
    <fieldset disabled={busy} className="space-y-4">
      <div><label htmlFor="webinar-name" className="block font-medium mb-1">Full name</label><input id="webinar-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} /></div>
      <div><label htmlFor="webinar-email" className="block font-medium mb-1">Email</label><input id="webinar-email" name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} /></div>
      <div><label htmlFor="webinar-phone" className="block font-medium mb-1">Phone number with country code</label><input id="webinar-phone" name="phoneNumber" type="tel" required maxLength={22} autoComplete="tel" placeholder="+91 98765 43210" className={inputClass} /></div>
      <p className={`text-xs ${finePrint}`}>By registering, you agree to be contacted about this webinar. Read our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
      {error && <p role="alert" className={dark ? 'text-red-300' : 'text-red-700'}>{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Reserving your seat…' : 'Reserve my free seat'}</Button>
    </fieldset>
    <p className={`text-sm ${finePrint}`}>This reserves the free webinar only. Joining the ₹9,999 programme is a separate decision.</p>
  </form>;
}
