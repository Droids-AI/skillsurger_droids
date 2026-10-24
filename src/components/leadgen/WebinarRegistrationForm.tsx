import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import { registerForWebinar, trackWebinarConversion } from '../../lib/webinarRegistration';
import { WEBINAR } from '../../lib/constants/webinar';
import { trackEvent, EVENTS } from '../../lib/analytics';
import { trackLandingEvent, useCampaignLink } from '../../lib/copilotFunnel';

export default function WebinarRegistrationForm({ dark = false }: { dark?: boolean }) {
  const navigate = useNavigate();
  const campaignLink = useCampaignLink();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(false);
  const submitting = useRef(false);
  const [closed, setClosed] = useState(() => Date.now() >= new Date(WEBINAR.startsAt).getTime());
  useEffect(() => {
    const timer = setInterval(() => setClosed(Date.now() >= new Date(WEBINAR.startsAt).getTime()), 30000);
    return () => clearInterval(timer);
  }, []);
  const muted = dark ? 'text-slate-300' : 'text-gray-600';
  const finePrint = dark ? 'text-slate-400' : 'text-gray-500';
  const inputClass = `w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 ${dark ? 'bg-[#0a0f2c] border-white/15 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'}`;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (Date.now() >= new Date(WEBINAR.startsAt).getTime()) { setClosed(true); return; }
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phoneNumber') || '').replace(/[\s()-]/g, '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+[1-9]\d{6,14}$/.test(phone)) {
      setError('Please enter your name, a valid email, and a WhatsApp number including +country code.');
      return;
    }
    setBusy(true);
    submitting.current = true;
    setError('');
    trackLandingEvent('webinar_form_submit', { form: 'webinar_registration' });
    try {
      const result = await registerForWebinar({ name, email, phoneNumber: phone });
      trackWebinarConversion(result);
      if (!result.alreadyRegistered) {
        trackLandingEvent(EVENTS.LEAD_FORM_SUBMITTED, { form: 'webinar_registration' });
        trackLandingEvent(EVENTS.WEBINAR_REGISTERED, { form: 'webinar_registration' });
        try { if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: 'Free job switch webinar' }); } catch { /* Tracking cannot fail a saved registration. */ }
      }
      navigate(campaignLink('/thank-you?type=webinar&existing=' + (result.alreadyRegistered ? '1' : '0') + '&delivery=' + result.whatsappStatus + '&email=' + (result.emailStatus || 'unconfigured')));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save your registration. Please try again.');
    } finally { submitting.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} onFocus={() => {
    if (!started.current) { started.current = true; trackEvent(EVENTS.LEAD_FORM_STARTED, { form: 'webinar_registration' }); }
  }} className="space-y-5">
    <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Reserve your free seat</h2>
    <p className={`text-sm ${muted}`}>No payment needed. After registering, join the WhatsApp group from your confirmation page for the meeting link.</p>
    {closed && <p role="status" className={muted}>Registration for this session is closed. <a href="/contact" className="underline">Contact us about the next webinar.</a></p>}
    <fieldset disabled={busy || closed} className="space-y-4">
      <div><label htmlFor="webinar-name" className="block font-medium mb-1">Full name</label><input id="webinar-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} /></div>
      <div><label htmlFor="webinar-email" className="block font-medium mb-1">Email</label><input id="webinar-email" name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} /></div>
      <div><label htmlFor="webinar-phone" className="block font-medium mb-1">WhatsApp number with country code</label><input id="webinar-phone" name="phoneNumber" type="tel" required maxLength={22} autoComplete="tel" defaultValue="+91 " placeholder="+91 98765 43210" className={inputClass} /></div>
      <p className={`text-xs ${finePrint}`}>By registering, you agree to receive your webinar confirmation and reminders by email. Read our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
      {error && <p role="alert" className={dark ? 'text-red-300' : 'text-red-700'}>{error}</p>}
      <Button type="submit" className="w-full min-h-12" disabled={busy || closed}>{closed ? 'Registration closed' : busy ? 'Reserving your seat…' : 'Reserve my free seat'}</Button>
    </fieldset>
    <p className={`text-sm ${muted}`}>{WEBINAR.schedule}. 60 minutes online.</p>
    <p className={`text-xs ${finePrint}`}>We do not send a direct WhatsApp confirmation. Join the group from your confirmation page for the meeting link. Joining is optional; group members may see your number.</p>
  </form>;
}
