export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  isPlaceholder?: boolean;
}

// Publish customer quotes only after their evidence and written permission are recorded.
export const testimonials: Testimonial[] = [];
