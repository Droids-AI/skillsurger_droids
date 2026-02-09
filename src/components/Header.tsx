import { Link, useLocation } from 'react-router-dom';
import { Brain, User, FileText, BarChart3, Search, Video, Briefcase, GraduationCap, MessageSquare, Info, BookOpen, DollarSign, ChevronDown, Menu, Trophy } from 'lucide-react';
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
  ];

  const servicesItems = [
    { label: 'Career Explorer', href: '/dashboard?section=career', icon: Briefcase, description: 'Discover career opportunities' },
    { label: 'Learning Paths', href: '/dashboard?section=learning', icon: GraduationCap, description: 'Personalized learning roadmaps' },
    { label: 'AI Mentorship', href: '/dashboard?section=mentorship', icon: MessageSquare, description: 'Get AI-powered career guidance' },
    { label: 'Career Training', href: '/training', icon: Trophy, description: 'Masterclass for high-earning professionals' },
  ];

  const companyItems = [
    { label: 'About', href: '/about', icon: Info },
    { label: 'Blog', href: '/blog', icon: BookOpen },
    { label: 'Pricing', href: '/pricing', icon: DollarSign },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href.split('?')[0]);
  };

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold">Skillsurger</span>
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold">Skillsurger</span>
        </Link>
        
        <nav ref={menuRef} className="hidden md:flex items-center space-x-1 flex-1 justify-center">
          <Link
            to="/"
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              isActive('/') 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Home
          </Link>

          {/* Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('tools')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${
                openMenu === 'tools'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Tools
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === 'tools' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'tools' && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  {toolsItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setOpenMenu(null)}
                        className="flex items-start gap-4 px-4 py-3 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
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
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${
                openMenu === 'services'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Services
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === 'services' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'services' && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  {servicesItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setOpenMenu(null)}
                        className="flex items-start gap-4 px-4 py-3 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
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
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${
                openMenu === 'company'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Company
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === 'company' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'company' && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  {companyItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setOpenMenu(null)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
                      >
                        <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
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
                <Button variant="outline" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Log in</Button>
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
