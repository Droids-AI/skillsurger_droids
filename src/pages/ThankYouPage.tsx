import { useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, ArrowRight, MessageCircle, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { thankYouContent, ThankYouType } from '../lib/constants/thankYouContent';
import { WEBINAR } from '../lib/constants/webinar';
import { JOB_SWITCH_PROGRAM } from '../lib/constants/jobSwitchProgram';
import { trackEvent, EVENTS } from '../lib/analytics';
import { useCampaignLink } from '../lib/copilotFunnel';
import { BOOTCAMP_PATH, WEBINAR_PATH } from '../lib/constants/jobSearchLanding';

const SUPPORT_WHATSAPP = 'https://wa.me/917310768702';

// Dodo redirects here with ?payment_id=…&status=succeeded. The purchase event fires
// once per payment; the Dodo webhook is the record of truth for reconciliation.
function PurchaseResult() {
  const [params] = useSearchParams();
  const paymentId = (params.get('payment_id') || '').slice(0, 80);
  const status = params.get('status');
  const succeeded = status === 'succeeded' || status === 'success';
  useEffect(() => {
    if (!succeeded || !paymentId) return;
    const key = `purchase-tracked:${paymentId}`;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { /* Fire anyway; transaction_id deduplicates. */ }
    trackEvent(EVENTS.PURCHASE, { transaction_id: paymentId, value: JOB_SWITCH_PROGRAM.price, currency: 'INR', items: [{ item_name: JOB_SWITCH_PROGRAM.name, price: JOB_SWITCH_PROGRAM.price, quantity: 1 }] });
  }, [succeeded, paymentId]);
  if (status && !succeeded) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-24">
      <SEO title="Payment not completed | Skillsurger" description="Your payment was not completed." canonicalUrl="/thank-you" noIndex />
      <div className="max-w-xl text-center space-y-5">
        <AlertCircle className="w-14 h-14 text-amber-500 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900">Your payment was not completed</h1>
        <p className="text-gray-600">No money has been taken for this attempt. You can try again, or message us if the amount was debited.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={JOB_SWITCH_PROGRAM.checkoutUrl} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Try payment again</a>
          <a href={`${SUPPORT_WHATSAPP}?text=${encodeURIComponent('My Job Switch Copilot payment did not complete' + (paymentId ? ` (payment ${paymentId})` : ''))}`} className="px-6 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100">Message us on WhatsApp</a>
        </div>
      </div>
    </div>;
  }
  return <ParameterizedThankYou type="purchase" />;
}

