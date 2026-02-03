import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WhatsAppChat from './WhatsAppChat';
import ProductHuntUpvote from './ProductHuntUpvote';
import MobileNavigation from './MobileNavigation';
import AnalyticsTracking from './AnalyticsTracking';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Analytics Tracking */}
      <AnalyticsTracking />
      
      {/* Header */}
      <Header onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* WhatsApp Chat */}
      <WhatsAppChat />
      
      {/* ProductHunt Upvote - Show on landing page and key pages */}
      <div className="fixed bottom-4 left-4 z-50">
        <ProductHuntUpvote showText={false} />
      </div>
    </div>
  );
};

export default Layout;
