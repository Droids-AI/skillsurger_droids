import { Phone, Clock, Target } from 'lucide-react';
import SEO from '../components/SEO';
import DiagnosisBookingForm from '../components/leadgen/DiagnosisBookingForm';
import BookingPreviewCard from '../components/leadgen/BookingPreviewCard';
import IllustrationFrame from '../components/illustrations/IllustrationFrame';
import BookingIllustration from '../components/illustrations/BookingIllustration';

export default function BookACall() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Book a Career Diagnosis Call | Skillsurger"
        description="Book a career diagnosis call with Skillsurger to identify what's holding your job search back and get a clear next-step plan."
        keywords="career diagnosis call, career coach call India, job search consultation"
        canonicalUrl="/book-a-call"
      />

      <section className="relative pt-32 pb-12 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4">
                20-30 Minute Call
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">Book Your Career Diagnosis Call</h1>
              <p className="text-xl text-gray-600">
                A focused conversation to understand where your job search is stuck — resume, positioning,
                outreach, or interview readiness — and what to prioritize next. Not a sales pitch, a diagnosis.
              </p>
            </div>
            <div className="hidden lg:flex justify-center">
              <IllustrationFrame>
                <BookingIllustration />
              </IllustrationFrame>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  What a confirmed booking looks like
                </p>
                <BookingPreviewCard />
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Target className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">What we'll cover</h3>
                    <p className="text-gray-600 text-sm">
                      Your target roles, current resume/positioning gaps, and what's actually blocking callbacks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Duration</h3>
                    <p className="text-gray-600 text-sm">About 20-30 minutes, scheduled around your preferred slot.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">What happens after</h3>
                    <p className="text-gray-600 text-sm">
                      We'll confirm your slot by email/phone and share a short plan before the call.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6">Book Career Diagnosis</h2>
              <DiagnosisBookingForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
