import {
  FileText,
  Compass,
  MessageSquare,
  Linkedin,
  TrendingUp,
  LifeBuoy,
  CalendarClock,
  BookOpenCheck,
  Bot,
  LucideIcon,
} from 'lucide-react';

export interface BlogCategoryPlaceholder {
  name: string;
  description: string;
  icon: LucideIcon;
  comingSoon: true;
}

/**
 * New blog category areas planned for Job Switch Copilot content.
 * These are NOT added to the existing Blog.tsx category filter (which is
 * tied to real post.category values) — they're rendered as a separate
 * "coming soon" preview section so the working filter/search experience
 * for existing posts is never touched.
 */
export const blogCategories: BlogCategoryPlaceholder[] = [
  { name: 'Job Switch Strategy', description: 'How to plan and run a structured job switch instead of applying randomly.', icon: Compass, comingSoon: true },
  { name: 'LinkedIn Optimization', description: 'Profile, headline, and outreach guidance for getting found by recruiters.', icon: Linkedin, comingSoon: true },
  { name: 'Salary Growth', description: 'Negotiation, positioning, and role-switch strategies for higher CTC.', icon: TrendingUp, comingSoon: true },
  { name: 'Layoff Recovery', description: 'Rebuilding your resume, pipeline, and confidence after a layoff.', icon: LifeBuoy, comingSoon: true },
  { name: 'Notice Period Job Search', description: 'Running an efficient job search while still employed.', icon: CalendarClock, comingSoon: true },
  { name: 'Role-Specific Guides', description: 'Resume and interview guidance broken down by engineering/PM/BA role.', icon: BookOpenCheck, comingSoon: true },
  { name: 'AI Career Tools', description: 'How to use AI responsibly for resume tailoring and interview prep.', icon: Bot, comingSoon: true },
  { name: 'Resume Tips', description: 'Deeper resume-specific tactics beyond the existing Resume Building posts.', icon: FileText, comingSoon: true },
  { name: 'Interview Preparation', description: 'Structured mock interview and system design prep guidance.', icon: MessageSquare, comingSoon: true },
];
