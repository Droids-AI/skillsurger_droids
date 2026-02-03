import { useEffect, useState } from 'react';
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';
import GradientCard from '../ui/GradientCard';
import TestimonialCard from '../ui/TestimonialCard';
import { testimonials } from '../../lib/constants/testimonials';

export default function TrustSignals() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToPrevious = () => {
    setActiveIndex(
      (current) => (current - 1 + testimonials.length) % testimonials.length
    );
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
            Trusted by thousands of job seekers
          </h2>
          <p className="text-lg text-gray-600">
            Built by experts, loved by users
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Built by experts */}
          <GradientCard gradient="blue-purple" className="text-white">
            <div className="flex items-start gap-4">
              <Award className="w-12 h-12 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold mb-3">
                  Built by IITians & MAANG Professionals
                </h3>
                <p className="text-white/90">
                  Our platform is designed by engineers and recruiters from top tech companies
                  who know exactly what it takes to land your dream job. Get insider knowledge
                  that actually works.
                </p>
              </div>
            </div>
          </GradientCard>

          {/* Right: Testimonials carousel */}
          <div className="relative">
            <div className="text-center mb-4">
              <p className="text-sm font-semibold text-gray-900">
                Join 5,000+ Indians who landed their dream jobs
              </p>
            </div>

            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <TestimonialCard testimonial={testimonials[activeIndex]} />
            </div>

            {/* Navigation arrows */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={goToPrevious}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeIndex
                        ? 'bg-blue-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
