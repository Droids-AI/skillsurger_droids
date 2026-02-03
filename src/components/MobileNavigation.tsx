import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  BarChart3, 
  Video, 
  Search, 
  Briefcase, 
  BookOpen, 
  DollarSign, 
  Info 
} from 'lucide-react';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const navigationItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home
    },
    {
      label: 'AI Resume Builder',
      href: '/ai-resume-builder',
      icon: FileText
    },
    {
      label: 'CV Score',
      href: '/dashboard?section=cv-scoring',
      icon: BarChart3
    },
    {
      label: 'Free Job Readiness Score',
      href: '/job-readiness-index',
      icon: BarChart3
    },
    {
      label: 'Mock Interview',
      href: '/mock-interview',
      icon: Video
    },
    {
      label: 'Free Job Search',
      href: '/job-search',
      icon: Search
    },
    {
      label: 'Career Explorer',
      href: '/dashboard',
      icon: Briefcase
    },
    {
      label: 'Blog',
      href: '/blog',
      icon: BookOpen
    },
    {
      label: 'Pricing',
      href: '/pricing',
      icon: DollarSign
    },
    {
      label: 'About',
      href: '/about',
      icon: Info
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Menu */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* CTA Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="space-y-3">
            <Link
              to="/login"
              onClick={onClose}
              className="block w-full px-4 py-2 text-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={onClose}
              className="block w-full px-4 py-2 text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
