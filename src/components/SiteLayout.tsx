import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import MobileNavigation from './MobileNavigation';
import Footer from './Footer';
import WhatsAppChat from './WhatsAppChat';
import OnboardingModal from './OnboardingModal';
import { COPILOT_LANDING_PATHS } from '../lib/constants/jobSearchLanding';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const focusedLanding = COPILOT_LANDING_PATHS.includes(pathname.replace(/\/$/, ''));
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen bg-gray-50">
    {!focusedLanding && <><Header onMobileMenuToggle={() => setMenuOpen(!menuOpen)} /><MobileNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} /><OnboardingModal /></>}
    <main>{children}</main>
    {!focusedLanding && <><WhatsAppChat phoneNumber="+917310768702" message="Hi! I'm interested in Skillsurger's career services." /><Footer /></>}
  </div>;
}
