import { FileText, BarChart3, Search, Video, ClipboardCheck, Briefcase, GraduationCap, MessageSquare, Info, BookOpen, Star, Building2, Handshake } from 'lucide-react';

export const toolsItems = [
  { label: 'Job Readiness Index™', href: '/job-readiness-index', icon: BarChart3, description: 'Check your job readiness for free' },
  { label: 'Free Job Search', href: '/job-search', icon: Search, description: 'Search for job opportunities' },
  { label: 'Free Resume Audit', href: '/free-resume-audit', icon: ClipboardCheck, description: 'Get a free ATS and role-fit audit' },
];
export const platformItems = [
  { label: 'AI Resume Builder', href: '/ai-resume-builder', icon: FileText, description: 'Build your resume with AI' },
  { label: 'FREE CV Score', href: '/dashboard?section=cv-scoring', icon: BarChart3, description: 'Get your CV score and insights' },
  { label: 'Mock Interviews', href: '/mock-interview', icon: Video, description: 'Practice with AI interviews' },
  { label: 'Career Explorer', href: '/dashboard?section=career', icon: Briefcase, description: 'Discover career opportunities' },
  { label: 'Learning Paths', href: '/dashboard?section=learning', icon: GraduationCap, description: 'Personalized learning roadmaps' },
  { label: 'AI Mentor', href: '/dashboard?section=mentorship', icon: MessageSquare, description: 'AI-powered career guidance' },
];
export const companyItems = [
  { label: 'About', href: '/about', icon: Info },
  { label: 'Blog', href: '/blog', icon: BookOpen },
  { label: 'Success Stories', href: '/success-stories', icon: Star },
  { label: 'For Colleges', href: '/for-colleges', icon: Building2 },
  { label: 'For EdTech Partners', href: '/for-edtech-partners', icon: Handshake },
];
