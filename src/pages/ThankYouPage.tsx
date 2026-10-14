import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { thankYouContent, ThankYouType } from '../lib/constants/thankYouContent';
import { WEBINAR } from '../lib/constants/webinar';

const toUtcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function AddToCalendarButton() {
  const title = `Free webinar: ${WEBINAR.title} — Skillsurger`;
  const description = `${WEBINAR.schedule}. 60 minutes online. Joining link: ${WEBINAR.whatsappGroupUrl} (shared in the webinar WhatsApp group).`;
  const location = 'Online (joining link sent via WhatsApp)';
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
  const delivery = params.get('delivery');

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
            <a href={WEBINAR.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-6 py-3 font-semibold text-white transition-colors">
              <MessageCircle className="w-5 h-5" /> Join WhatsApp group
            </a>
            {(delivery === 'delivered' || delivery === 'read' || delivery === 'accepted') && <p className="mt-3 text-sm text-gray-600">We've also sent the joining message to your WhatsApp number.</p>}
            <a className="block mt-3 text-sm text-green-800 underline" href="https://wa.me/917310768702?text=Please%20help%20with%20my%20Skillsurger%20webinar%20joining%20link%20for%2024%20October%202026">Trouble joining? Message us</a>
          </div>}
          {type === 'webinar' && <div className="mt-5"><AddToCalendarButton /></div>}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={content.primaryCtaHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            {content.primaryCtaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={content.secondaryCtaHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            {content.secondaryCtaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  if (type === 'resume-audit' || type === 'diagnosis-booking' || type === 'webinar') {
    return <ParameterizedThankYou type={type} />;
  }

  // The old March 2026 masterclass confirmation is retired; send stray visits to the current webinar.
  return <Navigate to="/job-switch-copilot#webinar" replace />;
}
