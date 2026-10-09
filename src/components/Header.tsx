import { Link, useLocation } from 'react-router-dom';
import { Brain, User, ChevronDown, Menu } from 'lucide-react';
import { toolsItems, platformItems, companyItems } from '../lib/constants/navigation';
import Button from './Button';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps = {} as HeaderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);

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

  useEffect(() => { setOpenMenu(null); }, [location.pathname, location.search]);

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href.split('?')[0]);
  };

  const isParameterizedThankYou =
    location.pathname === '/thank-you' && new URLSearchParams(location.search).has('type');
  const isDarkPage =
    location.pathname === '/training' ||
    (location.pathname === '/thank-you' && !isParameterizedThankYou);

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


  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${headerBg}`}>
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <Brain className={`w-8 h-8 ${logoIcon}`} />
          <span className={`text-xl font-bold ${logoText}`}>Skillsurger</span>
        </Link>

        <nav ref={menuRef} className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
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

          {/* Platform Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('platform')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${navLink(openMenu === 'platform')}`}
            >
              Platform
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === 'platform' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'platform' && (
              <div className={`absolute left-0 mt-2 w-80 rounded-lg shadow-xl border overflow-hidden z-50 ${dropdownBg}`}>
                <div className="py-2">
                  {platformItems.map((item, index) => {
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
          <div className="hidden lg:flex items-center space-x-4">
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

          {/* Mobile Menu Button */}
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className={`lg:hidden p-2 rounded-lg transition-colors flex-shrink-0 ${mobileMenuBtn}`}
              aria-label="Open mobile menu" aria-controls="mobile-navigation"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
