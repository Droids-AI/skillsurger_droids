import { Link, useLocation } from 'react-router-dom';
import { Brain, User, FileText, BarChart3, Search, Video, Briefcase, GraduationCap, MessageSquare, Info, BookOpen, DollarSign, ChevronDown, Menu, Trophy, Rocket, ClipboardCheck, Star, Building2, Handshake } from 'lucide-react';
import Button from './Button';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps = {} as HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu]);

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const toolsItems = [
    { label: 'AI Resume Builder', href: '/ai-resume-builder', icon: FileText, description: 'Build your resume with AI' },
    { label: 'CV Score', href: '/dashboard?section=cv-scoring', icon: BarChart3, description: 'Get your CV score and insights' },
    { label: 'Free Job Readiness Score', href: '/job-readiness-index', icon: BarChart3, description: 'Check your job readiness' },
    { label: 'Free Job Search', href: '/job-search', icon: Search, description: 'Search for job opportunities' },
    { label: 'Mock Interviews', href: '/mock-interview', icon: Video, description: 'Practice with AI interviews' },
    { label: 'Free Resume Audit', href: '/free-resume-audit', icon: ClipboardCheck, description: 'Get a free ATS and role-fit audit' },
  ];

  const servicesItems = [
    { label: 'Career Explorer', href: '/dashboard?section=career', icon: Briefcase, description: 'Discover career opportunities' },
    { label: 'Learning Paths', href: '/dashboard?section=learning', icon: GraduationCap, description: 'Personalized learning roadmaps' },
    { label: 'AI Mentorship', href: '/dashboard?section=mentorship', icon: MessageSquare, description: 'Get AI-powered career guidance' },
    { label: 'Career Training', href: '/training', icon: Trophy, description: 'Masterclass for high-earning professionals' },
    { label: 'Job Switch Copilot', href: '/job-switch-copilot', icon: Rocket, description: 'Structured job-search system for tech professionals' },
  ];

  const companyItems = [
    { label: 'About', href: '/about', icon: Info },
    { label: 'Blog', href: '/blog', icon: BookOpen },
    { label: 'Pricing', href: '/pricing', icon: DollarSign },
    { label: 'Success Stories', href: '/success-stories', icon: Star },
    { label: 'For Colleges', href: '/for-colleges', icon: Building2 },
    { label: 'For EdTech Partners', href: '/for-edtech-partners', icon: Handshake },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href.split('?')[0]);
  };

  const isDarkPage = location.pathname === '/training' || location.pathname === '/thank-you';

  // Theme-aware class helpers
  const headerBg = isDarkPage
    ? 'bg-[#020420]/80 backdrop-blur-md border-white/10'
    : 'bg-white border-gray-200 shadow-sm';

  const logoText = isDarkPage ? 'text-white' : 'text-gray-900';
  const logoIcon = isDarkPage ? 'text-blue-400' : 'text-blue-600';

  const navLink = (active: boolean) =>
    isDarkPage
      ? active
        ? 'text-blue-400 bg-white/10'
        : 'text-gray-300 hover:text-white hover:bg-white/10'
      : active
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50';

  const dropdownBg = isDarkPage
    ? 'bg-[#0a0f2c] border-white/10'
    : 'bg-white border-gray-200';

  const dropdownItem = isDarkPage
    ? 'hover:bg-white/10 group'
    : 'hover:bg-blue-50 group';

  const dropdownIcon = isDarkPage
    ? 'bg-white/5 group-hover:bg-white/10'
    : 'bg-gray-100 group-hover:bg-blue-100';

  const dropdownIconColor = isDarkPage
    ? 'text-gray-400 group-hover:text-blue-400'
    : 'text-gray-600 group-hover:text-blue-600';

  const dropdownLabel = isDarkPage
    ? 'text-gray-200 group-hover:text-blue-400'
    : 'text-gray-900 group-hover:text-blue-600';

  const dropdownDesc = isDarkPage ? 'text-gray-500' : 'text-gray-500';

  const mobileMenuBtn = isDarkPage
    ? 'hover:bg-white/10 text-gray-300'
    : 'hover:bg-gray-100 text-gray-700';

  if (loading) {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 border-b ${headerBg}`}>
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Brain className={`w-8 h-8 ${logoIcon}`} />
            <span className={`text-xl font-bold ${logoText}`}>Skillsurger</span>
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${headerBg}`}>
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <Brain className={`w-8 h-8 ${logoIcon}`} />
          <span className={`text-xl font-bold ${logoText}`}>Skillsurger</span>
        </Link>

        <nav ref={menuRef} className="hidden md:flex items-center space-x-1 flex-1 justify-center">
          <Link
            to="/"
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${navLink(isActive('/'))}`}
          >
            Home
          </Link>

          {/* Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('tools')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${navLink(openMenu === 'tools')}`}
            >
              Tools
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === 'tools' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'tools' && (
              <div className={`absolute left-0 mt-2 w-80 rounded-lg shadow-xl border overflow-hidden z-50 ${dropdownBg}`}>
                <div className="py-2">
                  {toolsItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setOpenMenu(null)}
                        className={`flex items-start gap-4 px-4 py-3 transition-colors ${dropdownItem}`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${dropdownIcon}`}>
                          <Icon className={`w-5 h-5 ${dropdownIconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${dropdownLabel}`}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div className={`text-xs mt-0.5 ${dropdownDesc}`}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Services Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('services')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${navLink(openMenu === 'services')}`}
            >
              Services
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === 'services' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'services' && (
              <div className={`absolute left-0 mt-2 w-80 rounded-lg shadow-xl border overflow-hidden z-50 ${dropdownBg}`}>
                <div className="py-2">
                  {servicesItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setOpenMenu(null)}
                        className={`flex items-start gap-4 px-4 py-3 transition-colors ${dropdownItem}`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${dropdownIcon}`}>
                          <Icon className={`w-5 h-5 ${dropdownIconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${dropdownLabel}`}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div className={`text-xs mt-0.5 ${dropdownDesc}`}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Company Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('company')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${navLink(openMenu === 'company')}`}
            >
              Company
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === 'company' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'company' && (
              <div className={`absolute left-0 mt-2 w-64 rounded-lg shadow-xl border overflow-hidden z-50 ${dropdownBg}`}>
                <div className="py-2">
                  {companyItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setOpenMenu(null)}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${dropdownItem}`}
                      >
                        <Icon className={`w-5 h-5 ${dropdownIconColor}`} />
                        <span className={`text-sm font-semibold ${dropdownLabel}`}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant={isDarkPage ? 'primary' : 'outline'} className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className={isDarkPage ? 'border-white/20 text-white hover:bg-white/10' : ''}>Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Only show when user is NOT logged in */}
          {onMobileMenuToggle && !user && (
            <button
              onClick={onMobileMenuToggle}
              className={`md:hidden p-2 rounded-lg transition-colors flex-shrink-0 ${mobileMenuBtn}`}
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