function PurchaseNextSteps() {
  const [params] = useSearchParams();
  const paymentId = (params.get('payment_id') || '').slice(0, 80);
  const message = `Hi, I just enrolled in Job Switch Copilot${paymentId ? ` (payment ${paymentId})` : ''}. Please share my onboarding details.`;
  return <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-6 text-left">
    <h2 className="font-bold text-lg text-gray-900 mb-3">Your onboarding, step by step</h2>
    <ol className="list-decimal pl-5 space-y-2 text-gray-700">
      <li>Check your email for the Dodo Payments receipt{paymentId ? <> (payment reference <span className="font-mono text-sm">{paymentId}</span>)</> : null}.</li>
      <li>Within 24 hours we send your cohort dates, session calendar and a short onboarding form.</li>
      <li>Fill the onboarding form and upload your current resume before session 1.</li>
      <li>{JOB_SWITCH_PROGRAM.refundPolicy}</li>
    </ol>
    <a href={`${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-6 py-3 font-semibold text-white"><MessageCircle className="w-5 h-5" /> Start onboarding on WhatsApp</a>
  </div>;
}

const toUtcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function AddToCalendarButton() {
  const title = `Free webinar: ${WEBINAR.title} — Skillsurger`;
  const description = `${WEBINAR.schedule}. 60 minutes online. Joining link: ${WEBINAR.whatsappGroupUrl} (shared in the webinar WhatsApp group).`;
  const location = 'Online (meeting link in the webinar WhatsApp group)';
  const startDate = toUtcStamp(WEBINAR.startsAt);
  const endDate = toUtcStamp(WEBINAR.endsAt);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skillsurger//Webinar//EN',
    'BEGIN:VEVENT',
    `UID:${WEBINAR.id}@skillsurger.com`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const handleICS = () => {
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skillsurger-webinar.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-blue-200 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
      >
        <Calendar className="w-5 h-5" />
        Add to Google Calendar
      </a>
      <button
        type="button"
        onClick={handleICS}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Calendar className="w-5 h-5" />
        Download .ics (Apple / Outlook)
      </button>
    </div>
  );
}

function ParameterizedThankYou({ type }: { type: ThankYouType }) {
  const content = thankYouContent[type];
  const [params] = useSearchParams();
  const existing = type === 'webinar' && params.get('existing') === '1';
  const emailStatus = params.get('email');
  const campaignLink = useCampaignLink();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20">
      <SEO
        title={`${content.headline} | Skillsurger`}
        description={content.body}
        canonicalUrl="/thank-you"
        noIndex
      />

      <div className="max-w-2xl w-full mx-auto text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 border border-green-300 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{existing ? 'You are already registered.' : content.headline}</h1>
          <p className="text-gray-600 text-lg">{content.body}</p>
          {type === 'webinar' && <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-left">
            <div className="flex items-center gap-2 text-green-800 font-bold text-lg"><MessageCircle className="w-5 h-5" /> Next step: join the webinar WhatsApp group</div>
            <p className="mt-2 text-gray-700">The joining link and reminders for {WEBINAR.schedule} are shared in this group.</p>
            <p className="mt-2 text-sm text-gray-600">Joining the group is optional. Your number may be visible to other members. You can contact support if you need another way to get the joining details.</p>
            <a href={WEBINAR.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-6 py-3 font-semibold text-white transition-colors">
              <MessageCircle className="w-5 h-5" /> Join WhatsApp group
            </a>
            <a className="block mt-3 text-sm text-green-800 underline" href={`${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Please help with my Skillsurger webinar joining link for ${WEBINAR.schedule}`)}`}>Trouble joining? Message us</a>
          </div>}
          {type === 'webinar' && <p className="mt-4 text-gray-600" role="status">We do not send a direct WhatsApp confirmation. Join the group above for the meeting link and reminders, or contact support for help.</p>}
          {(type === 'webinar' || type === 'resume-audit') && emailStatus === 'accepted' && <p className="mt-4 text-gray-600" role="status">Your confirmation email has been queued for sending. Check your inbox and spam folder.</p>}
          {(type === 'webinar' || type === 'resume-audit') && (emailStatus === 'failed' || emailStatus === 'unconfigured') && <p className="mt-4 text-gray-600" role="status">Your request is saved, but email confirmation is unavailable. Save these details and <a className="underline text-blue-700" href="/contact">contact us if you need help</a>.</p>}
          {(type === 'webinar' || type === 'resume-audit') && (emailStatus === 'pending' || emailStatus === 'sending') && <p className="mt-4 text-gray-600" role="status">Your confirmation email is being prepared. Save these details while you wait.</p>}
          {type === 'webinar' && !emailStatus && <p className="mt-4 text-gray-600" role="status">Email delivery status is unavailable. Save these details and join the group for the meeting link.</p>}
          {type === 'webinar' && <div className="mt-5"><AddToCalendarButton /></div>}
          {type === 'webinar' && <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-6 text-left">
            <h2 className="font-bold text-lg text-gray-900 mb-3">Before the webinar: 10 minutes of pre-work</h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>Keep your current resume handy as a PDF. We do a live resume diagnosis.</li>
              <li>Write down 2–3 roles or companies you want to move to next.</li>
              <li>Note where your search is stuck: callbacks, interviews or offers.</li>
            </ol>
          </div>}
          {type === 'purchase' && <PurchaseNextSteps />}
        </div>

        {type === 'webinar' ? <p className="text-sm text-gray-600">Want guided practice afterwards? <Link to={campaignLink(BOOTCAMP_PATH)} className="underline text-blue-700">Read about the optional paid bootcamp</Link>.</p> : <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={campaignLink(content.primaryCtaHref)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            {content.primaryCtaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={campaignLink(content.secondaryCtaHref)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            {content.secondaryCtaLabel}
          </Link>
        </div>}
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const campaignLink = useCampaignLink();

  if (type === 'purchase') {
    return <PurchaseResult />;
  }
  if (type === 'resume-audit' || type === 'diagnosis-booking' || type === 'webinar') {
    return <ParameterizedThankYou type={type} />;
  }

  // The old March 2026 masterclass confirmation is retired; send stray visits to the current webinar.
  return <Navigate to={campaignLink(WEBINAR_PATH + '#webinar')} replace />;
}
