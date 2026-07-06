import { Testimonial } from './testimonials';

/**
 * Placeholder-only testimonials for sections where real customer feedback
 * isn't available yet (e.g. Success Stories page for the new Job Switch
 * Copilot product line). Every entry is explicitly marked isPlaceholder:true
 * and rendered with a visible "sample" badge — never presented as real.
 * Replace with real user testimonials as they come in.
 */
export const placeholderTestimonials: Testimonial[] = [
  {
    name: 'Replace with real user name',
    role: 'Software Engineer',
    company: 'Sample Company',
    quote:
      'Replace with a real user testimonial once available. Placeholder illustrating the kind of feedback this section will feature — e.g. how the resume audit or interview prep helped their job search.',
    rating: 5,
    isPlaceholder: true,
  },
  {
    name: 'Replace with real user name',
    role: 'Data Engineer',
    company: 'Sample Company',
    quote:
      'Replace with a real user testimonial once available. Placeholder illustrating feedback about the application tracker or recruiter outreach templates.',
    rating: 5,
    isPlaceholder: true,
  },
  {
    name: 'Replace with real user name',
    role: 'DevOps Engineer',
    company: 'Sample Company',
    quote:
      'Replace with a real user testimonial once available. Placeholder illustrating feedback about the 30-day job recovery sprint after a layoff.',
    rating: 5,
    isPlaceholder: true,
  },
];
