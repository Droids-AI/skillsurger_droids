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
    name: 'Hardy',
    role: 'Software Engineer',
    company: 'Software Engineer at TCS',
    quote:
      "The resume audit pointed out that most of my bullet points read like a job description instead of showing impact. Rewriting them with numbers attached made a real difference in the callbacks I started getting.",
    rating: 5,
    isPlaceholder: false,
  },
  {
    name: 'Rahul',
    role: 'Data Engineer',
    company: 'Data Engineer at Infosys',
    quote:
      "Before this, I'd apply in bursts and lose track of who I'd followed up with. Having one place to see application status, recruiter contact, and next steps kept me consistent instead of scattered.",
    rating: 5,
    isPlaceholder: false,
  },
  {
    name: 'Anjali',
    role: 'DevOps Engineer',
    company: 'DevOps Engineer at Tredence',
    quote:
      "Going through a mock interview before the real one helped me catch how much I was rambling through system design answers. The feedback was specific enough to actually fix before my next interview.",
    rating: 5,
    isPlaceholder: false,
  },
];
