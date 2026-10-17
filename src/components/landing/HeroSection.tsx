import { useState, useEffect } from 'react';

import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import Button from '../Button';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { WEBINAR } from '../../lib/constants/webinar';
import { JOB_SWITCH_PROGRAM } from '../../lib/constants/jobSwitchProgram';
import { trackEvent, EVENTS } from '../../lib/analytics';

const focusAreas = ['Resume positioning', 'Targeted applications', 'Recruiter outreach', 'Interview preparation', 'Personal mentoring'];

export default function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const webinarUpcoming = Date.now() < new Date(WEBINAR.endsAt).getTime();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  return (
    <section className="relative pt-24 pb-14 sm:pt-32 sm:pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      </div>

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {webinarUpcoming && (
            <Link
              to="/job-switch-copilot#webinar"
              onClick={() => trackEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement: 'home_hero_pill', destination: 'free_webinar' })}
              className="inline-flex max-w-full items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-2xl sm:rounded-full text-xs sm:text-sm font-semibold text-left mb-5 sm:mb-6 hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Free job switch webinar · {WEBINAR.schedule}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </Link>
          )}

          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-700 mb-3">
            For Indian tech professionals · 3–12 years experience · ₹20–50 LPA roles
          </p>

          <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
            Your next tech job deserves more than another resume update.
          </h1>

          <p className="text-base sm:text-xl text-gray-600 mb-5 sm:mb-6 max-w-3xl mx-auto leading-relaxed">
            A 30-day AI + Human Job Switch Copilot for Indian tech professionals ready to move into better roles.
          </p>

          <ul aria-label="What the programme covers" className="mx-auto mb-5 sm:mb-6 flex max-w-3xl flex-wrap justify-center gap-2">
            {focusAreas.map(area => (
              <li key={area} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-800 ring-1 ring-gray-200">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                {area}
              </li>
            ))}
          </ul>

          <div className="mb-6 sm:mb-7 text-gray-900">
            <p className="text-base sm:text-lg">
              <span className="font-semibold">{JOB_SWITCH_PROGRAM.durationLabel}:</span>{' '}
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 align-middle">{JOB_SWITCH_PROGRAM.priceLabel}</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{JOB_SWITCH_PROGRAM.taxNote} · 6 group + 2 personal 1-to-1 sessions</p>
          </div>

          <div className="mx-auto mb-5 flex max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
            <Link
              to="/free-resume-audit"
              onClick={() => trackEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement: 'home_hero', destination: 'free_audit' })}
              className="block w-full sm:w-auto"
            >
              <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-base sm:text-lg w-full sm:w-auto">
                Free Career Audit
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link
              to="/job-switch-copilot#programme"
              onClick={() => trackEvent(EVENTS.JOB_SWITCH_COPILOT_CTA_CLICKED, { placement: 'home_hero', destination: 'programme' })}
              className="block w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="px-8 py-4 text-base sm:text-lg border-2 w-full sm:w-auto bg-white/70">
                View Program
              </Button>
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-gray-600">
            Free audit, no payment needed. No job or salary outcome is guaranteed.
            {isLoggedIn && <> · <Link to="/dashboard" className="font-semibold text-blue-700 underline">Go to your dashboard</Link></>}
          </p>
        </div>
      </div>
    </section>
  );
}
