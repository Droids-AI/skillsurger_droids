import {
  FileEdit,
  Target,
  ClipboardCheck,
  Mail,
  Linkedin,
  Video,
  Network,
  Rocket,
  TrendingUp,
  Compass,
  LucideIcon,
} from 'lucide-react';

export interface JobSwitchCopilotFeature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const jobSwitchCopilotFeatures: JobSwitchCopilotFeature[] = [
  {
    id: 'ai-resume-tailoring',
    title: 'AI Resume Tailoring',
    description: 'Tailor your resume to a specific job description in minutes, aligning keywords and positioning without starting from scratch each time.',
    icon: FileEdit,
  },
  {
    id: 'role-fit-matching',
    title: 'Role-Fit Matching',
    description: 'See how well your background matches a target role before you apply, so you spend effort on the applications most likely to convert.',
    icon: Target,
  },
  {
    id: 'application-tracker',
    title: 'Application Tracker',
    description: 'Track every application, its status, recruiter contact, and follow-up date in one place instead of scattered spreadsheets and memory.',
    icon: ClipboardCheck,
  },
  {
    id: 'recruiter-outreach-templates',
    title: 'Recruiter Outreach Templates',
    description: 'Message templates for reaching out to recruiters and hiring managers directly, instead of relying only on job-board applications.',
    icon: Mail,
  },
  {
    id: 'linkedin-optimization',
    title: 'LinkedIn Profile Optimization',
    description: 'Improve your LinkedIn headline, summary, and experience sections so recruiters searching for your target role can actually find you.',
    icon: Linkedin,
  },
  {
    id: 'mock-interview-prep',
    title: 'Mock Interview Prep',
    description: 'Practice role-specific mock interviews with structured feedback, so first-round nerves don’t cost you a shot at the role.',
    icon: Video,
  },
  {
    id: 'system-design-prep',
    title: 'System Design Interview Prep',
    description: 'Focused practice for system design rounds, a common blocker for engineers moving into senior and staff-level roles.',
    icon: Network,
  },
  {
    id: '30-day-sprint',
    title: '30-Day Job Search Sprint',
    description: 'A focused, week-by-week plan covering resume, applications, outreach, and interviews, designed for urgent job searches.',
    icon: Rocket,
  },
  {
    id: 'weekly-progress-dashboard',
    title: 'Weekly Progress Dashboard',
    description: 'A weekly view of applications sent, responses received, interviews scheduled, and where your pipeline needs attention.',
    icon: TrendingUp,
  },
  {
    id: 'career-diagnosis',
    title: 'Career Diagnosis',
    description: 'A one-on-one call to diagnose what is actually holding your job search back, and which parts of the system to prioritize first.',
    icon: Compass,
  },
];
