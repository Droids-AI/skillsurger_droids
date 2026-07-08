import { Star } from "lucide-react";
import { Testimonial } from "../../lib/constants/testimonials";

interface PlaceholderTestimonialCardProps {
  testimonial: Testimonial;
}

export default function PlaceholderTestimonialCard({
  testimonial,
}: PlaceholderTestimonialCardProps) {
  return (
    <div className="relative bg-white rounded-lg shadow-lg p-6 h-full flex flex-col border-2 border-dashed border-gray-300">
      <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
        {testimonial.company}
      </span>

      <div className="flex items-center gap-1 mb-4 mt-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <p className="text-gray-700 mb-6 flex-grow italic">
        "{testimonial.quote}"
      </p>

      <div className="border-t pt-4">
        <p className="font-semibold text-gray-900">{testimonial.name}</p>
        <p className="text-sm text-gray-600">{testimonial.role}</p>
      </div>
    </div>
  );
}
