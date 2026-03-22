import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, MessageCircle, Clock } from 'lucide-react';
import SEO from '../components/SEO';

const WEBINAR_DATE = new Date('2026-03-29T14:00:00+05:30'); // March 29, 2 PM IST
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/IDkVOndueptLmsuhCFAJCy?mode=gi_t';

function AddToCalendarButton() {
  const title = 'Free Masterclass: Land Your Dream Job in 90 Days — Skillsurger';
  const description =
    'Join the free masterclass with Sachin Agarwal, Senior Leader in MNC, and learn the 3-step system to get 3-7 dream offers with 50-200% salary hikes in under 90 days.';
  const location = 'Online (Link will be shared via WhatsApp & email)';
  const startDate = '20260329T083000Z'; // 2 PM IST = 8:30 AM UTC
  const endDate = '20260329T103000Z';   // 4 PM IST = 10:30 AM UTC

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
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
    a.download = 'skillsurger-masterclass.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
      >
        <Calendar className="w-5 h-5" />
        Add to Google Calendar
      </a>
      <button
        onClick={handleICS}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
      >
        <Calendar className="w-5 h-5" />
        Download .ics (Apple / Outlook)
      </button>
    </div>
  );
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = WEBINAR_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex gap-4 justify-center">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Mins', value: timeLeft.minutes },
        { label: 'Secs', value: timeLeft.seconds },
      ].map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-2xl font-bold tabular-nums">
            {pad(value)}
          </div>
          <span className="text-xs text-blue-300 mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-[#020420] text-white flex flex-col items-center justify-center px-4 py-20">
      <SEO
        title="You're Registered! | Skillsurger Free Masterclass"
        description="Your seat is reserved for the Skillsurger Free Masterclass on March 29 at 2 PM."
        keywords="skillsurger masterclass, free webinar, career training"
        canonicalUrl="/thank-you"
      />

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl w-full mx-auto text-center space-y-10">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Your Seat is{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Reserved!
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            We've sent the details to your email. See you inside!
          </p>
        </div>

        {/* Webinar info card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-center gap-3 text-blue-300">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-semibold">Free Masterclass Details</span>
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-white">Sunday, 29th March 2026</p>
            <p className="text-xl text-blue-400 font-semibold">2:00 PM IST</p>
            <p className="text-gray-500 text-sm">Online • Link shared via WhatsApp & email</p>
          </div>

          {/* Countdown */}
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">Starting in</p>
            <Countdown />
          </div>
        </div>

        {/* Add to calendar */}
        <div className="space-y-4">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Add to your calendar</p>
          <AddToCalendarButton />
        </div>

        {/* WhatsApp CTA */}
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-8 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <MessageCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold">Join the WhatsApp Community</h3>
          </div>
          <p className="text-gray-400">
            Get the live session link, reminders, and exclusive resources from 1,250+ professionals in our WhatsApp group.
          </p>
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl text-lg transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Join WhatsApp Group
          </a>
        </div>

        <p className="text-gray-600 text-sm">
          Questions? Email us at{' '}
          <a href="mailto:hello@skillsurger.com" className="text-blue-400 hover:underline">
            hello@skillsurger.com
          </a>
        </p>
      </div>
    </div>
  );
}
