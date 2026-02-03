import { Star } from 'lucide-react';
import { Testimonial } from '../../lib/constants/testimonials';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <p className="text-gray-700 mb-6 flex-grow italic">
        "{testimonial.quote}"
      </p>

      <div className="border-t pt-4">
        <p className="font-semibold text-gray-900">{testimonial.name}</p>
        <p className="text-sm text-gray-600">
          {testimonial.role} at {testimonial.company}
        </p>
      </div>
    </div>
  );
}
