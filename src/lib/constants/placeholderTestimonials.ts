import { Testimonial } from './testimonials';

// No customer identities, employers, quotes or ratings until evidence is supplied.
export const placeholderTestimonials: Testimonial[] = [
  {
    name: '[PUBLIC NAME: needed]',
    role: '[ROLE: needed]',
    company: 'Awaiting real testimonial',
    quote: '[TESTIMONIAL: need real quote + name + role + publication permission]',
    rating: 0,
    isPlaceholder: true,
  },
];
