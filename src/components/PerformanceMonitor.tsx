import { useEffect } from 'react';
import { reportWebVitals } from '../lib/performance';

/**
 * Component to monitor and report Web Vitals
 */
const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Report web vitals
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(reportWebVitals);
        getFID(reportWebVitals);
        getFCP(reportWebVitals);
        getLCP(reportWebVitals);
        getTTFB(reportWebVitals);
      }).catch(() => {
        // web-vitals not available, skip silently
        console.warn('web-vitals package not available');
      });
    }

    // Performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry);
              // You can send this to analytics
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'long_task', {
                  event_category: 'Performance',
                  value: Math.round(entry.duration),
                  non_interaction: true,
                });
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        
        return () => observer.disconnect();
      } catch (e) {
        // PerformanceObserver not fully supported
      }
    }
  }, []);

  return null;
};

export default PerformanceMonitor;

